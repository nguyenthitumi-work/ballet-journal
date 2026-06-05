import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listUserRewards } from '@/lib/db/rewards';
import { SUBJECT_CONFIG } from '@/lib/services/disciplineSubject';
import { RewardsBoard } from '@/components/rewards/RewardsBoard';

export default async function GymRewardsPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const rewards = await listUserRewards(userId, 'gym');

  return (
    <RewardsBoard
      rewards={rewards}
      unitPlural={SUBJECT_CONFIG.gym.unitPlural}
      homeHref="/gym"
    />
  );
}
