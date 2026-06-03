import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listMilestoneAttempts } from '@/lib/db/milestones';
import { listSkills } from '@/lib/db/skills';
import type { Skill, SkillAttempt } from '@/lib/types';
import { MilestoneCard } from './_components/MilestoneCard';

const TZ = 'America/Los_Angeles';

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

function monthKeyInTz(d: Date, timeZone: string): string {
  // YYYY-MM in the given timezone — used to bucket cards into month groups.
  return ymdInTz(d, timeZone).slice(0, 7);
}

function formatMonthHeading(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, 15)));
}

export default async function MilestonesPage() {
  const { userId, onboarded } = await getSessionContext();

  if (!onboarded) {
    redirect('/onboarding');
  }

  const [attempts, skills] = await Promise.all([
    listMilestoneAttempts(userId),
    listSkills(userId),
  ]);

  const skillsById: Map<string, Skill> = new Map(skills.map((s) => [s.id, s]));

  // Drop orphans defensively; ON DELETE CASCADE already prevents them at the DB
  // level, but a missing skill row here would otherwise render "Unknown skill".
  // Yoga milestones (asana-backed, skill_id null) are excluded — this page is
  // ballet-only for now.
  const visible = attempts.filter((a) => a.skillId !== null && skillsById.has(a.skillId));

  const totalLabel = `${visible.length} ${visible.length === 1 ? 'milestone' : 'milestones'}`;

  // Group by YYYY-MM (LA time), preserving the newest-first order from the query.
  const groups: { monthKey: string; items: SkillAttempt[] }[] = [];
  for (const a of visible) {
    const key = monthKeyInTz(new Date(a.attemptedAt), TZ);
    const last = groups[groups.length - 1];
    if (last && last.monthKey === key) {
      last.items.push(a);
    } else {
      groups.push({ monthKey: key, items: [a] });
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Milestones</h1>
        <p className="text-sm text-violet-900/60">
          Every breakthrough, in order. {visible.length > 0 ? totalLabel : ''}
        </p>
      </header>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-violet-950">No milestones yet.</p>
          <p className="max-w-sm text-violet-900/70">
            During practice, tap the ⭐ box on any attempt to mark a breakthrough —
            first split, first pirouette, the day a balance finally clicks.
          </p>
          <Link
            href="/practice"
            className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            Start practice
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <div key={g.monthKey} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-violet-900/60">
                {formatMonthHeading(g.monthKey)}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {g.items.map((a) => {
                  const skill = skillsById.get(a.skillId as string)!;
                  return (
                    <MilestoneCard
                      key={a.id}
                      attempt={a}
                      skillName={skill.name}
                      categoryId={skill.categoryId}
                      sessionDateYmd={ymdInTz(new Date(a.attemptedAt), TZ)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
