ALTER TABLE skill ADD COLUMN reference_url_suggested text;
ALTER TABLE skill ADD COLUMN reference_url_suggested_at timestamptz;

COMMENT ON COLUMN skill.reference_url_suggested IS
  'Auto-discovered YouTube URL from a search by skill name. Pre-fills the reference URL input on the skill page so a grown-up can confirm. The iframe still only renders from reference_url, not this column.';

COMMENT ON COLUMN skill.reference_url_suggested_at IS
  'Timestamp set when the suggestion fetch successfully returned (even if no result was found). Presence is the signal that the lazy fetch has run for this skill, so we do not call the YouTube API again.';
