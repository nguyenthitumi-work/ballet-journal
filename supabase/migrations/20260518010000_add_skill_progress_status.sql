-- Per-skill progress tracking: Learning / Practicing / Mastered.
-- Manual transition by the user (no auto-promotion in v1).
-- Distinct from is_currently_working_on: that flag is a "focus" toggle,
-- this column is a discrete progress milestone for the skill itself.

ALTER TABLE skill
  ADD COLUMN progress_status TEXT NOT NULL DEFAULT 'learning'
    CHECK (progress_status IN ('learning', 'practicing', 'mastered'));

CREATE INDEX idx_skill_user_progress
  ON skill (user_id, progress_status);
