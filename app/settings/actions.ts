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

const MIN_DAILY_GOAL = 1;
const MAX_DAILY_GOAL = 10;

export async function updateProfileAction(
  formData: FormData,
): Promise<{ ok: true }> {
  const rawName = formData.get('name');
  const rawDob = formData.get('dateOfBirth');
  const rawLevel = formData.get('level');
  const rawGoal = formData.get('dailySkillGoal');

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

  const goalNum = typeof rawGoal === 'string' ? Number.parseInt(rawGoal, 10) : NaN;
  if (!Number.isFinite(goalNum) || goalNum < MIN_DAILY_GOAL || goalNum > MAX_DAILY_GOAL) {
    throw new Error(
      `Daily goal must be between ${MIN_DAILY_GOAL} and ${MAX_DAILY_GOAL} skills.`,
    );
  }

  const { userId } = await getSessionContext();
  await updateProfile(userId, {
    name,
    dateOfBirth,
    level: levelStr,
    dailySkillGoal: goalNum,
  });

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
