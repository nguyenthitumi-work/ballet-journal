-- Fix user_profile SELECT policy to avoid infinite recursion with family_member/class_member
-- The policy was checking family_member which caused recursion when inserting profiles
-- Use a single SECURITY DEFINER function that does all the checks to completely bypass RLS

-- Helper function to check if viewer can see a profile (bypasses all RLS)
CREATE OR REPLACE FUNCTION can_view_user_profile(profile_user_id uuid, viewer_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Can always view yourself
  IF profile_user_id = viewer_id THEN
    RETURN true;
  END IF;

  -- Can view if in same family
  IF EXISTS (
    SELECT 1 FROM family_member fm1
    JOIN family_member fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = viewer_id
      AND fm2.user_id = profile_user_id
  ) THEN
    RETURN true;
  END IF;

  -- Can view if in same class
  IF EXISTS (
    SELECT 1 FROM class_member cm1
    JOIN class_member cm2 ON cm1.class_id = cm2.class_id
    WHERE cm1.user_id = viewer_id
      AND cm2.user_id = profile_user_id
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off;

DROP POLICY IF EXISTS user_profile_select ON user_profile;

-- Use the helper function - it bypasses RLS so no recursion
CREATE POLICY user_profile_select ON user_profile
  FOR SELECT
  USING (can_view_user_profile(user_id, auth.uid()));
