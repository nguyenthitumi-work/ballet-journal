import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listPlans } from '@/lib/db/plans';
import { listSkills } from '@/lib/db/skills';
import { CATEGORY_LABELS } from '@/lib/types';
import type { PracticePlan, Skill } from '@/lib/types';
import { startPracticeFromPlan, startFreePractice } from './actions';

function formatMinutes(totalSeconds: number): string {
  if (totalSeconds <= 0) return '—';
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} min`;
}

function planSkills(plan: PracticePlan, byId: Map<string, Skill>): Skill[] {
  return plan.orderedSkillIds
    .map((id) => byId.get(id))
    .filter((s): s is Skill => Boolean(s));
}

function planCategoryBadges(skills: Skill[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const s of skills) {
    const label = CATEGORY_LABELS[s.categoryId];
    if (!seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }
  return labels;
}

const CARD_CLASS = 'rounded-2xl border border-violet-200 bg-white p-6 shadow-sm';
const PRIMARY_BTN_CLASS =
  'rounded-full bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50';

export default async function PracticeIndexPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) {
    redirect('/onboarding');
  }

  const [plans, skills] = await Promise.all([listPlans(userId), listSkills(userId)]);
  const skillById = new Map(skills.map((s) => [s.id, s]));

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-violet-900/60">Ready to dance?</p>
        <h1 className="text-3xl font-semibold tracking-tight">Pick a practice</h1>
      </header>

      <form action={startFreePractice}>
        <div className={`${CARD_CLASS} flex flex-col gap-3`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-medium">Free practice</h2>
              <p className="mt-1 text-sm text-violet-900/70">
                A daily suggestion picked just for you — your focus skills first.
              </p>
            </div>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
              Recommended
            </span>
          </div>
          <div>
            <button type="submit" className={PRIMARY_BTN_CLASS}>
              Start
            </button>
          </div>
        </div>
      </form>

      {plans.length === 0 ? (
        <div className={CARD_CLASS}>
          <p className="text-violet-900/80">
            No practice plans yet. Free practice will pick a daily suggestion for you.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-violet-900/80">Plans</h2>
          {plans.map((plan) => {
            const skillsInPlan = planSkills(plan, skillById);
            const totalSeconds = skillsInPlan.reduce(
              (acc, s) => acc + s.defaultDurationSeconds,
              0,
            );
            const categories = planCategoryBadges(skillsInPlan);
            const skillCount = skillsInPlan.length;

            return (
              <form
                key={plan.id}
                action={startPracticeFromPlan.bind(null, plan.id)}
              >
                <div className={`${CARD_CLASS} flex flex-col gap-3`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-medium">{plan.name}</h3>
                      {plan.description ? (
                        <p className="mt-1 text-sm text-violet-900/70">{plan.description}</p>
                      ) : null}
                    </div>
                    {plan.isBuiltIn ? (
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                        Built-in
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-violet-900/70">
                    <span className="rounded-full bg-violet-50 px-3 py-1">
                      {skillCount} {skillCount === 1 ? 'skill' : 'skills'}
                    </span>
                    <span className="rounded-full bg-violet-50 px-3 py-1">
                      ~ {formatMinutes(totalSeconds)}
                    </span>
                    {categories.slice(0, 3).map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-violet-50 px-3 py-1"
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  <div>
                    <button
                      type="submit"
                      className={PRIMARY_BTN_CLASS}
                      disabled={skillCount === 0}
                    >
                      Start
                    </button>
                  </div>
                </div>
              </form>
            );
          })}
        </div>
      )}

      <p className="text-center text-sm text-violet-900/60">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to home
        </Link>
      </p>
    </section>
  );
}
