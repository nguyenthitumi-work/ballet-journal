-- Add family and class structure for parent/teacher viewing.
-- Parents link to dancers via families; teachers link to students via classes.
-- RLS extended to allow SELECT for linked viewers; INSERT/UPDATE/DELETE remain owner-only.

-- 1. Family table (household grouping)
CREATE TABLE family (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  created_by      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_family_created_by ON family (created_by);

-- 2. Family membership (parent or dancer)
CREATE TABLE family_member (
  family_id  uuid NOT NULL REFERENCES family(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('parent', 'dancer')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (family_id, user_id)
);

CREATE INDEX idx_family_member_user ON family_member (user_id);

-- 3. Class table (teacher-owned ballet class)
CREATE TABLE class (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code     text UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_class_owner ON class (owner_id);
CREATE INDEX idx_class_invite_code ON class (invite_code) WHERE invite_code IS NOT NULL;

-- 4. Class membership (teacher or student)
CREATE TABLE class_member (
  class_id   uuid NOT NULL REFERENCES class(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('teacher', 'student')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, user_id)
);

CREATE INDEX idx_class_member_user ON class_member (user_id);

-- 5. Invite table (pending links by code or email)
CREATE TABLE invite (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_family_id  uuid REFERENCES family(id) ON DELETE CASCADE,
  target_class_id   uuid REFERENCES class(id) ON DELETE CASCADE,
  target_role       text NOT NULL CHECK (target_role IN ('parent', 'dancer', 'teacher', 'student')),
  code              text UNIQUE,
  email             text,
  expires_at        timestamptz NOT NULL,
  accepted_at       timestamptz,
  accepted_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (target_family_id IS NOT NULL AND target_class_id IS NULL) OR
    (target_family_id IS NULL AND target_class_id IS NOT NULL)
  ),
  CHECK (
    (target_family_id IS NOT NULL AND target_role IN ('parent', 'dancer')) OR
    (target_class_id IS NOT NULL AND target_role IN ('teacher', 'student'))
  ),
  CHECK (code IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX idx_invite_code ON invite (code) WHERE code IS NOT NULL AND accepted_at IS NULL;
CREATE INDEX idx_invite_email ON invite (email) WHERE email IS NOT NULL AND accepted_at IS NULL;
CREATE INDEX idx_invite_created_by ON invite (created_by);

-- 6. Practice note table (viewer comments on sessions/attempts)
CREATE TABLE practice_note (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid REFERENCES practice_session(id) ON DELETE CASCADE,
  attempt_id       uuid REFERENCES skill_attempt(id) ON DELETE CASCADE,
  author_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body             text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (session_id IS NOT NULL AND attempt_id IS NULL) OR
    (session_id IS NULL AND attempt_id IS NOT NULL)
  )
);

CREATE INDEX idx_practice_note_session ON practice_note (session_id);
CREATE INDEX idx_practice_note_attempt ON practice_note (attempt_id);
CREATE INDEX idx_practice_note_author ON practice_note (author_user_id);

-- 7. RLS helper: can viewer see dancer's data?
CREATE OR REPLACE FUNCTION can_view_dancer(dancer_id uuid, viewer_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Same user
  IF dancer_id = viewer_id THEN
    RETURN true;
  END IF;

  -- Same family (parent can view dancer in same family)
  IF EXISTS (
    SELECT 1 FROM family_member fm1
    JOIN family_member fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = viewer_id
      AND fm2.user_id = dancer_id
      AND fm2.role = 'dancer'
  ) THEN
    RETURN true;
  END IF;

  -- Same class (teacher can view student in same class)
  IF EXISTS (
    SELECT 1 FROM class_member cm1
    JOIN class_member cm2 ON cm1.class_id = cm2.class_id
    WHERE cm1.user_id = viewer_id
      AND cm2.user_id = dancer_id
      AND cm2.role = 'student'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 8. Extend existing RLS policies to allow SELECT for linked viewers
-- Replace the existing owner-only policies with owner-write + viewer-read policies.

-- user_profile: viewers can SELECT
DROP POLICY IF EXISTS user_profile_own ON user_profile;
CREATE POLICY user_profile_select ON user_profile
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));
CREATE POLICY user_profile_modify ON user_profile
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY user_profile_update ON user_profile
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY user_profile_delete ON user_profile
  FOR DELETE
  USING (user_id = auth.uid());

-- skill: viewers can SELECT
DROP POLICY IF EXISTS skill_own ON skill;
CREATE POLICY skill_select ON skill
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));
CREATE POLICY skill_modify ON skill
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY skill_update ON skill
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY skill_delete ON skill
  FOR DELETE
  USING (user_id = auth.uid());

-- practice_plan: viewers can SELECT
DROP POLICY IF EXISTS practice_plan_own ON practice_plan;
CREATE POLICY practice_plan_select ON practice_plan
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));
CREATE POLICY practice_plan_modify ON practice_plan
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY practice_plan_update ON practice_plan
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY practice_plan_delete ON practice_plan
  FOR DELETE
  USING (user_id = auth.uid());

-- practice_session: viewers can SELECT
DROP POLICY IF EXISTS practice_session_own ON practice_session;
CREATE POLICY practice_session_select ON practice_session
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));
CREATE POLICY practice_session_modify ON practice_session
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY practice_session_update ON practice_session
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY practice_session_delete ON practice_session
  FOR DELETE
  USING (user_id = auth.uid());

-- skill_attempt: viewers can SELECT
DROP POLICY IF EXISTS skill_attempt_own ON skill_attempt;
CREATE POLICY skill_attempt_select ON skill_attempt
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));
CREATE POLICY skill_attempt_modify ON skill_attempt
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY skill_attempt_update ON skill_attempt
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY skill_attempt_delete ON skill_attempt
  FOR DELETE
  USING (user_id = auth.uid());

-- 9. RLS for new tables

-- family: members can view their own family
ALTER TABLE family ENABLE ROW LEVEL SECURITY;
CREATE POLICY family_member_select ON family
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_member
      WHERE family_member.family_id = family.id
        AND family_member.user_id = auth.uid()
    )
  );
CREATE POLICY family_create ON family
  FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY family_update ON family
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
CREATE POLICY family_delete ON family
  FOR DELETE
  USING (created_by = auth.uid());

-- family_member: members can view their own family's members
ALTER TABLE family_member ENABLE ROW LEVEL SECURITY;
CREATE POLICY family_member_select_own ON family_member
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_member fm2
      WHERE fm2.family_id = family_member.family_id
        AND fm2.user_id = auth.uid()
    )
  );
CREATE POLICY family_member_insert ON family_member
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family
      WHERE family.id = family_member.family_id
        AND family.created_by = auth.uid()
    )
  );
CREATE POLICY family_member_delete ON family_member
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM family
      WHERE family.id = family_member.family_id
        AND family.created_by = auth.uid()
    )
  );

-- class: owner and members can view
ALTER TABLE class ENABLE ROW LEVEL SECURITY;
CREATE POLICY class_member_select ON class
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM class_member
      WHERE class_member.class_id = class.id
        AND class_member.user_id = auth.uid()
    )
  );
CREATE POLICY class_create ON class
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY class_update ON class
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY class_delete ON class
  FOR DELETE
  USING (owner_id = auth.uid());

-- class_member: members can view their own class's members
ALTER TABLE class_member ENABLE ROW LEVEL SECURITY;
CREATE POLICY class_member_select_own ON class_member
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_member cm2
      WHERE cm2.class_id = class_member.class_id
        AND cm2.user_id = auth.uid()
    )
  );
CREATE POLICY class_member_insert ON class_member
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM class
      WHERE class.id = class_member.class_id
        AND class.owner_id = auth.uid()
    )
  );
CREATE POLICY class_member_delete ON class_member
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM class
      WHERE class.id = class_member.class_id
        AND class.owner_id = auth.uid()
    )
  );

-- invite: creator can view/manage; invitee can view their own pending invite by code/email
ALTER TABLE invite ENABLE ROW LEVEL SECURITY;
CREATE POLICY invite_creator_all ON invite
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
CREATE POLICY invite_by_code_select ON invite
  FOR SELECT
  USING (accepted_at IS NULL AND code IS NOT NULL);
CREATE POLICY invite_by_email_select ON invite
  FOR SELECT
  USING (
    accepted_at IS NULL AND
    email IS NOT NULL AND
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- practice_note: author can all; viewers who can see the session/attempt can read
ALTER TABLE practice_note ENABLE ROW LEVEL SECURITY;
CREATE POLICY practice_note_author_all ON practice_note
  FOR ALL
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());
CREATE POLICY practice_note_viewer_select ON practice_note
  FOR SELECT
  USING (
    (session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM practice_session
      WHERE practice_session.id = practice_note.session_id
        AND can_view_dancer(practice_session.user_id, auth.uid())
    )) OR
    (attempt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM skill_attempt
      WHERE skill_attempt.id = practice_note.attempt_id
        AND can_view_dancer(skill_attempt.user_id, auth.uid())
    ))
  );
