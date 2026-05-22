-- Allow users to join a class via invite code
-- This supplements the existing owner-only class_member_insert policy

-- Add a new policy that allows users to add themselves to a class
-- if they have a valid invite code (either via invite table or class.invite_code)
CREATE POLICY class_member_self_insert ON class_member
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND (
      -- Allow if there's a valid formal invite for this user
      EXISTS (
        SELECT 1 FROM invite
        WHERE invite.target_class_id = class_member.class_id
          AND invite.accepted_at IS NULL
          AND invite.expires_at > now()
          AND (
            invite.code IS NOT NULL OR
            invite.email = (SELECT email FROM auth.users WHERE id = auth.uid())
          )
      )
      OR
      -- Allow if the class has an invite code (public join)
      EXISTS (
        SELECT 1 FROM class
        WHERE class.id = class_member.class_id
          AND class.invite_code IS NOT NULL
      )
    )
  );
