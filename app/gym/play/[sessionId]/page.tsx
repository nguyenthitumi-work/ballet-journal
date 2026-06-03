import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getSession } from '@/lib/db/sessions';
import { getWorkout } from '@/lib/db/workouts';
import { listExercises } from '@/lib/db/exercises';
import GymLogger, { type LoggerExercise } from '../../_components/GymLogger';

const CARD_CLASS = 'rounded-2xl border border-violet-200 bg-white p-6 shadow-sm';

export default async function GymPlayPage(props: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await props.params;
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const session = await getSession(userId, sessionId);
  if (session === null || session.discipline !== 'gym') {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">We couldn&apos;t find that workout session.</h1>
        </div>
        <Link href="/gym/workouts" className="text-sm text-violet-700 hover:underline">
          ← Back to workouts
        </Link>
      </section>
    );
  }

  if (session.endedAt !== null) {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">This session is finished.</h1>
          <p className="mt-2 text-violet-900/70">Nice work — it&apos;s saved to your history.</p>
        </div>
        <Link
          href="/history"
          className="rounded-full bg-violet-600 px-6 py-3 text-center font-medium text-white hover:bg-violet-700"
        >
          View history
        </Link>
      </section>
    );
  }

  const workout = session.workoutId ? await getWorkout(userId, session.workoutId) : null;
  if (workout === null) {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">Workout not found.</h1>
        </div>
        <Link href="/gym/workouts" className="text-sm text-violet-700 hover:underline">
          ← Back to workouts
        </Link>
      </section>
    );
  }

  const exercises = await listExercises(userId);
  const byId = new Map(exercises.map((e) => [e.id, e]));

  const plan: LoggerExercise[] = workout.exercises
    .map((w): LoggerExercise | null => {
      const ex = byId.get(w.exerciseId);
      if (!ex) return null;
      return {
        exerciseId: w.exerciseId,
        name: ex.name,
        primaryMuscles: ex.primaryMuscles,
        cues: ex.cues,
        sets: w.sets,
        targetReps: w.targetReps,
        targetWeight: w.targetWeight,
        restSeconds: w.restSeconds,
      };
    })
    .filter((e): e is LoggerExercise => e !== null);

  if (plan.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">This workout has no exercises.</h1>
        </div>
        <Link href="/gym/workouts" className="text-sm text-violet-700 hover:underline">
          ← Back to workouts
        </Link>
      </section>
    );
  }

  return <GymLogger sessionId={sessionId} workoutName={workout.name} exercises={plan} />;
}
