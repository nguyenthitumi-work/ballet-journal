import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import {
  getWeeklySummary,
  formatDurationCompact,
  formatDeltaPercent,
} from '@/lib/services/weeklySummary';

export default async function SummaryPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const summary = await getWeeklySummary(userId, new Date());

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Weekly summary</h1>
        <p className="text-sm text-violet-900/60">Rolling last 7 days.</p>
      </header>

      {!summary.hasAnyActivity ? (
        <EmptyWeek />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Practice time"
              value={formatDurationCompact(summary.practiceTimeSec)}
              delta={
                summary.hasPriorBaseline
                  ? formatDeltaPercent(
                      summary.practiceTimeSec,
                      summary.practiceTimeSecPrior,
                    )
                  : null
              }
            />
            <StatTile
              label="Sessions"
              value={String(summary.sessionsCount)}
              delta={
                summary.hasPriorBaseline
                  ? formatDeltaPercent(
                      summary.sessionsCount,
                      summary.sessionsCountPrior,
                    )
                  : null
              }
            />
            <StatTile
              label="Skills practiced"
              value={String(summary.skillsPracticedCount)}
            />
            <StatTile
              label="Milestones"
              value={String(summary.milestonesCount)}
            />
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
              <Link
                href={`/skills/${summary.mostPracticed.skillId}`}
                className="mt-3 inline-flex text-sm font-medium text-violet-700 hover:text-violet-900"
              >
                Open skill →
              </Link>
            </div>
          ) : null}

          <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-violet-900/60">
              Skills improved
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
                    <Link
                      href={`/skills/${s.id}`}
                      className="font-medium hover:text-violet-700"
                    >
                      {s.name}
                    </Link>
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

          <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-violet-900/60">
              Mastered this week
            </p>
            {summary.masteredSkills.length === 0 ? (
              <p className="mt-2 text-sm text-violet-900/70">
                Mark a skill as Mastered when it&apos;s ready — it&apos;ll show up here.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {summary.masteredSkills.map((s) => (
                  <li
                    key={s.id}
                    className="border-b border-violet-100 py-3 last:border-b-0"
                  >
                    <Link
                      href={`/skills/${s.id}`}
                      className="font-medium hover:text-violet-700"
                    >
                      {s.name}
                    </Link>
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
      <p className="text-xs font-medium uppercase tracking-wide text-violet-900/60">
        {label}
      </p>
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

function EmptyWeek() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-200 bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-medium text-violet-950">No practice this week yet.</p>
      <p className="max-w-sm text-violet-900/70">
        Finish a session and your weekly summary will fill in here.
      </p>
      <Link
        href="/practice"
        className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
      >
        Start practice
      </Link>
    </div>
  );
}
