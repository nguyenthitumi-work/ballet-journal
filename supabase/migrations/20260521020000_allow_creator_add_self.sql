-- Allow family creator to add themselves as a member
-- Current policy blocks creator from adding themselves when creating family

DROP POLICY IF EXISTS family_member_insert ON family_member;

CREATE POLICY family_member_insert ON family_member
  FOR INSERT
  WITH CHECK (
    -- Family creator can add anyone (including themselves)
    EXISTS (
      SELECT 1 FROM family
      WHERE family.id = family_member.family_id
        AND family.created_by = auth.uid()
    )
    OR
    -- Anyone can add themselves (for accepting invites)
    user_id = auth.uid()
  );
