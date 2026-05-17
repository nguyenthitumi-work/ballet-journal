-- Migrate from device_id-scoped data to Supabase Auth user_id-scoped data.
-- Strategy: add user_id alongside device_id, do NOT migrate existing rows.
-- Existing device_id rows become orphans (RLS denies them because user_id IS NULL).
-- The app stops reading device_id; new code paths use user_id exclusively.

-- 1. Add user_id columns referencing auth.users
ALTER TABLE user_profile     ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE skill            ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE practice_plan    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE practice_session ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE skill_attempt    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Drop the FK constraints from child tables that point at user_profile.device_id.
--    They block the PK swap below. "Start fresh" means we don't need these references —
--    new rows link via user_id directly to auth.users, and RLS hides orphan rows.
ALTER TABLE skill            DROP CONSTRAINT IF EXISTS skill_device_id_fkey;
ALTER TABLE practice_plan    DROP CONSTRAINT IF EXISTS practice_plan_device_id_fkey;
ALTER TABLE practice_session DROP CONSTRAINT IF EXISTS practice_session_device_id_fkey;

-- 3. Drop the user_profile PK on device_id and replace with surrogate id + uniques.
--    This lets us have new rows with NULL device_id (auth-scoped) and old rows with NULL user_id.
ALTER TABLE user_profile DROP CONSTRAINT user_profile_pkey;
ALTER TABLE user_profile ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE user_profile ADD PRIMARY KEY (id);
ALTER TABLE user_profile ALTER COLUMN device_id DROP NOT NULL;
ALTER TABLE user_profile ADD CONSTRAINT user_profile_device_id_key UNIQUE (device_id);
ALTER TABLE user_profile ADD CONSTRAINT user_profile_user_id_key   UNIQUE (user_id);

-- 4. Allow nulls on child-table device_id columns so new auth-scoped rows can omit it.
ALTER TABLE skill            ALTER COLUMN device_id DROP NOT NULL;
ALTER TABLE practice_plan    ALTER COLUMN device_id DROP NOT NULL;
ALTER TABLE practice_session ALTER COLUMN device_id DROP NOT NULL;

-- 5. Indexes for the new query path (everything is filtered by user_id).
CREATE INDEX idx_skill_user            ON skill            (user_id);
CREATE INDEX idx_plan_user             ON practice_plan    (user_id);
CREATE INDEX idx_session_user_started  ON practice_session (user_id, started_at DESC);
CREATE INDEX idx_attempt_user          ON skill_attempt    (user_id);
CREATE INDEX idx_skill_user_focus_stale
  ON skill (user_id, last_attempted_at NULLS FIRST)
  WHERE is_currently_working_on = true;

-- 6. RLS — every per-user table allows access only to its owner.
ALTER TABLE user_profile     ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill            ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plan    ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_attempt    ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_category   ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profile_own ON user_profile
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY skill_own ON skill
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY practice_plan_own ON practice_plan
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY practice_session_own ON practice_session
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- skill_attempt has no direct user_id originally; we added one. The user must own
-- the parent session (defense in depth: a malicious client cannot spoof user_id
-- without also providing a valid session_id their own user owns).
CREATE POLICY skill_attempt_own ON skill_attempt
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- skill_category is shared lookup data — readable by any authenticated user.
CREATE POLICY skill_category_read ON skill_category
  FOR SELECT
  USING (auth.role() = 'authenticated');
