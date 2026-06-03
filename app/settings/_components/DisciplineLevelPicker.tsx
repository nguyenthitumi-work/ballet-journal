'use client';

import { useState, useTransition } from 'react';
import { setDisciplineLevelAction } from '../actions';

type Level = 'Beginner' | 'Intermediate' | 'Advanced';
const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];

interface Props {
  discipline: string;
  disciplineLabel: string;
  currentLevel: Level;
}

export default function DisciplineLevelPicker({ discipline, disciplineLabel, currentLevel }: Props) {
  const [level, setLevel] = useState<Level>(currentLevel);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function choose(next: Level) {
    if (next === level || isPending) return;
    const previous = level;
    setLevel(next);
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await setDisciplineLevelAction(discipline, next);
        setSaved(true);
      } catch (err) {
        setLevel(previous);
        setError(err instanceof Error ? err.message : 'Could not save level.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-violet-900/70">
        Your {disciplineLabel} level — separate from your other disciplines.
      </p>
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => {
          const active = l === level;
          return (
            <button
              key={l}
              type="button"
              onClick={() => choose(l)}
              disabled={isPending}
              aria-pressed={active}
              className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                active
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'border border-violet-200 bg-white text-violet-700 hover:border-violet-400'
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>
      {saved ? <p className="text-xs text-emerald-700">Saved.</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
