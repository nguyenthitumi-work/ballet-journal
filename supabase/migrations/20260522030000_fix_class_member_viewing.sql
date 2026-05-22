-- Fix class_member SELECT policy to allow viewing all members in your classes
-- The current policy only allows viewing your own membership record
-- Teachers/students need to see all members in their classes
-- Use a SECURITY DEFINER function to avoid infinite recursion

-- Helper function: Get class IDs where the user is a member (bypasses RLS)
CREATE OR REPLACE FUNCTION user_class_ids(user_id uuid)
RETURNS TABLE(class_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.class_id
  FROM class_member cm
  WHERE cm.user_id = user_class_ids.user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off;

DROP POLICY IF EXISTS class_member_select_own ON class_member;

-- Allow viewing all members in classes you belong to
CREATE POLICY class_member_select_own ON class_member
  FOR SELECT
  USING (
    class_id IN (SELECT user_class_ids(auth.uid()))
  );
