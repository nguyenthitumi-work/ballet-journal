-- Fix user_profile viewing - allow seeing profiles of family/class members
-- Current policy only works for viewing dancers, but parents/teachers also need visible profiles

DROP POLICY IF EXISTS user_profile_select ON user_profile;

-- Allow viewing profiles of:
-- 1. Yourself
-- 2. Anyone in families you belong to
-- 3. Anyone in classes you belong to
CREATE POLICY user_profile_select ON user_profile
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    -- Same family
    EXISTS (
      SELECT 1 FROM family_member fm1
      JOIN family_member fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid()
        AND fm2.user_id = user_profile.user_id
    )
    OR
    -- Same class
    EXISTS (
      SELECT 1 FROM class_member cm1
      JOIN class_member cm2 ON cm1.class_id = cm2.class_id
      WHERE cm1.user_id = auth.uid()
        AND cm2.user_id = user_profile.user_id
    )
  );
