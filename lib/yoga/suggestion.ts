import type { DayOfWeek } from '@/lib/services/suggestion';
import type { YogaFlow, YogaStyle } from './types';

// A gentle per-weekday style preference, echoing the ballet app's soft daily
// themes. Energizing styles early in the week, restorative toward the weekend.
const DAY_STYLE: Record<DayOfWeek, YogaStyle> = {
  0: 'restorative', // Sun
  1: 'wakeup', // Mon
  2: 'vinyasa', // Tue
  3: 'power', // Wed
  4: 'hatha', // Thu
  5: 'vinyasa', // Fri
  6: 'yin', // Sat
};

/**
 * Pick a suggested flow for today. Prefers a flow whose style matches the
 * weekday theme; otherwise rotates deterministically so the suggestion still
 * varies day to day. Returns null only when the user has no flows.
 */
export function pickTodaysFlow(flows: YogaFlow[], dayOfWeek: DayOfWeek): YogaFlow | null {
  if (flows.length === 0) return null;
  const preferred = DAY_STYLE[dayOfWeek];
  const match = flows.filter((f) => f.style === preferred);
  if (match.length > 0) {
    return match[dayOfWeek % match.length];
  }
  return flows[dayOfWeek % flows.length];
}
