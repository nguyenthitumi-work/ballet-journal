'use server';

import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import { setFocus, setProgressStatus as dbSetProgressStatus, setReferenceUrl } from '@/lib/db/skills';
import { evaluateUnlocks } from '@/lib/db/rewards';
import type { ProgressStatus } from '@/lib/types';
import { parseYouTubeId } from '@/lib/youtube';

export async function toggleFocus(skillId: string, next: boolean): Promise<void> {
  const { userId } = await getSessionContext();
  await setFocus(userId, skillId, next);
  revalidatePath('/skills');
  revalidatePath(`/skills/${skillId}`);
}

export async function setProgressStatus(
  skillId: string,
  next: ProgressStatus,
): Promise<void> {
  const { userId } = await getSessionContext();
  await dbSetProgressStatus(userId, skillId, next);

  // Mastery crossing a mastered_count threshold queues a reward scene for the
  // next session-end reveal. Non-critical — swallow failures.
  if (next === 'mastered') {
    try {
      await evaluateUnlocks(userId);
    } catch (err) {
      console.error('evaluateUnlocks failed after setProgressStatus', err);
    }
  }

  revalidatePath('/skills');
  revalidatePath(`/skills/${skillId}`);
}

export async function updateReferenceUrl(
  skillId: string,
  url: string | null,
): Promise<void> {
  const { userId } = await getSessionContext();
  if (url !== null && parseYouTubeId(url) === null) {
    throw new Error(
      'That doesn’t look like a YouTube link. Use a youtube.com or youtu.be URL.',
    );
  }
  await setReferenceUrl(userId, skillId, url);
  revalidatePath(`/skills/${skillId}`);
}
