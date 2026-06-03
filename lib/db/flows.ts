import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { flowFromRow } from '@/lib/yoga/types';
import type { FlowPose, YogaFlow, YogaFlowRow, YogaStyle } from '@/lib/yoga/types';
import type { Level } from '@/lib/types';

export async function listFlows(userId: string): Promise<YogaFlow[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('yoga_flow')
    .select('*')
    .eq('user_id', userId)
    .order('is_built_in', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as YogaFlowRow[]).map(flowFromRow);
}

export async function createFlow(
  userId: string,
  input: {
    name: string;
    description: string | null;
    style: YogaStyle;
    level: Level;
    poses: FlowPose[];
  },
): Promise<YogaFlow> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('yoga_flow')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
      style: input.style,
      level: input.level,
      is_built_in: false,
      poses: input.poses,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return flowFromRow(data as YogaFlowRow);
}

export interface YogaSessionStat {
  startedAt: string;
  durationSeconds: number | null;
}

/** Completed yoga sessions for the user, newest first. Powers the dashboard. */
export async function listYogaSessions(userId: string): Promise<YogaSessionStat[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_session')
    .select('started_at, duration_seconds')
    .eq('user_id', userId)
    .eq('discipline', 'yoga')
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Array<{ started_at: string; duration_seconds: number | null }>).map((r) => ({
    startedAt: r.started_at,
    durationSeconds: r.duration_seconds,
  }));
}

export interface AsanaAttemptStat {
  asanaId: string;
  attemptedAt: string;
  durationSeconds: number;
}

/** All asana-backed attempts for the user (yoga holds). Powers most-practiced. */
export async function listAsanaAttempts(userId: string): Promise<AsanaAttemptStat[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('asana_id, attempted_at, duration_seconds')
    .eq('user_id', userId)
    .not('asana_id', 'is', null);
  if (error) throw new Error(error.message);
  return (data as Array<{ asana_id: string; attempted_at: string; duration_seconds: number }>).map(
    (r) => ({
      asanaId: r.asana_id,
      attemptedAt: r.attempted_at,
      durationSeconds: r.duration_seconds,
    }),
  );
}

export async function getFlow(userId: string, flowId: string): Promise<YogaFlow | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('yoga_flow')
    .select('*')
    .eq('user_id', userId)
    .eq('id', flowId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return flowFromRow(data as YogaFlowRow);
}
