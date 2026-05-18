'use server';

import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  clearAttemptPhotoPath,
  clearAttemptVideoPath,
  getAttemptPhotoPath,
  getAttemptVideoPath,
} from '@/lib/db/sessions';

const VIDEO_BUCKET = 'practice-videos';
const PHOTO_BUCKET = 'practice-photos';

export async function deleteVideoForAttempt(args: {
  attemptId: string;
}): Promise<void> {
  const { attemptId } = args;
  if (typeof attemptId !== 'string' || attemptId.length === 0) {
    throw new Error('Missing attempt id.');
  }

  const { userId } = await getSessionContext();
  const path = await getAttemptVideoPath({ userId, attemptId });
  if (path === null) return;

  const supabase = await getServerSupabase();
  const { error: removeError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .remove([path]);
  if (removeError) throw new Error(removeError.message);

  await clearAttemptVideoPath({ userId, attemptId });

  revalidatePath('/history');
  revalidatePath('/settings');
}

export async function deletePhotoForAttempt(args: {
  attemptId: string;
}): Promise<void> {
  const { attemptId } = args;
  if (typeof attemptId !== 'string' || attemptId.length === 0) {
    throw new Error('Missing attempt id.');
  }

  const { userId } = await getSessionContext();
  const path = await getAttemptPhotoPath({ userId, attemptId });
  if (path === null) return;

  const supabase = await getServerSupabase();
  const { error: removeError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([path]);
  if (removeError) throw new Error(removeError.message);

  await clearAttemptPhotoPath({ userId, attemptId });

  revalidatePath('/history');
  revalidatePath('/settings');
}
