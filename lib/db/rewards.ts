import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { getDisciplineState } from '@/lib/db/disciplineProfile';
import { SUBJECT_CONFIG, listSubjectCatalog } from '@/lib/services/disciplineSubject';
import { scenesUnlockedBy, type RewardState } from '@/lib/services/rewards';
import type { Discipline } from '@/lib/types';

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

// The reward catalog is reused across disciplines, so a scene's stored id is
// namespaced per non-ballet discipline to keep each board's unlock state
// separate in the shared user_reward table. Ballet keeps bare ids
// ("swan-lake-01") for backward compatibility with existing rows.
function storedSceneId(sceneId: string, discipline: Discipline): string {
  return discipline === 'ballet' ? sceneId : `${discipline}:${sceneId}`;
}

function belongsToDiscipline(storedId: string, discipline: Discipline): boolean {
  const isYoga = storedId.startsWith('yoga:');
  const isGym = storedId.startsWith('gym:');
  if (discipline === 'yoga') return isYoga;
  if (discipline === 'gym') return isGym;
  return !isYoga && !isGym; // ballet = bare
}

function canonicalSceneId(storedId: string, discipline: Discipline): string {
  return discipline === 'ballet' ? storedId : storedId.slice(`${discipline}:`.length);
}

const userRewardFromRow = (r: UserRewardRow, discipline: Discipline): UserReward => ({
  userId: r.user_id,
  sceneId: canonicalSceneId(r.scene_id, discipline),
  unlockedAt: r.unlocked_at,
  revealQueuedAt: r.reveal_queued_at,
  revealedAt: r.revealed_at,
});

async function fetchRewardState(
  userId: string,
  discipline: Discipline,
): Promise<RewardState> {
  const cfg = SUBJECT_CONFIG[discipline];
  const supabase = await getServerSupabase();
  // All counts are scoped to the discipline so each board reflects only its own
  // practice. Mastery comes from the subject catalog (asanas/exercises also
  // carry progress_status); streak comes from the per-discipline state.
  const [sessions, milestones, state, catalog] = await Promise.all([
    supabase
      .from('practice_session')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('discipline', discipline)
      .not('ended_at', 'is', null),
    supabase
      .from('skill_attempt')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_milestone', true)
      .not(cfg.idColumn, 'is', null),
    getDisciplineState(userId, discipline),
    listSubjectCatalog(userId, discipline),
  ]);

  if (sessions.error) throw new Error(sessions.error.message);
  if (milestones.error) throw new Error(milestones.error.message);

  return {
    completedSessionCount: sessions.count ?? 0,
    masteredSkillCount: catalog.filter((c) => c.progressStatus === 'mastered').length,
    milestoneCount: milestones.count ?? 0,
    streak: state.streak,
  };
}

export async function listUnlockedSceneIds(
  userId: string,
  discipline: Discipline = 'ballet',
): Promise<Set<string>> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('user_reward')
    .select('scene_id')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  const set = new Set<string>();
  for (const r of data as { scene_id: string }[]) {
    if (belongsToDiscipline(r.scene_id, discipline)) {
      set.add(canonicalSceneId(r.scene_id, discipline));
    }
  }
  return set;
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
  discipline: Discipline = 'ballet',
  opts: { silent?: boolean } = {},
): Promise<string[]> {
  const silent = opts.silent === true;

  const state = await fetchRewardState(userId, discipline);
  const eligible = new Set(scenesUnlockedBy(state));
  const already = await listUnlockedSceneIds(userId, discipline);
  const newSceneIds = [...eligible].filter((id) => !already.has(id)).sort();

  if (newSceneIds.length === 0) return [];

  const now = new Date().toISOString();
  const rows = newSceneIds.map((scene_id) => ({
    user_id: userId,
    scene_id: storedSceneId(scene_id, discipline),
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
  return userRewardFromRow(data as UserRewardRow, 'ballet');
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

export async function listUserRewards(
  userId: string,
  discipline: Discipline = 'ballet',
): Promise<UserReward[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('user_reward')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data as UserRewardRow[])
    .filter((r) => belongsToDiscipline(r.scene_id, discipline))
    .map((r) => userRewardFromRow(r, discipline));
}
