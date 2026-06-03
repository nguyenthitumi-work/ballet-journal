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
import type { Level, ClassRole, FamilyRole, Discipline } from '@/lib/types';
import { isThemeId } from '@/lib/themes';
import { createFamily, createInvite } from '@/lib/db/families';
import { createClass, generateClassInviteCode } from '@/lib/db/classes';

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

export async function updateColorThemeAction(theme: string): Promise<{ ok: true }> {
  if (!isThemeId(theme)) {
    throw new Error('Unknown color theme.');
  }
  const { userId } = await getSessionContext();
  await updateProfile(userId, { colorTheme: theme });

  // The theme is applied in the root layout, so revalidate the whole tree.
  revalidatePath('/', 'layout');
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

const VALID_DISCIPLINES: readonly Discipline[] = ['ballet', 'yoga', 'gym'];

function toDiscipline(value: string | undefined): Discipline {
  return value && (VALID_DISCIPLINES as readonly string[]).includes(value)
    ? (value as Discipline)
    : 'ballet';
}

export async function createFamilyAction(name: string, discipline?: string): Promise<void> {
  const { userId } = await getSessionContext();
  await createFamily(userId, name, toDiscipline(discipline));
  revalidatePath('/settings');
}

export async function generateFamilyInviteCodeAction(opts: {
  familyId: string;
  role: FamilyRole;
}): Promise<{ code: string }> {
  const { userId } = await getSessionContext();
  const supabase = await getServerSupabase();

  // Verify user is the family creator
  const { data: family, error: fetchError } = await supabase
    .from('family')
    .select('created_by')
    .eq('id', opts.familyId)
    .single();

  if (fetchError) throw new Error('Family not found');
  if (family.created_by !== userId) {
    throw new Error('Only the family creator can generate invite codes');
  }

  const invite = await createInvite({
    createdBy: userId,
    targetFamilyId: opts.familyId,
    targetRole: opts.role,
    code: true,
  });

  revalidatePath('/settings');
  return { code: invite.code! };
}

export async function createClassAction(name: string, discipline?: string): Promise<void> {
  const { userId } = await getSessionContext();
  await createClass(userId, name, toDiscipline(discipline));
  revalidatePath('/settings');
}

export async function generateClassCodeAction(classId: string): Promise<void> {
  const { userId } = await getSessionContext();
  const supabase = await getServerSupabase();

  // Verify user is the class owner
  const { data: cls, error: fetchError } = await supabase
    .from('class')
    .select('owner_id')
    .eq('id', classId)
    .single();

  if (fetchError) throw new Error('Class not found');
  if (cls.owner_id !== userId) {
    throw new Error('Only the class owner can generate invite codes');
  }

  await generateClassInviteCode(classId);
  revalidatePath('/settings');
}

export async function deleteFamilyAction(familyId: string): Promise<void> {
  const { userId } = await getSessionContext();
  const supabase = await getServerSupabase();

  // Only family creator can delete
  const { error } = await supabase
    .from('family')
    .delete()
    .eq('id', familyId)
    .eq('created_by', userId);

  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deleteClassAction(classId: string): Promise<void> {
  const { userId } = await getSessionContext();
  const supabase = await getServerSupabase();

  // Only class owner can delete
  const { error } = await supabase
    .from('class')
    .delete()
    .eq('id', classId)
    .eq('owner_id', userId);

  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

