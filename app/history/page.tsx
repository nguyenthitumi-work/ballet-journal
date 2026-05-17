import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listSessions, listAttemptsForSession } from '@/lib/db/sessions';
import { listSkills } from '@/lib/db/skills';
import type { Skill, SkillAttempt } from '@/lib/types';
import { StreakBanner } from './_components/StreakBanner';
import { SessionCard } from './_components/SessionCard';

export default async function HistoryPage() {
  const { userId, profile, onboarded } = await getSessionContext();

  if (!onboarded) {
    redirect('/onboarding');
  }

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

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-pink-900/60">Every practice, big or small.</p>
      </header>

      <StreakBanner profile={profile} />

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-pink-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-pink-950">No practices yet.</p>
          <p className="max-w-sm text-pink-900/70">
            Your first session will show up here as soon as you finish it.
          </p>
          <Link
            href="/practice"
            className="rounded-full bg-pink-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-pink-700"
          >
            Start practice
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              attempts={attemptsBySession.get(s.id) ?? []}
              skillsById={skillsById}
            />
          ))}
        </div>
      )}
    </section>
  );
}
