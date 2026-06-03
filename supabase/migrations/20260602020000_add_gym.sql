-- Add the gym (strength training) discipline alongside ballet and yoga.
--
-- Same shared-engine strategy as the yoga migration: gym gets its own per-user
-- content tables (exercise, workout) following the user_id + RLS pattern, and
-- reuses practice_session + skill_attempt. The defining gym difference — sets ×
-- reps × weight — is modeled by adding reps/weight columns to skill_attempt and
-- recording one row per logged set.
--
-- Additive; does not touch existing ballet/yoga data.

-- 1. Allow 'gym' as a discipline (the yoga migration created this CHECK with
--    only ballet/yoga). Replace it with the three-value version.
ALTER TABLE practice_session
  DROP CONSTRAINT IF EXISTS practice_session_discipline_check;
ALTER TABLE practice_session
  ADD CONSTRAINT practice_session_discipline_check
    CHECK (discipline IN ('ballet', 'yoga', 'gym'));

-- 1b. Optional link from a gym session to the workout it was started from.
ALTER TABLE practice_session
  ADD COLUMN workout_id uuid;

-- 2. Exercise library (gym analog of `skill` / `asana`).
CREATE TABLE exercise (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category                text NOT NULL
                            CHECK (category IN ('push','pull','legs','core','cardio','full-body','olympic')),
  name                    text NOT NULL,
  description             text,
  cues                    text[] NOT NULL DEFAULT '{}',
  primary_muscles         text[] NOT NULL DEFAULT '{}',
  equipment               text,
  difficulty              smallint NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  level                   text NOT NULL DEFAULT 'Beginner'
                            CHECK (level IN ('Beginner','Intermediate','Advanced')),
  default_sets            smallint NOT NULL DEFAULT 3 CHECK (default_sets BETWEEN 1 AND 20),
  default_reps            smallint NOT NULL DEFAULT 10 CHECK (default_reps BETWEEN 1 AND 100),
  default_rest_seconds    int NOT NULL DEFAULT 90 CHECK (default_rest_seconds >= 0),
  is_currently_working_on boolean NOT NULL DEFAULT false,
  progress_status         text NOT NULL DEFAULT 'learning'
                            CHECK (progress_status IN ('learning','practicing','mastered')),
  reference_url           text,
  date_added              timestamptz NOT NULL DEFAULT now(),
  last_attempted_at       timestamptz
);

CREATE INDEX idx_exercise_user          ON exercise (user_id);
CREATE INDEX idx_exercise_user_category ON exercise (user_id, category);

-- 3. Workout (gym analog of `practice_plan` / `yoga_flow`). Steps carry
--    set/rep/weight/rest targets, stored as a jsonb array of
--    {exerciseId, sets, targetReps, targetWeight, restSeconds}.
CREATE TABLE workout (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  focus         text NOT NULL
                  CHECK (focus IN ('push','pull','legs','upper','lower','full','core','cardio')),
  level         text NOT NULL DEFAULT 'Beginner'
                  CHECK (level IN ('Beginner','Intermediate','Advanced')),
  is_built_in   boolean NOT NULL DEFAULT false,
  exercises     jsonb NOT NULL DEFAULT '[]'::jsonb
                  CHECK (jsonb_typeof(exercises) = 'array'),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_user ON workout (user_id);

ALTER TABLE practice_session
  ADD CONSTRAINT practice_session_workout_id_fkey
    FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE SET NULL;

-- 4. Extend skill_attempt to also represent a logged gym set: one row per set,
--    with exercise_id + reps + weight. Exactly one of (skill_id, asana_id,
--    exercise_id) is set per row.
ALTER TABLE skill_attempt
  ADD COLUMN exercise_id uuid REFERENCES exercise(id) ON DELETE CASCADE;
ALTER TABLE skill_attempt
  ADD COLUMN reps smallint CHECK (reps IS NULL OR (reps BETWEEN 0 AND 1000));
ALTER TABLE skill_attempt
  ADD COLUMN weight numeric(7,2) CHECK (weight IS NULL OR weight >= 0);

-- Replace the yoga-era two-subject XOR with a three-subject "exactly one" check.
ALTER TABLE skill_attempt
  DROP CONSTRAINT IF EXISTS skill_attempt_one_subject;
ALTER TABLE skill_attempt
  ADD CONSTRAINT skill_attempt_one_subject
    CHECK (
      (skill_id    IS NOT NULL)::int
    + (asana_id    IS NOT NULL)::int
    + (exercise_id IS NOT NULL)::int = 1
    );

CREATE INDEX idx_attempt_exercise_time
  ON skill_attempt (exercise_id, attempted_at DESC);

-- 5. RLS — same owner-only pattern as every other per-user table.
ALTER TABLE exercise ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout  ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercise_own ON exercise
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY workout_own ON workout
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
