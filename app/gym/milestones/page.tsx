import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listMilestoneAttempts } from '@/lib/db/milestones';
import { listSubjectCatalog } from '@/lib/services/disciplineSubject';
import { MilestonesView } from '@/components/milestones/MilestonesView';

export default async function GymMilestonesPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const [attempts, catalog] = await Promise.all([
    listMilestoneAttempts(userId, 'gym'),
    listSubjectCatalog(userId, 'gym'),
  ]);
  const nameById = new Map(catalog.map((c) => [c.id, c.name]));

  return (
    <MilestonesView
      attempts={attempts}
      nameById={nameById}
      subjectKey="exerciseId"
      homeHref="/gym"
      ctaLabel="Browse workouts"
    />
  );
}
