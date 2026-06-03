// Starter built-in workouts — a simple Push / Pull / Legs split plus a
// full-body beginner day. exerciseId values must match SEED_EXERCISES[].id.
import type { Workout } from './types';

export const SEED_WORKOUTS: Workout[] = [
  {
    id: 'push-day',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps.',
    focus: 'push',
    level: 'Intermediate',
    isBuiltIn: true,
    exercises: [
      { exerciseId: 'barbell-bench-press', sets: 4, targetReps: 8, targetWeight: null, restSeconds: 120 },
      { exerciseId: 'overhead-press', sets: 3, targetReps: 8, targetWeight: null, restSeconds: 120 },
      { exerciseId: 'push-up', sets: 3, targetReps: 12, targetWeight: null, restSeconds: 60 },
    ],
  },
  {
    id: 'pull-day',
    name: 'Pull Day',
    description: 'Back and biceps.',
    focus: 'pull',
    level: 'Intermediate',
    isBuiltIn: true,
    exercises: [
      { exerciseId: 'pull-up', sets: 4, targetReps: 6, targetWeight: null, restSeconds: 120 },
      { exerciseId: 'barbell-row', sets: 4, targetReps: 10, targetWeight: null, restSeconds: 90 },
      { exerciseId: 'lat-pulldown', sets: 3, targetReps: 12, targetWeight: null, restSeconds: 75 },
    ],
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    description: 'Quads, hamstrings, and glutes.',
    focus: 'legs',
    level: 'Intermediate',
    isBuiltIn: true,
    exercises: [
      { exerciseId: 'back-squat', sets: 4, targetReps: 6, targetWeight: null, restSeconds: 150 },
      { exerciseId: 'romanian-deadlift', sets: 3, targetReps: 10, targetWeight: null, restSeconds: 90 },
      { exerciseId: 'walking-lunge', sets: 3, targetReps: 12, targetWeight: null, restSeconds: 75 },
    ],
  },
  {
    id: 'full-body-starter',
    name: 'Full-Body Starter',
    description: 'A balanced beginner session hitting the whole body.',
    focus: 'full',
    level: 'Beginner',
    isBuiltIn: true,
    exercises: [
      { exerciseId: 'back-squat', sets: 3, targetReps: 8, targetWeight: null, restSeconds: 120 },
      { exerciseId: 'push-up', sets: 3, targetReps: 10, targetWeight: null, restSeconds: 60 },
      { exerciseId: 'lat-pulldown', sets: 3, targetReps: 12, targetWeight: null, restSeconds: 75 },
      { exerciseId: 'plank', sets: 3, targetReps: 45, targetWeight: null, restSeconds: 45 },
    ],
  },
];

export function getWorkout(id: string): Workout | undefined {
  return SEED_WORKOUTS.find((w) => w.id === id);
}
