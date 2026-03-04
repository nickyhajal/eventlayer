-- Preview: what WOULD be copied from event 30c40f2f (source) to d7ee6ca9 (target)
-- Does NOT modify any data

WITH source_event AS (
  SELECT '30c40f2f-05b9-480f-ba3b-1583f3d448e0'::uuid AS id
),
target_event AS (
  SELECT 'd7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4'::uuid AS id
),
attendees_both AS (
  SELECT user_id FROM event_user WHERE event_id = (SELECT id FROM source_event)
  INTERSECT
  SELECT user_id FROM event_user WHERE event_id = (SELECT id FROM target_event)
),
source_rows AS (
  SELECT
    eui.type,
    eui.key,
    eui.value,
    COALESCE(eui.public, false) AS public,
    eui.user_id,
    (SELECT id FROM target_event) AS target_event_id
  FROM event_user_info eui
  WHERE eui.event_id = (SELECT id FROM source_event)
    AND eui.user_id IS NOT NULL
    AND eui.user_id IN (SELECT user_id FROM attendees_both)
)

SELECT
  s.user_id,
  u.first_name,
  u.last_name,
  s.type,
  s.key,
  s.value,
  s.public,
  CASE
    WHEN existing.id IS NOT NULL THEN 'UPDATE'
    ELSE 'INSERT'
  END AS action,
  existing.value AS existing_value
FROM source_rows s
LEFT JOIN event_user_info existing
  ON existing.user_id = s.user_id
  AND existing.event_id = s.target_event_id
  AND existing.key = s.key
LEFT JOIN auth_user u ON u.id = s.user_id
ORDER BY u.last_name, u.first_name, s.key;
