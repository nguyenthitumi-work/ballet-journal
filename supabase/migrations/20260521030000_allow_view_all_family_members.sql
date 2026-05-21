-- Allow users to see ALL members in families they belong to
-- Current policy only shows their own membership record
-- Use SECURITY DEFINER function to avoid infinite recursion

-- Helper function to check if user is in a family (bypasses RLS)
CREATE OR REPLACE FUNCTION user_is_in_family(fam_id uuid, uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_member
    WHERE family_member.family_id = fam_id
      AND family_member.user_id = uid
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Drop old policies
DROP POLICY IF EXISTS family_member_select_own ON family_member;
DROP POLICY IF EXISTS family_member_select_all_in_my_families ON family_member;

-- New policy using helper function (no circular dependency)
CREATE POLICY family_member_select_all_in_my_families ON family_member
  FOR SELECT
  USING (
    user_is_in_family(family_member.family_id, auth.uid())
  );
