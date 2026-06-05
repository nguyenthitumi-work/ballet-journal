import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getDisciplineState } from '@/lib/db/disciplineProfile';
import {
  countCompletedSessions,
  countDistinctSubjectsPracticed,
  hasMilestoneForDiscipline,
} from '@/lib/db/disciplineStats';
import { listSubjectCatalog, SUBJECT_CONFIG } from '@/lib/services/disciplineSubject';
import { computeGenericBadges } from '@/lib/services/genericBadges';
import { BadgesView } from '@/components/badges/BadgesView';

export default async function YogaBadgesPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const [state, catalog, completedSessions, distinct, hasMilestone] = await Promise.all([
    getDisciplineState(userId, 'yoga'),
    listSubjectCatalog(userId, 'yoga'),
    countCompletedSessions(userId, 'yoga'),
    countDistinctSubjectsPracticed(userId, 'yoga'),
    hasMilestoneForDiscipline(userId, 'yoga'),
  ]);

  const badges = computeGenericBadges({
    streak: state.streak,
    completedSessions,
    distinctSubjectsPracticed: distinct,
    masteredCount: catalog.filter((c) => c.progressStatus === 'mastered').length,
    totalSubjects: catalog.length,
    hasMilestone,
    unit: SUBJECT_CONFIG.yoga.unit,
    unitPlural: SUBJECT_CONFIG.yoga.unitPlural,
  });

  return <BadgesView badges={badges} />;
}
