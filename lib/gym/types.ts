// Gym (strength training) discipline types.
//
// Mirrors the yoga model so the shared engine — sessions, attempts, history,
// streaks — is reused. Where yoga has "Asana"/"YogaFlow", gym has
// "Exercise"/"Workout". The defining difference: a workout step carries
// set/rep/weight/rest targets, and each logged set is one skill_attempt with
// reps + weight.
import type { Difficulty, Level } from '@/lib/types';

export type ExerciseCategory =
  | 'push'
  | 'pull'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'full-body'
  | 'olympic';

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
  'full-body': 'Full Body',
  olympic: 'Olympic',
};

export type WorkoutFocus = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | 'core' | 'cardio';

export const WORKOUT_FOCUS_LABELS: Record<WorkoutFocus, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Upper',
  lower: 'Lower',
  full: 'Full Body',
  core: 'Core',
  cardio: 'Cardio',
};

/** A single exercise. The gym analog of a yoga Asana. */
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  description: string;
  cues: string[];
  primaryMuscles: string[];
  equipment: string | null;
  difficulty: Difficulty;
  level: Level;
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
  referenceUrl: string | null;
}

/** One prescribed step in a workout: sets × target reps (× target weight). */
export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  targetReps: number;
  targetWeight: number | null;
  restSeconds: number;
}

/** An ordered list of prescribed exercises. The gym analog of a YogaFlow. */
export interface Workout {
  id: string;
  name: string;
  description: string;
  focus: WorkoutFocus;
  level: Level;
  isBuiltIn: boolean;
  exercises: WorkoutExercise[];
}

// --- DB row shapes + mappers ---

export interface ExerciseRow {
  id: string;
  user_id: string;
  category: ExerciseCategory;
  name: string;
  description: string | null;
  cues: string[];
  primary_muscles: string[];
  equipment: string | null;
  difficulty: number;
  level: Level;
  default_sets: number;
  default_reps: number;
  default_rest_seconds: number;
  is_currently_working_on: boolean;
  progress_status: string;
  reference_url: string | null;
  date_added: string;
  last_attempted_at: string | null;
}

export interface WorkoutRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  focus: WorkoutFocus;
  level: Level;
  is_built_in: boolean;
  exercises: unknown; // jsonb — coerced in workoutFromRow
  created_at: string;
}

function coerceExercises(value: unknown): WorkoutExercise[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    .map((v) => ({
      exerciseId: String(v.exerciseId ?? ''),
      sets: Number(v.sets ?? 0),
      targetReps: Number(v.targetReps ?? 0),
      targetWeight:
        v.targetWeight === null || v.targetWeight === undefined ? null : Number(v.targetWeight),
      restSeconds: Number(v.restSeconds ?? 0),
    }))
    .filter((e) => e.exerciseId.length > 0 && e.sets > 0);
}

export const exerciseFromRow = (r: ExerciseRow): Exercise => ({
  id: r.id,
  name: r.name,
  category: r.category,
  description: r.description ?? '',
  cues: r.cues ?? [],
  primaryMuscles: r.primary_muscles ?? [],
  equipment: r.equipment,
  difficulty: r.difficulty as Difficulty,
  level: r.level,
  defaultSets: r.default_sets,
  defaultReps: r.default_reps,
  defaultRestSeconds: r.default_rest_seconds,
  referenceUrl: r.reference_url,
});

export const workoutFromRow = (r: WorkoutRow): Workout => ({
  id: r.id,
  name: r.name,
  description: r.description ?? '',
  focus: r.focus,
  level: r.level,
  isBuiltIn: r.is_built_in,
  exercises: coerceExercises(r.exercises),
});

/** Total prescribed sets across the workout. */
export function workoutTotalSets(w: Workout): number {
  return w.exercises.reduce((sum, e) => sum + e.sets, 0);
}
