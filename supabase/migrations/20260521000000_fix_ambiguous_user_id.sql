-- Fix ambiguous user_id references in helper functions
-- The parameter names conflict with column names during INSERT operations

-- Drop existing functions first (CASCADE drops dependent policies)
DROP FUNCTION IF EXISTS is_family_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS is_class_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS can_view_dancer(uuid, uuid) CASCADE;

-- Recreate is_family_member with renamed parameters
CREATE FUNCTION is_family_member(fam_id uuid, uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_member
    WHERE family_member.family_id = fam_id
      AND family_member.user_id = uid
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Recreate is_class_member with renamed parameters
CREATE FUNCTION is_class_member(cls_id uuid, uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_member
    WHERE class_member.class_id = cls_id
      AND class_member.user_id = uid
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Recreate can_view_dancer with renamed parameter
CREATE FUNCTION can_view_dancer(dancer_id uuid, viewer_id uuid)
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

-- Recreate the policies that were dropped by CASCADE

-- family: Use helper function to check membership
CREATE POLICY family_select ON family
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    is_family_member(family.id, auth.uid())
  );

-- class: Use helper function to check membership
CREATE POLICY class_select ON class
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    is_class_member(class.id, auth.uid())
  );

-- user_profile: viewers can SELECT
CREATE POLICY user_profile_select ON user_profile
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));

-- skill: viewers can SELECT
CREATE POLICY skill_select ON skill
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));

-- practice_plan: viewers can SELECT
CREATE POLICY practice_plan_select ON practice_plan
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));

-- practice_session: viewers can SELECT
CREATE POLICY practice_session_select ON practice_session
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));

-- skill_attempt: viewers can SELECT
CREATE POLICY skill_attempt_select ON skill_attempt
  FOR SELECT
  USING (can_view_dancer(user_id, auth.uid()));
