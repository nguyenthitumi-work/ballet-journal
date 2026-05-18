'use server';

import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';
import { updateProfile } from '@/lib/db/profile';
import {
  clearAllUserVideoPaths,
  listUserVideoPaths,
} from '@/lib/db/sessions';
import { isValidDateOfBirth, MIN_AGE, MAX_AGE } from '@/lib/age';
import type { Level } from '@/lib/types';

const VIDEO_BUCKET = 'practice-videos';

const VALID_LEVELS: readonly Level[] = ['Beginner', 'Intermediate', 'Advanced'] as const;

function isLevel(value: string): value is Level {
  return (VALID_LEVELS as readonly string[]).includes(value);
}

export async function updateProfileAction(
  formData: FormData,
): Promise<{ ok: true }> {
  const rawName = formData.get('name');
  const rawDob = formData.get('dateOfBirth');
  const rawLevel = formData.get('level');

  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (name.length === 0) {
    throw new Error('Please tell us your name.');
  }

  const dateOfBirth = typeof rawDob === 'string' ? rawDob.trim() : '';
  if (dateOfBirth.length === 0) {
    throw new Error('Please pick your birthday.');
  }
  if (!isValidDateOfBirth(dateOfBirth)) {
    throw new Error(
      `Birthday must be a real past date and put your age between ${MIN_AGE} and ${MAX_AGE}.`,
    );
  }

  const levelStr = typeof rawLevel === 'string' ? rawLevel : '';
  if (!isLevel(levelStr)) {
    throw new Error('Please pick a level.');
  }

  const { userId } = await getSessionContext();
  await updateProfile(userId, { name, dateOfBirth, level: levelStr });

  revalidatePath('/settings');
  revalidatePath('/');

  return { ok: true };
}

export async function deleteAllVideosForUser(): Promise<{ deleted: number }> {
  const { userId } = await getSessionContext();
  const paths = await listUserVideoPaths(userId);
  if (paths.length === 0) return { deleted: 0 };

  const supabase = await getServerSupabase();
  const { error: removeError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .remove(paths);
  if (removeError) throw new Error(removeError.message);

  await clearAllUserVideoPaths(userId);

  revalidatePath('/settings');
  revalidatePath('/history');
  return { deleted: paths.length };
}
