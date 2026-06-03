'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { YOGA_STYLE_LABELS, type YogaStyle } from '@/lib/yoga/types';
import { createFlowAction } from '../../actions';

export interface BuilderAsana {
  id: string;
  name: string;
  defaultHoldSeconds: number;
}

interface DraftPose {
  key: string;
  asanaId: string;
  holdSeconds: number;
  side: 'center' | 'left' | 'right';
  breathCue: string;
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
const SIDES = [
  { value: 'center', label: 'Both / center' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
] as const;

const CARD = 'rounded-2xl border border-violet-200 bg-white p-5 shadow-sm';
const INPUT =
  'w-full rounded-lg border border-violet-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none';
const PRIMARY_BTN =
  'rounded-full bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50';
const GHOST_BTN =
  'rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:border-violet-400 disabled:opacity-50';

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `p${keySeq}`;
}

export default function FlowBuilder({ asanas }: { asanas: BuilderAsana[] }) {
  const firstAsana = asanas[0];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState<YogaStyle>('vinyasa');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Beginner');
  const [poses, setPoses] = useState<DraftPose[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const asanaById = new Map(asanas.map((a) => [a.id, a]));
  const totalSeconds = poses.reduce((sum, p) => sum + (Number(p.holdSeconds) || 0), 0);

  function addPose() {
    if (!firstAsana) return;
    setPoses((prev) => [
      ...prev,
      {
        key: nextKey(),
        asanaId: firstAsana.id,
        holdSeconds: firstAsana.defaultHoldSeconds,
        side: 'center',
        breathCue: '',
      },
    ]);
  }

  function updatePose(key: string, patch: Partial<DraftPose>) {
    setPoses((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function removePose(key: string) {
    setPoses((prev) => prev.filter((p) => p.key !== key));
  }

  function move(key: string, dir: -1 | 1) {
    setPoses((prev) => {
      const i = prev.findIndex((p) => p.key === key);
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
      setError('Give your flow a name.');
      return;
    }
    if (poses.length === 0) {
      setError('Add at least one pose.');
      return;
    }
    startTransition(async () => {
      try {
        await createFlowAction({
          name,
          description,
          style,
          level,
          poses: poses.map((p) => ({
            asanaId: p.asanaId,
            holdSeconds: Number(p.holdSeconds),
            side: p.side,
            breathCue: p.breathCue,
          })),
        });
      } catch (err) {
        if (err instanceof Error) {
          const digest = (err as Error & { digest?: string }).digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) throw err;
          setError(err.message);
        } else {
          setError('Could not save the flow.');
        }
      }
    });
  }

  if (!firstAsana) {
    return (
      <p className={CARD}>
        Your asana library is empty, so there&apos;s nothing to build a flow from yet.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-violet-900">New flow</h1>
          <p className="text-sm text-violet-900/70">Build a sequence from your poses.</p>
        </div>
        <Link href="/yoga/flows" className="text-sm text-violet-700 hover:underline">
          Cancel
        </Link>
      </header>

      <div className={`${CARD} flex flex-col gap-3`}>
        <div className="flex flex-col gap-1">
          <label htmlFor="flow-name" className="text-sm font-medium text-violet-900/70">
            Name
          </label>
          <input
            id="flow-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Morning reset"
            className={INPUT}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="flow-desc" className="text-sm font-medium text-violet-900/70">
            Description (optional)
          </label>
          <input
            id="flow-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A gentle wake-up sequence"
            className={INPUT}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="flow-style" className="text-sm font-medium text-violet-900/70">
              Style
            </label>
            <select
              id="flow-style"
              value={style}
              onChange={(e) => setStyle(e.target.value as YogaStyle)}
              className={INPUT}
              disabled={isPending}
            >
              {(Object.keys(YOGA_STYLE_LABELS) as YogaStyle[]).map((s) => (
                <option key={s} value={s}>
                  {YOGA_STYLE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="flow-level" className="text-sm font-medium text-violet-900/70">
              Level
            </label>
            <select
              id="flow-level"
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
            Poses{' '}
            <span className="font-normal text-violet-900/50">
              ({poses.length} · ~{Math.max(0, Math.round(totalSeconds / 60))} min)
            </span>
          </h2>
          <button type="button" onClick={addPose} disabled={isPending} className={GHOST_BTN}>
            + Add pose
          </button>
        </div>

        {poses.length === 0 ? (
          <p className={`${CARD} text-sm text-violet-900/60`}>
            No poses yet. Tap &ldquo;Add pose&rdquo; to start building.
          </p>
        ) : (
          poses.map((p, i) => (
            <div key={p.key} className={`${CARD} flex flex-col gap-3`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-violet-900/50">Pose {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(p.key, -1)}
                    disabled={isPending || i === 0}
                    aria-label="Move up"
                    className={GHOST_BTN}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(p.key, 1)}
                    disabled={isPending || i === poses.length - 1}
                    aria-label="Move down"
                    className={GHOST_BTN}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removePose(p.key)}
                    disabled={isPending}
                    aria-label="Remove pose"
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-violet-900/60">Pose</label>
                <select
                  value={p.asanaId}
                  onChange={(e) => {
                    const a = asanaById.get(e.target.value);
                    updatePose(p.key, {
                      asanaId: e.target.value,
                      holdSeconds: a ? a.defaultHoldSeconds : p.holdSeconds,
                    });
                  }}
                  className={INPUT}
                  disabled={isPending}
                >
                  {asanas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-violet-900/60">Hold (sec)</label>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={p.holdSeconds}
                    onChange={(e) => updatePose(p.key, { holdSeconds: Number(e.target.value) })}
                    className={`${INPUT} w-28`}
                    disabled={isPending}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-violet-900/60">Side</label>
                  <select
                    value={p.side}
                    onChange={(e) =>
                      updatePose(p.key, { side: e.target.value as DraftPose['side'] })
                    }
                    className={INPUT}
                    disabled={isPending}
                  >
                    {SIDES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-violet-900/60">Breath cue (optional)</label>
                <input
                  value={p.breathCue}
                  onChange={(e) => updatePose(p.key, { breathCue: e.target.value })}
                  placeholder="Inhale to lengthen, exhale to fold"
                  className={INPUT}
                  disabled={isPending}
                />
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
          {isPending ? 'Saving…' : 'Save flow'}
        </button>
      </div>
    </section>
  );
}
