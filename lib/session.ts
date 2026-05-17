import 'server-only';
import { getDeviceId } from '@/lib/device';
import { ensureDeviceBootstrapped } from '@/lib/db/bootstrap';
import { getProfile, isOnboarded } from '@/lib/db/profile';
import type { UserProfile } from '@/lib/types';

export type SessionContext = {
  deviceId: string;
  profile: UserProfile;
  onboarded: boolean;
};

export async function getSessionContext(): Promise<SessionContext> {
  const deviceId = await getDeviceId();
  await ensureDeviceBootstrapped(deviceId);
  const profile = await getProfile(deviceId);
  if (!profile) {
    throw new Error('Profile bootstrap failed — no row found after ensure.');
  }
  return { deviceId, profile, onboarded: isOnboarded(profile) };
}
