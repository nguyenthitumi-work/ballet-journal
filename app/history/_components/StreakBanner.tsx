type Props = {
  streak: number;
};

function getStreakMessage(streak: number): string {
  if (streak <= 0) return 'Ready when you are.';
  if (streak === 1) return 'Day 1 — nice start!';
  if (streak < 7) return `${streak} days in a row — keep it warm.`;
  return `${streak}-day streak! 🌟`;
}

export function StreakBanner({ streak: streakInput }: Props) {
  const streak = streakInput ?? 0;
  const message = getStreakMessage(streak);

  return (
    <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-100 to-violet-50 p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-violet-900/60">Streak</p>
      <p className="mt-1 text-5xl font-semibold tracking-tight text-violet-950">
        {streak}{' '}
        <span className="text-2xl font-medium text-violet-900/70">
          {streak === 1 ? 'day' : 'days'}
        </span>
      </p>
      <p className="mt-2 text-violet-900/80">{message}</p>
    </section>
  );
}
