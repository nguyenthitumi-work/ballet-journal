-- Fix infinite recursion in family/family_member and class/class_member SELECT policies.
-- The original policies had circular dependencies between parent and child tables.
--
-- Strategy: Make member tables have simple, non-recursive policies (user_id = auth.uid() only).
-- Use SECURITY DEFINER helper functions to bypass RLS when parent tables need to check membership.

-- Helper: Check if user is a member of a family (bypasses RLS)
CREATE OR REPLACE FUNCTION is_family_member(fam_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_member
    WHERE family_member.family_id = fam_id
      AND family_member.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper: Check if user is a member of a class (bypasses RLS)
CREATE OR REPLACE FUNCTION is_class_member(cls_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_member
    WHERE class_member.class_id = cls_id
      AND class_member.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- family_member: Simple policy - you can only see your own membership records
DROP POLICY IF EXISTS family_member_select_own ON family_member;
CREATE POLICY family_member_select_own ON family_member
  FOR SELECT
  USING (user_id = auth.uid());

-- class_member: Simple policy - you can only see your own membership records
DROP POLICY IF EXISTS class_member_select_own ON class_member;
CREATE POLICY class_member_select_own ON class_member
  FOR SELECT
  USING (user_id = auth.uid());

-- family: Use helper function to check membership (no circular dependency)
DROP POLICY IF EXISTS family_member_select ON family;
CREATE POLICY family_select ON family
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    is_family_member(family.id, auth.uid())
  );

-- class: Use helper function to check membership (no circular dependency)
DROP POLICY IF EXISTS class_member_select ON class;
CREATE POLICY class_select ON class
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    is_class_member(class.id, auth.uid())
  );
