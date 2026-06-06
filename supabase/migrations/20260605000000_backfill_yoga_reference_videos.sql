-- Backfill curated demonstration videos onto the seed asanas.
--
-- The yoga bootstrap (lib/yoga/bootstrap.ts) only seeds a user's asanas on
-- their first /yoga visit, and it bailed out for everyone who had already been
-- seeded with reference_url = NULL. Updating seedAsanas.ts therefore only helps
-- brand-new users; this migration brings existing users up to the same state.
--
-- Matched by the English pose name (unique within a user's library) and applied
-- ONLY where reference_url IS NULL, so it never overwrites a link a user set and
-- is safe to re-run. URLs are the same validated YouTube links as seedAsanas.ts.

UPDATE asana AS a
SET reference_url = v.url
FROM (VALUES
  ('Mountain Pose',          'https://www.youtube.com/watch?v=ATLU-XX_lro'),
  ('Downward-Facing Dog',    'https://www.youtube.com/watch?v=EYuJRSf0JaM'),
  ('Warrior I',              'https://www.youtube.com/watch?v=k4qaVoAbeHM'),
  ('Warrior II',             'https://www.youtube.com/watch?v=hmZxKCXS0tY'),
  ('Tree Pose',              'https://www.youtube.com/watch?v=wdln9qWYloU'),
  ('Chair Pose',             'https://www.youtube.com/watch?v=ZDPMdCSy4jQ'),
  ('Cobra Pose',             'https://www.youtube.com/watch?v=FCEhHyu7H_w'),
  ('Child''s Pose',          'https://www.youtube.com/watch?v=l-mtV34Afok'),
  ('Seated Forward Fold',    'https://www.youtube.com/watch?v=4VLYUCml5sw'),
  ('Bridge Pose',            'https://www.youtube.com/watch?v=6HYNo1YQsUk'),
  ('Supine Spinal Twist',    'https://www.youtube.com/watch?v=ezyMaQEaVaI'),
  ('Corpse Pose',            'https://www.youtube.com/watch?v=ocnRmfbFV9E')
) AS v(name, url)
WHERE a.name = v.name
  AND a.reference_url IS NULL;
