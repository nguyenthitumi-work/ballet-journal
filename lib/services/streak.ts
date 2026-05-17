export function formatLocalDate(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

function addDays(localDate: string, delta: number): string {
  const [y, m, d] = localDate.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const shifted = new Date(utc + delta * 86_400_000);
  const yy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function computeNewStreak(args: {
  currentStreak: number;
  lastPracticeDate: string | null;
  todayLocal: string;
}): { newStreak: number; updatedLastPracticeDate: string } {
  const { currentStreak, lastPracticeDate, todayLocal } = args;

  if (lastPracticeDate === null) {
    return { newStreak: 1, updatedLastPracticeDate: todayLocal };
  }

  if (lastPracticeDate === todayLocal) {
    return { newStreak: currentStreak, updatedLastPracticeDate: todayLocal };
  }

  const yesterday = addDays(todayLocal, -1);
  if (lastPracticeDate === yesterday) {
    return { newStreak: currentStreak + 1, updatedLastPracticeDate: todayLocal };
  }

  if (lastPracticeDate > todayLocal) {
    return { newStreak: currentStreak, updatedLastPracticeDate: lastPracticeDate };
  }

  return { newStreak: 1, updatedLastPracticeDate: todayLocal };
}
