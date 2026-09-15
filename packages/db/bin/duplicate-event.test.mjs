import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { test } from 'node:test'

import {
  apply,
  buildPlan,
  cleanup,
  clearRouteCaches,
  hash,
  mediaKey,
  moveDomain,
  schema,
  shiftDate,
  snapshot,
  SOURCE,
} from './duplicate-event.mjs'

test('schedule mapping preserves Eastern wall-clock times and rejects other years', () => {
  assert.equal(shiftDate('2025-10-07T18:30:00'), '2026-10-05T18:30:00')
  assert.equal(shiftDate('2025-10-08 08:15:00'), '2026-10-06 08:15:00')
  assert.equal(shiftDate('2025-10-09T13:00:00'), '2026-10-07T13:00:00')
  assert.equal(shiftDate('2025-10-10T10:00:00.125'), '2026-10-08T10:00:00.125')
  assert.equal(shiftDate(null), null)
  assert.throws(() => shiftDate('2024-10-08T08:15:00'), /Unexpected/)
  assert.throws(() => shiftDate('2025-10-08T08:15:00Z'), /Unexpected/)
})

test('file keys match application URLs', () => {
  assert.equal(
    mediaKey({ id: 'image', dir: 'prod', path: 'venue', version: 2, ext: 'jpg' }),
    'prod/venue/image-2.jpg',
  )
  assert.throws(
    () => mediaKey({ id: 'image', dir: 'prod', path: '../venue', version: 2, ext: 'jpg' }),
    /Unsafe/,
  )
})

test('installed Redis SDK sends only the intended cache keys to a local HTTP endpoint', async () => {
  let received
  const server = createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    received = JSON.parse(Buffer.concat(chunks).toString())
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ result: 3 }))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    await clearRouteCaches(
      {
        REDIS_URL: `http://127.0.0.1:${server.address().port}`,
        REDIS_TOKEN: 'local-test-only',
      },
      ['ing', 'ing25'],
      SOURCE,
    )
    assert.deepEqual(received, [
      'del',
      'event_subdomain:ing',
      'event_subdomain:ing25',
      `event_heavy:${SOURCE}`,
    ])
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
})

// Opt-in integration test. Every nested transaction runs inside an outer transaction
// that is always rolled back, including operations tables and injected test activity.
test(
  'real PostgreSQL copy, retry, failure, source preservation and guarded cleanup',
  {
    skip: !process.env.DUPLICATE_EVENT_TEST_ENV,
  },
  async (t) => {
    const require = createRequire(import.meta.url)
    const { Client } = require('pg')
    const env = require('dotenv').parse(readFileSync(process.env.DUPLICATE_EVENT_TEST_ENV, 'utf8'))
    const url = new URL(env.DB_URL)
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Tests require localhost')
    assert.equal(url.pathname, '/eventlayer', 'Tests require the local eventlayer database')
    const client = new Client({
      connectionString: env.DB_URL,
      options: '-c search_path=public -c statement_timeout=60000',
    })
    await client.connect()
    let nested = false
    const db = {
      query: async (sql, values) => {
        if (sql === 'begin') {
          assert.equal(nested, false)
          nested = true
          return client.query('savepoint copy_test')
        }
        if (sql === 'commit') {
          assert.equal(nested, true)
          nested = false
          return client.query('release savepoint copy_test')
        }
        if (sql === 'rollback') {
          assert.equal(nested, true)
          nested = false
          await client.query('rollback to savepoint copy_test')
          return client.query('release savepoint copy_test')
        }
        return client.query(sql, values)
      },
    }
    try {
      await client.query('begin')
      await schema(client)
      const source = await snapshot(client)
      const database = (
        await client.query(
          'select current_database() as database,inet_server_addr()::text as server,inet_server_port() as port',
        )
      ).rows[0]
      const plan = buildPlan(source, database, {
        run: 'integration-copy-2026',
        domain: 'integration-copy-2026',
      })
      await t.test(
        'new plans generate UUID v4 IDs; saved plans reuse them after JSON round-trip',
        () => {
          const second = buildPlan(source, database, { run: plan.run, domain: plan.domain })
          assert.notEqual(second.rootId, plan.rootId)
          assert.ok(
            Object.values(plan.map).every((id) =>
              /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id),
            ),
          )
          const restored = JSON.parse(JSON.stringify(plan))
          assert.deepEqual(buildPlan(source, database, restored), plan)
          const missing = { ...plan.map }
          delete missing[SOURCE]
          assert.throws(
            () => buildPlan(source, database, { ...plan, map: missing }),
            /exactly the source rows/,
          )
          const ids = Object.keys(plan.map)
          assert.throws(
            () =>
              buildPlan(source, database, {
                ...plan,
                map: { ...plan.map, [ids[0]]: plan.map[ids[1]] },
              }),
            /duplicate target IDs/,
          )
          assert.throws(
            () => buildPlan(source, database, { ...plan, map: { ...plan.map, [SOURCE]: SOURCE } }),
            /reuses a source ID/,
          )
          assert.throws(() =>
            buildPlan(source, database, { ...plan, map: { ...plan.map, [SOURCE]: 'invalid' } }),
          )
        },
      )
      await t.test(
        'archive move refuses the occupied ing25 domain and leaves source unchanged',
        async () => {
          await assert.rejects(
            moveDomain(db, {}, { 'maintenance-confirmed': true }),
            /Archive domain ing25 is occupied/,
          )
          assert.equal((await snapshot(client)).fingerprint, source.fingerprint)
        },
      )
      await t.test('copy policy removes people, updates dates, preserves external URLs', () => {
        assert.equal(plan.output.event.length, 102)
        assert.equal(plan.output.media.length, 158)
        assert.ok(
          plan.output.event.every((x) => x.num_attendees === 0 && x.internal_notes === null),
        )
        assert.ok(plan.output.media.every((x) => x.user_id === null && x.event_id === plan.rootId))
        assert.equal(plan.output.content.find((x) => x.key === 'alert-link').body, '')
        assert.equal(
          plan.output.content.find((x) => x.key === 'main-start-date').body,
          'October 5–8, 2026',
        )
        assert.ok(
          plan.output.page.find((x) => x.path === 'meals').body.includes('Tuesday, October 6th'),
        )
        assert.ok(
          plan.output.page
            .find((x) => x.path === 'program')
            .body.includes('51d64293-c677-4ed3-9329-5324456377b4'),
        )
        assert.ok(!('event_user' in plan.output))
        const otherDatabase = buildPlan(
          source,
          { ...database, database: 'another-database' },
          {
            run: plan.run,
            domain: plan.domain,
          },
        )
        assert.notEqual(otherDatabase.rootId, plan.rootId)
        assert.notEqual(otherDatabase.assets[0].target, plan.assets[0].target)
      })
      const countTarget = async () =>
        Number(
          (await client.query('select count(*) from event where id=$1', [plan.rootId])).rows[0]
            .count,
        )
      await t.test('rehearsal rolls back every inserted row', async () => {
        assert.equal(
          (await apply(db, plan, { rehearse: true })).status,
          'rehearsed-and-rolled-back',
        )
        assert.equal(await countTarget(), 0)
      })
      await t.test('mid-copy failure rolls back all earlier inserts', async () => {
        await assert.rejects(
          apply(db, plan, { rehearse: true, failAfter: 110 }),
          /Injected failure/,
        )
        assert.equal(await countTarget(), 0)
        assert.equal((await snapshot(client)).fingerprint, source.fingerprint)
      })
      await t.test('edited plans and occupied domains fail without changes', async () => {
        await assert.rejects(
          apply(db, { ...plan, domain: 'wrong' }, { rehearse: true }),
          /invalid or edited/,
        )
        await client.query('savepoint collision')
        await client.query("insert into event(name,domain_id) values('test collision',$1)", [
          plan.domain,
        ])
        await assert.rejects(apply(db, plan, { rehearse: true }), /occupied/)
        await client.query('rollback to savepoint collision')
        await client.query('release savepoint collision')
      })
      // Storage is intentionally not exercised by the DB test. The CLI requires real
      // file verification before apply; this temporary manifest permits testing SQL.
      await client.query('create schema if not exists eventlayer_ops')
      await client.query(
        "create table if not exists eventlayer_ops.duplication_run(run text primary key,digest text not null,status text not null,plan jsonb not null,inserted jsonb,assets jsonb not null default '{}'::jsonb,created_at timestamptz not null default now())",
      )
      await client.query(
        "insert into eventlayer_ops.duplication_run(run,digest,status,plan) values($1,$2,'assets-ready',$3)",
        [plan.run, plan.digest, plan],
      )
      await t.test('apply and retry create exactly one copy', async () => {
        assert.equal((await apply(db, plan)).status, 'applied')
        assert.equal((await apply(db, plan)).status, 'already-applied')
        assert.equal(await countTarget(), 1)
        assert.equal((await snapshot(client)).fingerprint, source.fingerprint)
      })
      await t.test('cleanup refuses an edited page', async () => {
        await client.query('savepoint edit')
        await client.query("update page set title='Edited' where id=$1", [plan.output.page[0].id])
        await assert.rejects(cleanup(db, plan), /row changed/)
        assert.equal(await countTarget(), 1)
        await client.query('rollback to savepoint edit')
        await client.query('release savepoint edit')
      })
      await t.test('cleanup refuses new RSVP activity', async () => {
        await client.query('savepoint activity')
        await client.query("insert into event_user(event_id,type) values($1,'attendee')", [
          plan.rootId,
        ])
        await assert.rejects(cleanup(db, plan), /New activity/)
        await client.query('rollback to savepoint activity')
        await client.query('release savepoint activity')
      })
      await t.test('cleanup refuses an external reference without a foreign key', async () => {
        await client.query('savepoint incoming')
        await client.query('insert into content(body) values($1)', [`/schedule/${plan.rootId}`])
        await assert.rejects(cleanup(db, plan), /Another content row/)
        await client.query('rollback to savepoint incoming')
        await client.query('release savepoint incoming')
      })
      await t.test('cleanup removes only the recorded copy and is repeatable', async () => {
        assert.equal((await cleanup(db, plan)).status, 'cleaned')
        assert.equal((await cleanup(db, plan)).status, 'already-cleaned')
        assert.equal(await countTarget(), 0)
        assert.equal((await snapshot(client)).fingerprint, source.fingerprint)
      })
      await t.test('another run can recreate the copy after cleanup', async () => {
        const again = buildPlan(source, database, {
          run: 'integration-copy-again',
          domain: plan.domain,
        })
        assert.notEqual(again.rootId, plan.rootId)
        assert.equal(
          (await apply(db, again, { rehearse: true })).status,
          'rehearsed-and-rolled-back',
        )
      })
      assert.equal(hash((await snapshot(client)).data), hash(source.data))
    } finally {
      await client.query('rollback')
      await client.end()
    }
  },
)
