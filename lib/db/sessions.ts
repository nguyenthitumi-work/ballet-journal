import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { formatLocalDate } from '@/lib/services/streak';
import { sessionFromRow, attemptFromRow } from '@/lib/types';
import type {
  PracticeSession,
  PracticeSessionRow,
  Rating,
  SkillAttempt,
  SkillAttemptRow,
} from '@/lib/types';

export async function startSession(args: {
  userId: string;
  planId: string | null;
  orderedSkillIds: string[];
  discipline?: 'ballet' | 'yoga';
  flowId?: string | null;
}): Promise<PracticeSession> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_session')
    .insert({
      user_id: args.userId,
      plan_id: args.planId,
      ordered_skill_ids: args.orderedSkillIds,
      discipline: args.discipline ?? 'ballet',
      flow_id: args.flowId ?? null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return sessionFromRow(data as PracticeSessionRow);
}

export async function endSession(
  userId: string,
  sessionId: string,
  moodRating: Rating | null,
  overallNotes: string | null,
): Promise<PracticeSession> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_session')
    .update({
      ended_at: new Date().toISOString(),
      mood_rating: moodRating,
      overall_notes: overallNotes,
    })
    .eq('user_id', userId)
    .eq('id', sessionId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return sessionFromRow(data as PracticeSessionRow);
}

export async function getSession(
  userId: string,
  sessionId: string,
): Promise<PracticeSession | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_session')
    .select('*')
    .eq('user_id', userId)
    .eq('id', sessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return sessionFromRow(data as PracticeSessionRow);
}

export async function listSessions(
  userId: string,
  limit = 50,
): Promise<PracticeSession[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_session')
    .select('*')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as PracticeSessionRow[]).map(sessionFromRow);
}

export async function listSessionDaysInMonth(
  userId: string,
  year: number,
  monthIdx: number,
): Promise<Array<{ startedAt: string; durationSeconds: number | null }>> {
  // Pad by one day each side so a session that occurred on the 1st (LA) but
  // is stored as the previous UTC day (or vice versa on the last) is still
  // covered. Caller buckets each row by its LA ymd.
  const startIso = new Date(Date.UTC(year, monthIdx, 0)).toISOString();
  const endIso = new Date(Date.UTC(year, monthIdx + 1, 2)).toISOString();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_session')
    .select('started_at, duration_seconds')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .gte('started_at', startIso)
    .lt('started_at', endIso);
  if (error) throw new Error(error.message);
  return (data as Array<{ started_at: string; duration_seconds: number | null }>).map(
    (r) => ({ startedAt: r.started_at, durationSeconds: r.duration_seconds }),
  );
}

export async function recordAttempt(args: {
  userId: string;
  sessionId: string;
  skillId: string;
  rating: Rating;
  notes: string | null;
  isMilestone: boolean;
  durationSeconds: number;
}): Promise<SkillAttempt> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .insert({
      user_id: args.userId,
      session_id: args.sessionId,
      skill_id: args.skillId,
      rating: args.rating,
      notes: args.notes,
      is_milestone: args.isMilestone,
      duration_seconds: args.durationSeconds,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return attemptFromRow(data as SkillAttemptRow);
}

/**
 * Record a completed yoga hold. The yoga analog of recordAttempt: writes a
 * skill_attempt row whose subject is an asana (skill_id stays null; the DB
 * CHECK enforces exactly one of skill_id / asana_id). Everything downstream —
 * History, streaks, video — keys off the same skill_attempt table.
 */
export async function recordAsanaAttempt(args: {
  userId: string;
  sessionId: string;
  asanaId: string;
  rating: Rating;
  notes: string | null;
  isMilestone: boolean;
  durationSeconds: number;
}): Promise<SkillAttempt> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .insert({
      user_id: args.userId,
      session_id: args.sessionId,
      asana_id: args.asanaId,
      rating: args.rating,
      notes: args.notes,
      is_milestone: args.isMilestone,
      duration_seconds: args.durationSeconds,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return attemptFromRow(data as SkillAttemptRow);
}

export async function listAttemptsForSkill(
  userId: string,
  skillId: string,
  limit = 50,
): Promise<SkillAttempt[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .order('attempted_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as SkillAttemptRow[]).map(attemptFromRow);
}

export async function listAttemptsForSession(sessionId: string): Promise<SkillAttempt[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('*')
    .eq('session_id', sessionId)
    .order('attempted_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SkillAttemptRow[]).map(attemptFromRow);
}

export async function setAttemptVideoPath(args: {
  userId: string;
  attemptId: string;
  videoPath: string;
  videoSizeBytes: number;
}): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('skill_attempt')
    .update({
      video_path: args.videoPath,
      video_size_bytes: args.videoSizeBytes,
    })
    .eq('user_id', args.userId)
    .eq('id', args.attemptId);
  if (error) throw new Error(error.message);
}

export async function clearAttemptVideoPath(args: {
  userId: string;
  attemptId: string;
}): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('skill_attempt')
    .update({ video_path: null, video_size_bytes: null })
    .eq('user_id', args.userId)
    .eq('id', args.attemptId);
  if (error) throw new Error(error.message);
}

export async function getAttemptVideoPath(args: {
  userId: string;
  attemptId: string;
}): Promise<string | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('video_path')
    .eq('user_id', args.userId)
    .eq('id', args.attemptId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { video_path: string | null } | null)?.video_path ?? null;
}

export async function setAttemptPhotoPath(args: {
  userId: string;
  attemptId: string;
  photoPath: string;
  photoSizeBytes: number;
}): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('skill_attempt')
    .update({
      photo_path: args.photoPath,
      photo_size_bytes: args.photoSizeBytes,
    })
    .eq('user_id', args.userId)
    .eq('id', args.attemptId);
  if (error) throw new Error(error.message);
}

export async function clearAttemptPhotoPath(args: {
  userId: string;
  attemptId: string;
}): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('skill_attempt')
    .update({ photo_path: null, photo_size_bytes: null })
    .eq('user_id', args.userId)
    .eq('id', args.attemptId);
  if (error) throw new Error(error.message);
}

export async function getAttemptPhotoPath(args: {
  userId: string;
  attemptId: string;
}): Promise<string | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('photo_path')
    .eq('user_id', args.userId)
    .eq('id', args.attemptId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { photo_path: string | null } | null)?.photo_path ?? null;
}

export async function getUserVideoStats(userId: string): Promise<{
  videoCount: number;
  totalBytes: number;
}> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('video_size_bytes')
    .eq('user_id', userId)
    .not('video_path', 'is', null);
  if (error) throw new Error(error.message);
  const rows = (data as { video_size_bytes: number | null }[]) ?? [];
  return {
    videoCount: rows.length,
    totalBytes: rows.reduce((sum, r) => sum + (r.video_size_bytes ?? 0), 0),
  };
}

export async function listUserVideoPaths(userId: string): Promise<string[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('video_path')
    .eq('user_id', userId)
    .not('video_path', 'is', null);
  if (error) throw new Error(error.message);
  return (data as { video_path: string | null }[])
    .map((r) => r.video_path)
    .filter((p): p is string => p !== null);
}

export async function clearAllUserVideoPaths(userId: string): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('skill_attempt')
    .update({ video_path: null, video_size_bytes: null })
    .eq('user_id', userId)
    .not('video_path', 'is', null);
  if (error) throw new Error(error.message);
}

export async function hasAnyMilestone(userId: string): Promise<boolean> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('id')
    .eq('user_id', userId)
    .eq('is_milestone', true)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

// Number of distinct skills the user has attempted today (in their TZ). Used
// for the daily practice goal on the home page. Pads the SQL filter to a
// 48-hour UTC window so we don't have to compute TZ-aware UTC bounds; the
// in-memory filter then keeps only rows whose local date matches today.
export async function countDistinctSkillsToday(
  userId: string,
  tz: string,
): Promise<number> {
  const DAY_MS = 86_400_000;
  const now = new Date();
  const todayLocal = formatLocalDate(now, tz);
  const startIso = new Date(now.getTime() - DAY_MS).toISOString();
  const endIso = new Date(now.getTime() + DAY_MS).toISOString();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('skill_id, attempted_at')
    .eq('user_id', userId)
    .not('skill_id', 'is', null)
    .gte('attempted_at', startIso)
    .lt('attempted_at', endIso);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ skill_id: string | null; attempted_at: string }>;
  const skillIds = new Set<string>();
  for (const r of rows) {
    if (r.skill_id && formatLocalDate(new Date(r.attempted_at), tz) === todayLocal) {
      skillIds.add(r.skill_id);
    }
  }
  return skillIds.size;
}
