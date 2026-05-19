-- One-time marker so retroactive reward backfill runs once per user.
-- Bootstrap reads this column on every page load; when null, it calls
-- evaluateUnlocks(silent:true) to silently catch up past sessions/masteries
-- /milestones/streak, then sets this timestamp. After that, the bootstrap
-- short-circuits with no extra DB calls. New users get NOW() at insert time
-- (lib/db/bootstrap.ts) since they have nothing to backfill.

ALTER TABLE user_profile
  ADD COLUMN rewards_backfilled_at timestamptz;
