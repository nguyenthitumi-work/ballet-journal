-- Add SET row_security = off to all existing SECURITY DEFINER helper functions
-- This ensures they truly bypass RLS and don't cause infinite recursion

-- Drop and recreate the helpers from 20260520010000_fix_member_policies.sql
-- Use CASCADE because policies depend on these functions
DROP FUNCTION IF EXISTS is_family_member(uuid, uuid) CASCADE;
CREATE FUNCTION is_family_member(fam_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_member
    WHERE family_member.family_id = fam_id
      AND family_member.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off;

DROP FUNCTION IF EXISTS is_class_member(uuid, uuid) CASCADE;
CREATE FUNCTION is_class_member(cls_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_member
    WHERE class_member.class_id = cls_id
      AND class_member.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off;

-- Recreate the family and class SELECT policies that depend on these functions
-- These tables should exist by now since this migration runs after 20260520000000
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

-- Update the can_view_dancer helper from 20260520000000_add_families_and_classes.sql
-- Use CASCADE because many policies depend on this function
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

-- Recreate all the policies that depend on can_view_dancer
-- These tables should exist by now
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
