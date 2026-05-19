-- Collectible reward scenes (e.g. "Swan Lake" journey). The catalog of journeys
-- and scenes lives in TypeScript (lib/data/seedRewards.ts) — same pattern as
-- lib/services/badges.ts. Only the per-user unlock state is persisted here.
--
-- Reveal queue semantics (so one unlock can be "saved for later"):
--   revealed_at IS NULL AND reveal_queued_at IS NOT NULL  → pending reveal
--   revealed_at IS NOT NULL                               → already shown (or silent backfill)
-- Silent backfill (existing sessions retroactively unlocked on first install of
-- this feature) writes revealed_at = now() so it never enters the queue.

CREATE TABLE user_reward (
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scene_id          text        NOT NULL,
  unlocked_at       timestamptz NOT NULL DEFAULT now(),
  reveal_queued_at  timestamptz,
  revealed_at       timestamptz,
  PRIMARY KEY (user_id, scene_id)
);

-- Partial index for the queue lookup: "next pending reveal for this user".
CREATE INDEX idx_user_reward_pending
  ON user_reward (user_id, reveal_queued_at)
  WHERE revealed_at IS NULL;

ALTER TABLE user_reward ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_reward_own ON user_reward
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
