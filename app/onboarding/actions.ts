'use server';

import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { updateProfile } from '@/lib/db/profile';
import type { Level } from '@/lib/types';

const VALID_LEVELS: readonly Level[] = ['Beginner', 'Intermediate', 'Advanced'] as const;
const MIN_AGE = 3;
const MAX_AGE = 120;

function isLevel(value: string): value is Level {
  return (VALID_LEVELS as readonly string[]).includes(value);
}

export async function submitOnboarding(formData: FormData): Promise<void> {
  const rawName = formData.get('name');
  const rawAge = formData.get('age');
  const rawLevel = formData.get('level');

  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (name.length === 0) {
    throw new Error('Please tell us your name.');
  }

  const ageStr = typeof rawAge === 'string' ? rawAge.trim() : '';
  if (ageStr.length === 0) {
    throw new Error('Please enter your age.');
  }
  const age = Number(ageStr);
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    throw new Error(`Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}.`);
  }

  const levelStr = typeof rawLevel === 'string' ? rawLevel : '';
  if (!isLevel(levelStr)) {
    throw new Error('Please pick a level.');
  }

  const { deviceId } = await getSessionContext();
  await updateProfile(deviceId, { name, age, level: levelStr });

  redirect('/');
}
