-- Curriculum level for each skill: Beginner / Intermediate / Advanced.
-- Separate from `difficulty` (1-5): difficulty is a raw rating, level is the
-- pedagogical grouping the suggester and progress UI key off of.
-- Manual on seed; the bootstrap inserts the per-skill level from seedSkills.ts.

ALTER TABLE skill
  ADD COLUMN level TEXT NOT NULL DEFAULT 'Beginner'
    CHECK (level IN ('Beginner', 'Intermediate', 'Advanced'));

CREATE INDEX idx_skill_user_level
  ON skill (user_id, level);
