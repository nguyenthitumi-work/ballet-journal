'use client';

import { useEffect, useState, useTransition } from 'react';
import { getPhotoSignedUrl } from '@/lib/storage/photos';
import { deletePhotoForAttempt } from '../actions';

interface Props {
  attemptId: string;
  photoPath: string;
}

export default function AttemptPhoto({ attemptId, photoPath }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const signed = await getPhotoSignedUrl(photoPath);
        if (!cancelled) setUrl(signed);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load photo.');
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoPath]);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePhotoForAttempt({ attemptId });
        setUrl(null);
        setConfirming(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete photo.');
      }
    });
  };

  if (!loaded) {
    return <p className="mt-2 text-xs text-violet-900/50">Loading photo…</p>;
  }
  if (!url) {
    return error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Practice attempt"
        className="max-h-72 w-full rounded-lg object-contain"
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {confirming ? (
          <>
            <span className="text-xs text-violet-900/70">Delete this photo?</span>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="rounded-full border border-violet-300 px-3 py-1 text-xs text-violet-800 hover:bg-violet-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Delete photo"
            className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
          >
            🗑 Delete photo
          </button>
        )}
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
