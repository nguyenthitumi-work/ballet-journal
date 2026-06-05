import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listMilestoneAttempts } from '@/lib/db/milestones';
import { listSubjectCatalog } from '@/lib/services/disciplineSubject';
import { MilestonesView } from '@/components/milestones/MilestonesView';

export default async function YogaMilestonesPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const [attempts, catalog] = await Promise.all([
    listMilestoneAttempts(userId, 'yoga'),
    listSubjectCatalog(userId, 'yoga'),
  ]);
  const nameById = new Map(catalog.map((c) => [c.id, c.name]));

  return (
    <MilestonesView
      attempts={attempts}
      nameById={nameById}
      subjectKey="asanaId"
      homeHref="/yoga"
      ctaLabel="Browse flows"
    />
  );
}
