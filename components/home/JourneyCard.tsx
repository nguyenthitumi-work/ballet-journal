import Link from 'next/link';
import Image from 'next/image';
import { SEED_REWARD_JOURNEYS, SEED_REWARD_SCENES } from '@/lib/data/seedRewards';

const PRIMARY_JOURNEY_ID = 'swan-lake';

// "Your journey" reward-board preview for a discipline home. Shared with the
// ballet home's inline version (app/page.tsx); `href` points at the
// discipline's own rewards board, `unlockedSceneIds` are canonical scene ids.
export function JourneyCard({
  unlockedSceneIds,
  href,
}: {
  unlockedSceneIds: Set<string>;
  href: string;
}) {
  const journey = SEED_REWARD_JOURNEYS.find((j) => j.id === PRIMARY_JOURNEY_ID);
  const scenes = SEED_REWARD_SCENES
    .filter((s) => s.journeyId === PRIMARY_JOURNEY_ID)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const unlockedInJourney = scenes.filter((s) => unlockedSceneIds.has(s.id)).length;

  return (
    <Link
      href={href}
      className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:border-violet-400"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-violet-900/70">Your journey</p>
        <p className="text-xs text-violet-900/60">
          {unlockedInJourney} / {scenes.length} scenes
        </p>
      </div>
      {journey ? (
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-violet-700/80">
          {journey.title}
        </p>
      ) : null}
      <ul
        className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6"
        aria-label={`${unlockedInJourney} of ${scenes.length} scenes unlocked`}
      >
        {scenes.map((scene) => {
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
        <p className="mt-3 text-sm text-violet-900/70">Practice to start filling your journey.</p>
      ) : null}
    </Link>
  );
}
