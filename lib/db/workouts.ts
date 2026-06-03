import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { workoutFromRow } from '@/lib/gym/types';
import type { Workout, WorkoutRow, WorkoutExercise, WorkoutFocus } from '@/lib/gym/types';
import type { Level } from '@/lib/types';

export async function listWorkouts(userId: string): Promise<Workout[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('workout')
    .select('*')
    .eq('user_id', userId)
    .order('is_built_in', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as WorkoutRow[]).map(workoutFromRow);
}

export async function getWorkout(userId: string, workoutId: string): Promise<Workout | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('workout')
    .select('*')
    .eq('user_id', userId)
    .eq('id', workoutId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return workoutFromRow(data as WorkoutRow);
}

export async function createWorkout(
  userId: string,
  input: {
    name: string;
    description: string | null;
    focus: WorkoutFocus;
    level: Level;
    exercises: WorkoutExercise[];
  },
): Promise<Workout> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('workout')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
      focus: input.focus,
      level: input.level,
      is_built_in: false,
      exercises: input.exercises,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return workoutFromRow(data as WorkoutRow);
}

export interface GymSessionStat {
  startedAt: string;
  durationSeconds: number | null;
}

/** Completed gym sessions, newest first. Powers the dashboard. */
export async function listGymSessions(userId: string): Promise<GymSessionStat[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_session')
    .select('started_at, duration_seconds')
    .eq('user_id', userId)
    .eq('discipline', 'gym')
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Array<{ started_at: string; duration_seconds: number | null }>).map((r) => ({
    startedAt: r.started_at,
    durationSeconds: r.duration_seconds,
  }));
}

export interface ExerciseSetStat {
  exerciseId: string;
  attemptedAt: string;
  reps: number | null;
  weight: number | null;
}

/** All logged sets (exercise-backed attempts). Powers volume + most-trained. */
export async function listExerciseSets(userId: string): Promise<ExerciseSetStat[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_attempt')
    .select('exercise_id, attempted_at, reps, weight')
    .eq('user_id', userId)
    .not('exercise_id', 'is', null);
  if (error) throw new Error(error.message);
  return (
    data as Array<{
      exercise_id: string;
      attempted_at: string;
      reps: number | null;
      weight: number | null;
    }>
  ).map((r) => ({
    exerciseId: r.exercise_id,
    attemptedAt: r.attempted_at,
    reps: r.reps,
    weight: r.weight,
  }));
}
