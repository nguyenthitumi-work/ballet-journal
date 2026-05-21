'use client';

import { useState } from 'react';
import type { ViewableDancer } from '@/lib/db/families';
import { setViewContextAction } from '@/app/actions';

interface ViewContextSwitcherProps {
  dancers: ViewableDancer[];
  currentDancerId: string;
}

export function ViewContextSwitcher({ dancers, currentDancerId }: ViewContextSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentDancer = dancers.find((d) => d.userId === currentDancerId);

  if (dancers.length <= 1) return null;

  async function handleSelect(dancerId: string) {
    await setViewContextAction(dancerId);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-200"
      >
        <span className="text-xs">Viewing:</span>
        <span>{currentDancer?.name || 'Unknown'}</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-violet-200 bg-white shadow-lg">
            {dancers.map((d) => (
              <button
                key={d.userId}
                type="button"
                onClick={() => handleSelect(d.userId)}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-violet-50 ${d.userId === currentDancerId ? 'bg-violet-100 font-medium text-violet-900' : 'text-violet-900/80'} first:rounded-t-lg last:rounded-b-lg`}
              >
                <div>{d.name || 'Unknown'}</div>
                <div className="text-xs text-violet-700">
                  {d.source === 'self' ? 'You' : d.source === 'family' ? 'Family' : 'Class'}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
