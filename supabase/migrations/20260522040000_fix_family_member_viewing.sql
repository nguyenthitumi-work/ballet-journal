-- Fix family_member SELECT policy to allow viewing all members in your families
-- The current policy only allows viewing your own membership record
-- Parents/dancers need to see all members in their families
-- Use a SECURITY DEFINER function to avoid infinite recursion

-- Helper function: Get family IDs where the user is a member (bypasses RLS)
CREATE OR REPLACE FUNCTION user_family_ids(user_id uuid)
RETURNS TABLE(family_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT fm.family_id
  FROM family_member fm
  WHERE fm.user_id = user_family_ids.user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off;

DROP POLICY IF EXISTS family_member_select_own ON family_member;

-- Allow viewing all members in families you belong to
CREATE POLICY family_member_select_own ON family_member
  FOR SELECT
  USING (
    family_id IN (SELECT user_family_ids(auth.uid()))
  );
