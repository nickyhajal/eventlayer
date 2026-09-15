#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(resolve(here, '../package.json'))
const { Client } = require('pg')
const { parse: parseEnv } = require('dotenv')
const { z } = require('zod')
const baseline = JSON.parse(readFileSync(resolve(here, 'duplicate-event-schema.json'), 'utf8'))
const ROOT = resolve(here, '../../..')
const utilRequire = createRequire(resolve(ROOT, 'packages/util/package.json'))
const apiRequire = createRequire(resolve(ROOT, 'packages/api/package.json'))
const v4 = utilRequire('uuid/v4')
const { Redis } = apiRequire('@upstash/redis')
const idMapSchema = z.record(z.string().uuid(), z.string().uuid())
export const SOURCE = '08873456-7c8b-4f42-9e15-fb875bf59d6f'
const RUNS = 'eventlayer_ops.duplication_run'
const COPY = [
  'event',
  'venue',
  'content',
  'page',
  'menu',
  'sponsor',
  'media',
  'form_group',
  'form',
  'form_element',
  'event_user_field',
  'screen_profile',
  'screen',
  'screen_config',
]
const EXCLUDE = [
  'api_key',
  'event_user',
  'event_ticket',
  'event_user_checkin',
  'event_user_connection',
  'event_user_info',
  'event_sponsor_connection',
  'form_session',
  'form_response',
  'form_response_stat',
]
const UUID = /[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi
const ident = (s) => '"' + s.replaceAll('"', '""') + '"'
const table = (s) => `public.${ident(s)}`
const canonical = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
      : x,
  )
export const hash = (v) => createHash('sha256').update(canonical(v)).digest('hex')
const check = (ok, message) => {
  if (!ok) throw new Error(message)
}
const rows = async (db, sql, values = []) => (await db.query(sql, values)).rows
const readRows = async (db, name, where = 'true', values = []) =>
  (
    await rows(
      db,
      `select row_to_json(t) as row from ${table(name)} t where ${where} order by id`,
      values,
    )
  ).map((x) => x.row)
const byIds = (db, name, ids) =>
  readRows(db, name, 'id = any($1::uuid[])', ids.length ? [ids] : [[]])
const counts = (data) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]))

export function shiftDate(value) {
  if (value === null) return null
  check(
    /^2025-10-(07|08|09|10)[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value),
    `Unexpected schedule timestamp: ${value}`,
  )
  return `2026-10-${String(Number(value.slice(8, 10)) - 2).padStart(2, '0')}${value.slice(10)}`
}

export function mediaKey(row) {
  check(
    row.dir && row.path && row.ext && Number.isInteger(row.version),
    `Incomplete media path: ${row.id}`,
  )
  const key = `${row.dir}/${row.path}/${row.id}-${row.version}.${row.ext}`
  check(!key.split('/').includes('..') && !key.startsWith('/'), 'Unsafe media path')
  return key
}

export async function schema(db) {
  const cols = await rows(
    db,
    "select table_name,column_name,udt_name,is_nullable from information_schema.columns where table_schema='public' order by table_name,ordinal_position",
  )
  const constraints = await rows(
    db,
    "select conrelid::regclass::text as table_name,conname,pg_get_constraintdef(oid) as definition from pg_constraint where connamespace='public'::regnamespace order by conrelid::regclass::text,conname",
  )
  check(
    hash({ cols, constraints }) === hash(baseline),
    'Database schema differs from the reviewed schema. Review the table/column policies before updating duplicate-event-schema.json.',
  )
  const triggers = await rows(
    db,
    "select tgname from pg_trigger where not tgisinternal and tgrelid in(select oid from pg_class where relnamespace='public'::regnamespace)",
  )
  check(!triggers.length, 'Unreviewed database triggers exist; refusing copy/cleanup')
  return { cols, constraints }
}

async function identity(db) {
  const [v] = await rows(
    db,
    'select current_database() as database, inet_server_addr()::text as server, inet_server_port() as port',
  )
  return v
}

export async function snapshot(db, source = SOURCE) {
  const events = (
    await rows(
      db,
      `with recursive tree as (
    select * from public.event where id=$1
    union select e.* from public.event e join tree t on e.event_id=t.id
  ) select row_to_json(tree) as row from tree order by id`,
      [source],
    )
  ).map((x) => x.row)
  const root = events.find((x) => x.id === source)
  check(root && root.event_id === null, 'Source must be an existing root event')
  const ids = events.map((x) => x.id)
  const data = { event: events }
  for (const name of COPY.filter(
    (x) => !['event', 'media', 'form_group', 'form_element'].includes(x),
  )) {
    data[name] = await readRows(db, name, 'event_id=any($1::uuid[])', [ids])
  }
  data.form_group = await byIds(db, 'form_group', data.form.map((x) => x.group_id).filter(Boolean))
  data.form_element = await readRows(db, 'form_element', 'form_id=any($1::uuid[])', [
    data.form.map((x) => x.id),
  ])
  check(
    data.form_element.every((x) => x.user_id === null),
    'Personalized form elements require an explicit policy',
  )
  const entityIds = new Set(
    Object.values(data)
      .flat()
      .map((x) => x.id),
  )
  const directMedia = new Set(
    Object.values(data)
      .flat()
      .flatMap((x) =>
        ['mediaId', 'media_id', 'large_logo_id', 'dark_logo_id', 'favicon_id']
          .map((k) => x[k])
          .filter(Boolean),
      ),
  )
  const mentions = [...new Set(JSON.stringify(data).match(UUID) || [])].filter(
    (x) => !entityIds.has(x),
  )
  data.media = await byIds(db, 'media', [...new Set([...mentions, ...directMedia])])
  check(
    [...directMedia].every((id) => data.media.some((x) => x.id === id)),
    'A direct media reference is missing from the source database',
  )
  check(
    data.media.every((x) => x.parent_type !== 'user'),
    'Content references a user image. Review before copying.',
  )
  const selectedIds = new Set(
    Object.values(data)
      .flat()
      .map((x) => x.id),
  )
  const entityTable = new Map(
    Object.entries(data).flatMap(([name, list]) => list.map((x) => [x.id, name])),
  )
  const referenceTypes = {
    event_id: 'event',
    venue_id: 'venue',
    form_id: 'form',
    group_id: 'form_group',
    form_element_id: 'form_element',
    screen_id: 'screen',
    screen_profile_id: 'screen_profile',
    mediaId: 'media',
    media_id: 'media',
    large_logo_id: 'media',
    dark_logo_id: 'media',
    favicon_id: 'media',
  }
  for (const [name, list] of Object.entries(data))
    for (const row of list) {
      const references = Object.entries(row).filter(([k, v]) => v && k in referenceTypes)
      for (const [key, id] of references)
        check(
          entityTable.get(id) === referenceTypes[key],
          `Unresolved or wrong-type ${name}.${key} on ${row.id}: ${id}`,
        )
      if (row.parent_id && name !== 'media')
        check(selectedIds.has(row.parent_id), `Unresolved ${name}.parent_id on ${row.id}`)
    }
  const excluded = {}
  for (const name of EXCLUDE) {
    const cols = baseline.cols.filter((x) => x.table_name === name).map((x) => x.column_name)
    const scope = cols
      .filter((x) => ['event_id', 'main_id', 'main_event_id', 'company_id'].includes(x))
      .map((k) => `${ident(k)}=any($1::uuid[])`)
    if (name === 'form_session' || name === 'form_response') scope.push('form_id=any($2::uuid[])')
    if (name === 'form_response_stat') scope.push('element_id=any($2::uuid[])')
    const values = [ids]
    if (name === 'form_session' || name === 'form_response') values.push(data.form.map((x) => x.id))
    if (name === 'form_response_stat') values.push(data.form_element.map((x) => x.id))
    // Only fingerprints and counts leave this function for attendee data.
    const found = await readRows(db, name, scope.join(' or '), values)
    excluded[name] = { count: found.length, hash: hash(found) }
  }
  const ownedMedia = await readRows(db, 'media', 'event_id=any($1::uuid[])', [ids])
  return { data, excluded, root, fingerprint: hash({ data, excluded, ownedMedia }) }
}

export function buildPlan(snap, database, { run, domain, map: savedMap }) {
  check(
    /^[a-z0-9][a-z0-9-]{2,70}$/.test(run),
    'Use a run name with 3–71 lowercase letters, digits or hyphens',
  )
  check(
    /^[a-z0-9][a-z0-9-]{0,62}$/.test(domain) && !['ing25', snap.root.domain_id].includes(domain),
    'Destination must be a new subdomain, distinct from source and archive',
  )
  const sourceIds = Object.values(snap.data)
    .flat()
    .map((row) => row.id)
  const map = idMapSchema.parse(savedMap ?? Object.fromEntries(sourceIds.map((id) => [id, v4()])))
  check(
    Object.keys(map).length === sourceIds.length && sourceIds.every((id) => Object.hasOwn(map, id)),
    'Saved ID map must cover exactly the source rows',
  )
  const targetIds = new Set(Object.values(map))
  check(targetIds.size === sourceIds.length, 'Saved ID map contains duplicate target IDs')
  check(
    sourceIds.every((id) => !targetIds.has(id)),
    'Saved ID map reuses a source ID',
  )
  const rootId = map[snap.root.id]
  const remap = (v) => {
    if (typeof v === 'string') return v.replace(UUID, (id) => map[id] || id)
    if (Array.isArray(v)) return v.map(remap)
    if (v && typeof v === 'object')
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, remap(x)]))
    return v
  }
  const output = {}
  const warnings = [
    'Copied session times, speakers mentioned in text, sponsor claims and external booking links need editorial review. No speaker/staff memberships are copied.',
    'Selected-only sessions keep their access rule and have no assignments. Existing full audience rules are preserved for review.',
    'External images and restaurant links keep their original URLs.',
  ]
  const edits = []
  for (const [name, list] of Object.entries(snap.data))
    output[name] = list.map((original) => {
      const row = remap(original)
      delete row.created_at
      delete row.updated_at
      if ('user_id' in row) row.user_id = null
      if ('internal_notes' in row) row.internal_notes = null
      if (name === 'event') {
        row.num_attendees = 0
        row.domain_id = original.id === snap.root.id ? domain : null
        row.starts_at =
          original.id === snap.root.id ? '2026-10-05T00:00:00' : shiftDate(original.starts_at)
        // The existing root has no end date, and the app has no root end-boundary convention.
        row.end_at = original.id === snap.root.id ? null : shiftDate(original.end_at)
        const settings = original.settings || {}
        check(
          Object.keys(settings).every((k) => ['header_scripts', 'support_email'].includes(k)) &&
            !settings.header_scripts,
          `Unreviewed settings on event ${original.id}`,
        )
        row.settings = original.settings === null ? null : { ...settings, header_scripts: '' }
        if (row.description)
          row.description = row.description
            .replace('2025 Innovation Network Gathering', '2026 Innovation Network Gathering')
            .replace("At last year's Gathering (2024)", 'At the 2024 Gathering')
      }
      if (name === 'content') {
        if (row.key === 'main-start-date') row.body = 'October 5–8, 2026'
        if (['alert', 'alert-link', 'main-location-line-5'].includes(row.key)) row.body = ''
        if (original.id === '3fb5572c-9546-497f-9858-76e97e56ed58')
          row.body =
            'Arrival day is Monday, October 5, 2026. Program day 1 is Tuesday, October 6. Check-in and program times will be confirmed in the schedule.'
      }
      if (name === 'page' && row.path === 'meals')
        row.body = row.body
          ?.replaceAll('Wednesday, October 8th', 'Tuesday, October 6th')
          .replaceAll('Thursday, October 9th', 'Wednesday, October 7th')
      if (name === 'media' && !map[original.parent_id]) {
        row.parent_id = rootId
        row.parent_type = 'event-content'
      }
      if (name === 'media') row.event_id = rootId
      if (name === 'screen_config' || name === 'screen_profile') {
        row.notification_enabled = false
        row.notification_message = null
        row.message_body = null
        if (row.mode === 'message') row.mode = 'upcoming_events'
        if ('time_override_at' in row) row.time_override_at = null
      }
      if (name === 'sponsor')
        check(
          !row.settings || Object.keys(row.settings).length === 0,
          `Review sponsor settings before copying ${original.id}`,
        )
      for (const k of ['body', 'description'])
        if (row[k] !== remap(original[k]))
          edits.push({
            table: name,
            sourceId: original.id,
            field: k,
            before: original[k],
            after: row[k],
          })
      return row
    })
  for (const row of output.event)
    if (row.end_at && row.starts_at >= row.end_at)
      warnings.push(`Review zero-length/inverted session: ${row.name}`)
  const assets = snap.data.media.map((m) => ({
    source: mediaKey(m),
    target: mediaKey(output.media.find((x) => x.id === map[m.id])),
    sourceId: m.id,
    targetId: map[m.id],
  }))
  check(
    assets.every((a) => a.source !== a.target),
    'Source and destination file keys must differ',
  )
  const plan = {
    version: 1,
    policy: 'ing-2026-v2',
    run,
    sourceId: snap.root.id,
    sourceDomain: snap.root.domain_id,
    archiveDomain: 'ing25',
    domain,
    rootId,
    database,
    schemaHash: hash(baseline),
    sourceFingerprint: snap.fingerprint,
    map,
    output,
    assets,
    excluded: snap.excluded,
    edits,
    warnings,
  }
  return { ...plan, digest: hash(plan) }
}

function validatePlan(plan) {
  const { digest, ...payload } = plan
  check(
    plan.version === 1 && plan.policy === 'ing-2026-v2' && digest === hash(payload),
    'Plan is invalid or edited. Generate a fresh plan.',
  )
  check(plan.sourceId === SOURCE, 'This policy is scoped to the audited ING event')
  idMapSchema.parse(plan.map)
}

async function setupRuns(db) {
  await db.query('create schema if not exists eventlayer_ops')
  await db.query(
    `create table if not exists ${RUNS} (run text primary key, digest text not null, status text not null, plan jsonb not null, inserted jsonb, assets jsonb not null default '{}'::jsonb, created_at timestamptz not null default now())`,
  )
}

async function runExists(db, run) {
  const [exists] = await rows(db, "select to_regclass('eventlayer_ops.duplication_run') as name")
  return exists.name ? (await rows(db, `select * from ${RUNS} where run=$1`, [run]))[0] : null
}

async function lockTables(db) {
  await db.query("set local lock_timeout='5s'")
  const names = [...new Set(baseline.cols.map((x) => x.table_name))].sort()
  await db.query(`lock table ${names.map(table).join(',')} in share row exclusive mode`)
}

async function fresh(db, plan) {
  validatePlan(plan)
  await schema(db)
  check(hash(await identity(db)) === hash(plan.database), 'Plan belongs to a different database')
  const snap = await snapshot(db, plan.sourceId)
  check(
    snap.fingerprint === plan.sourceFingerprint,
    'Source changed since planning. Generate a fresh plan.',
  )
  check(
    buildPlan(snap, plan.database, plan).digest === plan.digest,
    'Plan differs from the current copy policy',
  )
  const occupied = await rows(db, 'select id from public.event where domain_id=$1', [plan.domain])
  check(!occupied.length, `Destination domain ${plan.domain} is already occupied`)
  return snap
}

async function insertRow(db, name, row) {
  const fields = Object.keys(row)
  const [result] = await rows(
    db,
    `insert into ${table(name)} (${fields.map(ident).join(',')}) select ${fields.map(ident).join(',')} from json_populate_record(null::${table(name)},$1::json) returning row_to_json(${ident(name)}) as row`,
    [JSON.stringify(row)],
  )
  return result.row
}

async function insertCopy(db, plan, failAfter = 0) {
  const inserted = Object.fromEntries(COPY.map((t) => [t, []]))
  let n = 0
  for (const name of COPY) {
    for (const original of plan.output[name]) {
      const row = { ...original }
      // Venue/event references form a cycle; restore nullable references after all inserts.
      if (name === 'event') row.venue_id = null
      if (name === 'venue') row.venue_id = null
      const result = await insertRow(db, name, row)
      inserted[name].push({ id: result.id, hash: hash(result) })
      if (++n === failAfter) throw new Error('Injected failure; transaction will roll back')
    }
  }
  for (const name of ['event', 'venue'])
    for (const row of plan.output[name]) {
      if (row.venue_id)
        await db.query(`update ${table(name)} set venue_id=$1 where id=$2`, [row.venue_id, row.id])
    }
  for (const name of COPY)
    inserted[name] = (
      await byIds(
        db,
        name,
        plan.output[name].map((x) => x.id),
      )
    ).map((x) => ({ id: x.id, hash: hash(x) }))
  return inserted
}

async function verifyRows(db, plan, inserted) {
  for (const name of COPY) {
    const found = await byIds(
      db,
      name,
      plan.output[name].map((x) => x.id),
    )
    check(found.length === plan.output[name].length, `Missing copied rows in ${name}`)
    for (const row of found)
      check(
        inserted[name].find((x) => x.id === row.id)?.hash === hash(row),
        `Copied ${name} row changed: ${row.id}`,
      )
  }
  const copy = await snapshot(db, plan.rootId)
  for (const [name, info] of Object.entries(copy.excluded))
    check(info.count === 0, `New activity in ${name}; automatic cleanup is unsafe`)
  for (const row of copy.data.event)
    check(row.num_attendees === 0, `Nonzero attendance on ${row.id}`)
  check(
    (await snapshot(db, plan.sourceId)).fingerprint === plan.sourceFingerprint,
    'Source differs from the original plan',
  )
}

export async function apply(db, plan, { rehearse = false, failAfter = 0 } = {}) {
  validatePlan(plan)
  await db.query('begin')
  try {
    await schema(db)
    check(hash(await identity(db)) === hash(plan.database), 'Wrong database')
    await lockTables(db)
    await db.query("select pg_advisory_xact_lock(hashtext('eventlayer-duplicate'))")
    const previous = await runExists(db, plan.run)
    if (previous?.status === 'applied') {
      check(previous.digest === plan.digest, 'Run name already belongs to another plan')
      await verifyRows(db, plan, previous.inserted)
      await db.query('rollback')
      return { status: 'already-applied', rootId: plan.rootId }
    }
    check(
      !previous || previous.status === 'assets-ready',
      'Run cannot be applied in its current state',
    )
    await fresh(db, plan)
    if (!rehearse) {
      check(
        previous?.digest === plan.digest && previous.status === 'assets-ready',
        'Run assets first. Apply never creates an event with uncopied images.',
      )
    }
    await setupRuns(db)
    const inserted = await insertCopy(db, plan, failAfter)
    await verifyRows(db, plan, inserted)
    await db.query(
      `insert into ${RUNS} (run,digest,status,plan,inserted) values($1,$2,'applied',$3,$4) on conflict(run) do update set status='applied',inserted=excluded.inserted`,
      [plan.run, plan.digest, plan, inserted],
    )
    await db.query(rehearse ? 'rollback' : 'commit')
    return {
      status: rehearse ? 'rehearsed-and-rolled-back' : 'applied',
      rootId: plan.rootId,
      counts: counts(plan.output),
      excluded: Object.fromEntries(Object.keys(plan.excluded).map((k) => [k, 0])),
    }
  } catch (e) {
    await db.query('rollback')
    throw e
  }
}

async function noIncomingReferences(db, plan) {
  const targetIds = Object.values(plan.map)
  const pattern = '[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}'
  for (const name of [...new Set(baseline.cols.map((x) => x.table_name))]) {
    const own = plan.output[name]?.map((x) => x.id) || []
    const found = await rows(
      db,
      `select id from ${table(name)} t where not(id::text=any($1::text[])) and exists (
      select 1 from regexp_matches(row_to_json(t)::text,$2,'gi') as matches(parts)
      where lower(parts[1])=any($3::text[])
    ) limit 1`,
      [own, pattern, targetIds],
    )
    check(!found.length, `Another ${name} row refers to this copy; refusing cleanup`)
  }
}

export async function cleanup(db, plan) {
  validatePlan(plan)
  await db.query('begin')
  try {
    await schema(db)
    check(hash(await identity(db)) === hash(plan.database), 'Wrong database')
    await lockTables(db)
    await db.query("select pg_advisory_xact_lock(hashtext('eventlayer-duplicate'))")
    const saved = await runExists(db, plan.run)
    check(saved?.digest === plan.digest, 'No matching recorded run')
    if (saved.status === 'cleaned') {
      await db.query('rollback')
      return { status: 'already-cleaned' }
    }
    check(saved.status === 'applied', 'Only an applied run can be cleaned')
    await verifyRows(db, plan, saved.inserted)
    await noIncomingReferences(db, plan)
    for (const name of ['event', 'venue'])
      await db.query(`update ${table(name)} set venue_id=null where id=any($1::uuid[])`, [
        plan.output[name].map((x) => x.id),
      ])
    for (const name of [...COPY].reverse())
      await db.query(`delete from ${table(name)} where id=any($1::uuid[])`, [
        plan.output[name].map((x) => x.id),
      ])
    check(
      (await snapshot(db, plan.sourceId)).fingerprint === plan.sourceFingerprint,
      'Source changed during cleanup',
    )
    await db.query(`update ${RUNS} set status='cleaned' where run=$1`, [plan.run])
    await db.query('commit')
    return {
      status: 'cleaned',
      retainedFiles: plan.assets.length,
      note: 'Only copied database rows removed. Files are retained; no source or copied storage objects are deleted.',
    }
  } catch (e) {
    await db.query('rollback')
    throw e
  }
}

async function storage(env) {
  const sdk = apiRequire('@aws-sdk/client-s3')
  check(env.B2_ACCESS_ID && env.B2_ACCESS_KEY, 'B2 credentials are missing')
  return {
    sdk,
    client: new sdk.S3Client({
      endpoint: 'https://s3.us-east-005.backblazeb2.com',
      region: 'us-east-005',
      credentials: { accessKeyId: env.B2_ACCESS_ID, secretAccessKey: env.B2_ACCESS_KEY },
    }),
  }
}

async function head(client, sdk, key) {
  try {
    return await client.send(new sdk.HeadObjectCommand({ Bucket: 'eventlayer', Key: key }))
  } catch (e) {
    if (e.$metadata?.httpStatusCode === 404) return null
    throw e
  }
}

async function assets(db, plan, env, inspectOnly = false) {
  validatePlan(plan)
  await fresh(db, plan)
  const { client, sdk } = await storage(env)
  try {
    const sources = []
    for (const a of plan.assets) {
      const source = await head(client, sdk, a.source)
      check(
        source,
        `Missing source file ${a.source}; source data will not be repaired by this script`,
      )
      sources.push({
        ...a,
        etag: source.ETag,
        size: source.ContentLength,
        sourceVersion: source.VersionId,
      })
      if (sources.length % 20 === 0)
        process.stderr.write(`Checked ${sources.length}/${plan.assets.length} source files\n`)
    }
    if (inspectOnly) return { status: 'files-checked', count: sources.length }
    // Session lock serializes retries while network calls run outside a database transaction.
    await db.query("select pg_advisory_lock(hashtext('eventlayer-duplicate'))")
    try {
      await setupRuns(db)
      const prior = await runExists(db, plan.run)
      check(!prior || prior.digest === plan.digest, 'Run name belongs to another plan')
      check(
        !prior || ['assets-copying', 'assets-ready'].includes(prior.status),
        'Run cannot copy files in its current state',
      )
      await db.query(
        `insert into ${RUNS}(run,digest,status,plan) values($1,$2,'assets-copying',$3) on conflict(run) do nothing`,
        [plan.run, plan.digest, plan],
      )
      for (let i = 0; i < sources.length; i++) {
        const a = sources[i]
        let dest = await head(client, sdk, a.target)
        if (dest)
          check(
            dest.Metadata?.['duplication-run'] === plan.run &&
              dest.Metadata?.['source-etag'] === a.etag,
            `Destination file already exists without matching provenance: ${a.target}`,
          )
        else {
          await client.send(
            new sdk.CopyObjectCommand({
              Bucket: 'eventlayer',
              Key: a.target,
              CopySource: `eventlayer/${a.source.split('/').map(encodeURIComponent).join('/')}${a.sourceVersion ? `?versionId=${encodeURIComponent(a.sourceVersion)}` : ''}`,
              CopySourceIfMatch: a.etag,
              MetadataDirective: 'REPLACE',
              Metadata: { 'duplication-run': plan.run, 'source-etag': a.etag },
              ContentType: (await head(client, sdk, a.source)).ContentType,
            }),
          )
          dest = await head(client, sdk, a.target)
        }
        check(
          dest && dest.ContentLength === a.size && dest.ETag === a.etag,
          `Copied file differs: ${a.target}`,
        )
        await db.query(`update ${RUNS} set assets=assets || $2::jsonb where run=$1`, [
          plan.run,
          JSON.stringify({
            [a.target]: { etag: dest.ETag, size: dest.ContentLength, version: dest.VersionId },
          }),
        ])
        if ((i + 1) % 20 === 0)
          process.stderr.write(`Copied/verified ${i + 1}/${sources.length} files\n`)
      }
      await db.query(`update ${RUNS} set status='assets-ready' where run=$1`, [plan.run])
      return { status: 'assets-ready', count: sources.length }
    } finally {
      await db.query("select pg_advisory_unlock(hashtext('eventlayer-duplicate'))")
    }
  } finally {
    client.destroy()
  }
}

async function verifyAssets(db, plan, env) {
  const saved = await runExists(db, plan.run)
  check(saved?.digest === plan.digest, 'Missing run manifest')
  const { client, sdk } = await storage(env)
  try {
    for (const a of plan.assets) {
      const stored = saved.assets[a.target]
      const dest = await head(client, sdk, a.target)
      check(
        stored &&
          dest &&
          dest.ETag === stored.etag &&
          dest.ContentLength === stored.size &&
          dest.Metadata?.['duplication-run'] === plan.run,
        `Missing/changed copied file: ${a.target}`,
      )
    }
  } finally {
    client.destroy()
  }
}

export async function moveDomain(db, env, options) {
  check(
    options['maintenance-confirmed'],
    'Domain moves require --maintenance-confirmed with web traffic paused until cache invalidation succeeds',
  )
  const from = options.from || 'ing'
  const to = options.to || 'ing25'
  check(
    from === 'ing' && to === 'ing25',
    'This command only supports the reviewed ing → ing25 move',
  )
  await db.query('begin')
  try {
    await schema(db)
    await lockTables(db)
    const before = await snapshot(db)
    check(before.root.domain_id === from, `Source domain is ${before.root.domain_id}, not ${from}`)
    check(
      !(await rows(db, 'select id from public.event where domain_id=$1', [to])).length,
      `Archive domain ${to} is occupied. No rows changed. Resolve that event separately; this script never overwrites it.`,
    )
    await setupRuns(db)
    const run = `move-ing-ing25-${hash(before.root).slice(0, 12)}`
    const changed = await rows(
      db,
      'update public.event set domain_id=$1 where id=$2 and domain_id=$3 returning id',
      [to, SOURCE, from],
    )
    check(changed.length === 1, 'Source domain changed concurrently')
    const after = await snapshot(db)
    after.root.domain_id = from
    check(
      hash(before.data) === hash(after.data) && hash(before.excluded) === hash(after.excluded),
      'Unexpected source changes',
    )
    await db.query(`insert into ${RUNS}(run,digest,status,plan) values($1,$2,'domain-moved',$3)`, [
      run,
      hash(before.root),
      { sourceId: SOURCE, from, to },
    ])
    await db.query('commit')
  } catch (e) {
    await db.query('rollback')
    throw e
  }
  await clearRouteCaches(env, [from, to], SOURCE)
  return {
    status: 'domain-moved',
    sourceId: SOURCE,
    from,
    to,
    note: 'Verify both hostnames before resuming traffic. Generate the copy plan AFTER this move.',
  }
}

export async function clearRouteCaches(env, domains, rootId) {
  check(
    env.REDIS_URL && env.REDIS_TOKEN,
    'Database operation completed, but Redis credentials are missing. Keep traffic paused and run clear-cache.',
  )
  const keys = [...domains.map((x) => `event_subdomain:${x}`), `event_heavy:${rootId}`]
  try {
    const redis = new Redis({
      url: env.REDIS_URL,
      token: env.REDIS_TOKEN,
      signal: AbortSignal.timeout(15000),
      enableAutoPipelining: false,
    })
    check(Number.isInteger(await redis.del(...keys)), 'Invalid Redis response')
  } catch {
    throw new Error(
      'Cache invalidation failed; the database operation may already be committed. Keep traffic paused and run clear-cache.',
    )
  }
}

const help = `ING duplication, explicit database connection required.
node packages/db/bin/duplicate-event.mjs COMMAND --env-file apps/web/.env [options]

inspect                            Read source counts and domain conflicts
plan --run NAME --domain NAME --out FILE
                                   Write a private, reviewable plan (no database writes)
rehearse --plan FILE                Insert, verify and ROLLBACK; no file/cache operations
check-files --plan FILE             Read-only check of source files in Backblaze
assets --plan FILE                  Copy required files to new names; resumable
apply --plan FILE                   Insert copy and saved cleanup manifest
verify --plan FILE                  Verify unchanged copy/source and copied files
cleanup --plan FILE                 Remove unused copy rows; retain files
move-domain --maintenance-confirmed Move exact source ing → ing25; refuse collisions
clear-cache --plan FILE             Clear only the planned destination routing cache
clear-cache --maintenance-confirmed Retry ing/ing25 cache invalidation after a domain move

Remote database writes additionally require --allow-remote --expect-database NAME.
Remote apply/cleanup require --maintenance-confirmed and invalidate route caches.
This is an ING 2026 policy, not a general-purpose event copier. See duplicate-event.md.
`

export async function main(argv = process.argv.slice(2)) {
  const { values: o, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: Object.fromEntries(
      ['env-file', 'run', 'domain', 'out', 'plan', 'expect-database', 'from', 'to']
        .map((k) => [k, { type: 'string' }])
        .concat(
          ['help', 'allow-remote', 'maintenance-confirmed'].map((k) => [k, { type: 'boolean' }]),
        ),
    ),
  })
  const command = positionals[0]
  if (!command || o.help) {
    process.stdout.write(help)
    return
  }
  check(
    [
      'inspect',
      'plan',
      'rehearse',
      'check-files',
      'assets',
      'apply',
      'verify',
      'cleanup',
      'move-domain',
      'clear-cache',
    ].includes(command) && positionals.length === 1,
    'Unknown command; use --help',
  )
  const env = o['env-file'] ? parseEnv(readFileSync(resolve(o['env-file']), 'utf8')) : process.env
  check(env.DB_URL, 'Supply --env-file or DB_URL. No implicit packages/db/.env fallback.')
  const url = new URL(env.DB_URL)
  const remote = !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  const writes = ['assets', 'apply', 'cleanup', 'move-domain', 'clear-cache'].includes(command)
  check(
    !remote ||
      !writes ||
      (o['allow-remote'] && o['expect-database'] === decodeURIComponent(url.pathname.slice(1))),
    'Remote writes require --allow-remote --expect-database NAME',
  )
  check(
    !remote || !['apply', 'cleanup'].includes(command) || o['maintenance-confirmed'],
    'Remote apply/cleanup requires paused traffic and --maintenance-confirmed',
  )
  const db = new Client({
    connectionString: env.DB_URL,
    connectionTimeoutMillis: 10000,
    application_name: 'eventlayer-duplicate',
    options: '-c search_path=public -c statement_timeout=60000',
  })
  await db.connect()
  try {
    if (o['expect-database'])
      check((await identity(db)).database === o['expect-database'], 'Unexpected database')
    let plan
    if (o.plan) {
      plan = JSON.parse(readFileSync(resolve(o.plan), 'utf8'))
      validatePlan(plan)
    }
    let result
    if (command === 'inspect' || command === 'plan') {
      await db.query('begin isolation level repeatable read read only')
      await schema(db)
      const snap = await snapshot(db)
      const database = await identity(db)
      if (command === 'inspect')
        result = {
          database,
          source: { id: snap.root.id, domain: snap.root.domain_id, startsAt: snap.root.starts_at },
          copy: counts(snap.data),
          excluded: Object.fromEntries(Object.entries(snap.excluded).map(([k, v]) => [k, v.count])),
          domains: await rows(
            db,
            "select id,domain_id,starts_at::text from public.event where domain_id in ('ing','ing25','ing26')",
          ),
        }
      else {
        check(o.run && o.domain && o.out, 'plan requires --run, --domain and --out')
        check(
          !(await rows(db, 'select id from public.event where domain_id=$1', [o.domain])).length,
          'Destination domain is occupied',
        )
        plan = buildPlan(snap, database, o)
        writeFileSync(resolve(o.out), JSON.stringify(plan, null, 2) + '\n', {
          flag: 'wx',
          mode: 0o600,
        })
        result = {
          status: 'planned',
          file: resolve(o.out),
          digest: plan.digest,
          counts: counts(plan.output),
          assets: plan.assets.length,
          warnings: plan.warnings,
        }
      }
      await db.query('rollback')
    } else if (command === 'move-domain') result = await moveDomain(db, env, o)
    else if (command === 'clear-cache') {
      check(
        plan || o['maintenance-confirmed'],
        'Provide a plan, or confirm paused traffic for ing/ing25',
      )
      await clearRouteCaches(env, plan ? [plan.domain] : ['ing', 'ing25'], plan?.rootId || SOURCE)
      result = { status: 'cache-cleared' }
    } else {
      check(plan, `${command} requires --plan FILE`)
      if (command === 'rehearse') result = await apply(db, plan, { rehearse: true })
      if (command === 'assets' || command === 'check-files')
        result = await assets(db, plan, env, command === 'check-files')
      if (command === 'apply') {
        await verifyAssets(db, plan, env)
        result = await apply(db, plan)
      }
      if (command === 'cleanup') result = await cleanup(db, plan)
      if (command === 'verify') {
        const saved = await runExists(db, plan.run)
        check(saved?.digest === plan.digest && saved.status === 'applied', 'Run is not applied')
        await db.query('begin isolation level repeatable read read only')
        await schema(db)
        check(hash(await identity(db)) === hash(plan.database), 'Wrong database')
        await verifyRows(db, plan, saved.inserted)
        await db.query('rollback')
        await verifyAssets(db, plan, env)
        result = { status: 'verified', rootId: plan.rootId }
      }
      if (remote && ['apply', 'cleanup'].includes(command))
        await clearRouteCaches(env, [plan.domain], plan.rootId)
    }
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  } finally {
    await db.end()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`Error: ${e.message}\n`)
    process.exitCode = 1
  })
}
