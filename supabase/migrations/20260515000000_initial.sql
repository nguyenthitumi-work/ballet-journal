CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE skill_category (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  display_order   smallint NOT NULL UNIQUE,
  icon_name       text NOT NULL,
  brand_color_hex text NOT NULL CHECK (brand_color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE user_profile (
  device_id          uuid PRIMARY KEY,
  name               text,
  age                int CHECK (age BETWEEN 3 AND 120),
  level              text NOT NULL DEFAULT 'Beginner'
                       CHECK (level IN ('Beginner','Intermediate','Advanced')),
  streak             int  NOT NULL DEFAULT 0 CHECK (streak >= 0),
  last_practice_date date,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE skill (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id                uuid NOT NULL REFERENCES user_profile(device_id) ON DELETE CASCADE,
  category_id              text NOT NULL REFERENCES skill_category(id) ON DELETE RESTRICT,
  name                     text NOT NULL,
  description              text,
  technique_tips           text[] NOT NULL DEFAULT '{}',
  difficulty               smallint NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  default_duration_seconds int NOT NULL DEFAULT 60 CHECK (default_duration_seconds > 0),
  is_currently_working_on  boolean NOT NULL DEFAULT false,
  date_added               timestamptz NOT NULL DEFAULT now(),
  last_attempted_at        timestamptz
);

CREATE INDEX idx_skill_cat_working
  ON skill (category_id, is_currently_working_on);
CREATE INDEX idx_skill_device
  ON skill (device_id);
CREATE INDEX idx_skill_focus_stale
  ON skill (device_id, last_attempted_at NULLS FIRST)
  WHERE is_currently_working_on = true;

CREATE TABLE practice_plan (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id          uuid NOT NULL REFERENCES user_profile(device_id) ON DELETE CASCADE,
  name               text NOT NULL,
  description        text,
  is_built_in        boolean NOT NULL DEFAULT false,
  ordered_skill_ids  jsonb NOT NULL DEFAULT '[]'::jsonb
                       CHECK (jsonb_typeof(ordered_skill_ids) = 'array'),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_device ON practice_plan (device_id);

CREATE TABLE practice_session (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id        uuid NOT NULL REFERENCES user_profile(device_id) ON DELETE CASCADE,
  plan_id          uuid REFERENCES practice_plan(id) ON DELETE SET NULL,
  started_at       timestamptz NOT NULL DEFAULT now(),
  ended_at         timestamptz,
  duration_seconds int GENERATED ALWAYS AS
                     (CASE WHEN ended_at IS NULL THEN NULL
                           ELSE EXTRACT(EPOCH FROM (ended_at - started_at))::int END) STORED,
  mood_rating      smallint CHECK (mood_rating BETWEEN 1 AND 5),
  overall_notes    text,
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX idx_session_device_started
  ON practice_session (device_id, started_at DESC);

CREATE TABLE skill_attempt (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid NOT NULL REFERENCES practice_session(id) ON DELETE CASCADE,
  skill_id         uuid NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
  rating           smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  notes            text,
  is_milestone     boolean NOT NULL DEFAULT false,
  attempted_at     timestamptz NOT NULL DEFAULT now(),
  duration_seconds int NOT NULL CHECK (duration_seconds >= 0)
);

CREATE INDEX idx_attempt_session ON skill_attempt (session_id);
CREATE INDEX idx_attempt_skill_time
  ON skill_attempt (skill_id, attempted_at DESC);

CREATE OR REPLACE FUNCTION touch_skill_last_attempted() RETURNS trigger AS $$
BEGIN
  UPDATE skill
     SET last_attempted_at = GREATEST(COALESCE(last_attempted_at, NEW.attempted_at), NEW.attempted_at)
   WHERE id = NEW.skill_id;
  RETURN NEW;
END $$ LANGUAGE plpgsql;


CREATE TRIGGER trg_attempt_touches_skill
AFTER INSERT ON skill_attempt
FOR EACH ROW EXECUTE FUNCTION touch_skill_last_attempted();

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profile_updated
BEFORE UPDATE ON user_profile
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

INSERT INTO skill_category (id, name, display_order, icon_name, brand_color_hex) VALUES
  ('barre',        'Barre',        1, 'GripVertical',       '#E91E63'),
  ('center',       'Center',       2, 'Sparkles',           '#9C27B0'),
  ('jumps',        'Jumps',        3, 'ArrowUp',            '#3F51B5'),
  ('turns',        'Turns',        4, 'RotateCw',           '#03A9F4'),
  ('stretches',    'Stretches',    5, 'StretchHorizontal',  '#4CAF50'),
  ('conditioning', 'Conditioning', 6, 'Dumbbell',           '#FF9800');
