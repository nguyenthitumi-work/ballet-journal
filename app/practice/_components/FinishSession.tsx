'use client';

import { useState, useTransition } from 'react';
import { finishSession } from '../actions';

interface Props {
  sessionId: string;
}

const MOODS: { value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }[] = [
  { value: 1, emoji: '😩', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '🙂', label: 'OK' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
];

const CARD_CLASS = 'rounded-2xl border border-violet-200 bg-white p-6 shadow-sm';
const PRIMARY_BTN_CLASS =
  'rounded-full bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50';

export default function FinishSession({ sessionId }: Props) {
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEnd = () => {
    setError(null);
    startTransition(async () => {
      try {
        await finishSession(sessionId, mood, notes);
      } catch (err) {
        if (err instanceof Error) {
          const digest = (err as Error & { digest?: string }).digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
            throw err;
          }
          setError(err.message);
        } else {
          setError('Something went wrong. Please try again.');
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={`${CARD_CLASS} flex flex-col gap-4`}>
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
          <label htmlFor="overall-notes" className="text-sm font-medium text-violet-900/70">
            Anything to remember? (optional)
          </label>
          <textarea
            id="overall-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Wins, things to try next time…"
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
        <button
          type="button"
          onClick={handleEnd}
          disabled={isPending}
          className={PRIMARY_BTN_CLASS}
        >
          {isPending ? 'Saving…' : 'End practice'}
        </button>
      </div>
    </div>
  );
}
