import Link from 'next/link';
import {
  formatDurationCompact,
  formatDeltaPercent,
} from '@/lib/services/weeklySummary';
import type { WeeklySummary } from '@/lib/types';

interface SummaryViewProps {
  summary: WeeklySummary;
  // e.g. "pose" / "poses" or "exercise" / "exercises".
  unit: string;
  unitPlural: string;
  // Where the empty-state CTA points (the discipline home).
  homeHref: string;
  ctaLabel: string;
}

// Presentational weekly-summary used by the yoga and gym summary pages. Mirrors
// the ballet summary page (app/summary/page.tsx) but renders subjects as plain
// text (no per-subject detail route) and omits "mastered this week" — asanas
// and exercises don't record a mastery timestamp.
export function SummaryView({ summary, unitPlural, homeHref, ctaLabel }: SummaryViewProps) {
  const practicedLabel = `${unitPlural.charAt(0).toUpperCase()}${unitPlural.slice(1)} practiced`;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Weekly summary</h1>
        <p className="text-sm text-violet-900/60">Rolling last 7 days.</p>
      </header>

      {!summary.hasAnyActivity ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-violet-950">No practice this week yet.</p>
          <p className="max-w-sm text-violet-900/70">
            Finish a session and your weekly summary will fill in here.
          </p>
          <Link
            href={homeHref}
            className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            {ctaLabel}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Practice time"
              value={formatDurationCompact(summary.practiceTimeSec)}
              delta={
                summary.hasPriorBaseline
                  ? formatDeltaPercent(summary.practiceTimeSec, summary.practiceTimeSecPrior)
                  : null
              }
            />
            <StatTile
              label="Sessions"
              value={String(summary.sessionsCount)}
              delta={
                summary.hasPriorBaseline
                  ? formatDeltaPercent(summary.sessionsCount, summary.sessionsCountPrior)
                  : null
              }
            />
            <StatTile label={practicedLabel} value={String(summary.skillsPracticedCount)} />
            <StatTile label="Milestones" value={String(summary.milestonesCount)} />
          </div>

          {summary.mostPracticed ? (
            <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-violet-900/60">
                Most practiced
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {summary.mostPracticed.skillName}
              </p>
              <p className="mt-1 text-sm text-violet-900/70">
                {formatDurationCompact(summary.mostPracticed.totalSec)} this week
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-violet-900/60">
              {practicedLabel.replace('practiced', 'improved')}
            </p>
            {!summary.hasPriorBaseline ? (
              <p className="mt-2 text-sm text-violet-900/70">
                Building your baseline — improvement compares this week to last week.
              </p>
            ) : summary.improvedSkills.length === 0 ? (
              <p className="mt-2 text-sm text-violet-900/70">
                No improvements yet — keep stacking attempts.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {summary.improvedSkills.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-violet-100 py-3 last:border-b-0"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-violet-900/70">
                      {s.priorAvg.toFixed(1)} → {s.currentAvg.toFixed(1)}{' '}
                      <span className="text-violet-700">
                        (+{(s.currentAvg - s.priorAvg).toFixed(1)})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-violet-900/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {delta ? (
        <p
          className={`mt-1 text-xs font-medium ${
            delta.startsWith('+')
              ? 'text-emerald-700'
              : delta.startsWith('-')
                ? 'text-rose-700'
                : 'text-violet-900/60'
          }`}
        >
          {delta} vs prior week
        </p>
      ) : null}
    </div>
  );
}
