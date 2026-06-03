-- Add the yoga discipline alongside ballet.
--
-- Strategy: yoga gets its own per-user content tables (asana, yoga_flow) that
-- mirror the ballet skill/practice_plan model and follow the same user_id +
-- RLS pattern established in 20260517000000_add_auth.sql. The shared engine —
-- practice_session and skill_attempt — is REUSED, not duplicated. A practice
-- session is tagged with a discipline so History/streaks/rewards can filter or
-- aggregate per discipline while sharing one code path.
--
-- This migration is additive and does not touch existing ballet tables' data.

-- 1. Discipline tag on practice sessions (defaults to ballet so existing rows
--    and existing app code keep working unchanged).
ALTER TABLE practice_session
  ADD COLUMN discipline text NOT NULL DEFAULT 'ballet'
    CHECK (discipline IN ('ballet', 'yoga'));

CREATE INDEX idx_session_user_discipline
  ON practice_session (user_id, discipline, started_at DESC);

-- 1b. Optional link from a yoga session back to the flow it was started from.
--     Nullable: ballet sessions and ad-hoc yoga sessions leave it null. The FK
--     is added after yoga_flow is created (see step 3b below).
ALTER TABLE practice_session
  ADD COLUMN flow_id uuid;

-- 2. Asana library (yoga analog of `skill`).
CREATE TABLE asana (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category              text NOT NULL
                          CHECK (category IN ('standing','seated','balance','backbend',
                                              'forward-fold','twist','inversion','restorative')),
  name                  text NOT NULL,
  sanskrit_name         text,
  description           text,
  benefits              text[] NOT NULL DEFAULT '{}',
  cues                  text[] NOT NULL DEFAULT '{}',
  focus                 text[] NOT NULL DEFAULT '{}',
  contraindications     text[] NOT NULL DEFAULT '{}',
  difficulty            smallint NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  level                 text NOT NULL DEFAULT 'Beginner'
                          CHECK (level IN ('Beginner','Intermediate','Advanced')),
  default_hold_seconds  int NOT NULL DEFAULT 30 CHECK (default_hold_seconds > 0),
  is_currently_working_on boolean NOT NULL DEFAULT false,
  progress_status       text NOT NULL DEFAULT 'learning'
                          CHECK (progress_status IN ('learning','practicing','mastered')),
  reference_url         text,
  date_added            timestamptz NOT NULL DEFAULT now(),
  last_attempted_at     timestamptz
);

CREATE INDEX idx_asana_user           ON asana (user_id);
CREATE INDEX idx_asana_user_category  ON asana (user_id, category);

-- 3. Yoga flow (yoga analog of `practice_plan`). Unlike a plain ordered list of
--    skill ids, a flow's steps carry timing + side + breath cue, so we store the
--    sequence as a jsonb array of {asanaId, holdSeconds, side, breathCue}.
CREATE TABLE yoga_flow (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  style         text NOT NULL
                  CHECK (style IN ('vinyasa','hatha','yin','restorative','power','wakeup')),
  level         text NOT NULL DEFAULT 'Beginner'
                  CHECK (level IN ('Beginner','Intermediate','Advanced')),
  is_built_in   boolean NOT NULL DEFAULT false,
  poses         jsonb NOT NULL DEFAULT '[]'::jsonb
                  CHECK (jsonb_typeof(poses) = 'array'),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_yoga_flow_user ON yoga_flow (user_id);

-- 3b. Now that yoga_flow exists, point practice_session.flow_id at it.
ALTER TABLE practice_session
  ADD CONSTRAINT practice_session_flow_id_fkey
    FOREIGN KEY (flow_id) REFERENCES yoga_flow(id) ON DELETE SET NULL;

-- 4. Let a skill_attempt reference an asana instead of a ballet skill. Exactly
--    one of (skill_id, asana_id) is set per attempt. This is what lets the
--    existing session player, History, video recording and MediaPipe pose
--    overlay record yoga holds with zero new attempt plumbing.
ALTER TABLE skill_attempt
  ADD COLUMN asana_id uuid REFERENCES asana(id) ON DELETE CASCADE;

ALTER TABLE skill_attempt
  ALTER COLUMN skill_id DROP NOT NULL;

ALTER TABLE skill_attempt
  ADD CONSTRAINT skill_attempt_one_subject
    CHECK ((skill_id IS NOT NULL) <> (asana_id IS NOT NULL));

CREATE INDEX idx_attempt_asana_time
  ON skill_attempt (asana_id, attempted_at DESC);

-- 5. RLS — same owner-only pattern as every other per-user table.
ALTER TABLE asana     ENABLE ROW LEVEL SECURITY;
ALTER TABLE yoga_flow ENABLE ROW LEVEL SECURITY;

CREATE POLICY asana_own ON asana
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY yoga_flow_own ON yoga_flow
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
