'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/lib/session';
import {
  endSession,
  recordAsanaAttempt,
  startSession,
} from '@/lib/db/sessions';
import { createFlow, getFlow } from '@/lib/db/flows';
import { listAsanas } from '@/lib/db/asanas';
import { evaluateUnlocks } from '@/lib/db/rewards';
import { getDisciplineState, setDisciplineStreak } from '@/lib/db/disciplineProfile';
import { computeNewStreak, formatLocalDate } from '@/lib/services/streak';
import {
  YOGA_STYLE_LABELS,
  type FlowPose,
  type FlowSide,
  type YogaStyle,
} from '@/lib/yoga/types';
import type { Level, Rating } from '@/lib/types';

const LOCAL_TZ = 'America/Los_Angeles';
const VALID_RATINGS: readonly Rating[] = [1, 2, 3, 4, 5];

function isRating(value: number): value is Rating {
  return (VALID_RATINGS as readonly number[]).includes(value);
}

// Start a guided flow: create a yoga-tagged practice_session linked to the flow,
// then hand off to the timed player. The session's ordered_skill_ids holds the
// distinct asana ids in the flow (book-keeping; the player drives the actual
// timed sequence, including left/right repeats, from the flow itself).
export async function startFlow(flowId: string): Promise<void> {
  if (typeof flowId !== 'string' || flowId.length === 0) {
    throw new Error('Missing flow id.');
  }
  const { userId } = await getSessionContext();
  const flow = await getFlow(userId, flowId);
  if (flow === null) {
    throw new Error('Flow not found.');
  }
  const distinctAsanaIds = Array.from(new Set(flow.poses.map((p) => p.asanaId)));
  const session = await startSession({
    userId,
    planId: null,
    orderedSkillIds: distinctAsanaIds,
    discipline: 'yoga',
    flowId,
  });
  redirect(`/yoga/play/${session.id}`);
}

// Record one completed hold as a skill_attempt (subject = asana). Called by the
// player as each pose's timer elapses. Rating defaults to a neutral 3 ("done")
// because timed holds aren't self-rated 1–5 the way ballet skills are.
export async function recordHold(args: {
  sessionId: string;
  asanaId: string;
  durationSeconds: number;
  rating?: number;
}): Promise<{ attemptId: string }> {
  const { sessionId, asanaId, durationSeconds } = args;
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    throw new Error('Missing session id.');
  }
  if (typeof asanaId !== 'string' || asanaId.length === 0) {
    throw new Error('Missing asana id.');
  }
  const rating: Rating =
    typeof args.rating === 'number' && Number.isInteger(args.rating) && isRating(args.rating)
      ? args.rating
      : 3;
  const safeDuration =
    Number.isFinite(durationSeconds) && durationSeconds >= 0 ? Math.floor(durationSeconds) : 0;

  const { userId } = await getSessionContext();
  const attempt = await recordAsanaAttempt({
    userId,
    sessionId,
    asanaId,
    rating,
    notes: null,
    isMilestone: false,
    durationSeconds: safeDuration,
  });
  return { attemptId: attempt.id };
}

// End a yoga session. Mirrors the ballet finishSession: close the session,
// advance the streak, and queue any newly-earned reward scenes. Reward reveals
// are evaluated silently here (no /yoga reveal screen yet) and will surface on
// the next ballet session end or a future yoga reveal page.
export async function finishFlowSession(
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

  const state = await getDisciplineState(userId, 'yoga');
  const todayLocal = formatLocalDate(new Date(), LOCAL_TZ);
  const { newStreak, updatedLastPracticeDate } = computeNewStreak({
    currentStreak: state.streak,
    lastPracticeDate: state.lastPracticeDate,
    todayLocal,
  });
  await setDisciplineStreak(userId, 'yoga', newStreak, updatedLastPracticeDate);

  // Fill the yoga reward board for newly-crossed thresholds. Silent (no reveal
  // animation yet for yoga); best-effort so a reward hiccup never blocks the
  // session from closing.
  try {
    await evaluateUnlocks(userId, 'yoga', { silent: true });
  } catch (err) {
    console.error('evaluateUnlocks failed after finishFlowSession', err);
  }

  revalidatePath('/');
  revalidatePath('/yoga');
  revalidatePath('/history');
  redirect('/history');
}

const VALID_LEVELS: readonly Level[] = ['Beginner', 'Intermediate', 'Advanced'];
const VALID_SIDES: readonly FlowSide[] = ['left', 'right', 'center'];

export interface NewFlowInput {
  name: string;
  description: string;
  style: string;
  level: string;
  poses: { asanaId: string; holdSeconds: number; side: string; breathCue: string }[];
}

// Create a user-authored flow from the builder. Validates every field and
// confirms each referenced asana belongs to the user before saving.
export async function createFlowAction(input: NewFlowInput): Promise<void> {
  const { userId } = await getSessionContext();

  const name = (input.name ?? '').trim();
  if (name.length === 0) throw new Error('Give your flow a name.');
  if (name.length > 80) throw new Error('Flow name is too long.');

  if (!(input.style in YOGA_STYLE_LABELS)) throw new Error('Pick a valid style.');
  const style = input.style as YogaStyle;

  if (!(VALID_LEVELS as readonly string[]).includes(input.level)) {
    throw new Error('Pick a valid level.');
  }
  const level = input.level as Level;

  if (!Array.isArray(input.poses) || input.poses.length === 0) {
    throw new Error('Add at least one pose.');
  }

  const ownedIds = new Set((await listAsanas(userId)).map((a) => a.id));

  const poses: FlowPose[] = input.poses.map((p, i) => {
    if (!ownedIds.has(p.asanaId)) {
      throw new Error(`Pose ${i + 1} is not in your library.`);
    }
    const holdSeconds = Math.floor(Number(p.holdSeconds));
    if (!Number.isFinite(holdSeconds) || holdSeconds < 5 || holdSeconds > 600) {
      throw new Error(`Pose ${i + 1} needs a hold between 5 and 600 seconds.`);
    }
    const side = (VALID_SIDES as readonly string[]).includes(p.side)
      ? (p.side as FlowSide)
      : 'center';
    const breathCue = (p.breathCue ?? '').trim();
    return {
      asanaId: p.asanaId,
      holdSeconds,
      side,
      breathCue: breathCue.length === 0 ? null : breathCue.slice(0, 120),
    };
  });

  await createFlow(userId, {
    name,
    description: input.description.trim().length === 0 ? null : input.description.trim().slice(0, 280),
    style,
    level,
    poses,
  });

  revalidatePath('/yoga/flows');
  redirect('/yoga/flows');
}
