'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Rating } from '@/lib/types';
import { finishWorkoutSession, logSet } from '../actions';

export interface LoggerExercise {
  exerciseId: string;
  name: string;
  primaryMuscles: string[];
  cues: string[];
  sets: number;
  targetReps: number;
  targetWeight: number | null;
  restSeconds: number;
}

interface Props {
  sessionId: string;
  workoutName: string;
  exercises: LoggerExercise[];
}

interface SetRow {
  reps: string;
  weight: string;
  done: boolean;
}

const MOODS: { value: Rating; emoji: string; label: string }[] = [
  { value: 1, emoji: '😩', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '🙂', label: 'OK' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Strong' },
];

const CARD = 'rounded-2xl border border-violet-200 bg-white p-5 shadow-sm';
const PRIMARY_BTN =
  'rounded-full bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50';
const GHOST_BTN =
  'rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition hover:border-violet-400 disabled:opacity-50';
const NUM_INPUT =
  'w-20 rounded-lg border border-violet-200 px-2 py-1.5 text-center text-sm focus:border-violet-500 focus:outline-none';

function fmt(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function GymLogger({ sessionId, workoutName, exercises }: Props) {
  const [phase, setPhase] = useState<'logging' | 'finishing'>('logging');
  const [index, setIndex] = useState(0);
  const [logged, setLogged] = useState<SetRow[][]>(() =>
    exercises.map((e) =>
      Array.from({ length: e.sets }, () => ({
        reps: String(e.targetReps),
        weight: e.targetWeight !== null ? String(e.targetWeight) : '',
        done: false,
      })),
    ),
  );
  const [restLeft, setRestLeft] = useState(0);
  const [resting, setResting] = useState(false);

  const [mood, setMood] = useState<Rating | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const savingRef = useRef<Set<string>>(new Set());

  // Rest countdown.
  useEffect(() => {
    if (!resting || restLeft <= 0) return;
    const t = setTimeout(() => {
      setRestLeft((s) => {
        if (s <= 1) setResting(false);
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [resting, restLeft]);

  const totalVolume = logged.reduce(
    (sum, rows) =>
      sum +
      rows.reduce((s, r) => {
        if (!r.done) return s;
        const reps = Number(r.reps) || 0;
        const weight = r.weight.trim() === '' ? 0 : Number(r.weight) || 0;
        return s + reps * weight;
      }, 0),
    0,
  );
  const completedSets = logged.reduce(
    (sum, rows) => sum + rows.filter((r) => r.done).length,
    0,
  );

  function updateSet(exIdx: number, setIdx: number, patch: Partial<SetRow>) {
    setLogged((prev) =>
      prev.map((rows, i) =>
        i === exIdx ? rows.map((r, j) => (j === setIdx ? { ...r, ...patch } : r)) : rows,
      ),
    );
  }

  function startRest(seconds: number) {
    if (seconds <= 0) {
      setResting(false);
      setRestLeft(0);
      return;
    }
    setRestLeft(seconds);
    setResting(true);
  }

  function handleLog(exIdx: number, setIdx: number) {
    const ex = exercises[exIdx];
    const row = logged[exIdx][setIdx];
    const key = `${exIdx}:${setIdx}`;
    if (savingRef.current.has(key) || row.done) return;
    savingRef.current.add(key);

    const reps = Math.max(0, Math.floor(Number(row.reps) || 0));
    const weight = row.weight.trim() === '' ? null : Number(row.weight);

    // Optimistic: mark done, carry values to the next undone set, start rest.
    updateSet(exIdx, setIdx, { done: true });
    setLogged((prev) =>
      prev.map((rows, i) => {
        if (i !== exIdx) return rows;
        const nextUndone = rows.findIndex((r, j) => j > setIdx && !r.done);
        if (nextUndone === -1) return rows;
        return rows.map((r, j) =>
          j === nextUndone ? { ...r, reps: String(reps), weight: row.weight } : r,
        );
      }),
    );
    const isLastSet = setIdx === ex.sets - 1;
    if (!isLastSet) startRest(ex.restSeconds);

    logSet({ sessionId, exerciseId: ex.exerciseId, reps, weight })
      .catch((e) => {
        console.error('logSet failed', e);
        updateSet(exIdx, setIdx, { done: false });
        setError('That set didn’t save — tap to log it again.');
      })
      .finally(() => savingRef.current.delete(key));
  }

  const handleFinish = () => {
    setError(null);
    startTransition(async () => {
      try {
        await finishWorkoutSession(sessionId, mood, notes);
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
          <p className="text-sm text-violet-900/60">Workout complete</p>
          <h1 className="text-3xl font-semibold tracking-tight">How did it go?</h1>
        </header>
        <div className={`${CARD} flex flex-col gap-4`}>
          <p className="text-violet-900/80">
            You logged {completedSets} {completedSets === 1 ? 'set' : 'sets'} in{' '}
            <strong>{workoutName}</strong>
            {totalVolume > 0 ? <> · {Math.round(totalVolume).toLocaleString()} total volume</> : null}.
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
            <label htmlFor="wk-notes" className="text-sm font-medium text-violet-900/70">
              Anything to remember? (optional)
            </label>
            <textarea
              id="wk-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="PRs, form notes, what to push next time…"
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
            {isPending ? 'Saving…' : 'Save workout'}
          </button>
        </div>
      </section>
    );
  }

  const ex = exercises[index];
  const rows = logged[index];
  const isLastExercise = index === exercises.length - 1;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm text-violet-900/60">{workoutName}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-violet-950">
            Exercise {index + 1} of {exercises.length}
          </h1>
        </div>
        <Link href="/gym/workouts" className="text-sm text-violet-700 hover:underline">
          Exit
        </Link>
      </header>

      {resting ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-violet-300 bg-violet-50 px-5 py-3">
          <span className="text-sm font-medium text-violet-800">
            Rest · <span className="tabular-nums">{fmt(restLeft)}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setResting(false);
              setRestLeft(0);
            }}
            className={GHOST_BTN}
          >
            Skip rest
          </button>
        </div>
      ) : null}

      <div className={`${CARD} flex flex-col gap-4`}>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-violet-900">{ex.name}</h2>
          {ex.primaryMuscles.length > 0 ? (
            <p className="text-xs text-violet-900/60">{ex.primaryMuscles.join(' · ')}</p>
          ) : null}
          <p className="mt-1 text-sm text-violet-700">
            Target: {ex.sets} × {ex.targetReps}
            {ex.targetWeight !== null ? ` @ ${ex.targetWeight}` : ''}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-violet-900/50">
            <span className="w-10">Set</span>
            <span className="w-20 text-center">Reps</span>
            <span className="w-20 text-center">Weight</span>
            <span className="flex-1" />
          </div>
          {rows.map((row, setIdx) => (
            <div key={setIdx} className="flex items-center gap-3">
              <span className="w-10 text-sm font-medium text-violet-900/70">{setIdx + 1}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={row.reps}
                onChange={(e) => updateSet(index, setIdx, { reps: e.target.value })}
                disabled={row.done}
                className={NUM_INPUT}
                aria-label={`Set ${setIdx + 1} reps`}
              />
              <input
                type="number"
                min={0}
                step="0.5"
                inputMode="decimal"
                value={row.weight}
                onChange={(e) => updateSet(index, setIdx, { weight: e.target.value })}
                disabled={row.done}
                placeholder="—"
                className={NUM_INPUT}
                aria-label={`Set ${setIdx + 1} weight`}
              />
              <div className="flex-1 text-right">
                {row.done ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    ✓ Logged
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleLog(index, setIdx)}
                    className="rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-200"
                  >
                    Log set
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {ex.cues.length > 0 ? (
          <ul className="flex flex-col gap-1 border-t border-violet-100 pt-3 text-sm text-violet-900/70">
            {ex.cues.map((c) => (
              <li key={c} className="flex gap-2">
                <span aria-hidden className="text-violet-400">
                  •
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="text-center text-sm text-violet-900/60">
        {completedSets} sets logged
        {totalVolume > 0 ? ` · ${Math.round(totalVolume).toLocaleString()} volume` : ''}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className={GHOST_BTN}
        >
          ← Previous
        </button>
        {isLastExercise ? (
          <button type="button" onClick={() => setPhase('finishing')} className={PRIMARY_BTN}>
            Finish workout →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setResting(false);
              setRestLeft(0);
              setIndex((i) => Math.min(exercises.length - 1, i + 1));
            }}
            className={GHOST_BTN}
          >
            Next exercise →
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setPhase('finishing')}
          className="text-sm text-violet-900/50 underline-offset-2 hover:underline"
        >
          End workout early
        </button>
      </div>
    </section>
  );
}
