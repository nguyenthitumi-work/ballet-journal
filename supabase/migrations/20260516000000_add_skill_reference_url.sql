ALTER TABLE skill ADD COLUMN reference_url text;

COMMENT ON COLUMN skill.reference_url IS
  'Parent-curated YouTube URL for a reference video. NULL until set. Validated app-side to youtube.com / youtu.be / youtube-nocookie.com only.';
