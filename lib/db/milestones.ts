import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { SUBJECT_CONFIG } from '@/lib/services/disciplineSubject';
import { attemptFromRow } from '@/lib/types';
import type { Discipline, SkillAttempt, SkillAttemptRow } from '@/lib/types';

// Milestone attempts for one discipline, newest first. The subject is scoped by
// the discipline's id column (skill_id / asana_id / exercise_id) so each
// discipline's Milestones page shows only its own breakthroughs.
export async function listMilestoneAttempts(
  userId: string,
  discipline: Discipline = 'ballet',
  limit = 200,
): Promise<SkillAttempt[]> {
  const idColumn = SUBJECT_CONFIG[discipline].idColumn;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('*')
    .eq('user_id', userId)
    .eq('is_milestone', true)
    .not(idColumn, 'is', null)
    .order('attempted_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as SkillAttemptRow[]).map(attemptFromRow);
}
