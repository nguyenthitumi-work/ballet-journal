import type { GenericBadgeStatus } from '@/lib/services/genericBadges';

// Presentational badge grid for yoga and gym. Mirrors the ballet badges page
// (app/badges/page.tsx) but takes the discipline-agnostic GenericBadgeStatus.
export function BadgesView({ badges }: { badges: GenericBadgeStatus[] }) {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-violet-900">Badges</h1>
        <p className="text-sm text-violet-900/70">
          {earnedCount} of {badges.length} earned. Keep going.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {badges.map((b) => (
          <BadgeCard key={b.badge.id} status={b} />
        ))}
      </ul>
    </section>
  );
}

function BadgeCard({ status }: { status: GenericBadgeStatus }) {
  const { badge, earned, progress } = status;
  return (
    <li
      aria-label={
        earned
          ? `${badge.name} — earned`
          : progress
            ? `${badge.name} — ${progress.current} of ${progress.target}`
            : `${badge.name} — not yet earned`
      }
      className={`flex items-start gap-3 rounded-2xl border p-4 shadow-sm transition ${
        earned ? 'border-violet-300 bg-white' : 'border-violet-100 bg-violet-50/40'
      }`}
    >
      <span aria-hidden className={`text-3xl ${earned ? '' : 'opacity-30 grayscale'}`}>
        {badge.emoji}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={`text-base font-semibold tracking-tight ${
              earned ? 'text-violet-900' : 'text-violet-900/60'
            }`}
          >
            {badge.name}
          </h2>
          {earned ? (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700">
              Earned
            </span>
          ) : null}
        </div>
        <p className={`text-sm ${earned ? 'text-violet-900/80' : 'text-violet-900/60'}`}>
          {badge.description}
        </p>
        {!earned && progress ? (
          <p className="text-xs tabular-nums text-violet-900/60">
            {progress.current} / {progress.target}
          </p>
        ) : null}
      </div>
    </li>
  );
}
