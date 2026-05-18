'use server';

import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  clearAttemptVideoPath,
  getAttemptVideoPath,
} from '@/lib/db/sessions';

const BUCKET = 'practice-videos';

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
    .from(BUCKET)
    .remove([path]);
  if (removeError) throw new Error(removeError.message);

  await clearAttemptVideoPath({ userId, attemptId });

  revalidatePath('/history');
  revalidatePath('/settings');
}
