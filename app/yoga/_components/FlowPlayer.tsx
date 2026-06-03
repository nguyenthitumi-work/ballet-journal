'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type { FlowSide } from '@/lib/yoga/types';
import type { Rating } from '@/lib/types';
import { finishFlowSession, recordHold } from '../actions';
import VideoRecorder, { type RecordedClip } from '@/app/practice/_components/VideoRecorder';
import { attachVideoToAttempt } from '@/app/practice/actions';
import { buildVideoPath, uploadVideoBlob, deleteVideoBlob } from '@/lib/storage/videos';

export interface PlayerStep {
  asanaId: string;
  name: string;
  sanskritName: string;
  cues: string[];
  side: FlowSide;
  holdSeconds: number;
  breathCue: string | null;
}

interface Props {
  sessionId: string;
  userId: string;
  flowName: string;
  steps: PlayerStep[];
}

const FEEL: { value: Rating; emoji: string; label: string }[] = [
  { value: 1, emoji: '😣', label: 'Hard' },
  { value: 2, emoji: '😕', label: 'Shaky' },
  { value: 3, emoji: '🙂', label: 'OK' },
  { value: 4, emoji: '😊', label: 'Steady' },
  { value: 5, emoji: '🤩', label: 'Strong' },
];

const MOODS = FEEL.map((f) => ({ ...f }));

const CARD = 'rounded-2xl border border-violet-200 bg-white p-6 shadow-sm';
const PRIMARY_BTN =
  'rounded-full bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50';
const GHOST_BTN =
  'rounded-full border border-violet-200 bg-white px-5 py-2.5 text-sm font-medium text-violet-700 transition hover:border-violet-400 disabled:opacity-50';

function fmt(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function sideLabel(side: FlowSide): string | null {
  if (side === 'left') return 'Left side';
  if (side === 'right') return 'Right side';
  return null;
}

export default function FlowPlayer({ sessionId, userId, flowName, steps }: Props) {
  const [phase, setPhase] = useState<'playing' | 'finishing'>('playing');
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(steps[0]?.holdSeconds ?? 0);
  const [running, setRunning] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [rating, setRating] = useState<Rating | null>(null);

  // Per-pose video recording (optional). Recording pauses the timer, so the
  // upload finishes before the user advances and we attach to the new attempt.
  const [recordMode, setRecordMode] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'failed'>(
    'idle',
  );

  const [mood, setMood] = useState<Rating | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const recordedRef = useRef<Set<number>>(new Set());
  const uploadPathRef = useRef<string | null>(null);
  const uploadPromiseRef = useRef<Promise<void> | null>(null);
  const clipRef = useRef<RecordedClip | null>(null);

  function resetPerPose() {
    setRecordMode(false);
    setUploadStatus('idle');
    setRating(null);
    uploadPathRef.current = null;
    uploadPromiseRef.current = null;
    clipRef.current = null;
  }

  // Records the completed hold, then (if a clip was recorded for this pose)
  // attaches the uploaded video to the new attempt. Reads the upload refs
  // synchronously before its first await so a concurrent resetPerPose() can't
  // null them out from under it.
  async function recordStep(i: number, elapsed: number, feel: Rating | null) {
    if (recordedRef.current.has(i)) return;
    recordedRef.current.add(i);
    const path = uploadPathRef.current;
    const promise = uploadPromiseRef.current;
    const clip = clipRef.current;
    setCompletedCount((c) => c + 1);
    const step = steps[i];
    if (!step) return;
    try {
      const { attemptId } = await recordHold({
        sessionId,
        asanaId: step.asanaId,
        durationSeconds: elapsed,
        rating: feel ?? undefined,
      });
      if (path && promise && clip) {
        try {
          await promise;
          await attachVideoToAttempt({
            attemptId,
            videoPath: path,
            videoSizeBytes: clip.blob.size,
          });
        } catch (e) {
          console.error('attach video failed', e);
        }
      }
    } catch (e) {
      console.error('recordHold failed', e);
    }
  }

  function advanceFrom(i: number, elapsed: number, feel: Rating | null) {
    void recordStep(i, elapsed, feel);
    resetPerPose();
    if (i + 1 < steps.length) {
      setIndex(i + 1);
      setSecondsLeft(steps[i + 1].holdSeconds);
    } else {
      setPhase('finishing');
    }
  }

  // One timer drives the flow. Each tick counts down or, on the final second,
  // records the hold and advances. State updates happen inside the timeout
  // callback (not synchronously in the effect body). Paused while recording.
  useEffect(() => {
    if (phase !== 'playing' || !running || secondsLeft <= 0) return;
    const t = setTimeout(() => {
      if (secondsLeft <= 1) {
        advanceFrom(index, steps[index]?.holdSeconds ?? 0, rating);
      } else {
        setSecondsLeft((s) => s - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, running, secondsLeft, index, rating]);

  function handleClipChange(clip: RecordedClip | null) {
    const prevPath = uploadPathRef.current;
    const prevPromise = uploadPromiseRef.current;
    uploadPathRef.current = null;
    uploadPromiseRef.current = null;
    clipRef.current = null;
    if (prevPath) {
      Promise.resolve(prevPromise)
        .catch(() => undefined)
        .then(() => deleteVideoBlob(prevPath))
        .catch(() => undefined);
    }
    if (clip === null) {
      setUploadStatus('idle');
      return;
    }
    clipRef.current = clip;
    setUploadStatus('uploading');
    setError(null);
    const path = buildVideoPath(userId, clip.blob.type);
    uploadPathRef.current = path;
    uploadPromiseRef.current = uploadVideoBlob(path, clip.blob).then(
      () => {
        if (uploadPathRef.current === path) setUploadStatus('uploaded');
      },
      (err: unknown) => {
        if (uploadPathRef.current === path) {
          setUploadStatus('failed');
          setError(
            `Video upload failed: ${err instanceof Error ? err.message : 'unknown error'}. You can re-record or continue without it.`,
          );
        }
        throw err;
      },
    );
  }

  const handleFinish = () => {
    setError(null);
    startTransition(async () => {
      try {
        await finishFlowSession(sessionId, mood, notes);
      } catch (err) {
        if (err instanceof Error) {
          const digest = (err as Error & { digest?: string }).digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) throw err;
          setError(err.message);
        } else {
          setError('Something went wrong. Please try again.');
        }
      }
    });
  };

  if (phase === 'finishing') {
    return (
      <section className="flex flex-col gap-6">
        <header>
          <p className="text-sm text-violet-900/60">Flow complete</p>
          <h1 className="text-3xl font-semibold tracking-tight">How did it feel?</h1>
        </header>
        <div className={`${CARD} flex flex-col gap-4`}>
          <p className="text-violet-900/80">
            You moved through {completedCount} {completedCount === 1 ? 'pose' : 'poses'} in{' '}
            <strong>{flowName}</strong>.
          </p>
          <fieldset>
            <legend className="text-sm font-medium text-violet-900/70">
              How do you feel overall?
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const selected = mood === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    disabled={isPending}
                    aria-pressed={selected}
                    aria-label={m.label}
                    className={`flex flex-col items-center gap-1 rounded-full border px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50 ${
                      selected
                        ? 'border-violet-500 bg-violet-100 text-violet-900'
                        : 'border-violet-200 bg-white text-violet-900/80 hover:border-violet-400'
                    }`}
                  >
                    <span className="text-2xl" aria-hidden>
                      {m.emoji}
                    </span>
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <label htmlFor="flow-notes" className="text-sm font-medium text-violet-900/70">
              Anything to remember? (optional)
            </label>
            <textarea
              id="flow-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How the breath felt, poses to revisit…"
              rows={3}
              disabled={isPending}
              className="w-full rounded-lg border border-violet-200 px-3 py-2 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button type="button" onClick={handleFinish} disabled={isPending} className={PRIMARY_BTN}>
            {isPending ? 'Saving…' : 'Save practice'}
          </button>
        </div>
      </section>
    );
  }

  const step = steps[index];
  const pct = step.holdSeconds > 0 ? (secondsLeft / step.holdSeconds) * 100 : 0;
  const side = sideLabel(step.side);
  const progressPct =
    ((index + (1 - secondsLeft / Math.max(1, step.holdSeconds))) / steps.length) * 100;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm text-violet-900/60">{flowName}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-violet-950">
            Pose {index + 1} of {steps.length}
          </h1>
        </div>
        <Link href="/yoga/flows" className="text-sm text-violet-700 hover:underline">
          Exit
        </Link>
      </header>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
        <div className="h-full bg-violet-400 transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      <div className={`${CARD} flex flex-col items-center gap-4 text-center`}>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-2xl font-semibold tracking-tight text-violet-900">{step.name}</h2>
          {step.sanskritName ? (
            <p className="text-sm italic text-violet-900/60">{step.sanskritName}</p>
          ) : null}
          {side ? (
            <span className="mt-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              {side}
            </span>
          ) : null}
        </div>

        <div
          className="relative flex h-44 w-44 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(var(--color-violet-500) ${pct}%, var(--color-violet-100) ${pct}%)`,
          }}
          role="timer"
          aria-label={`${fmt(secondsLeft)} remaining`}
        >
          <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white">
            <span className="text-4xl font-semibold tabular-nums text-violet-950">
              {fmt(secondsLeft)}
            </span>
          </div>
        </div>

        {step.breathCue ? (
          <p className="text-sm font-medium text-violet-700">{step.breathCue}</p>
        ) : null}

        {step.cues.length > 0 ? (
          <ul className="flex flex-col gap-1 text-left text-sm text-violet-900/75">
            {step.cues.map((c) => (
              <li key={c} className="flex gap-2">
                <span aria-hidden className="text-violet-400">
                  •
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <fieldset className="w-full">
          <legend className="sr-only">How did this pose feel?</legend>
          <div className="flex flex-wrap justify-center gap-1.5">
            {FEEL.map((f) => {
              const selected = rating === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setRating(f.value)}
                  aria-pressed={selected}
                  aria-label={f.label}
                  title={f.label}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition ${
                    selected
                      ? 'border-violet-500 bg-violet-100'
                      : 'border-violet-200 bg-white hover:border-violet-400'
                  }`}
                >
                  <span aria-hidden>{f.emoji}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {recordMode ? (
          <div className="w-full text-left">
            <VideoRecorder onChange={handleClipChange} disabled={isPending} />
            {uploadStatus === 'uploading' ? (
              <p className="mt-1 text-xs text-violet-900/60">Uploading video…</p>
            ) : null}
            {uploadStatus === 'uploaded' ? (
              <p className="mt-1 text-xs text-emerald-700">
                Video ready — it&apos;ll save with this pose when you continue.
              </p>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRecordMode(true);
              setRunning(false);
            }}
            className="rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-200"
          >
            🎥 Record this pose
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          disabled={recordMode}
          className={GHOST_BTN}
        >
          {running ? 'Pause' : 'Resume'}
        </button>
        <button type="button" onClick={() => setSecondsLeft((s) => s + 15)} className={GHOST_BTN}>
          +15s
        </button>
        <button
          type="button"
          onClick={() => advanceFrom(index, step.holdSeconds - secondsLeft, rating)}
          className={GHOST_BTN}
        >
          {index + 1 < steps.length ? 'Next pose →' : 'Finish flow →'}
        </button>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            void recordStep(index, step.holdSeconds - secondsLeft, rating);
            setPhase('finishing');
          }}
          className="text-sm text-violet-900/50 underline-offset-2 hover:underline"
        >
          End practice early
        </button>
      </div>
    </section>
  );
}
