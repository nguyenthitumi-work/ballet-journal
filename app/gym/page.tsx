import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { ensureGymBootstrapped } from '@/lib/gym/bootstrap';
import { listExercises } from '@/lib/db/exercises';
import { listWorkouts } from '@/lib/db/workouts';
import { pickTodaysWorkout } from '@/lib/gym/suggestion';
import { localDayOfWeek } from '@/lib/services/suggestion';
import {
  EXERCISE_CATEGORY_LABELS,
  WORKOUT_FOCUS_LABELS,
  workoutTotalSets,
  type Exercise,
  type ExerciseCategory,
} from '@/lib/gym/types';
import type { Level } from '@/lib/types';
import { startWorkout } from './actions';

const LOCAL_TZ = 'America/Los_Angeles';

const LEVEL_BADGE_CLASSES: Record<Level, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-amber-50 text-amber-700',
  Advanced: 'bg-violet-100 text-violet-700',
};

const CATEGORY_ORDER: ExerciseCategory[] = [
  'push',
  'pull',
  'legs',
  'core',
  'olympic',
  'cardio',
  'full-body',
];

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <article className="block rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:border-violet-400">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-violet-900">
            {exercise.name}
          </h3>
          {exercise.equipment ? (
            <p className="text-xs text-violet-900/60">{exercise.equipment}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${LEVEL_BADGE_CLASSES[exercise.level]}`}
        >
          {exercise.level}
        </span>
      </div>
      {exercise.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-violet-900/70">{exercise.description}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-violet-900/70">
        <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700">
          {exercise.defaultSets} × {exercise.defaultReps}
        </span>
        {exercise.primaryMuscles.slice(0, 3).map((m) => (
          <span key={m} className="rounded-full bg-violet-50 px-2 py-0.5">
            {m}
          </span>
        ))}
      </div>
    </article>
  );
}

export default async function GymHomePage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');
  await ensureGymBootstrapped(userId);
  const [exercises, workouts] = await Promise.all([listExercises(userId), listWorkouts(userId)]);
  const todaysWorkout = pickTodaysWorkout(workouts, localDayOfWeek(new Date(), LOCAL_TZ));

  const byCategory = new Map<ExerciseCategory, Exercise[]>();
  for (const e of exercises) {
    const bucket = byCategory.get(e.category);
    if (bucket) bucket.push(e);
    else byCategory.set(e.category, [e]);
  }
  const orderedCategories = CATEGORY_ORDER.filter((c) => byCategory.has(c));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-violet-900">Gym</h1>
        <p className="text-sm text-violet-900/70">
          Browse exercises, or start a workout and log your sets.
        </p>
        <nav className="mt-2 flex gap-2">
          <Link
            href="/gym/workouts"
            className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            Workouts →
          </Link>
          <Link
            href="/gym/progress"
            className="inline-flex items-center rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700 transition hover:border-violet-400"
          >
            Progress
          </Link>
        </nav>
      </header>

      {todaysWorkout ? (
        <form action={startWorkout.bind(null, todaysWorkout.id)}>
          <div className="flex flex-col gap-3 rounded-2xl border border-violet-300 bg-violet-50 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700/80">
                  Today&apos;s workout
                </p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-violet-900">
                  {todaysWorkout.name}
                </h2>
                <p className="mt-1 text-sm text-violet-900/70">
                  {WORKOUT_FOCUS_LABELS[todaysWorkout.focus]} · {todaysWorkout.exercises.length}{' '}
                  exercises · {workoutTotalSets(todaysWorkout)} sets
                </p>
              </div>
              <span className="rounded-full bg-violet-200 px-3 py-1 text-xs font-medium text-violet-800">
                Suggested
              </span>
            </div>
            <div>
              <button
                type="submit"
                className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
              >
                Start
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {orderedCategories.length === 0 ? (
        <p className="rounded-2xl border border-violet-200 bg-white p-5 text-sm text-violet-900/70 shadow-sm">
          Your exercise library is empty. Refresh to seed the starter exercises.
        </p>
      ) : (
        orderedCategories.map((cat) => (
          <section key={cat} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-violet-900">
                {EXERCISE_CATEGORY_LABELS[cat]}
              </h2>
              <span className="text-xs text-violet-900/60">
                {byCategory.get(cat)?.length ?? 0} exercises
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(byCategory.get(cat) ?? []).map((e) => (
                <ExerciseCard key={e.id} exercise={e} />
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  );
}
