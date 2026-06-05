// Streak hero card shared across discipline home pages. Mirrors the ballet
// home's streak card (app/page.tsx) so yoga/gym match it visually.

function streakMessage(streak: number): string {
  if (streak <= 0) return "Press start whenever you're ready.";
  if (streak < 7) return `${streak}-day streak — nice.`;
  return `${streak}-day streak. ⭐`;
}

export function StreakCard({ streak }: { streak: number }) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-100 to-violet-50 p-6 shadow-sm">
      <p className="text-sm font-medium text-violet-900/70">Streak</p>
      <p className="mt-1 text-5xl font-semibold tracking-tight">
        {streak}
        <span className="ml-2 text-2xl font-medium text-violet-900/60">
          {streak === 1 ? 'day' : 'days'}
        </span>
      </p>
      <p className="mt-2 text-sm text-violet-900/70">{streakMessage(streak)}</p>
    </div>
  );
}
