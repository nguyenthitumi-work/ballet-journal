-- Allow users to add themselves to families when accepting invites
-- Current policy only allows family creator to add members, which blocks invite acceptance

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS family_member_insert ON family_member;

-- New policy: Family creator can add anyone, OR anyone can add themselves
CREATE POLICY family_member_insert ON family_member
  FOR INSERT
  WITH CHECK (
    -- Family creator can add anyone
    EXISTS (
      SELECT 1 FROM family
      WHERE family.id = family_member.family_id
        AND family.created_by = auth.uid()
    )
    OR
    -- Anyone can add themselves (for accepting invites)
    user_id = auth.uid()
  );

-- Same fix for class_member
DROP POLICY IF EXISTS class_member_insert ON class_member;

CREATE POLICY class_member_insert ON class_member
  FOR INSERT
  WITH CHECK (
    -- Class owner can add anyone
    EXISTS (
      SELECT 1 FROM class
      WHERE class.id = class_member.class_id
        AND class.owner_id = auth.uid()
    )
    OR
    -- Anyone can add themselves (for accepting invites)
    user_id = auth.uid()
  );
