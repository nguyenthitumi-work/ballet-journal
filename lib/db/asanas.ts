import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { asanaFromRow } from '@/lib/yoga/types';
import type { Asana, AsanaRow } from '@/lib/yoga/types';

export async function listAsanas(userId: string): Promise<Asana[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('asana')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as AsanaRow[]).map(asanaFromRow);
}

export async function getAsana(userId: string, asanaId: string): Promise<Asana | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('asana')
    .select('*')
    .eq('user_id', userId)
    .eq('id', asanaId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return asanaFromRow(data as AsanaRow);
}
