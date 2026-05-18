import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listSessions, listAttemptsForSession } from '@/lib/db/sessions';
import { listSkills } from '@/lib/db/skills';
import type { Skill, SkillAttempt } from '@/lib/types';
import { StreakBanner } from './_components/StreakBanner';
import { SessionCard } from './_components/SessionCard';

interface HistoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function HistoryPage(props: HistoryPageProps) {
  const { userId, profile, onboarded } = await getSessionContext();

  if (!onboarded) {
    redirect('/onboarding');
  }

  const sp = await props.searchParams;
  const milestonesOnly = firstParam(sp.milestones) === '1';

  const [sessions, skills] = await Promise.all([
    listSessions(userId),
    listSkills(userId),
  ]);

  // PERF: per-session attempt fetch in parallel (N round-trips). Acceptable for v1
  // (few sessions). When this grows, replace with a single `skill_attempt` query
  // filtered by `session_id in (...)` grouped client-side.
  const attemptsBySession: Map<string, SkillAttempt[]> = new Map(
    await Promise.all(
      sessions.map(
        async (s): Promise<[string, SkillAttempt[]]> => [
          s.id,
          await listAttemptsForSession(s.id),
        ],
      ),
    ),
  );

  const skillsById: Map<string, Skill> = new Map(skills.map((s) => [s.id, s]));

  // When milestonesOnly is on: keep only sessions that have at least one milestone
  // attempt, and within those sessions show only the milestone attempts.
  const visibleSessions = milestonesOnly
    ? sessions.filter((s) =>
        (attemptsBySession.get(s.id) ?? []).some((a) => a.isMilestone),
      )
    : sessions;
  const visibleAttemptsFor = (sessionId: string): SkillAttempt[] => {
    const all = attemptsBySession.get(sessionId) ?? [];
    return milestonesOnly ? all.filter((a) => a.isMilestone) : all;
  };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-violet-900/60">Every practice, big or small.</p>
      </header>

      <StreakBanner profile={profile} />

      <nav aria-label="Filter history" className="flex flex-wrap gap-2">
        <FilterChip href="/history" label="All" active={!milestonesOnly} />
        <FilterChip
          href="/history?milestones=1"
          label="⭐ Milestones"
          active={milestonesOnly}
        />
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
          No milestones yet. Tap the ⭐ box during practice to mark one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleSessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              attempts={visibleAttemptsFor(s.id)}
              skillsById={skillsById}
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
