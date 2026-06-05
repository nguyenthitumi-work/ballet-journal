import Link from 'next/link';
import AttemptMedia from '@/app/skills/_components/AttemptMedia';
import type { Rating, SkillAttempt } from '@/lib/types';

const TZ = 'America/Los_Angeles';

function ymdInTz(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${y}-${m}-${day}`;
}

function monthKeyInTz(d: Date, timeZone: string): string {
  return ymdInTz(d, timeZone).slice(0, 7);
}

function formatMonthHeading(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, 15)));
}

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

interface MilestonesViewProps {
  attempts: SkillAttempt[];
  // Resolves a subject id (asana/exercise) to its display name.
  nameById: Map<string, string>;
  // Which attempt column holds this discipline's subject id.
  subjectKey: 'asanaId' | 'exerciseId';
  // Discipline home, for the empty-state CTA.
  homeHref: string;
  ctaLabel: string;
}

// Presentational Milestones list for yoga and gym. Mirrors the ballet
// milestones page (app/milestones/page.tsx) — month-grouped breakthrough
// cards — but is self-contained: no ballet category labels, subjects resolved
// via nameById.
export function MilestonesView({
  attempts,
  nameById,
  subjectKey,
  homeHref,
  ctaLabel,
}: MilestonesViewProps) {
  const visible = attempts.filter((a) => {
    const id = a[subjectKey];
    return id !== null && nameById.has(id);
  });
  const totalLabel = `${visible.length} ${visible.length === 1 ? 'milestone' : 'milestones'}`;

  const groups: { monthKey: string; items: SkillAttempt[] }[] = [];
  for (const a of visible) {
    const key = monthKeyInTz(new Date(a.attemptedAt), TZ);
    const last = groups[groups.length - 1];
    if (last && last.monthKey === key) last.items.push(a);
    else groups.push({ monthKey: key, items: [a] });
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Milestones</h1>
        <p className="text-sm text-violet-900/60">
          Every breakthrough, in order. {visible.length > 0 ? totalLabel : ''}
        </p>
      </header>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-violet-950">No milestones yet.</p>
          <p className="max-w-sm text-violet-900/70">
            During a session, tap the ⭐ box on any attempt to mark a breakthrough.
          </p>
          <Link
            href={homeHref}
            className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            {ctaLabel}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <div key={g.monthKey} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-violet-900/60">
                {formatMonthHeading(g.monthKey)}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {g.items.map((a) => (
                  <article
                    key={a.id}
                    className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-sm"
                  >
                    <header className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
                          <span aria-hidden>⭐</span>
                          Milestone
                        </span>
                        <Stars rating={a.rating} />
                      </div>
                      <h3 className="text-base font-semibold text-violet-950">
                        {nameById.get(a[subjectKey] as string)}
                      </h3>
                      <div className="text-xs text-violet-900/60">{formatDate(a.attemptedAt)}</div>
                    </header>

                    {a.videoPath || a.photoPath ? (
                      <AttemptMedia videoPath={a.videoPath} photoPath={a.photoPath} />
                    ) : null}

                    {a.notes && a.notes.trim() ? (
                      <p className="text-sm italic text-violet-900/80">&ldquo;{a.notes}&rdquo;</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
