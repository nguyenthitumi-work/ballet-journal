import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { ensureGymBootstrapped } from '@/lib/gym/bootstrap';
import { listExercises } from '@/lib/db/exercises';
import WorkoutBuilder, { type BuilderExercise } from '../_components/WorkoutBuilder';

export default async function NewWorkoutPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');
  await ensureGymBootstrapped(userId);

  const exercises = await listExercises(userId);
  const builderExercises: BuilderExercise[] = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    defaultSets: e.defaultSets,
    defaultReps: e.defaultReps,
    defaultRestSeconds: e.defaultRestSeconds,
  }));

  return <WorkoutBuilder exercises={builderExercises} />;
}
