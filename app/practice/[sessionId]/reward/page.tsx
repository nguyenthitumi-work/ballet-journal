import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getSessionContext } from '@/lib/session';
import { getSession } from '@/lib/db/sessions';
import { nextQueuedReveal } from '@/lib/db/rewards';
import { SEED_REWARD_JOURNEYS, SEED_REWARD_SCENES } from '@/lib/data/seedRewards';
import RewardContinueButton from '../../_components/RewardContinueButton';

export default async function RewardRevealPage(props: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await props.params;
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  // Defensive: this page is only meaningful right after a finished session.
  // If the session doesn't exist or hasn't been ended, send the user back home.
  const session = await getSession(userId, sessionId);
  if (!session || session.endedAt === null) {
    redirect('/history');
  }

  const reveal = await nextQueuedReveal(userId);
  if (!reveal) {
    // Queue empty — nothing to show. Happens if the user revisits the URL.
    redirect('/history');
  }

  const scene = SEED_REWARD_SCENES.find((s) => s.id === reveal.sceneId);
  if (!scene) {
    // Catalog drift — scene removed after a unlock was recorded. Bail rather
    // than render a broken card; the dangling row can be cleaned up later.
    redirect('/history');
  }

  const journey = SEED_REWARD_JOURNEYS.find((j) => j.id === scene.journeyId);
  const totalInJourney = SEED_REWARD_SCENES.filter(
    (s) => s.journeyId === scene.journeyId,
  ).length;

  return (
    <section className="flex flex-col items-center gap-6 py-8 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-700">
        You unlocked a scene
      </p>

      <div className="animate-reveal flex flex-col items-center gap-3">
        <Image
          src={scene.artworkPath}
          alt={scene.title}
          width={240}
          height={320}
          priority
          unoptimized
          className="drop-shadow-lg"
        />
      </div>

      <div className="animate-reveal-late flex flex-col items-center gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-violet-950">
          {scene.title}
        </h1>
        <p className="text-sm text-violet-900/60">
          {journey?.title ?? ''} · Scene {scene.orderIndex} of {totalInJourney}
        </p>
      </div>

      <RewardContinueButton sceneId={scene.id} />
    </section>
  );
}
