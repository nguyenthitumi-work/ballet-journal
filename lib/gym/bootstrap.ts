import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { SEED_EXERCISES } from './seedExercises';
import { SEED_WORKOUTS } from './seedWorkouts';

// Seed per-user gym content on the user's first /gym visit. Idempotent, guarded
// by an existence check on the user's exercises. Mirrors lib/yoga/bootstrap.ts.
export async function ensureGymBootstrapped(userId: string): Promise<void> {
  const supabase = await getServerSupabase();

  const { count, error: countError } = await supabase
    .from('exercise')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (countError) throw new Error(`Failed to check gym seed state: ${countError.message}`);
  if ((count ?? 0) > 0) return;

  const exerciseRows = SEED_EXERCISES.map((e) => ({
    user_id: userId,
    category: e.category,
    name: e.name,
    description: e.description,
    cues: e.cues,
    primary_muscles: e.primaryMuscles,
    equipment: e.equipment,
    difficulty: e.difficulty,
    level: e.level,
    default_sets: e.defaultSets,
    default_reps: e.defaultReps,
    default_rest_seconds: e.defaultRestSeconds,
    reference_url: e.referenceUrl,
  }));

  const { data: insertedExercises, error: exError } = await supabase
    .from('exercise')
    .insert(exerciseRows)
    .select('id, name');
  if (exError) throw new Error(`Failed to seed exercises: ${exError.message}`);

  const nameBySlug = new Map(SEED_EXERCISES.map((e) => [e.id, e.name]));
  const uuidByName = new Map((insertedExercises ?? []).map((r) => [r.name, r.id]));

  const workoutRows = SEED_WORKOUTS.map((w) => ({
    user_id: userId,
    name: w.name,
    description: w.description,
    focus: w.focus,
    level: w.level,
    is_built_in: true,
    exercises: w.exercises
      .map((e) => {
        const uuid = uuidByName.get(nameBySlug.get(e.exerciseId) ?? '');
        if (!uuid) return null;
        return {
          exerciseId: uuid,
          sets: e.sets,
          targetReps: e.targetReps,
          targetWeight: e.targetWeight,
          restSeconds: e.restSeconds,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null),
  }));

  const { error: woError } = await supabase.from('workout').insert(workoutRows);
  if (woError) throw new Error(`Failed to seed workouts: ${woError.message}`);
}
