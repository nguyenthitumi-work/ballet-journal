'use client';

import { useState, useTransition } from 'react';
import type { ProgressStatus } from '@/lib/types';
import { setProgressStatus } from '../actions';

interface ProgressStatusToggleProps {
  skillId: string;
  initial: ProgressStatus;
}

const OPTIONS: { value: ProgressStatus; label: string; emoji: string }[] = [
  { value: 'learning', label: 'Learning', emoji: '🌱' },
  { value: 'practicing', label: 'Practicing', emoji: '🪻' },
  { value: 'mastered', label: 'Mastered', emoji: '🌟' },
];

export function ProgressStatusToggle({ skillId, initial }: ProgressStatusToggleProps) {
  const [status, setStatus] = useState<ProgressStatus>(initial);
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: ProgressStatus) {
    if (next === status) return;
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      try {
        await setProgressStatus(skillId, next);
      } catch {
        setStatus(previous);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-violet-900/70">Progress</span>
      <div
        role="group"
        aria-label="Progress status"
        className="inline-flex w-fit overflow-hidden rounded-full border border-violet-300 bg-white"
      >
        {OPTIONS.map((opt) => {
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              disabled={isPending}
              aria-pressed={active}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
                active
                  ? 'bg-violet-600 text-white'
                  : 'text-violet-700 hover:bg-violet-50 hover:text-violet-800'
              }`}
            >
              <span aria-hidden>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
