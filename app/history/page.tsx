import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import {
  listSessions,
  listAttemptsForSession,
  listSessionDaysInMonth,
} from '@/lib/db/sessions';
import { listSkills } from '@/lib/db/skills';
import { listAsanas } from '@/lib/db/asanas';
import { listExercises } from '@/lib/db/exercises';
import { getNotesForSession } from '@/lib/db/notes';
import { getProfile } from '@/lib/db/profile';
import { getAuthUserId } from '@/lib/auth';
import { getViewedDancerId } from '@/lib/viewContext';
import type { Skill, SkillAttempt, PracticeNote } from '@/lib/types';
import { StreakBanner } from './_components/StreakBanner';
import { SessionCard } from './_components/SessionCard';
import { MonthCalendar, type DayBucket } from './_components/MonthCalendar';

interface HistoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TZ = 'America/Los_Angeles';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function ymdInTz(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${y}-${m}-${day}`;
}

function buildHref(params: {
  month?: string | null;
  date?: string | null;
  milestones?: boolean;
}): string {
  const sp = new URLSearchParams();
  if (params.month) sp.set('month', params.month);
  if (params.date) sp.set('date', params.date);
  if (params.milestones) sp.set('milestones', '1');
  const s = sp.toString();
  return s ? `/history?${s}` : '/history';
}

function shiftMonth(year: number, monthIdx: number, delta: number): { year: number; monthIdx: number } {
  const total = year * 12 + monthIdx + delta;
  return { year: Math.floor(total / 12), monthIdx: ((total % 12) + 12) % 12 };
}

function monthKey(year: number, monthIdx: number): string {
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
}

export default async function HistoryPage(props: HistoryPageProps) {
  const { profile, onboarded } = await getSessionContext();

  if (!onboarded) {
    redirect('/onboarding');
  }

  const authUserId = await getAuthUserId();
  const viewedDancerId = await getViewedDancerId();
  const canAddNotes = authUserId !== viewedDancerId;

  const sp = await props.searchParams;
  const milestonesOnly = firstParam(sp.milestones) === '1';
  const dateParam = firstParam(sp.date);
  const monthParam = firstParam(sp.month);

  const now = new Date();
  const todayYmd = ymdInTz(now, TZ);
  const todayParts = todayYmd.split('-').map(Number);
  const currentYear = todayParts[0];
  const currentMonthIdx = todayParts[1] - 1;

  let calendarYear = currentYear;
  let calendarMonthIdx = currentMonthIdx;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [yy, mm] = monthParam.split('-').map(Number);
    if (mm >= 1 && mm <= 12) {
      calendarYear = yy;
      calendarMonthIdx = mm - 1;
    }
  } else if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const [yy, mm] = dateParam.split('-').map(Number);
    if (mm >= 1 && mm <= 12) {
      calendarYear = yy;
      calendarMonthIdx = mm - 1;
    }
  }

  const selectedYmd =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null;

  const [sessions, skills, asanas, exercises, monthDays] = await Promise.all([
    listSessions(viewedDancerId),
    listSkills(viewedDancerId),
    listAsanas(viewedDancerId),
    listExercises(viewedDancerId),
    listSessionDaysInMonth(viewedDancerId, calendarYear, calendarMonthIdx),
  ]);
  const asanasById = new Map(asanas.map((a) => [a.id, { name: a.name }]));
  const exercisesById = new Map(exercises.map((e) => [e.id, { name: e.name }]));

  // PERF: per-session attempt fetch in parallel (N round-trips). Acceptable for v1
  // (few sessions). When this grows, replace with a single `skill_attempt` query
  // filtered by `session_id in (...)` grouped client-side.
  const [attemptsData, notesData] = await Promise.all([
    Promise.all(
      sessions.map(
        async (s): Promise<[string, SkillAttempt[]]> => [
          s.id,
          await listAttemptsForSession(s.id),
        ],
      ),
    ),
    Promise.all(
      sessions.map(
        async (s): Promise<[string, PracticeNote[]]> => [
          s.id,
          await getNotesForSession(s.id),
        ],
      ),
    ),
  ]);

  const attemptsBySession: Map<string, SkillAttempt[]> = new Map(attemptsData);
  const notesBySession: Map<string, PracticeNote[]> = new Map(notesData);

  const allAuthorIds = new Set<string>();
  for (const notes of notesBySession.values()) {
    for (const note of notes) {
      allAuthorIds.add(note.authorUserId);
    }
  }
  const authorNames: Record<string, string> = {};
  await Promise.all(
    Array.from(allAuthorIds).map(async (id) => {
      const p = await getProfile(id);
      authorNames[id] = p?.name || 'Unknown';
    }),
  );

  const skillsById: Map<string, Skill> = new Map(skills.map((s) => [s.id, s]));

  const byYmd: Map<string, DayBucket> = new Map();
  for (const row of monthDays) {
    const ymd = ymdInTz(new Date(row.startedAt), TZ);
    const existing = byYmd.get(ymd) ?? { totalSec: 0, count: 0 };
    existing.count += 1;
    existing.totalSec += row.durationSeconds ?? 0;
    byYmd.set(ymd, existing);
  }

  // When milestonesOnly is on: keep only sessions that have at least one milestone
  // attempt, and within those sessions show only the milestone attempts.
  let visibleSessions = milestonesOnly
    ? sessions.filter((s) =>
        (attemptsBySession.get(s.id) ?? []).some((a) => a.isMilestone),
      )
    : sessions;
  if (selectedYmd) {
    visibleSessions = visibleSessions.filter(
      (s) => ymdInTz(new Date(s.startedAt), TZ) === selectedYmd,
    );
  }
  const visibleAttemptsFor = (sessionId: string): SkillAttempt[] => {
    const all = attemptsBySession.get(sessionId) ?? [];
    return milestonesOnly ? all.filter((a) => a.isMilestone) : all;
  };

  const prev = shiftMonth(calendarYear, calendarMonthIdx, -1);
  const next = shiftMonth(calendarYear, calendarMonthIdx, 1);
  const isCurrentMonth =
    calendarYear === currentYear && calendarMonthIdx === currentMonthIdx;

  const prevHref = buildHref({
    month: monthKey(prev.year, prev.monthIdx),
    milestones: milestonesOnly,
  });
  const nextHref = buildHref({
    month: monthKey(next.year, next.monthIdx),
    milestones: milestonesOnly,
  });
  const todayHref = isCurrentMonth
    ? null
    : buildHref({ milestones: milestonesOnly });
  const hrefForDay = (ymd: string) =>
    buildHref({
      month: monthKey(calendarYear, calendarMonthIdx),
      date: ymd === selectedYmd ? null : ymd,
      milestones: milestonesOnly,
    });

  const selectedChipLabel = selectedYmd
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: TZ,
        month: 'short',
        day: 'numeric',
      }).format(new Date(`${selectedYmd}T12:00:00Z`))
    : null;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-violet-900/60">Every practice, big or small.</p>
      </header>

      <StreakBanner profile={profile} />

      <MonthCalendar
        year={calendarYear}
        monthIdx={calendarMonthIdx}
        todayYmd={todayYmd}
        selectedYmd={selectedYmd}
        byYmd={byYmd}
        prevHref={prevHref}
        nextHref={nextHref}
        todayHref={todayHref}
        hrefForDay={hrefForDay}
      />

      <nav aria-label="Filter history" className="flex flex-wrap gap-2">
        <FilterChip
          href={buildHref({
            month: isCurrentMonth ? null : monthKey(calendarYear, calendarMonthIdx),
          })}
          label="All"
          active={!milestonesOnly && !selectedYmd}
        />
        <FilterChip
          href={buildHref({
            month: isCurrentMonth ? null : monthKey(calendarYear, calendarMonthIdx),
            date: selectedYmd,
            milestones: true,
          })}
          label="⭐ Milestones"
          active={milestonesOnly}
        />
        {selectedChipLabel && (
          <Link
            href={buildHref({
              month: isCurrentMonth ? null : monthKey(calendarYear, calendarMonthIdx),
              milestones: milestonesOnly,
            })}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white shadow-sm"
          >
            <span aria-hidden>📅</span>
            {selectedChipLabel}
            <span aria-hidden className="text-white/80">✕</span>
          </Link>
        )}
      </nav>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-violet-950">No practices yet.</p>
          <p className="max-w-sm text-violet-900/70">
            Your first session will show up here as soon as you finish it.
          </p>
          <Link
            href="/practice"
            className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            Start practice
          </Link>
        </div>
      ) : visibleSessions.length === 0 ? (
        <p className="rounded-2xl border border-violet-200 bg-white p-5 text-sm text-violet-900/70 shadow-sm">
          {selectedYmd
            ? 'No practice on this day.'
            : 'No milestones yet. Tap the ⭐ box during practice to mark one.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleSessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              attempts={visibleAttemptsFor(s.id)}
              skillsById={skillsById}
              asanasById={asanasById}
              exercisesById={exercisesById}
              notes={notesBySession.get(s.id) ?? []}
              canAddNotes={canAddNotes}
              authorNames={authorNames}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-violet-600 text-white shadow-sm'
          : 'border border-violet-200 bg-white text-violet-700 hover:border-violet-400'
      }`}
    >
      {label}
    </Link>
  );
}
