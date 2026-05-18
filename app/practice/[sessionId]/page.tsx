import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import {
  getSession,
  listAttemptsForSession,
} from '@/lib/db/sessions';
import { getSkill } from '@/lib/db/skills';
import { CATEGORY_LABELS } from '@/lib/types';
import type { Skill } from '@/lib/types';
import PracticeLoop from '../_components/PracticeLoop';
import FinishSession from '../_components/FinishSession';

const CARD_CLASS = 'rounded-2xl border border-violet-200 bg-white p-6 shadow-sm';

export default async function PracticeSessionPage(props: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await props.params;
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) {
    redirect('/onboarding');
  }

  const session = await getSession(userId, sessionId);
  if (session === null) {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">We couldn&apos;t find that practice.</h1>
          <p className="mt-2 text-violet-900/70">It may have been deleted.</p>
        </div>
        <Link href="/practice" className="text-sm text-violet-700 hover:underline">
          ← Back to practice
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

  const skillOrder = session.orderedSkillIds;
  const attempts = await listAttemptsForSession(sessionId);
  const attemptedSet = new Set(attempts.map((a) => a.skillId));

  if (skillOrder.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">Nothing to practice yet.</h1>
          <p className="mt-2 text-violet-900/70">
            Add a few skills first, then come back to start a practice.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/skills"
            className="rounded-full bg-violet-600 px-6 py-3 text-center font-medium text-white hover:bg-violet-700"
          >
            Browse skills
          </Link>
          <FinishSession sessionId={sessionId} />
        </div>
      </section>
    );
  }

  const nextSkillId = skillOrder.find((id) => !attemptedSet.has(id)) ?? null;

  if (nextSkillId === null) {
    return (
      <section className="flex flex-col gap-6">
        <header>
          <p className="text-sm text-violet-900/60">All done!</p>
          <h1 className="text-3xl font-semibold tracking-tight">How did it feel?</h1>
        </header>
        <div className={CARD_CLASS}>
          <p className="text-violet-900/80">
            You finished {attempts.length} {attempts.length === 1 ? 'skill' : 'skills'}. Rate your
            mood and add any notes before wrapping up.
          </p>
        </div>
        <FinishSession sessionId={sessionId} />
      </section>
    );
  }

  const currentSkill = await getSkill(userId, nextSkillId);
  if (currentSkill === null) {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">Skill not found.</h1>
          <p className="mt-2 text-violet-900/70">
            We couldn&apos;t load the next skill. You can wrap up this session and try again.
          </p>
        </div>
        <FinishSession sessionId={sessionId} />
      </section>
    );
  }

  const remainingIds = skillOrder.filter((id) => !attemptedSet.has(id));
  const remainingSkills: { id: string; name: string }[] = [];
  for (const id of remainingIds) {
    if (id === currentSkill.id) continue;
    const s = await getSkill(userId, id);
    if (s) remainingSkills.push({ id: s.id, name: s.name });
  }

  return (
    <PracticeLoop
      key={currentSkill.id}
      userId={userId}
      sessionId={sessionId}
      currentSkill={serializeSkill(currentSkill)}
      remainingSkills={remainingSkills}
      attemptsCount={attempts.length}
      totalSkillsCount={skillOrder.length}
    />
  );
}

function serializeSkill(skill: Skill): {
  id: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  description: string | null;
  techniqueTips: string[];
  defaultDurationSeconds: number;
} {
  return {
    id: skill.id,
    name: skill.name,
    categoryId: skill.categoryId,
    categoryLabel: CATEGORY_LABELS[skill.categoryId],
    description: skill.description,
    techniqueTips: skill.techniqueTips,
    defaultDurationSeconds: skill.defaultDurationSeconds,
  };
}
