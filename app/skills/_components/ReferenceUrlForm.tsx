'use client';

import { useState, useTransition } from 'react';
import { updateReferenceUrl } from '../actions';

interface Props {
  skillId: string;
  initialUrl: string | null;
}

const NEXT_REDIRECT_DIGEST = 'NEXT_REDIRECT';

export function ReferenceUrlForm({ skillId, initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setStatus('idle');
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const trimmed = url.trim();
        await updateReferenceUrl(skillId, trimmed === '' ? null : trimmed);
        setStatus('saved');
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'digest' in err &&
          typeof (err as { digest?: string }).digest === 'string' &&
          (err as { digest: string }).digest.startsWith(NEXT_REDIRECT_DIGEST)
        ) {
          throw err;
        }
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Could not save the link.');
      }
    });
  };

  const clear = () => {
    setUrl('');
    setStatus('idle');
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await updateReferenceUrl(skillId, null);
        setStatus('saved');
      } catch (err) {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Could not clear the link.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="url"
        inputMode="url"
        placeholder="https://www.youtube.com/watch?v=…"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setStatus('idle');
        }}
        disabled={pending}
        className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none disabled:opacity-50"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || url.trim() === (initialUrl ?? '')}
          className="rounded-full bg-pink-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {initialUrl ? (
          <button
            type="button"
            onClick={clear}
            disabled={pending}
            className="rounded-full border border-pink-300 px-4 py-1.5 text-sm font-medium text-pink-700 hover:bg-pink-50 disabled:opacity-50"
          >
            Remove
          </button>
        ) : null}
        {status === 'saved' ? (
          <span className="text-xs text-pink-700">Saved.</span>
        ) : null}
      </div>
      {status === 'error' && errorMsg ? (
        <p className="text-xs text-red-700">{errorMsg}</p>
      ) : null}
      <p className="text-xs text-pink-900/60">
        Paste a YouTube link (youtube.com or youtu.be). The video shows up here with no
        autoplay and minimal tracking.
      </p>
    </div>
  );
}
