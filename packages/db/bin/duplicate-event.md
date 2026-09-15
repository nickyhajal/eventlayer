# Duplicate ING for October 2026

Run commands from the repository root. The script is a standalone Node CLI using Eventlayer's installed `pg`, `dotenv`, `uuid/v4`, `zod`, `@upstash/redis` and AWS S3 SDK packages. It resolves each dependency from its existing workspace package. It does not load the web app or call email, payment, notification or import code. No packages were added.

## What it does

- Copies the exact source UUID `08873456-7c8b-4f42-9e15-fb875bf59d6f` and its reusable content into a separate root event.
- Maps October 7–10, 2025 to October 5–8, 2026, preserving local times. Sets parent start to October 5 at midnight; leaves parent end unset. Updates the homepage date, Meals headings, registration FAQ and closing-session year. Clears the old feedback link and prompt.
- Copies 102 event rows, 41 venues, 20 content rows, 3 pages, 30 menus, 17 sponsors, 1 onboarding form with 15 elements, 1 screen/configuration, and 158 referenced media rows in the audited local dataset.
- Starts with zero memberships, speakers, staff, RSVPs, assignments, answers, submissions, connections, tickets and check-ins. User accounts are untouched. Capacities and audience rules remain; selected-only sessions have no assignments. Existing `full` rules are preserved for review.
- Uses new IDs and independent storage filenames. Clears authorship IDs and private internal notes on copied rows. Refuses unknown event/sponsor settings rather than copying possible integrations or secrets.
- Leaves external Squarespace and restaurant URLs unchanged. They contain UUIDs that are not references to database rows.
- Saves the exact inserted IDs and row fingerprints in `eventlayer_ops.duplication_run` in the same transaction as the event copy.
- Refuses a destination domain collision, changed source, schema drift, unreviewed triggers, incomplete media references or a changed plan.

This is an ING-specific policy. It is intentionally stricter than a general duplicate feature. Review new schema/data cases before extending it. A plan contains event content; files are created with owner-only permissions and must stay out of git.

## Archive-domain conflict

The requested archive domain is **ing25**. Locally, it already belongs to `76b474df-030c-4225-9fef-44234fb97598`, whose schedule is from 2024. The script will not rename, delete or overwrite that event. Decide its address separately before cutover. A dev copy under another domain does not depend on resolving this conflict.

## Inspect and rehearse, no persistent writes

The correct local connection is `apps/web/.env`. `packages/db/.env` points to a different database. The CLI never silently loads either file.

```sh
rtk proxy node packages/db/bin/duplicate-event.mjs inspect --env-file apps/web/.env

rtk proxy node packages/db/bin/duplicate-event.mjs plan \
  --env-file apps/web/.env \
  --run ing-2026-dev-20260915 \
  --domain ing-copy-test \
  --out /tmp/eventlayer-ing-2026-dev-plan.json

rtk proxy node packages/db/bin/duplicate-event.mjs rehearse \
  --env-file apps/web/.env --plan /tmp/eventlayer-ing-2026-dev-plan.json

rtk proxy node packages/db/bin/duplicate-event.mjs check-files \
  --env-file apps/web/.env --plan /tmp/eventlayer-ing-2026-dev-plan.json
```

`plan` is read-only and refuses to overwrite its output file. Inspect its `output`, `edits`, `assets`, `excluded` and `warnings`. Do not edit the JSON; change the policy and generate a new plan. The digest and regenerated copy policy must agree at apply time.

Each new plan generates random UUID v4 IDs using the same `uuid/v4` package as `packages/util/src/lib/getId.ts`. The plan saves the complete old-to-new ID map. Rehearsal, apply and retries reuse that map rather than generating new IDs. Zod validates UUIDs; additional checks reject missing mappings, duplicate target IDs and reused source IDs. A separately generated plan gets new IDs even when given the same run name, and an already-recorded run refuses a different plan. Keep the original plan to retry. Policy v2 rejects older plans made with deterministic IDs.

`rehearse` inserts into the real database, verifies all copied rows and empty participation tables, compares the source fingerprint, then rolls back everything. It does not touch Backblaze or Redis. A rehearsal proves database behavior, not image rendering or browser behavior.

`check-files` performs read-only HEAD requests for all source objects in Backblaze. These use the B2 credentials from the explicitly selected environment file. The script follows `getSignedUploadUrl.ts` and `getMediaUrl.ts`: bucket `eventlayer`, region `us-east-005`, key `dir/path/id-version.ext`.

## Create a persistent dev copy

These commands copy files in Backblaze and insert the new event locally. They never overwrite source file keys. Metadata retains the original storage directory because existing URLs embed it; each target filename uses a new media UUID.

```sh
rtk proxy node packages/db/bin/duplicate-event.mjs assets \
  --env-file apps/web/.env --plan /tmp/eventlayer-ing-2026-dev-plan.json

rtk proxy node packages/db/bin/duplicate-event.mjs apply \
  --env-file apps/web/.env --plan /tmp/eventlayer-ing-2026-dev-plan.json

rtk proxy node packages/db/bin/duplicate-event.mjs verify \
  --env-file apps/web/.env --plan /tmp/eventlayer-ing-2026-dev-plan.json
```

Files copy before the database event is committed. Each copy uses the source version and ETag, writes run provenance, and verifies target size/ETag. A retry checks provenance before reusing a target. If it finds a foreign object at the target name, it stops. Interrupted file copies are resumable using the same plan/run.

`apply` checks the copied files before inserting rows. Repeating an applied run verifies and returns the existing event. It never creates a second copy. Rehearsal and apply briefly lock the public tables against concurrent writes and abort after five seconds if locks cannot be acquired; reads continue. Plan for a maintenance window on production.

The local web app's Redis configuration points to a hosted Redis instance. Dev apply/cleanup therefore do **not** invalidate caches automatically. Use a fresh test domain, configure a separate dev Redis, and verify which database the running app uses before browser testing. `clear-cache --plan FILE` is an explicit remote cache mutation and only clears the planned target and its event cache.

## Delete the unused copy and try again

```sh
rtk proxy node packages/db/bin/duplicate-event.mjs cleanup \
  --env-file apps/web/.env --plan /tmp/eventlayer-ing-2026-dev-plan.json
```

Cleanup removes only the saved inserted IDs. It refuses if any copied row changed, new participation appeared, another database row references the copy, or the source differs from the plan. It does not blindly rely on cascading deletion. Running cleanup again is a no-op.

**Copied storage files are retained.** The script never deletes storage objects, source or copied. This avoids deleting files still used by browsers or other content. The operations record retains their exact names and version IDs for a separately reviewed storage cleanup. Interrupted file-copy runs likewise retain their file manifest. They create no event until apply succeeds.

To try again after cleanup, choose a new run name and plan filename. You can reuse the now-free test domain. Do not manually delete an event row or reuse a cleaned run name.

## Production cutover

Production was not used to validate the local counts. Inspect production and back it up first. Resolve the existing `ing25` collision through a separate decision. Pause web traffic before changing routing; a database lock alone does not stop in-flight requests from repopulating Redis with an old domain mapping.

The commands below are examples. Replace `/secure/prod.env` and `DATABASE_NAME` with the actual connection and expected database name. The script requires explicit remote-write flags; they do not grant authorization to change production.

```sh
rtk proxy node packages/db/bin/duplicate-event.mjs inspect --env-file /secure/prod.env

rtk proxy node packages/db/bin/duplicate-event.mjs move-domain \
  --env-file /secure/prod.env --allow-remote --expect-database DATABASE_NAME \
  --maintenance-confirmed
```

`move-domain` changes only the source's `domain_id` from `ing` to `ing25`. All other source fields and related rows stay unchanged. It records the move and invalidates `event_subdomain:ing`, `event_subdomain:ing25`, and the source's event cache. If cache invalidation fails after the database commit, keep traffic paused and run:

```sh
rtk proxy node packages/db/bin/duplicate-event.mjs clear-cache \
  --env-file /secure/prod.env --allow-remote --expect-database DATABASE_NAME \
  --maintenance-confirmed
```

Verify `ing25` serves the source UUID. Generate a **new production plan after the domain move**, because the source domain is included in its fingerprint:

```sh
rtk proxy node packages/db/bin/duplicate-event.mjs plan \
  --env-file /secure/prod.env --run ing-2026-production \
  --domain ing --out /secure/ing-2026-production-plan.json
```

Review that plan, then run `check-files`, `assets`, `apply`, and `verify` with the production environment and plan paths. Add `--allow-remote --expect-database DATABASE_NAME` for remote writes. Add `--maintenance-confirmed` to production apply/cleanup. Remote apply/cleanup invalidate the target routing cache after the database commit. If that step fails, use `clear-cache --plan FILE` while traffic remains paused.

Before resuming traffic, verify both hostnames and browse home, Program, Meals, FAQs, venue maps/details, sponsors, schedule, onboarding and screens. Confirm empty attendee and speaker lists, Eastern times, working images, and restricted sessions. Old session names, speaker mentions, sponsor claims and external booking URLs need editorial review before public launch.

The original is not automatically moved back if a later copy step fails. It remains available at `ing25`; fix the failure and retry the same run, or review a separate routing rollback. This avoids silently undoing a completed archive move.

## Tests

```sh
rtk proxy node --test packages/db/bin/duplicate-event.test.mjs

rtk proxy env DUPLICATE_EVENT_TEST_ENV=apps/web/.env \
  node --test packages/db/bin/duplicate-event.test.mjs
```

The integration suite only accepts localhost database `eventlayer`. It uses the actual ING data and an outer transaction that always rolls back. It tests full copy, retry, date/content changes, injected failure, domain collision, source preservation, refusal to clean up edited or used copies, external references without foreign keys, cleanup, and a fresh second run. Storage operations are excluded from that suite; `check-files` verifies source object availability separately.

## References

- Local schema inventory: `duplicate-event-schema.json`. Unknown columns, tables, constraints or triggers stop execution. Do not regenerate it to bypass an error without reviewing the copy policy.
- Application URL/storage behavior: `packages/util/src/lib/getMediaUrl.ts`, `packages/api/src/media/getSignedUploadUrl.ts`.
- [node-postgres transactions](https://node-postgres.com/features/transactions): all transaction statements use one client.
- [Backblaze Copy Object](https://www.backblaze.com/apidocs/s3-copy-object) and [Head Object](https://www.backblaze.com/apidocs/s3-head-object): file copy and metadata verification.
- [Upstash REST API](https://upstash.com/docs/redis/features/restapi): explicit POST command for routing-cache invalidation.
