import 'server-only';
import { getAuthUserId } from '@/lib/auth';
import { ensureUserBootstrapped } from '@/lib/db/bootstrap';
import { getProfile, isOnboarded } from '@/lib/db/profile';
import type { UserProfile } from '@/lib/types';

export type SessionContext = {
  userId: string;
  profile: UserProfile;
  onboarded: boolean;
};

export async function getSessionContext(): Promise<SessionContext> {
  const userId = await getAuthUserId();
  await ensureUserBootstrapped(userId);
  const profile = await getProfile(userId);
  if (!profile) {
    throw new Error('Profile bootstrap failed — no row found after ensure.');
  }
  return { userId, profile, onboarded: isOnboarded(profile) };
}
