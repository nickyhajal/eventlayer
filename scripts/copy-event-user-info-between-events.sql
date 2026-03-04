-- Copy event_user_info rows from event 30c40f2f (source) to d7ee6ca9 (target)
-- Only for users who are attendees in BOTH events
--
-- Source: 30c40f2f-05b9-480f-ba3b-1583f3d448e0
-- Target: d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4
--
-- Preview: run the SELECT below first to see how many rows will be copied
/*
SELECT count(*)
FROM event_user_info eui
WHERE eui.event_id = '30c40f2f-05b9-480f-ba3b-1583f3d448e0'::uuid
  AND eui.user_id IN (
    SELECT user_id FROM event_user WHERE event_id = '30c40f2f-05b9-480f-ba3b-1583f3d448e0'::uuid
    INTERSECT
    SELECT user_id FROM event_user WHERE event_id = 'd7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4'::uuid
  );
*/

WITH source_event AS (
  SELECT '30c40f2f-05b9-480f-ba3b-1583f3d448e0'::uuid AS id
),
target_event AS (
  SELECT 'd7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4'::uuid AS id
),
-- Users attending both events
attendees_both AS (
  SELECT user_id FROM event_user WHERE event_id = (SELECT id FROM source_event)
  INTERSECT
  SELECT user_id FROM event_user WHERE event_id = (SELECT id FROM target_event)
)
INSERT INTO event_user_info (
  type,
  key,
  value,
  public,
  user_id,
  event_id
)
SELECT
  eui.type,
  eui.key,
  eui.value,
  COALESCE(eui.public, false),
  eui.user_id,
  (SELECT id FROM target_event) AS event_id
FROM event_user_info eui
WHERE eui.event_id = (SELECT id FROM source_event)
  AND eui.user_id IS NOT NULL
  AND eui.user_id IN (SELECT user_id FROM attendees_both)
ON CONFLICT (user_id, event_id, key)
DO UPDATE SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  public = EXCLUDED.public,
  updated_at = now();
