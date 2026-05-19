-- Per-user target for how many distinct skills count as "today's practice goal."
-- Default 3 keeps brand-new accounts motivated without being overwhelming.
-- Cap at 10 because the seed catalog has 40 skills total and 10 unique skills/day
-- is already an unusually long session for a kid.

ALTER TABLE user_profile
  ADD COLUMN daily_skill_goal int NOT NULL DEFAULT 3
    CHECK (daily_skill_goal BETWEEN 1 AND 10);
