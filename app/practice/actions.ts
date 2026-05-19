'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import {
  endSession,
  recordAttempt,
  setAttemptPhotoPath,
  setAttemptVideoPath,
  startSession,
} from '@/lib/db/sessions';
import { getPlan } from '@/lib/db/plans';
import { listSkills } from '@/lib/db/skills';
import { getProfile, setStreak } from '@/lib/db/profile';
import { computeNewStreak, formatLocalDate } from '@/lib/services/streak';
import { localDayOfWeek, pickDailySuggestion } from '@/lib/services/suggestion';
import { computeLockStates } from '@/lib/services/unlock';
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
  const { userId } = await getSessionContext();
  const plan = await getPlan(userId, planId);
  if (plan === null) {
    throw new Error('Plan not found.');
  }
  const session = await startSession({
    userId,
    planId,
    orderedSkillIds: plan.orderedSkillIds,
  });
  redirect(`/practice/${session.id}`);
}

export async function startFreePractice(): Promise<void> {
  const { userId, profile } = await getSessionContext();
  const skills = await listSkills(userId);
  const lockStates = computeLockStates(skills);
  const now = new Date();
  const picks = pickDailySuggestion({
    skills: skills.map((s) => ({
      id: s.id,
      name: s.name,
      categoryId: s.categoryId,
      level: s.level,
      progressStatus: s.progressStatus,
      isCurrentlyWorkingOn: s.isCurrentlyWorkingOn,
      lastAttemptedAt: s.lastAttemptedAt ? new Date(s.lastAttemptedAt) : null,
      isLocked: lockStates.get(s.id)?.locked === true,
    })),
    userLevel: profile.level,
    now,
    dayOfWeek: localDayOfWeek(now, LOCAL_TZ),
  });
  const session = await startSession({
    userId,
    planId: null,
    orderedSkillIds: picks.map((p) => p.skillId),
  });
  redirect(`/practice/${session.id}`);
}

export async function submitAttempt(args: {
  sessionId: string;
  skillId: string;
  rating: number;
  notes: string;
  isMilestone: boolean;
  durationSeconds: number;
}): Promise<{ attemptId: string }> {
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
  const { userId } = await getSessionContext();

  const attempt = await recordAttempt({
    userId,
    sessionId,
    skillId,
    rating,
    notes: trimmedNotes.length === 0 ? null : trimmedNotes,
    isMilestone: Boolean(isMilestone),
    durationSeconds: safeDuration,
  });

  revalidatePath(`/practice/${sessionId}`);
  return { attemptId: attempt.id };
}

export async function attachVideoToAttempt(args: {
  attemptId: string;
  videoPath: string;
  videoSizeBytes: number;
}): Promise<void> {
  const { attemptId, videoPath, videoSizeBytes } = args;

  if (typeof attemptId !== 'string' || attemptId.length === 0) {
    throw new Error('Missing attempt id.');
  }
  if (typeof videoPath !== 'string' || videoPath.length === 0) {
    throw new Error('Missing video path.');
  }
  if (!Number.isFinite(videoSizeBytes) || videoSizeBytes < 0) {
    throw new Error('Invalid video size.');
  }

  const { userId } = await getSessionContext();

  // Defense in depth: storage RLS enforces the same constraint, but reject any
  // path whose first segment isn't this user's UID before touching the DB.
  const firstSegment = videoPath.split('/')[0];
  if (firstSegment !== userId) {
    throw new Error('Video path does not belong to this user.');
  }

  await setAttemptVideoPath({
    userId,
    attemptId,
    videoPath,
    videoSizeBytes: Math.floor(videoSizeBytes),
  });
}

export async function attachPhotoToAttempt(args: {
  attemptId: string;
  photoPath: string;
  photoSizeBytes: number;
}): Promise<void> {
  const { attemptId, photoPath, photoSizeBytes } = args;

  if (typeof attemptId !== 'string' || attemptId.length === 0) {
    throw new Error('Missing attempt id.');
  }
  if (typeof photoPath !== 'string' || photoPath.length === 0) {
    throw new Error('Missing photo path.');
  }
  if (!Number.isFinite(photoSizeBytes) || photoSizeBytes < 0) {
    throw new Error('Invalid photo size.');
  }

  const { userId } = await getSessionContext();

  const firstSegment = photoPath.split('/')[0];
  if (firstSegment !== userId) {
    throw new Error('Photo path does not belong to this user.');
  }

  await setAttemptPhotoPath({
    userId,
    attemptId,
    photoPath,
    photoSizeBytes: Math.floor(photoSizeBytes),
  });
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

  const { userId } = await getSessionContext();

  await endSession(
    userId,
    sessionId,
    mood,
    overallNotes.trim().length === 0 ? null : overallNotes.trim(),
  );

  const profile = await getProfile(userId);
  if (profile) {
    const todayLocal = formatLocalDate(new Date(), LOCAL_TZ);
    const { newStreak, updatedLastPracticeDate } = computeNewStreak({
      currentStreak: profile.streak,
      lastPracticeDate: profile.lastPracticeDate,
      todayLocal,
    });
    await setStreak(userId, newStreak, updatedLastPracticeDate);
  }

  revalidatePath('/');
  revalidatePath('/history');
  redirect('/history');
}
