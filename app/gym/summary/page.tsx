import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getWeeklySummary } from '@/lib/services/weeklySummary';
import { SUBJECT_CONFIG } from '@/lib/services/disciplineSubject';
import { SummaryView } from '@/components/summary/SummaryView';

export default async function GymSummaryPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const summary = await getWeeklySummary(userId, new Date(), 'gym');

  return (
    <SummaryView
      summary={summary}
      unit={SUBJECT_CONFIG.gym.unit}
      unitPlural={SUBJECT_CONFIG.gym.unitPlural}
      homeHref="/gym"
      ctaLabel="Browse workouts"
    />
  );
}
