'use client';

import { useState, useTransition } from 'react';
import { toggleFocus } from '../actions';

interface FocusToggleProps {
  skillId: string;
  initial: boolean;
}

export function FocusToggle({ skillId, initial }: FocusToggleProps) {
  const [focused, setFocused] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const nextValue = !focused;
    // Optimistic update — flip the UI immediately, server action reconciles.
    setFocused(nextValue);
    startTransition(async () => {
      try {
        await toggleFocus(skillId, nextValue);
      } catch {
        // Revert on failure so UI matches server state.
        setFocused(!nextValue);
      }
    });
  }

  const label = focused ? "You're working on this!" : 'Add to what I’m working on';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={focused}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition disabled:opacity-60 ${
        focused
          ? 'bg-pink-600 text-white hover:bg-pink-700'
          : 'border border-pink-300 bg-white text-pink-700 hover:border-pink-500 hover:text-pink-800'
      }`}
    >
      <span aria-hidden className="text-base leading-none">
        {focused ? '♥' : '♡'}
      </span>
      <span>{label}</span>
    </button>
  );
}
