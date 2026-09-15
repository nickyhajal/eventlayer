# ING rollover and duplication plan

## Verified local state, September 14, 2026

Read-only inspection used the web app's `apps/web/.env` connection: PostgreSQL `eventlayer` on localhost:5432. `packages/db/.env` points to a different database, `dailyflow`; do not use that file for this operation. Production has not been inspected.

Source: `08873456-7c8b-4f42-9e15-fb875bf59d6f`, domain `ing`, name `Innovation Network Gathering`. Its start is the timezone-free database value `2025-10-08 08:15:00`; end is null. Its 101 descendants run October 7–10, 2025. The user corrected the requested archive domain to `ing25`. That domain already belongs to `76b474df-030c-4225-9fef-44234fb97598`, an event dated 2024. Resolve that collision separately before running the domain move; never overwrite or delete it.

The official website https://innovationgathering.network/ advertises October 5–8, 2026, West Chester, Pennsylvania. Arrival is October 5, program days are October 6 and 7. These dates support the proposed mapping below, not confirmation of individual sessions or times.

No database rows were changed. Existing dirty source files were left alone.

## Source preservation and routing

Keep the source event's identity and every related row. The requested domain move requires one explicit exception to literal source immutability: change only its `domain_id` from `ing` to `ing25`. Do not rename it, rewrite its dates, reset its counts, or alter its content.

If even this one source-field change is forbidden, stop and implement separate domain routing first. The current application stores routing directly on `event.domain_id`; an alias cannot be added without changing the routing design.

The script refuses the existing `ing25` collision. It does not decide a new address for that older event.

Keep domain migration separate from duplication. Duplicate by immutable source UUID, regardless of its current domain. In development, first create the copy under an unused preview domain, leaving `ing` untouched. In production, only claim `ing` after the original resolves at `ing25`.

`apps/web/src/hooks.server.ts` caches routing at `event_subdomain:<domain>` without a TTL. Invalidate both domain keys and relevant event caches during cutover. Use a short maintenance window or equivalent request coordination to prevent an in-flight request repopulating the old mapping. Verify both hostnames against the expected IDs afterward.

## Data policy

Counts below are local rows scoped to the source and its descendants. An implementation must also follow indirect references, including forms, media, and alternate event columns. Counts are an audit baseline, not hard-coded production expectations.

| Data | Local count | Treatment |
|---|---:|---|
| Main event | 1 | New UUID; copy branding, name, description, colors, capacities, sender display settings; set target domain and dates; reset attendee count and creation/update timestamps. Leave parent null. Review private notes rather than copying historical operations notes. |
| Child events | 101 | Copy recursively with new UUIDs and remapped event/venue/media references. Keep ordering, descriptions, capacities and audience rules. Shift schedule dates. Reset all attendee counts. |
| Venues | 41 | Copy all with new IDs; preserve addresses, coordinates, descriptions, order and visibility; remap parent venue and media references. Never share mutable venue rows with the archive. |
| Content | 20 | Copy 12 strings and 8 FAQs. Remap parents and embedded internal links. Apply specific date/content overrides below. Clear old alert/feedback state. |
| Pages | 3 | Copy code-of-conduct, program and meals pages, including body, path, status and order. Remap embedded references and apply reviewed date edits. |
| Menus | 30 | Copy all navigation contexts, locations, icons, props and order. Remap parents and any internal ID links. Attendee/speaker routes will initially have no members. |
| Sponsors | 17 | Copy sponsor content, ordering and branding as editable starting data. Review sponsorship claims, booking URLs and settings before public launch. Do not copy attendee associations or leads. |
| Media | 556 | Do not bulk-copy. Exclude 330 user-parented images. Traverse assets actually referenced by copied event/venue/sponsor rows and rich content; include required parent chains. Direct columns currently reference 158 distinct assets: 100 event images, 39 venue images, 17 sponsor images, one favicon and one large logo. Rich-content assets may add to this. |
| Forms | 1 | Copy User Onboarding with a new ID. Its group is null. Support remapping groups if production differs. |
| Form elements | 15 | Copy definitions, options and layout with new IDs and remapped parent/conditional references. All 15 currently have null user_id. Exclude personalized elements if encountered. |
| Event user fields | 0 | Copy definitions if present in production; inspect scope values and options for IDs. Never copy field answers. |
| Screens/configuration | 1 + 1 | Copy layout and references. Reset notifications/messages used as live alerts and clear time overrides. Existing config is upcoming_events, notifications off, no time override. |
| Screen profiles | 0 | Copy definitions if present; remap profile IDs and reset live announcements. |
| Event memberships | 1,105 | Copy none. Includes 278 main-event memberships and 827 child memberships/assignments. Main memberships include attendees, speakers and staff. |
| User info | 3,110 | Copy none. These are user values, not reusable field definitions. |
| User connections | 197 | Copy none. |
| Form sessions / responses | 394 / 2,701 | Copy none. The script also finds 53 responses through the form relationship that the first event-ID-only count missed. |
| Response statistics | 0 | Copy none; scope via company_id, element and response references. |
| Tickets / check-ins / sponsor connections / API keys | 0 each | Copy none, even if production has rows. |
| Global users, authentication, login links, organizations and organization memberships | Shared tables | Leave untouched. Do not duplicate accounts, sessions, tokens or access grants. |

Administrative access must be deliberate. Reuse existing super-admin access for testing, then add only named organizers if required. Do not copy staff memberships automatically. Speakers and facilitators are memberships too; their rosters will be empty until explicitly added.

All local media rows have a user_id, including venue and branding uploads. That field is not sufficient to identify attendee media; use parent type and actual reference reachability. Create independent media metadata. Before choosing whether to reuse blob paths or copy blobs to a new prefix, inspect URL generation and replacement semantics. Prefer independent blob keys if normal edits can overwrite the source object. Cleanup must never delete a shared source blob.

Event settings currently contain only an empty header_scripts value. Use a reviewed settings allowlist; do not inherit credentials, integrations or injected tracking scripts when production differs.

## Date and content overrides, target only

Preserve Eastern local wall-clock times. PostgreSQL columns are timestamp without time zone; avoid converting through the developer machine's local timezone.

| Old date | New date | Purpose |
|---|---|---|
| 2025-10-07 | 2026-10-05 | Arrival/setup |
| 2025-10-08 | 2026-10-06 | Program day 1 |
| 2025-10-09 | 2026-10-07 | Program day 2 |
| 2025-10-10 | 2026-10-08 | Departure |

Shift both start and non-null end timestamps by 363 calendar days. Keep missing session end times missing. Flag zero-length or inverted ranges for review, without changing the source.

The script sets parent start to October 5, 2026 at 00:00 and leaves parent end null. The home date string explicitly displays October 5–8. This avoids inventing an inclusive/exclusive end convention absent from the existing event. Individual program times remain provisional copies of 2025.

Specific edits to the target:

- Set main-start-date to `October 5–8, 2026`. Keep Eastern Time and West Chester location strings.
- Change Meals headings from Wednesday October 8 / Thursday October 9 to Tuesday October 6 / Wednesday October 7.
- Rewrite the registration FAQ to distinguish October 5 arrival from October 6 program start; copied 09:00 start remains provisional until confirmed.
- Change the closing-session description's current-event year from 2025 to 2026.
- Keep historical references such as a talk delivered in 2024 accurate. Replace relative wording such as “last year” with the explicit historical year where needed.
- Clear main-location-line-5's old feedback request and alert-link's old Airtable feedback URL. Keep alert empty.
- Review the Program page's embedded UUID and the Rai Rai meal description's two embedded UUIDs. Resolve their entity types before remapping; do not replace UUID-shaped strings blindly.
- Preserve selected-only audience rules with empty assignments. Review the two `full` audience values before deciding whether they represent a reusable access rule or stale availability. Do not blindly convert them to public or RSVP.
- Review old speaker names, sponsor commitments, attendee-led meetups and external registration/feedback links. Copying these makes an editable starting schedule, not a verified 2026 program.

## Implementation shape

Build a CLI around a reusable copy planner and executor. A dashboard feature can call the same service later. Avoid the existing hard-coded add-a rollover route, which copies attendee data.

Proposed commands:

1. `inspect`: read-only inventory, schema/foreign-key inventory, source identity, counts, date distribution and warnings. Never output secrets or attendee records.
2. `plan`: generate an explicit per-table/per-field policy, source fingerprints, new IDs, old-to-new ID maps, date/text overrides, asset actions and a run identifier. Fail on unknown tables/columns or unresolved references rather than silently skipping them.
3. `apply`: validate database identity and source fingerprint; require an unused destination domain; execute inserts in one transaction. No source UPDATE or DELETE in this command. Record provenance and the complete inserted-ID manifest transactionally. A repeated run identifier returns the existing verified result.
4. `verify`: check counts, links, reset state and source preservation, then exercise the application.
5. `cleanup`: delete only IDs owned by the recorded run, in dependency order. Refuse if users, responses, new assets or other unexpected data have appeared since the copy. Verify incoming references before any cascading deletion. Keep the source and global users out of the deletion set.
6. `move-domain`: a separate compare-and-set update requiring exact source UUID, expected old domain and free archive domain. Record before/after values and handle cache invalidation. It must not be hidden inside copy or cleanup.

Persist the run and inserted-ID manifest in a small operations table so a process crash after commit does not lose rollback ownership. Keep the source UUID as provenance without making the new edition a child of the old one. A series model is optional and not required for this task.

Use explicit insert order and two-pass remapping where necessary. PostgreSQL foreign keys are incomplete here: content/page/menu/media/sponsor event ownership and event parent links need application checks. A single DELETE of the main event is not a reliable cleanup strategy.

## Development proof

1. Use explicit localhost eventlayer connection, isolated preview domain, and isolated/local Redis. No outbound email, import, payment or notification calls.
2. Record source and related-row fingerprints in a consistent snapshot. Apply target inserts transactionally and prove the source fingerprints are unchanged.
3. Verify 102 copied event rows, 41 venues, 20 content rows, 3 pages, 30 menus, 17 sponsors, 1 form and 15 elements, plus the selected media closure and screen config. Recalculate expected counts if source data changes.
4. Verify zero target memberships, RSVP/assignment rows, responses, sessions, connections, tickets, check-ins and API keys. Verify every copied num_attendees is zero.
5. Check every direct and embedded internal reference against its target entity and ownership. Detect dangling references and unintended links back into the source.
6. Browse home, program, meals, FAQs, venue details/maps, branding, sponsor pages, schedule, onboarding and screens. Confirm selected sessions remain private and attendees/speakers are empty. Test RSVP using a dedicated test account only after the empty-state assertions.
7. Test repeat apply, deliberate mid-copy failure, cleanup, refusal to clean up after new activity, and a second fresh copy. Verify source preservation after every step.
8. Rehearse domain cutover in an isolated restored database before touching the original local routing. Test cache invalidation and rollback of routing.

## Production sequence

After development proof and review of the exact manifest:

1. Inspect production read-only and confirm source UUID/domain/data match the intended event. Refresh the plan against production; local counts are not production proof.
2. Take and verify a recoverable database backup. Confirm target asset handling and domain availability.
3. Once the existing archive-domain collision is separately resolved, move the original domain to ing25 with the separate guarded operation. Invalidate routing caches and verify ing25 serves the original UUID and unchanged history. Generate the final production copy plan after this move.
4. Apply the approved duplication plan to the original UUID, creating a new root event at ing. Verify data and both hostnames before reopening normal traffic.
5. Keep the source archive intact. Retain the manifest for cleanup of an unused copy; once registrations begin, use a new reviewed plan rather than automatic deletion.

## Minimal feature assessment

A raw row-copy endpoint is small, but a safe duplicate feature is not trivial in this schema. Embedded references, media ownership, missing foreign keys, attendee-linked roles, date overrides, cache routing and reliable cleanup are the substantial work. Build and prove the reusable service through this script first. Then add a small admin preview UI with source, target domain, dates, policy choices, warnings and a run identifier. No series redesign is needed to deliver this rollover.

## Implementation

See `packages/db/bin/duplicate-event.mjs` and its `duplicate-event.md` runbook. The implementation copies 158 referenced media files to new UUID-based names. It preserves the external Squarespace logo and restaurant links; their UUIDs are not database references. Cleanup deletes the recorded copy's database rows but deliberately retains copied storage objects. No storage objects are deleted by this script.
