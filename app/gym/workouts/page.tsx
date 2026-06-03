import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { ensureGymBootstrapped } from '@/lib/gym/bootstrap';
import { listWorkouts } from '@/lib/db/workouts';
import { listExercises } from '@/lib/db/exercises';
import {
  WORKOUT_FOCUS_LABELS,
  workoutTotalSets,
  type Workout,
} from '@/lib/gym/types';
import type { Level } from '@/lib/types';
import { startWorkout } from '../actions';

const LEVEL_BADGE_CLASSES: Record<Level, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-amber-50 text-amber-700',
  Advanced: 'bg-violet-100 text-violet-700',
};

function WorkoutCard({ workout, nameById }: { workout: Workout; nameById: Map<string, string> }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-violet-900">{workout.name}</h3>
          <p className="text-xs text-violet-900/60">
            {WORKOUT_FOCUS_LABELS[workout.focus]} · {workout.exercises.length} exercises ·{' '}
            {workoutTotalSets(workout)} sets
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${LEVEL_BADGE_CLASSES[workout.level]}`}
        >
          {workout.level}
        </span>
      </div>
      {workout.description ? (
        <p className="text-sm text-violet-900/70">{workout.description}</p>
      ) : null}
      <ol className="flex flex-col gap-1 text-sm text-violet-900/80">
        {workout.exercises.map((e, i) => (
          <li key={`${e.exerciseId}-${i}`} className="flex justify-between gap-3">
            <span>{nameById.get(e.exerciseId) ?? 'Exercise'}</span>
            <span className="shrink-0 tabular-nums text-violet-900/50">
              {e.sets} × {e.targetReps}
              {e.targetWeight !== null ? ` @ ${e.targetWeight}` : ''}
            </span>
          </li>
        ))}
      </ol>
      <form action={startWorkout.bind(null, workout.id)}>
        <button
          type="submit"
          disabled={workout.exercises.length === 0}
          className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
        >
          Start workout
        </button>
      </form>
    </article>
  );
}

export default async function GymWorkoutsPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');
  await ensureGymBootstrapped(userId);

  const [workouts, exercises] = await Promise.all([listWorkouts(userId), listExercises(userId)]);
  const nameById = new Map(exercises.map((e) => [e.id, e.name]));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-violet-900">Workouts</h1>
        <p className="text-sm text-violet-900/70">Pick a routine and log your sets.</p>
        <nav className="mt-2 flex gap-2">
          <Link
            href="/gym"
            className="inline-flex items-center rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700 transition hover:border-violet-400"
          >
            ← Exercises
          </Link>
          <Link
            href="/gym/workouts/new"
            className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            + New workout
          </Link>
        </nav>
      </header>

      {workouts.length === 0 ? (
        <p className="rounded-2xl border border-violet-200 bg-white p-5 text-sm text-violet-900/70 shadow-sm">
          No workouts yet. Refresh to seed the starter routines, or build your own.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {workouts.map((w) => (
            <WorkoutCard key={w.id} workout={w} nameById={nameById} />
          ))}
        </div>
      )}
    </section>
  );
}
