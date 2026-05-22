-- Fix the class_member_self_insert policy to avoid permission denied error
-- The previous version tried to access auth.users table which users can't query

-- Drop the problematic policy
DROP POLICY IF EXISTS class_member_self_insert ON class_member;

-- Create a corrected version that doesn't access auth.users
CREATE POLICY class_member_self_insert ON class_member
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND (
      -- Allow if there's a valid formal invite with a code for this class
      EXISTS (
        SELECT 1 FROM invite
        WHERE invite.target_class_id = class_member.class_id
          AND invite.accepted_at IS NULL
          AND invite.expires_at > now()
          AND invite.code IS NOT NULL
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
