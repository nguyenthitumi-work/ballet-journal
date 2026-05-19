import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listUserRewards } from '@/lib/db/rewards';
import { SEED_REWARD_JOURNEYS, SEED_REWARD_SCENES, type UnlockRule } from '@/lib/data/seedRewards';

const TZ = 'America/Los_Angeles';
const PRIMARY_JOURNEY_ID = 'swan-lake';

function formatEarnedDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatUnlockCriteria(rule: UnlockRule): string {
  switch (rule.kind) {
    case 'session_count':
      return `Complete ${rule.threshold} ${rule.threshold === 1 ? 'practice' : 'practices'}`;
    case 'mastered_count':
      return `Master ${rule.threshold} ${rule.threshold === 1 ? 'skill' : 'skills'}`;
    case 'milestone_count':
      return `Star ${rule.threshold} ${rule.threshold === 1 ? 'milestone' : 'milestones'}`;
    case 'streak':
      return `Reach a ${rule.threshold}-day streak`;
  }
}

export default async function RewardsPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const rewards = await listUserRewards(userId);
  const earnedAtById = new Map(rewards.map((r) => [r.sceneId, r.unlockedAt]));

  const journey = SEED_REWARD_JOURNEYS.find((j) => j.id === PRIMARY_JOURNEY_ID);
  const scenes = SEED_REWARD_SCENES
    .filter((s) => s.journeyId === PRIMARY_JOURNEY_ID)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const unlockedCount = scenes.filter((s) => earnedAtById.has(s.id)).length;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link href="/" className="text-sm text-violet-700 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {journey?.title ?? 'Journey'}
        </h1>
        <p className="text-sm text-violet-900/70">
          {unlockedCount} of {scenes.length} scenes unlocked
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {scenes.map((scene) => {
          const earnedAt = earnedAtById.get(scene.id) ?? null;
          const unlocked = earnedAt !== null;
          return (
            <li
              key={scene.id}
              className="flex flex-col gap-2 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Image
                  src={scene.artworkPath}
                  alt={unlocked ? scene.title : ''}
                  fill
                  sizes="(min-width: 768px) 180px, (min-width: 640px) 200px, 160px"
                  unoptimized
                  className={unlocked ? '' : 'opacity-30 grayscale'}
                />
              </div>
              <div className="flex flex-col gap-1 px-1">
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700/70">
                  Scene {scene.orderIndex}
                </p>
                <h3
                  className={`text-sm font-medium leading-tight ${
                    unlocked ? 'text-violet-950' : 'text-violet-900/50'
                  }`}
                >
                  {scene.title}
                </h3>
                <p className="text-xs text-violet-900/60">
                  {unlocked
                    ? `Earned ${formatEarnedDate(earnedAt)}`
                    : `Unlock: ${formatUnlockCriteria(scene.unlock)}`}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
