-- Per-discipline siloing: each discipline gets its own streak, level, and its
-- own families/classes. Ballet keeps using user_profile (unchanged); yoga and
-- gym get their state from discipline_profile. Families/classes are tagged with
-- a discipline so a yoga class is separate from a ballet class.
--
-- Additive and backwards-compatible: existing ballet data is untouched, and the
-- new columns default to 'ballet'.

-- 1. Per-discipline profile state (level / streak / goal). Ballet rows are
--    optional here — the app reads ballet state from user_profile — but yoga
--    and gym rely on this table. (user_id, discipline) is unique.
CREATE TABLE discipline_profile (
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline         text NOT NULL CHECK (discipline IN ('ballet','yoga','gym')),
  level              text NOT NULL DEFAULT 'Beginner'
                       CHECK (level IN ('Beginner','Intermediate','Advanced')),
  streak             int  NOT NULL DEFAULT 0 CHECK (streak >= 0),
  last_practice_date date,
  daily_goal         smallint NOT NULL DEFAULT 3 CHECK (daily_goal BETWEEN 1 AND 20),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, discipline)
);

ALTER TABLE discipline_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY discipline_profile_own ON discipline_profile
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Tag families and classes with a discipline (default ballet for existing).
ALTER TABLE family
  ADD COLUMN discipline text NOT NULL DEFAULT 'ballet'
    CHECK (discipline IN ('ballet','yoga','gym'));

ALTER TABLE class
  ADD COLUMN discipline text NOT NULL DEFAULT 'ballet'
    CHECK (discipline IN ('ballet','yoga','gym'));

CREATE INDEX idx_family_creator_discipline ON family (created_by, discipline);
CREATE INDEX idx_class_owner_discipline ON class (owner_id, discipline);
