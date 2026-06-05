import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getWeeklySummary } from '@/lib/services/weeklySummary';
import { SUBJECT_CONFIG } from '@/lib/services/disciplineSubject';
import { SummaryView } from '@/components/summary/SummaryView';

export default async function YogaSummaryPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const summary = await getWeeklySummary(userId, new Date(), 'yoga');

  return (
    <SummaryView
      summary={summary}
      unit={SUBJECT_CONFIG.yoga.unit}
      unitPlural={SUBJECT_CONFIG.yoga.unitPlural}
      homeHref="/yoga"
      ctaLabel="Browse flows"
    />
  );
}
