import type { Difficulty } from '@/lib/types';

const MAX_DIFFICULTY = 5;

const LABELS: Record<Difficulty, string> = {
  1: 'Beginner',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Advanced',
};

export function difficultyLabel(value: Difficulty): string {
  return LABELS[value];
}

export function DifficultyBadge({
  value,
  size = 'sm',
}: {
  value: Difficulty;
  size?: 'sm' | 'md';
}) {
  const filled = Math.max(0, Math.min(MAX_DIFFICULTY, value));
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < MAX_DIFFICULTY; i += 1) {
    dots.push(
      <span
        key={i}
        aria-hidden
        className={i < filled ? 'text-violet-600' : 'text-violet-200'}
      >
        ●
      </span>,
    );
  }
  const textCls = size === 'md' ? 'text-sm' : 'text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${textCls} text-violet-900/80`}
      aria-label={`Difficulty ${difficultyLabel(value)}, ${filled} of ${MAX_DIFFICULTY}`}
    >
      <span className="font-medium text-violet-900">{difficultyLabel(value)}</span>
      <span className="inline-flex gap-0.5 leading-none" aria-hidden>
        {dots}
      </span>
      <span className="text-violet-900/60" aria-hidden>
        {filled}/{MAX_DIFFICULTY}
      </span>
    </span>
  );
}
