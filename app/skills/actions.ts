'use server';

import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import { setFocus, setReferenceUrl } from '@/lib/db/skills';
import { parseYouTubeId } from '@/lib/youtube';

export async function toggleFocus(skillId: string, next: boolean): Promise<void> {
  const { deviceId } = await getSessionContext();
  await setFocus(deviceId, skillId, next);
  revalidatePath('/skills');
  revalidatePath(`/skills/${skillId}`);
}

export async function updateReferenceUrl(
  skillId: string,
  url: string | null,
): Promise<void> {
  const { deviceId } = await getSessionContext();
  if (url !== null && parseYouTubeId(url) === null) {
    throw new Error(
      'That doesn’t look like a YouTube link. Use a youtube.com or youtu.be URL.',
    );
  }
  await setReferenceUrl(deviceId, skillId, url);
  revalidatePath(`/skills/${skillId}`);
}
