import type { DayOfWeek } from '@/lib/services/suggestion';
import type { Workout, WorkoutFocus } from './types';

// A simple weekly split echoing a common Push/Pull/Legs rotation, with
// full-body and rest-leaning days mixed in.
const DAY_FOCUS: Record<DayOfWeek, WorkoutFocus> = {
  0: 'full', // Sun
  1: 'push', // Mon
  2: 'pull', // Tue
  3: 'legs', // Wed
  4: 'push', // Thu
  5: 'pull', // Fri
  6: 'legs', // Sat
};

/**
 * Pick a suggested workout for today. Prefers one whose focus matches the
 * weekday split; otherwise rotates deterministically. Null only when the user
 * has no workouts.
 */
export function pickTodaysWorkout(workouts: Workout[], dayOfWeek: DayOfWeek): Workout | null {
  if (workouts.length === 0) return null;
  const preferred = DAY_FOCUS[dayOfWeek];
  const match = workouts.filter((w) => w.focus === preferred);
  if (match.length > 0) return match[dayOfWeek % match.length];
  return workouts[dayOfWeek % workouts.length];
}
