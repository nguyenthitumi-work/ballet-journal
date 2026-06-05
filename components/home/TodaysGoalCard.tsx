// Daily-goal progress card shared across discipline home pages. Mirrors the
// ballet home's "Today's goal" card (app/page.tsx). `unit`/`unitPlural` let it
// read naturally per discipline ("skills" / "poses" / "exercises").

interface TodaysGoalCardProps {
  todaysCount: number;
  goal: number;
  unit: string;
  unitPlural: string;
}

export function TodaysGoalCard({ todaysCount, goal, unit, unitPlural }: TodaysGoalCardProps) {
  const goalMet = todaysCount >= goal;
  const remaining = goal - todaysCount;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-violet-900/70">Today&apos;s goal</p>
        <p className="text-xs text-violet-900/60">
          {Math.min(todaysCount, goal)} of {goal} {unitPlural}
        </p>
      </div>
      <ul
        className="mt-3 flex flex-wrap gap-2"
        aria-label={`${todaysCount} of ${goal} ${unitPlural} practiced today`}
      >
        {Array.from({ length: goal }, (_, i) => (
          <li
            key={i}
            aria-hidden
            className={`h-4 w-4 rounded-full ${
              i < todaysCount ? 'bg-violet-600' : 'border-2 border-violet-300'
            }`}
          />
        ))}
      </ul>
      <p className="mt-3 text-sm text-violet-900/70">
        {goalMet
          ? todaysCount > goal
            ? `Goal met — ${todaysCount} ${unitPlural} today. ⭐`
            : 'Goal met for today. ⭐'
          : `Practice ${remaining} more ${remaining === 1 ? unit : unitPlural} to hit today’s goal.`}
      </p>
    </div>
  );
}
