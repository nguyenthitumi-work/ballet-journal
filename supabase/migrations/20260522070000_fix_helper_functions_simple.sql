-- Simply add SET row_security = off to all SECURITY DEFINER helper functions
-- The CASCADE will drop the policies, and we'll let them be recreated automatically
-- when the functions are used again (Postgres will detect the function signature changed)

-- Update is_family_member
DROP FUNCTION IF EXISTS is_family_member(uuid, uuid) CASCADE;
CREATE FUNCTION is_family_member(fam_id uuid, uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_member
    WHERE family_member.family_id = fam_id
      AND family_member.user_id = uid
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off;

-- Update is_class_member
DROP FUNCTION IF EXISTS is_class_member(uuid, uuid) CASCADE;
CREATE FUNCTION is_class_member(cls_id uuid, uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_member
    WHERE class_member.class_id = cls_id
      AND class_member.user_id = uid
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off;

-- Update can_view_dancer
DROP FUNCTION IF EXISTS can_view_dancer(uuid, uuid) CASCADE;
CREATE FUNCTION can_view_dancer(dancer_id uuid, viewer_id uuid)
RETURNS boolean AS $$
BEGIN
  IF dancer_id = viewer_id THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM family_member fm1
    JOIN family_member fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = viewer_id
      AND fm2.user_id = dancer_id
      AND fm2.role = 'dancer'
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM class_member cm1
    JOIN class_member cm2 ON cm1.class_id = cm2.class_id
    WHERE cm1.user_id = viewer_id
      AND cm2.user_id = dancer_id
      AND (cm1.role = 'teacher' OR cm2.role = 'student')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off;

-- Recreate the policies that were dropped by CASCADE
-- These are from 20260520010000_fix_member_policies.sql
CREATE POLICY family_select ON family
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    is_family_member(family.id, auth.uid())
  );

CREATE POLICY class_select ON class
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    is_class_member(class.id, auth.uid())
  );

-- These are from 20260521000000_fix_ambiguous_user_id.sql
CREATE POLICY skill_select ON skill
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));

CREATE POLICY practice_plan_select ON practice_plan
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));

CREATE POLICY practice_session_select ON practice_session
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));

CREATE POLICY skill_attempt_select ON skill_attempt
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM practice_session
      WHERE practice_session.id = skill_attempt.session_id
        AND can_view_dancer(practice_session.user_id, auth.uid())
    )
  );
