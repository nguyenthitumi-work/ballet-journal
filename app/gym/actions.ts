'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import { endSession, recordSet, startSession } from '@/lib/db/sessions';
import { createWorkout, getWorkout } from '@/lib/db/workouts';
import { listExercises } from '@/lib/db/exercises';
import { getDisciplineState, setDisciplineStreak } from '@/lib/db/disciplineProfile';
import { computeNewStreak, formatLocalDate } from '@/lib/services/streak';
import { WORKOUT_FOCUS_LABELS, type WorkoutExercise, type WorkoutFocus } from '@/lib/gym/types';
import type { Level, Rating } from '@/lib/types';

const LOCAL_TZ = 'America/Los_Angeles';
const VALID_RATINGS: readonly Rating[] = [1, 2, 3, 4, 5];
const VALID_LEVELS: readonly Level[] = ['Beginner', 'Intermediate', 'Advanced'];

function isRating(value: number): value is Rating {
  return (VALID_RATINGS as readonly number[]).includes(value);
}

// Start a workout: create a gym-tagged session linked to the workout, then hand
// off to the logging player. ordered_skill_ids holds the distinct exercise ids.
export async function startWorkout(workoutId: string): Promise<void> {
  if (typeof workoutId !== 'string' || workoutId.length === 0) {
    throw new Error('Missing workout id.');
  }
  const { userId } = await getSessionContext();
  const workout = await getWorkout(userId, workoutId);
  if (workout === null) throw new Error('Workout not found.');
  const distinctIds = Array.from(new Set(workout.exercises.map((e) => e.exerciseId)));
  const session = await startSession({
    userId,
    planId: null,
    orderedSkillIds: distinctIds,
    discipline: 'gym',
    workoutId,
  });
  redirect(`/gym/play/${session.id}`);
}

// Log a single completed set.
export async function logSet(args: {
  sessionId: string;
  exerciseId: string;
  reps: number;
  weight: number | null;
  rating?: number;
}): Promise<{ attemptId: string }> {
  const { sessionId, exerciseId } = args;
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    throw new Error('Missing session id.');
  }
  if (typeof exerciseId !== 'string' || exerciseId.length === 0) {
    throw new Error('Missing exercise id.');
  }
  const reps = Math.floor(Number(args.reps));
  if (!Number.isFinite(reps) || reps < 0 || reps > 1000) {
    throw new Error('Reps must be between 0 and 1000.');
  }
  let weight: number | null = null;
  if (args.weight !== null && args.weight !== undefined && `${args.weight}` !== '') {
    const w = Number(args.weight);
    if (!Number.isFinite(w) || w < 0 || w > 10000) throw new Error('Weight is out of range.');
    weight = Math.round(w * 100) / 100;
  }
  const rating: Rating =
    typeof args.rating === 'number' && Number.isInteger(args.rating) && isRating(args.rating)
      ? args.rating
      : 3;

  const { userId } = await getSessionContext();
  const attempt = await recordSet({
    userId,
    sessionId,
    exerciseId,
    reps,
    weight,
    rating,
    isMilestone: false,
    durationSeconds: 0,
  });
  return { attemptId: attempt.id };
}

// End a gym session. Mirrors the ballet/yoga finish: close, advance streak,
// queue reward unlocks, then go to History.
export async function finishWorkoutSession(
  sessionId: string,
  moodRating: number | null,
  overallNotes: string,
): Promise<void> {
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    throw new Error('Missing session id.');
  }
  let mood: Rating | null = null;
  if (moodRating !== null) {
    if (!Number.isInteger(moodRating) || !isRating(moodRating)) {
      throw new Error('Mood rating must be between 1 and 5.');
    }
    mood = moodRating;
  }

  const { userId } = await getSessionContext();
  await endSession(
    userId,
    sessionId,
    mood,
    overallNotes.trim().length === 0 ? null : overallNotes.trim(),
  );

  const state = await getDisciplineState(userId, 'gym');
  const todayLocal = formatLocalDate(new Date(), LOCAL_TZ);
  const { newStreak, updatedLastPracticeDate } = computeNewStreak({
    currentStreak: state.streak,
    lastPracticeDate: state.lastPracticeDate,
    todayLocal,
  });
  await setDisciplineStreak(userId, 'gym', newStreak, updatedLastPracticeDate);

  // Reward scenes are a ballet feature; gym sessions don't trigger them.

  revalidatePath('/');
  revalidatePath('/history');
  redirect('/history');
}

const VALID_FOCUS = Object.keys(WORKOUT_FOCUS_LABELS) as WorkoutFocus[];

export interface NewWorkoutInput {
  name: string;
  description: string;
  focus: string;
  level: string;
  exercises: {
    exerciseId: string;
    sets: number;
    targetReps: number;
    targetWeight: string;
    restSeconds: number;
  }[];
}

export async function createWorkoutAction(input: NewWorkoutInput): Promise<void> {
  const { userId } = await getSessionContext();

  const name = (input.name ?? '').trim();
  if (name.length === 0) throw new Error('Give your workout a name.');
  if (name.length > 80) throw new Error('Workout name is too long.');

  if (!(VALID_FOCUS as readonly string[]).includes(input.focus)) {
    throw new Error('Pick a valid focus.');
  }
  const focus = input.focus as WorkoutFocus;

  if (!(VALID_LEVELS as readonly string[]).includes(input.level)) {
    throw new Error('Pick a valid level.');
  }
  const level = input.level as Level;

  if (!Array.isArray(input.exercises) || input.exercises.length === 0) {
    throw new Error('Add at least one exercise.');
  }

  const ownedIds = new Set((await listExercises(userId)).map((e) => e.id));

  const exercises: WorkoutExercise[] = input.exercises.map((e, i) => {
    if (!ownedIds.has(e.exerciseId)) {
      throw new Error(`Exercise ${i + 1} is not in your library.`);
    }
    const sets = Math.floor(Number(e.sets));
    if (!Number.isFinite(sets) || sets < 1 || sets > 20) {
      throw new Error(`Exercise ${i + 1} needs 1–20 sets.`);
    }
    const targetReps = Math.floor(Number(e.targetReps));
    if (!Number.isFinite(targetReps) || targetReps < 1 || targetReps > 100) {
      throw new Error(`Exercise ${i + 1} needs 1–100 target reps.`);
    }
    const restSeconds = Math.floor(Number(e.restSeconds));
    if (!Number.isFinite(restSeconds) || restSeconds < 0 || restSeconds > 600) {
      throw new Error(`Exercise ${i + 1} rest must be 0–600 seconds.`);
    }
    let targetWeight: number | null = null;
    if (e.targetWeight !== undefined && `${e.targetWeight}`.trim() !== '') {
      const w = Number(e.targetWeight);
      if (!Number.isFinite(w) || w < 0 || w > 10000) {
        throw new Error(`Exercise ${i + 1} has an invalid target weight.`);
      }
      targetWeight = Math.round(w * 100) / 100;
    }
    return { exerciseId: e.exerciseId, sets, targetReps, targetWeight, restSeconds };
  });

  await createWorkout(userId, {
    name,
    description:
      input.description.trim().length === 0 ? null : input.description.trim().slice(0, 280),
    focus,
    level,
    exercises,
  });

  revalidatePath('/gym/workouts');
  redirect('/gym/workouts');
}
