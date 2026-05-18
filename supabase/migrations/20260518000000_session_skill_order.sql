-- Snapshot the skill order on each practice_session at start time.
--
-- Before this migration the practice page recomputed the skill list on every
-- render via pickDailySuggestion (for free practice) or by reading the plan
-- row (for plan-based). Both inputs change during a session — Math.random()
-- shuffle, lastAttemptedAt drift, plan edits — so the list of "6 skills"
-- shifted between attempts and the session never reached "All done!".
--
-- Freezing the order on the session row makes each session stable for its
-- entire run, regardless of later state changes.
--
-- Column type matches practice_plan.ordered_skill_ids (jsonb array of skill
-- IDs as strings), so the backfill below is a plain assignment.

ALTER TABLE practice_session DROP COLUMN IF EXISTS ordered_skill_ids;
ALTER TABLE practice_session
  ADD COLUMN ordered_skill_ids jsonb NOT NULL DEFAULT '[]'::jsonb
  CHECK (jsonb_typeof(ordered_skill_ids) = 'array');

-- Backfill plan-based sessions from their plan so existing in-flight sessions
-- keep working. Free-practice sessions (plan_id IS NULL) without a stored
-- order will show the "nothing to practice" finish prompt — acceptable since
-- the prior code was already producing a broken loop for them.
UPDATE practice_session ps
SET ordered_skill_ids = pp.ordered_skill_ids
FROM practice_plan pp
WHERE ps.plan_id = pp.id
  AND jsonb_array_length(ps.ordered_skill_ids) = 0;
