import Link from 'next/link';

export type DayBucket = { totalSec: number; count: number };

type Props = {
  year: number;
  monthIdx: number;
  todayYmd: string;
  selectedYmd: string | null;
  byYmd: Map<string, DayBucket>;
  prevHref: string;
  nextHref: string;
  todayHref: string | null;
  hrefForDay: (ymd: string) => string;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function dotSizeClass(totalSec: number): string | null {
  if (totalSec <= 0) return null;
  const minutes = totalSec / 60;
  if (minutes < 15) return 'h-1.5 w-1.5 bg-violet-400';
  if (minutes < 30) return 'h-2.5 w-2.5 bg-violet-500';
  return 'h-3.5 w-3.5 bg-violet-600';
}

export function MonthCalendar({
  year,
  monthIdx,
  todayYmd,
  selectedYmd,
  byYmd,
  prevHref,
  nextHref,
  todayHref,
  hrefForDay,
}: Props) {
  const firstWeekday = new Date(Date.UTC(year, monthIdx, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  const monthLabel = `${MONTH_LABELS[monthIdx]} ${year}`;

  return (
    <section
      aria-label="Practice calendar"
      className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href={prevHref}
          aria-label="Previous month"
          className="rounded-full px-2 py-1 text-violet-700 transition hover:bg-violet-50"
        >
          ‹
        </Link>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-violet-950">
            {monthLabel}
          </h2>
          {todayHref && (
            <Link
              href={todayHref}
              className="rounded-full border border-violet-200 px-2 py-0.5 text-[10px] font-medium text-violet-700 transition hover:border-violet-400"
            >
              Today
            </Link>
          )}
        </div>
        <Link
          href={nextHref}
          aria-label="Next month"
          className="rounded-full px-2 py-1 text-violet-700 transition hover:bg-violet-50"
        >
          ›
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-violet-900/50">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} aria-hidden>
            {label}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ymd = `${year}-${pad2(monthIdx + 1)}-${pad2(day)}`;
          const bucket = byYmd.get(ymd);
          const dot = bucket ? dotSizeClass(bucket.totalSec) : null;
          const isToday = ymd === todayYmd;
          const isSelected = ymd === selectedYmd;

          const cell = (
            <div
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition ${
                isSelected
                  ? 'bg-violet-600 text-white'
                  : isToday
                    ? 'ring-1 ring-violet-300 text-violet-950'
                    : 'text-violet-900/80 hover:bg-violet-50'
              }`}
            >
              <span className="leading-none">{day}</span>
              <span
                aria-hidden
                className={`mt-1 rounded-full ${
                  dot ? (isSelected ? 'h-1.5 w-1.5 bg-white' : dot) : 'h-1.5 w-1.5 bg-transparent'
                }`}
              />
            </div>
          );

          const a11yLabel = bucket
            ? `${MONTH_LABELS[monthIdx]} ${day}, ${bucket.count} ${bucket.count === 1 ? 'session' : 'sessions'}`
            : `${MONTH_LABELS[monthIdx]} ${day}, no practice`;

          return (
            <Link
              key={ymd}
              href={hrefForDay(ymd)}
              aria-label={a11yLabel}
              aria-current={isSelected ? 'date' : undefined}
            >
              {cell}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
