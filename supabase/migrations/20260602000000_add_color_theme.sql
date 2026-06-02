-- Per-user UI color theme. Validated/normalized in the app (lib/themes.ts), so
-- no CHECK constraint here — that keeps adding new themes a code-only change.
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS color_theme text NOT NULL DEFAULT 'lavender';
