import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { sessionFromRow, attemptFromRow } from '@/lib/types';
import type {
  PracticeSession,
  PracticeSessionRow,
  Rating,
  SkillAttempt,
  SkillAttemptRow,
} from '@/lib/types';

export async function startSession(
  userId: string,
  planId: string | null,
): Promise<PracticeSession> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_session')
    .insert({ user_id: userId, plan_id: planId })
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
