import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { exerciseFromRow } from '@/lib/gym/types';
import type { Exercise, ExerciseRow } from '@/lib/gym/types';

export async function listExercises(userId: string): Promise<Exercise[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('exercise')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ExerciseRow[]).map(exerciseFromRow);
}

export async function getExercise(userId: string, exerciseId: string): Promise<Exercise | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('exercise')
    .select('*')
    .eq('user_id', userId)
    .eq('id', exerciseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return exerciseFromRow(data as ExerciseRow);
}
