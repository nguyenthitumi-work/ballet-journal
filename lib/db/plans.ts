import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { planFromRow } from '@/lib/types';
import type { PracticePlan, PracticePlanRow } from '@/lib/types';

export async function listPlans(userId: string): Promise<PracticePlan[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_plan')
    .select('*')
    .eq('user_id', userId)
    .order('is_built_in', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as PracticePlanRow[]).map(planFromRow);
}

export async function getPlan(
  userId: string,
  planId: string,
): Promise<PracticePlan | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_plan')
    .select('*')
    .eq('user_id', userId)
    .eq('id', planId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return planFromRow(data as PracticePlanRow);
}
