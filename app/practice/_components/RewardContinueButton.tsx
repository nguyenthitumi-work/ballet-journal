'use client';

import { useState, useTransition } from 'react';
import { markRevealAndContinue } from '../actions';

interface Props {
  sceneId: string;
}

export default function RewardContinueButton({ sceneId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        await markRevealAndContinue(sceneId);
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
    <div className="animate-reveal-late flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full bg-violet-600 px-8 py-3 font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Continue →'}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
