-- Allow users to view a class if they have the invite code
-- This is needed for the accept-code flow: users need to see the class
-- before they can join it via the invite code

-- Add a new SELECT policy that allows viewing classes by invite code
CREATE POLICY class_select_by_invite_code ON class
  FOR SELECT
  USING (
    invite_code IS NOT NULL
  );
