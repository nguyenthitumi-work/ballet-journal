-- Replace the stored `age` integer with `date_of_birth`. Age is derived at render time
-- so the profile stays accurate as the dancer gets older without us having to update it.

ALTER TABLE user_profile
  ADD COLUMN date_of_birth date
  CHECK (date_of_birth IS NULL OR date_of_birth >= '1900-01-01');

-- Drop the now-redundant `age` column (and its CHECK constraint with it).
ALTER TABLE user_profile DROP COLUMN age;
