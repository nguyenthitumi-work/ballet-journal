-- Fix note viewing - dancers should see notes on their own sessions
-- Current policy with can_view_dancer() isn't working correctly

DROP POLICY IF EXISTS practice_note_viewer_select ON practice_note;

-- Simpler policy: you can see notes on sessions/attempts you own
CREATE POLICY practice_note_viewer_select ON practice_note
  FOR SELECT
  USING (
    -- See notes you authored
    author_user_id = auth.uid()
    OR
    -- See notes on sessions you own
    (session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM practice_session
      WHERE practice_session.id = practice_note.session_id
        AND practice_session.user_id = auth.uid()
    ))
    OR
    -- See notes on attempts you own
    (attempt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM skill_attempt
      WHERE skill_attempt.id = practice_note.attempt_id
        AND skill_attempt.user_id = auth.uid()
    ))
  );
