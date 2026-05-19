import Link from 'next/link';
import Image from 'next/image';
import { getSessionContext } from '@/lib/session';
import { countDistinctSkillsToday } from '@/lib/db/sessions';
import { listSkills } from '@/lib/db/skills';
import { listUnlockedSceneIds } from '@/lib/db/rewards';
import { SEED_REWARD_JOURNEYS, SEED_REWARD_SCENES } from '@/lib/data/seedRewards';
import {
  WEEKLY_TEMPLATE,
  localDayOfWeek,
  pickDailySuggestion,
  type SuggestionReason,
} from '@/lib/services/suggestion';
import { pickNextSkill, type NextSkillReason } from '@/lib/services/nextSkill';
import { computeLockStates } from '@/lib/services/unlock';
import {
  getWeeklySummary,
  formatDurationCompact,
} from '@/lib/services/weeklySummary';
import { CATEGORY_LABELS } from '@/lib/types';
import type { Skill } from '@/lib/types';

const PRIMARY_JOURNEY_ID = 'swan-lake';

const LOCAL_TZ = 'America/Los_Angeles';
const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

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

function nextSkillReasonText(reason: NextSkillReason): string {
  switch (reason.kind) {
    case 'prereq-for-focus':
      return `Master this to unlock ${reason.enablesSkillName}`;
    case 'continue':
      return "You've been working on this — keep going";
    case 'next-up':
      return 'A gentle next step at your level';
    case 'stretch':
      return 'Stretch goal — above your current level';
  }
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
  const { userId, profile, onboarded } = await getSessionContext();

  if (!onboarded) {
    return (
      <section className="flex flex-col items-center gap-6 py-12 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to Plié</h1>
        <p className="max-w-md text-violet-900/80">
          A tiny notebook for tracking your ballet practice. Let&apos;s set up your profile.
        </p>
        <Link
          href="/onboarding"
          className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
        >
          Get started
        </Link>
      </section>
    );
  }

  const now = new Date();
  const dayOfWeek = localDayOfWeek(now, LOCAL_TZ);
  const dayTemplate = WEEKLY_TEMPLATE[dayOfWeek];
  const [skills, todaysCount, unlockedSceneIds, weekly] = await Promise.all([
    listSkills(userId),
    countDistinctSkillsToday(userId, LOCAL_TZ),
    listUnlockedSceneIds(userId),
    getWeeklySummary(userId, now),
  ]);
  const journey = SEED_REWARD_JOURNEYS.find((j) => j.id === PRIMARY_JOURNEY_ID);
  const journeyScenes = SEED_REWARD_SCENES
    .filter((s) => s.journeyId === PRIMARY_JOURNEY_ID)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const unlockedInJourney = journeyScenes.filter((s) => unlockedSceneIds.has(s.id)).length;
  const lockStates = computeLockStates(skills);
  const goal = profile.dailySkillGoal;
  const goalMet = todaysCount >= goal;
  const suggestionInput = skills.map((s) => ({
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    level: s.level,
    progressStatus: s.progressStatus,
    isCurrentlyWorkingOn: s.isCurrentlyWorkingOn,
    lastAttemptedAt: s.lastAttemptedAt ? new Date(s.lastAttemptedAt) : null,
    isLocked: lockStates.get(s.id)?.locked === true,
  }));
  const picks = pickDailySuggestion({
    skills: suggestionInput,
    userLevel: profile.level,
    now,
    dayOfWeek,
  });
  const skillById = new Map<string, Skill>(skills.map((s) => [s.id, s]));
  const nextSkill = pickNextSkill({
    skills,
    lockStates,
    userLevel: profile.level,
  });

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Hi, {profile.name}</h1>
        <p className="text-violet-900/70">{greetingTagline(now)}</p>
      </header>

      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-100 to-violet-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-violet-900/70">Streak</p>
        <p className="mt-1 text-5xl font-semibold tracking-tight">
          {profile.streak}
          <span className="ml-2 text-2xl font-medium text-violet-900/60">
            {profile.streak === 1 ? 'day' : 'days'}
          </span>
        </p>
        <p className="mt-2 text-sm text-violet-900/70">{streakMessage(profile.streak)}</p>
      </div>

      <Link
        href="/summary"
        className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:border-violet-400"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-violet-900/70">This week</p>
          <p className="text-xs text-violet-900/60">View summary →</p>
        </div>
        {weekly.hasAnyActivity ? (
          <div className="mt-2 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-violet-900/60">Practice time</p>
              <p className="text-xl font-semibold tracking-tight">
                {formatDurationCompact(weekly.practiceTimeSec)}
              </p>
            </div>
            <div>
              <p className="text-xs text-violet-900/60">Sessions</p>
              <p className="text-xl font-semibold tracking-tight">
                {weekly.sessionsCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-violet-900/60">Skills improved</p>
              <p className="text-xl font-semibold tracking-tight">
                {weekly.improvedSkills.length}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-violet-900/70">
            No practice yet this week — finish a session to start your summary.
          </p>
        )}
      </Link>

      <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-violet-900/70">Today&apos;s goal</p>
          <p className="text-xs text-violet-900/60">
            {Math.min(todaysCount, goal)} of {goal} skills
          </p>
        </div>
        <ul
          className="mt-3 flex flex-wrap gap-2"
          aria-label={`${todaysCount} of ${goal} skills practiced today`}
        >
          {Array.from({ length: goal }, (_, i) => (
            <li
              key={i}
              aria-hidden
              className={`h-4 w-4 rounded-full ${
                i < todaysCount ? 'bg-violet-600' : 'border-2 border-violet-300'
              }`}
            />
          ))}
        </ul>
        <p className="mt-3 text-sm text-violet-900/70">
          {goalMet
            ? todaysCount > goal
              ? `Goal met — ${todaysCount} skills today. ⭐`
              : 'Goal met for today. ⭐'
            : `Practice ${goal - todaysCount} more ${
                goal - todaysCount === 1 ? 'skill' : 'skills'
              } to hit today’s goal.`}
        </p>
      </div>

      {nextSkill ? (
        <div className="rounded-2xl border-2 border-violet-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
            Your next skill
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-violet-900">
            {nextSkill.skill.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
              {CATEGORY_LABELS[nextSkill.skill.categoryId]}
            </span>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
              {nextSkill.skill.level}
            </span>
          </div>
          <p className="mt-3 text-sm text-violet-900/70">
            {nextSkillReasonText(nextSkill.reason)}
          </p>
          <Link
            href={`/skills/${nextSkill.skill.id}`}
            className="mt-4 inline-flex items-center rounded-full bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Open
            <span aria-hidden className="ml-1">→</span>
          </Link>
        </div>
      ) : null}

      <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-violet-900/70">Today&apos;s practice</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-violet-700/80">
          {WEEKDAY_LABELS[dayOfWeek]} — {dayTemplate.theme}
        </p>
        {picks.length === 0 ? (
          <p className="mt-2 text-violet-900/80">
            Pick some focus skills from the Skills tab to get personalized suggestions.
          </p>
        ) : (
          <>
            <p className="mt-2 text-violet-900/80">
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
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-violet-100 py-3 last:border-b-0"
                  >
                    <span className="font-medium">{skill.name}</span>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                      {CATEGORY_LABELS[skill.categoryId]}
                    </span>
                    <span className="text-xs text-violet-900/60">
                      {REASON_LABELS[pick.reason]}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5">
              <Link
                href="/practice"
                className="inline-flex rounded-full bg-violet-600 px-7 py-3 font-medium text-white hover:bg-violet-700"
              >
                Start practice
              </Link>
            </div>
          </>
        )}
      </div>

      <Link
        href="/rewards"
        className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:border-violet-400"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-violet-900/70">Your journey</p>
          <p className="text-xs text-violet-900/60">
            {unlockedInJourney} / {journeyScenes.length} scenes
          </p>
        </div>
        {journey ? (
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-violet-700/80">
            {journey.title}
          </p>
        ) : null}
        <ul
          className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6"
          aria-label={`${unlockedInJourney} of ${journeyScenes.length} scenes unlocked`}
        >
          {journeyScenes.map((scene) => {
            const unlocked = unlockedSceneIds.has(scene.id);
            return (
              <li
                key={scene.id}
                className="relative aspect-[3/4] overflow-hidden rounded-md border border-violet-100"
              >
                <Image
                  src={scene.artworkPath}
                  alt={unlocked ? scene.title : ''}
                  fill
                  sizes="(min-width: 640px) 80px, 70px"
                  unoptimized
                  className={unlocked ? '' : 'opacity-30 grayscale'}
                />
              </li>
            );
          })}
        </ul>
        {unlockedInJourney === 0 ? (
          <p className="mt-3 text-sm text-violet-900/70">
            Practice to start filling your journey.
          </p>
        ) : null}
      </Link>

    </section>
  );
}
