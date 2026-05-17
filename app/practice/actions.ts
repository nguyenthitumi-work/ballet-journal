'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import { endSession, recordAttempt, startSession } from '@/lib/db/sessions';
import { getProfile, setStreak } from '@/lib/db/profile';
import { computeNewStreak, formatLocalDate } from '@/lib/services/streak';
import type { Rating } from '@/lib/types';

const LOCAL_TZ = 'America/Los_Angeles';
const VALID_RATINGS: readonly Rating[] = [1, 2, 3, 4, 5];

function isRating(value: number): value is Rating {
  return (VALID_RATINGS as readonly number[]).includes(value);
}

export async function startPracticeFromPlan(planId: string): Promise<void> {
  if (typeof planId !== 'string' || planId.length === 0) {
    throw new Error('Missing plan id.');
  }
  const { deviceId } = await getSessionContext();
  const session = await startSession(deviceId, planId);
  redirect(`/practice/${session.id}`);
}

export async function startFreePractice(): Promise<void> {
  const { deviceId } = await getSessionContext();
  const session = await startSession(deviceId, null);
  redirect(`/practice/${session.id}`);
}

export async function submitAttempt(args: {
  sessionId: string;
  skillId: string;
  rating: number;
  notes: string;
  isMilestone: boolean;
  durationSeconds: number;
}): Promise<void> {
  const { sessionId, skillId, rating, notes, isMilestone, durationSeconds } = args;

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    throw new Error('Missing session id.');
  }
  if (typeof skillId !== 'string' || skillId.length === 0) {
    throw new Error('Missing skill id.');
  }
  if (!Number.isInteger(rating) || !isRating(rating)) {
    throw new Error('Rating must be between 1 and 5.');
  }
  const safeDuration =
    Number.isFinite(durationSeconds) && durationSeconds >= 0
      ? Math.floor(durationSeconds)
      : 0;
  const trimmedNotes = notes.trim();

  await recordAttempt({
    sessionId,
    skillId,
    rating,
    notes: trimmedNotes.length === 0 ? null : trimmedNotes,
    isMilestone: Boolean(isMilestone),
    durationSeconds: safeDuration,
  });

  revalidatePath(`/practice/${sessionId}`);
}

export async function finishSession(
  sessionId: string,
  moodRating: number | null,
  overallNotes: string,
): Promise<void> {
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    throw new Error('Missing session id.');
  }

  let mood: Rating | null = null;
  if (moodRating !== null) {
    if (!Number.isInteger(moodRating) || !isRating(moodRating)) {
      throw new Error('Mood rating must be between 1 and 5.');
    }
    mood = moodRating;
  }

  const { deviceId } = await getSessionContext();

  await endSession(
    deviceId,
    sessionId,
    mood,
    overallNotes.trim().length === 0 ? null : overallNotes.trim(),
  );

  const profile = await getProfile(deviceId);
  if (profile) {
    const todayLocal = formatLocalDate(new Date(), LOCAL_TZ);
    const { newStreak, updatedLastPracticeDate } = computeNewStreak({
      currentStreak: profile.streak,
      lastPracticeDate: profile.lastPracticeDate,
      todayLocal,
    });
    await setStreak(deviceId, newStreak, updatedLastPracticeDate);
  }

  revalidatePath('/');
  revalidatePath('/history');
  redirect('/history');
}
