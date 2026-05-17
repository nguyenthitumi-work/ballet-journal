import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { planFromRow } from '@/lib/types';
import type { PracticePlan, PracticePlanRow } from '@/lib/types';

export async function listPlans(deviceId: string): Promise<PracticePlan[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('practice_plan')
    .select('*')
    .eq('device_id', deviceId)
    .order('is_built_in', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as PracticePlanRow[]).map(planFromRow);
}

export async function getPlan(
  deviceId: string,
  planId: string,
): Promise<PracticePlan | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('practice_plan')
    .select('*')
    .eq('device_id', deviceId)
    .eq('id', planId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return planFromRow(data as PracticePlanRow);
}
