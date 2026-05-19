import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { scenesUnlockedBy, type RewardState } from '@/lib/services/rewards';

export interface UserReward {
  userId: string;
  sceneId: string;
  unlockedAt: string;
  revealQueuedAt: string | null;
  revealedAt: string | null;
}

interface UserRewardRow {
  user_id: string;
  scene_id: string;
  unlocked_at: string;
  reveal_queued_at: string | null;
  revealed_at: string | null;
}

const userRewardFromRow = (r: UserRewardRow): UserReward => ({
  userId: r.user_id,
  sceneId: r.scene_id,
  unlockedAt: r.unlocked_at,
  revealQueuedAt: r.reveal_queued_at,
  revealedAt: r.revealed_at,
});

async function fetchRewardState(userId: string): Promise<RewardState> {
  const supabase = await getServerSupabase();
  // Parallel: four small count queries instead of one wide read.
  const [sessions, mastered, milestones, profile] = await Promise.all([
    supabase
      .from('practice_session')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('ended_at', 'is', null),
    supabase
      .from('skill')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('progress_status', 'mastered'),
    supabase
      .from('skill_attempt')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_milestone', true),
    supabase
      .from('user_profile')
      .select('streak')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (sessions.error) throw new Error(sessions.error.message);
  if (mastered.error) throw new Error(mastered.error.message);
  if (milestones.error) throw new Error(milestones.error.message);
  if (profile.error) throw new Error(profile.error.message);

  return {
    completedSessionCount: sessions.count ?? 0,
    masteredSkillCount: mastered.count ?? 0,
    milestoneCount: milestones.count ?? 0,
    streak: (profile.data as { streak: number } | null)?.streak ?? 0,
  };
}

export async function listUnlockedSceneIds(userId: string): Promise<Set<string>> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('user_reward')
    .select('scene_id')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return new Set((data as { scene_id: string }[]).map((r) => r.scene_id));
}

// Diffs the user's current state against already-unlocked scenes and inserts
// rows for any newly-qualifying ones. Idempotent: a second call with no state
// change is a no-op. Safe to call from server actions after the events that
// could move thresholds (session finish, mastery toggle, milestone mark).
//
// silent=true backfills past activity without queuing reveals — used once at
// bootstrap so existing users see a partially-filled board immediately and
// only future unlocks trigger the reveal animation.
export async function evaluateUnlocks(
  userId: string,
  opts: { silent?: boolean } = {},
): Promise<string[]> {
  const silent = opts.silent === true;

  const state = await fetchRewardState(userId);
  const eligible = new Set(scenesUnlockedBy(state));
  const already = await listUnlockedSceneIds(userId);
  const newSceneIds = [...eligible].filter((id) => !already.has(id)).sort();

  if (newSceneIds.length === 0) return [];

  const now = new Date().toISOString();
  const rows = newSceneIds.map((scene_id) => ({
    user_id: userId,
    scene_id,
    unlocked_at: now,
    reveal_queued_at: silent ? null : now,
    revealed_at: silent ? now : null,
  }));

  const supabase = await getServerSupabase();
  // ignoreDuplicates handles the race where two concurrent server actions both
  // think a scene is new. The PK (user_id, scene_id) is the dedup key.
  const { error } = await supabase
    .from('user_reward')
    .upsert(rows, { onConflict: 'user_id,scene_id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  return newSceneIds;
}

// Oldest pending reveal for this user. Returns null when the queue is empty.
// Ties on reveal_queued_at break by scene_id (lexicographic == narrative order
// because scene IDs are 'swan-lake-01' .. 'swan-lake-24').
export async function nextQueuedReveal(userId: string): Promise<UserReward | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('user_reward')
    .select('*')
    .eq('user_id', userId)
    .is('revealed_at', null)
    .not('reveal_queued_at', 'is', null)
    .order('reveal_queued_at', { ascending: true })
    .order('scene_id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return userRewardFromRow(data as UserRewardRow);
}

export async function markRevealed(userId: string, sceneId: string): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('user_reward')
    .update({ revealed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('scene_id', sceneId);
  if (error) throw new Error(error.message);
}

export async function listUserRewards(userId: string): Promise<UserReward[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('user_reward')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data as UserRewardRow[]).map(userRewardFromRow);
}
