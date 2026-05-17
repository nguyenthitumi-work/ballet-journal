import Link from 'next/link';
import { getSessionContext } from '@/lib/session';
import { listSkills } from '@/lib/db/skills';
import { pickDailySuggestion, type SuggestionReason } from '@/lib/services/suggestion';
import { CATEGORY_LABELS } from '@/lib/types';
import type { Skill } from '@/lib/types';

const REASON_LABELS: Record<SuggestionReason, string> = {
  focus: 'Working on',
  stale: "Haven't tried in a while",
  rediscovery: 'Rediscover',
  default: 'Suggested',
};

function streakMessage(streak: number): string {
  if (streak <= 0) return "Press start whenever you're ready.";
  if (streak < 7) return `${streak}-day streak — nice.`;
  return `${streak}-day streak. ⭐`;
}

function greetingTagline(now: Date): string {
  // Pick a friendly variation based on day-of-week so it changes through the week
  // but is stable within a single day.
  const variations = [
    "Ready to dance?",
    "Let's get into it!",
    "Time to move.",
    "Up on your toes!",
    "Let's stretch and shine.",
    "Class is in session.",
    "Find your center.",
  ];
  return variations[now.getDay()];
}

export default async function HomePage() {
  const { deviceId, profile, onboarded } = await getSessionContext();

  if (!onboarded) {
    return (
      <section className="flex flex-col items-center gap-6 py-12 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to Ballet Journal</h1>
        <p className="max-w-md text-pink-900/80">
          A tiny notebook for tracking your ballet practice. Let&apos;s set up your profile.
        </p>
        <Link
          href="/onboarding"
          className="rounded-full bg-pink-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-pink-700"
        >
          Get started
        </Link>
      </section>
    );
  }

  const now = new Date();
  const skills = await listSkills(deviceId);
  const suggestionInput = skills.map((s) => ({
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    isCurrentlyWorkingOn: s.isCurrentlyWorkingOn,
    lastAttemptedAt: s.lastAttemptedAt ? new Date(s.lastAttemptedAt) : null,
  }));
  const picks = pickDailySuggestion({ skills: suggestionInput, now });
  const skillById = new Map<string, Skill>(skills.map((s) => [s.id, s]));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Hi, {profile.name}</h1>
        <p className="text-pink-900/70">{greetingTagline(now)}</p>
      </header>

      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-100 to-pink-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-pink-900/70">Streak</p>
        <p className="mt-1 text-5xl font-semibold tracking-tight">
          {profile.streak}
          <span className="ml-2 text-2xl font-medium text-pink-900/60">
            {profile.streak === 1 ? 'day' : 'days'}
          </span>
        </p>
        <p className="mt-2 text-sm text-pink-900/70">{streakMessage(profile.streak)}</p>
      </div>

      <div className="rounded-2xl border border-pink-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-pink-900/70">Today&apos;s practice</p>
        {picks.length === 0 ? (
          <p className="mt-2 text-pink-900/80">
            Pick some focus skills from the Skills tab to get personalized suggestions.
          </p>
        ) : (
          <>
            <p className="mt-1 text-pink-900/80">
              Here&apos;s a {picks.length}-skill warmup pulled from your focus list and a few
              stale ones.
            </p>
            <ul className="mt-4 flex flex-col">
              {picks.map((pick) => {
                const skill = skillById.get(pick.skillId);
                if (!skill) return null;
                return (
                  <li
                    key={pick.skillId}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-pink-100 py-3 last:border-b-0"
                  >
                    <span className="font-medium">{skill.name}</span>
                    <span className="rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700">
                      {CATEGORY_LABELS[skill.categoryId]}
                    </span>
                    <span className="text-xs text-pink-900/60">
                      {REASON_LABELS[pick.reason]}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5">
              <Link
                href="/practice"
                className="inline-flex rounded-full bg-pink-600 px-7 py-3 font-medium text-white hover:bg-pink-700"
              >
                Start practice
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <Link
          href="/skills"
          className="rounded-xl border border-pink-200 bg-white px-3 py-3 transition hover:border-pink-400"
        >
          Skills
        </Link>
        <Link
          href="/practice"
          className="rounded-xl border border-pink-200 bg-white px-3 py-3 transition hover:border-pink-400"
        >
          Practice plans
        </Link>
        <Link
          href="/history"
          className="rounded-xl border border-pink-200 bg-white px-3 py-3 transition hover:border-pink-400"
        >
          History
        </Link>
      </div>
    </section>
  );
}
