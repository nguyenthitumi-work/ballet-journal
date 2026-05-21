-- Remove the email-based invite policy since we're using code-only invites
-- The policy references auth.users which requires admin privileges

DROP POLICY IF EXISTS invite_by_email_select ON invite;

-- Also update the invite table constraints to make email optional
-- (code is now the primary invite method)
