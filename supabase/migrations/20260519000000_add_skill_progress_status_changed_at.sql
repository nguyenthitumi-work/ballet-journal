-- Track when progress_status last changed, so the weekly summary can show
-- "skills mastered this week." Default to date_added for existing rows so
-- they don't all bunch onto the migration timestamp; a BEFORE UPDATE trigger
-- keeps it fresh whenever progress_status transitions.

ALTER TABLE skill
  ADD COLUMN progress_status_changed_at timestamptz NOT NULL DEFAULT now();

UPDATE skill SET progress_status_changed_at = date_added;

CREATE OR REPLACE FUNCTION skill_progress_status_changed_at_fn()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.progress_status IS DISTINCT FROM OLD.progress_status THEN
    NEW.progress_status_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER skill_progress_status_changed_at_trg
  BEFORE UPDATE OF progress_status ON skill
  FOR EACH ROW
  EXECUTE FUNCTION skill_progress_status_changed_at_fn();

CREATE INDEX idx_skill_user_progress_changed
  ON skill (user_id, progress_status, progress_status_changed_at DESC);
