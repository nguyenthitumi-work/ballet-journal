'use client';

import { useMemo, useState } from 'react';
import type { Rating, SkillAttempt } from '@/lib/types';
import AttemptMedia from './AttemptMedia';

interface Props {
  attempts: SkillAttempt[];
}

const TZ = 'America/Los_Angeles';

function formatAttemptDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function Stars({ rating }: { rating: Rating }) {
  return (
    <span aria-label={`${rating} of 5`} className="text-violet-600">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= rating ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

function MilestonePill() {
  return (
    <span
      aria-label="Milestone"
      title="Milestone"
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800"
    >
      <span aria-hidden>⭐</span>
      Milestone
    </span>
  );
}

export function AttemptsTimeline({ attempts }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string[]>([]);

  const byId = useMemo(() => {
    const m = new Map<string, SkillAttempt>();
    for (const a of attempts) m.set(a.id, a);
    return m;
  }, [attempts]);

  if (attempts.length === 0) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium text-violet-900/70">History</h2>
        <p className="mt-2 text-sm text-violet-900/70">
          No attempts yet. Tap a skill in practice to log your first try.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const clearSelection = () => setSelected([]);

  const selectionDisabled = (id: string) =>
    selected.length >= 2 && !selected.includes(id);

  // Compare pair ordered earliest -> latest for the classic before/after read.
  const comparePair: SkillAttempt[] = selected.length === 2
    ? selected
        .map((id) => byId.get(id))
        .filter((a): a is SkillAttempt => a !== undefined)
        .sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt))
    : [];

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-violet-900/70">History</h2>
        <span className="text-xs text-violet-900/60">
          {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}
        </span>
      </div>

      {comparePair.length === 2 ? (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-violet-900/70">
              Before · After
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-violet-700 hover:text-violet-900 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {comparePair.map((a) => (
              <div key={a.id} className="flex flex-col gap-2 rounded-lg bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-violet-950">
                    {formatAttemptDate(a.attemptedAt)}
                  </span>
                  <Stars rating={a.rating} />
                </div>
                {a.isMilestone ? <MilestonePill /> : null}
                <AttemptMedia videoPath={a.videoPath} photoPath={a.photoPath} />
                {a.notes ? (
                  <p className="text-sm text-violet-900/80 italic">
                    &ldquo;{a.notes}&rdquo;
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <ul className="mt-4 flex flex-col gap-2">
        {attempts.map((a) => {
          const isOpen = expanded.has(a.id);
          const isSelected = selected.includes(a.id);
          const disabled = selectionDisabled(a.id);
          const hasMedia = a.videoPath !== null || a.photoPath !== null;
          return (
            <li
              key={a.id}
              className={`rounded-xl border p-3 transition ${
                isSelected
                  ? 'border-violet-500 bg-violet-50/60'
                  : 'border-violet-100 bg-violet-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => toggleSelect(a.id)}
                  aria-label={`Select attempt from ${formatAttemptDate(a.attemptedAt)} for compare`}
                  className="mt-1 h-4 w-4 accent-violet-600 disabled:opacity-40"
                />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-violet-950">
                      {formatAttemptDate(a.attemptedAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      {a.isMilestone ? <MilestonePill /> : null}
                      <Stars rating={a.rating} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-violet-900/60">
                    {a.videoPath ? <span aria-label="Has video">🎥 Video</span> : null}
                    {a.photoPath ? <span aria-label="Has photo">📷 Photo</span> : null}
                    {a.notes ? <span className="line-clamp-1 italic">&ldquo;{a.notes}&rdquo;</span> : null}
                  </div>
                  {hasMedia || a.notes ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(a.id)}
                      className="self-start text-xs font-medium text-violet-700 hover:text-violet-900 hover:underline"
                      aria-expanded={isOpen}
                    >
                      {isOpen ? 'Hide details' : 'Show details'}
                    </button>
                  ) : null}
                  {isOpen ? (
                    <div className="mt-2 flex flex-col gap-2">
                      {hasMedia ? (
                        <AttemptMedia videoPath={a.videoPath} photoPath={a.photoPath} />
                      ) : null}
                      {a.notes ? (
                        <p className="text-sm text-violet-900/80 italic">
                          &ldquo;{a.notes}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {selected.length === 1 ? (
        <p className="mt-3 text-xs text-violet-900/60">
          Pick one more attempt to compare side-by-side.
        </p>
      ) : null}
      {selected.length === 0 && attempts.length >= 2 ? (
        <p className="mt-3 text-xs text-violet-900/60">
          Tip: tick two attempts to see them side-by-side.
        </p>
      ) : null}
    </div>
  );
}
