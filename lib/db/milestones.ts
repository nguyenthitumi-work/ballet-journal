import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { attemptFromRow } from '@/lib/types';
import type { SkillAttempt, SkillAttemptRow } from '@/lib/types';

export async function listMilestoneAttempts(
  userId: string,
  limit = 200,
): Promise<SkillAttempt[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('*')
    .eq('user_id', userId)
    .eq('is_milestone', true)
    .order('attempted_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as SkillAttemptRow[]).map(attemptFromRow);
}
