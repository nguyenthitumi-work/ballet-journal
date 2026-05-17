const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_RECENT_THRESHOLD = 7;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Convert a Date (or ISO date string) to a child-friendly relative time string.
 *
 *   null            -> "Never tried yet"
 *   today           -> "Today"
 *   yesterday       -> "Yesterday"
 *   2..6 days ago   -> "{N} days ago"
 *   older           -> short date, e.g. "Mar 4"
 */
export function humanizeLastAttempted(input: Date | string | null): string {
  if (!input) return 'Never tried yet';

  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return 'Never tried yet';

  const now = new Date();
  const days = Math.floor((startOfDay(now) - startOfDay(d)) / MS_PER_DAY);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < DAYS_RECENT_THRESHOLD) return `${days} days ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
