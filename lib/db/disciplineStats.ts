import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { SUBJECT_CONFIG } from '@/lib/services/disciplineSubject';
import type { Discipline } from '@/lib/types';

// Per-discipline aggregate stats backing the generic badges and reward unlocks.

export async function countCompletedSessions(
  userId: string,
  discipline: Discipline,
): Promise<number> {
  const supabase = await getServerSupabase();
  const { count, error } = await supabase
    .from('practice_session')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('discipline', discipline)
    .not('ended_at', 'is', null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// Distinct subjects (asanas/exercises/skills) the user has ever attempted.
// Supabase has no DISTINCT helper, so we dedupe the id column in app.
export async function countDistinctSubjectsPracticed(
  userId: string,
  discipline: Discipline,
): Promise<number> {
  const idColumn = SUBJECT_CONFIG[discipline].idColumn;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select(idColumn)
    .eq('user_id', userId)
    .not(idColumn, 'is', null);
  if (error) throw new Error(error.message);
  const ids = new Set<string>();
  for (const r of (data ?? []) as Array<Record<string, string | null>>) {
    const id = r[idColumn];
    if (id) ids.add(id);
  }
  return ids.size;
}

export async function hasMilestoneForDiscipline(
  userId: string,
  discipline: Discipline,
): Promise<boolean> {
  const idColumn = SUBJECT_CONFIG[discipline].idColumn;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('id')
    .eq('user_id', userId)
    .eq('is_milestone', true)
    .not(idColumn, 'is', null)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}
