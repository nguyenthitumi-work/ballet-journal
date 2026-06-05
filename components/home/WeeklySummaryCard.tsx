import Link from 'next/link';
import { formatDurationCompact } from '@/lib/services/weeklySummary';
import type { WeeklySummary } from '@/lib/types';

// "This week" recap card linking to the full summary page. Shared across
// discipline homes (mirrors the ballet home card in app/page.tsx); `href`
// points at the discipline's own summary route.
export function WeeklySummaryCard({
  summary,
  href,
}: {
  summary: WeeklySummary;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:border-violet-400"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-violet-900/70">This week</p>
        <p className="text-xs text-violet-900/60">View summary →</p>
      </div>
      {summary.hasAnyActivity ? (
        <div className="mt-2 grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-violet-900/60">Practice time</p>
            <p className="text-xl font-semibold tracking-tight">
              {formatDurationCompact(summary.practiceTimeSec)}
            </p>
          </div>
          <div>
            <p className="text-xs text-violet-900/60">Sessions</p>
            <p className="text-xl font-semibold tracking-tight">{summary.sessionsCount}</p>
          </div>
          <div>
            <p className="text-xs text-violet-900/60">Improved</p>
            <p className="text-xl font-semibold tracking-tight">
              {summary.improvedSkills.length}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-violet-900/70">
          No practice yet this week — finish a session to start your summary.
        </p>
      )}
    </Link>
  );
}
