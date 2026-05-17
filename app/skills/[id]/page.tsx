import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getSkill, listCategories } from '@/lib/db/skills';
import { CATEGORY_LABELS } from '@/lib/types';
import { DifficultyBadge } from '../_components/Difficulty';
import { FocusToggle } from '../_components/FocusToggle';
import { humanizeLastAttempted } from '../_components/lastAttempted';
import { PronounceButton } from '../_components/PronounceButton';
import { ReferenceVideo } from '../_components/ReferenceVideo';

const SECONDS_PER_MINUTE = 60;

interface SkillDetailPageProps {
  params: Promise<{ id: string }>;
}

function humanizeDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return 'a moment';
  if (totalSeconds < SECONDS_PER_MINUTE) {
    return `about ${totalSeconds} seconds`;
  }
  const minutes = Math.round(totalSeconds / SECONDS_PER_MINUTE);
  return `about ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

export default async function SkillDetailPage(props: SkillDetailPageProps) {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const { id } = await props.params;
  const [skill, categories] = await Promise.all([
    getSkill(userId, id),
    listCategories(),
  ]);

  if (!skill) {
    return (
      <section className="flex flex-col items-center gap-4 py-12 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-violet-900">
          Skill not found
        </h1>
        <p className="text-sm text-violet-900/70">
          We couldn’t find that one. Maybe it tiptoed away.
        </p>
        <Link
          href="/skills"
          className="rounded-full bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700"
        >
          Back to skills
        </Link>
      </section>
    );
  }

  const category = categories.find((c) => c.id === skill.categoryId);
  const categoryLabel = CATEGORY_LABELS[skill.categoryId] ?? category?.name ?? skill.categoryId;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link
          href="/skills"
          className="inline-flex items-center text-sm text-violet-700 hover:text-violet-900"
        >
          <span aria-hidden className="mr-1">←</span>
          All skills
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700"
          >
            {category?.brandColorHex ? (
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: category.brandColorHex }}
              />
            ) : null}
            {categoryLabel}
          </span>
          {skill.isCurrentlyWorkingOn ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700"
              aria-label="You're working on this"
            >
              <span aria-hidden>♥</span>
              Working on this
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-violet-900">{skill.name}</h1>
          <PronounceButton text={skill.name} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-violet-900/70">
          <DifficultyBadge value={skill.difficulty} size="md" />
          <span aria-hidden>·</span>
          <span>{humanizeDuration(skill.defaultDurationSeconds)}</span>
        </div>
      </header>

      <FocusToggle skillId={skill.id} initial={skill.isCurrentlyWorkingOn} />

      <ReferenceVideo
        skillId={skill.id}
        skillName={skill.name}
        referenceUrl={skill.referenceUrl}
      />

      {skill.trains.length > 0 ? (
        <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-violet-900/70">Trains</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {skill.trains.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {skill.description ? (
        <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-violet-900/70">About</h2>
          <p className="mt-2 text-violet-950">{skill.description}</p>
        </div>
      ) : null}

      {skill.techniqueTips.length > 0 ? (
        <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-violet-900/70">Technique tips</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-violet-950">
            {skill.techniqueTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium text-violet-900/70">Last tried</h2>
        <p className="mt-1 text-violet-950">{humanizeLastAttempted(skill.lastAttemptedAt)}</p>
      </div>
    </section>
  );
}
