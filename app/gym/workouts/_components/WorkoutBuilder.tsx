'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { WORKOUT_FOCUS_LABELS, type WorkoutFocus } from '@/lib/gym/types';
import { createWorkoutAction } from '../../actions';

export interface BuilderExercise {
  id: string;
  name: string;
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
}

interface DraftExercise {
  key: string;
  exerciseId: string;
  sets: number;
  targetReps: number;
  targetWeight: string;
  restSeconds: number;
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

const CARD = 'rounded-2xl border border-violet-200 bg-white p-5 shadow-sm';
const INPUT =
  'w-full rounded-lg border border-violet-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none';
const NUM =
  'w-24 rounded-lg border border-violet-200 px-2 py-1.5 text-sm focus:border-violet-500 focus:outline-none';
const PRIMARY_BTN =
  'rounded-full bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50';
const GHOST_BTN =
  'rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:border-violet-400 disabled:opacity-50';

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `e${keySeq}`;
}

export default function WorkoutBuilder({ exercises }: { exercises: BuilderExercise[] }) {
  const first = exercises[0];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [focus, setFocus] = useState<WorkoutFocus>('full');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Beginner');
  const [items, setItems] = useState<DraftExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const byId = new Map(exercises.map((e) => [e.id, e]));

  function addItem() {
    if (!first) return;
    setItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        exerciseId: first.id,
        sets: first.defaultSets,
        targetReps: first.defaultReps,
        targetWeight: '',
        restSeconds: first.defaultRestSeconds,
      },
    ]);
  }

  function update(key: string, patch: Partial<DraftExercise>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function remove(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function move(key: string, dir: -1 | 1) {
    setItems((prev) => {
      const i = prev.findIndex((it) => it.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function handleSave() {
    setError(null);
    if (name.trim().length === 0) {
      setError('Give your workout a name.');
      return;
    }
    if (items.length === 0) {
      setError('Add at least one exercise.');
      return;
    }
    startTransition(async () => {
      try {
        await createWorkoutAction({
          name,
          description,
          focus,
          level,
          exercises: items.map((it) => ({
            exerciseId: it.exerciseId,
            sets: Number(it.sets),
            targetReps: Number(it.targetReps),
            targetWeight: it.targetWeight,
            restSeconds: Number(it.restSeconds),
          })),
        });
      } catch (err) {
        if (err instanceof Error) {
          const digest = (err as Error & { digest?: string }).digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) throw err;
          setError(err.message);
        } else {
          setError('Could not save the workout.');
        }
      }
    });
  }

  if (!first) {
    return (
      <p className={CARD}>
        Your exercise library is empty, so there&apos;s nothing to build a workout from yet.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-violet-900">New workout</h1>
          <p className="text-sm text-violet-900/70">Build a routine from your exercises.</p>
        </div>
        <Link href="/gym/workouts" className="text-sm text-violet-700 hover:underline">
          Cancel
        </Link>
      </header>

      <div className={`${CARD} flex flex-col gap-3`}>
        <div className="flex flex-col gap-1">
          <label htmlFor="wk-name" className="text-sm font-medium text-violet-900/70">
            Name
          </label>
          <input
            id="wk-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Upper body A"
            className={INPUT}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="wk-desc" className="text-sm font-medium text-violet-900/70">
            Description (optional)
          </label>
          <input
            id="wk-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Chest, back, and arms"
            className={INPUT}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="wk-focus" className="text-sm font-medium text-violet-900/70">
              Focus
            </label>
            <select
              id="wk-focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value as WorkoutFocus)}
              className={INPUT}
              disabled={isPending}
            >
              {(Object.keys(WORKOUT_FOCUS_LABELS) as WorkoutFocus[]).map((f) => (
                <option key={f} value={f}>
                  {WORKOUT_FOCUS_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="wk-level" className="text-sm font-medium text-violet-900/70">
              Level
            </label>
            <select
              id="wk-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}
              className={INPUT}
              disabled={isPending}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-violet-900">
            Exercises <span className="font-normal text-violet-900/50">({items.length})</span>
          </h2>
          <button type="button" onClick={addItem} disabled={isPending} className={GHOST_BTN}>
            + Add exercise
          </button>
        </div>

        {items.length === 0 ? (
          <p className={`${CARD} text-sm text-violet-900/60`}>
            No exercises yet. Tap &ldquo;Add exercise&rdquo; to start building.
          </p>
        ) : (
          items.map((it, i) => (
            <div key={it.key} className={`${CARD} flex flex-col gap-3`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-violet-900/50">Exercise {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(it.key, -1)}
                    disabled={isPending || i === 0}
                    aria-label="Move up"
                    className={GHOST_BTN}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(it.key, 1)}
                    disabled={isPending || i === items.length - 1}
                    aria-label="Move down"
                    className={GHOST_BTN}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.key)}
                    disabled={isPending}
                    aria-label="Remove exercise"
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-violet-900/60">Exercise</label>
                <select
                  value={it.exerciseId}
                  onChange={(e) => {
                    const ex = byId.get(e.target.value);
                    update(it.key, {
                      exerciseId: e.target.value,
                      sets: ex ? ex.defaultSets : it.sets,
                      targetReps: ex ? ex.defaultReps : it.targetReps,
                      restSeconds: ex ? ex.defaultRestSeconds : it.restSeconds,
                    });
                  }}
                  className={INPUT}
                  disabled={isPending}
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-violet-900/60">Sets</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={it.sets}
                    onChange={(e) => update(it.key, { sets: Number(e.target.value) })}
                    className={NUM}
                    disabled={isPending}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-violet-900/60">Target reps</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={it.targetReps}
                    onChange={(e) => update(it.key, { targetReps: Number(e.target.value) })}
                    className={NUM}
                    disabled={isPending}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-violet-900/60">Weight (optional)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={it.targetWeight}
                    onChange={(e) => update(it.key, { targetWeight: e.target.value })}
                    placeholder="—"
                    className={NUM}
                    disabled={isPending}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-violet-900/60">Rest (sec)</label>
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={it.restSeconds}
                    onChange={(e) => update(it.key, { restSeconds: Number(e.target.value) })}
                    className={NUM}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          ))
        )}
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
        <button type="button" onClick={handleSave} disabled={isPending} className={PRIMARY_BTN}>
          {isPending ? 'Saving…' : 'Save workout'}
        </button>
      </div>
    </section>
  );
}
