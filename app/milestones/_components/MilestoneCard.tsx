'use client';

import Link from 'next/link';
import type { Rating, SkillAttempt } from '@/lib/types';
import { CATEGORY_LABELS, type CategoryId } from '@/lib/types';
import AttemptMedia from '@/app/skills/_components/AttemptMedia';

interface Props {
  attempt: SkillAttempt;
  skillName: string;
  categoryId: CategoryId;
  sessionDateYmd: string;
}

const TZ = 'America/Los_Angeles';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

function Stars({ rating }: { rating: Rating }) {
  return (
    <span aria-label={`${rating} of 5`} className="text-violet-600">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= rating ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

export function MilestoneCard({ attempt, skillName, categoryId, sessionDateYmd }: Props) {
  const dateLabel = formatDate(attempt.attemptedAt);
  const categoryLabel = CATEGORY_LABELS[categoryId];
  const sessionHref = `/history?date=${sessionDateYmd}#session-${attempt.sessionId}`;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-sm">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
            <span aria-hidden>⭐</span>
            Milestone
          </span>
          <Stars rating={attempt.rating} />
        </div>
        <h3 className="text-base font-semibold text-violet-950">{skillName}</h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-violet-900/60">
          <span>{dateLabel}</span>
          <span aria-hidden>·</span>
          <span>{categoryLabel}</span>
        </div>
      </header>

      {attempt.videoPath || attempt.photoPath ? (
        <AttemptMedia videoPath={attempt.videoPath} photoPath={attempt.photoPath} />
      ) : null}

      {attempt.notes && attempt.notes.trim() ? (
        <p className="text-sm italic text-violet-900/80">&ldquo;{attempt.notes}&rdquo;</p>
      ) : null}

      <Link
        href={sessionHref}
        className="self-start text-xs font-medium text-violet-700 hover:text-violet-900 hover:underline"
      >
        View session →
      </Link>
    </article>
  );
}
