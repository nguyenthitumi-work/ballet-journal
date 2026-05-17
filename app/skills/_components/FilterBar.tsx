'use client';

import { useRef } from 'react';
import type { CategoryId, Difficulty } from '@/lib/types';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Hard' },
  { value: 5, label: 'Advanced' },
];

interface FilterBarProps {
  q: string;
  cat: CategoryId | null;
  diff: Difficulty | null;
  train: string | null;
  trainOptions: string[];
}

export function FilterBar({ q, cat, diff, train, trainOptions }: FilterBarProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const submit = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      method="get"
      action="/skills"
      role="search"
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
    >
      {cat ? <input type="hidden" name="cat" value={cat} /> : null}

      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search skills…"
        className="min-w-0 flex-1 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm shadow-sm outline-none placeholder:text-violet-900/40 focus:border-violet-400"
      />

      <label className="sr-only" htmlFor="diff-select">
        Difficulty
      </label>
      <select
        id="diff-select"
        name="diff"
        defaultValue={diff ? String(diff) : ''}
        onChange={submit}
        className="rounded-full border border-violet-200 bg-white px-3 py-2 text-sm text-violet-900 shadow-sm outline-none focus:border-violet-400"
      >
        <option value="">All difficulties</option>
        {DIFFICULTY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="train-select">
        Trains
      </label>
      <select
        id="train-select"
        name="train"
        defaultValue={train ?? ''}
        onChange={submit}
        className="rounded-full border border-violet-200 bg-white px-3 py-2 text-sm text-violet-900 shadow-sm outline-none focus:border-violet-400"
      >
        <option value="">All focus areas</option>
        {trainOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Submit button so Enter still works for the text input; hidden visually. */}
      <button type="submit" className="sr-only">
        Apply filters
      </button>
    </form>
  );
}
