'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { getVideoSignedUrl } from '@/lib/storage/videos';
import { deleteVideoForAttempt } from '../actions';
import PoseOverlay from './PoseOverlay';

interface Props {
  attemptId: string;
  videoPath: string;
}

export default function AttemptVideo({ attemptId, videoPath }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isPending, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const signed = await getVideoSignedUrl(videoPath);
        if (!cancelled) setUrl(signed);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load video.');
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [videoPath]);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteVideoForAttempt({ attemptId });
        setUrl(null);
        setConfirming(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete video.');
      }
    });
  };

  if (!loaded) {
    return (
      <p className="mt-2 text-xs text-violet-900/50">Loading video…</p>
    );
  }
  if (!url) {
    return error ? (
      <p className="mt-2 text-xs text-red-700">{error}</p>
    ) : null;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          src={url}
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          className="h-full w-full"
        />
        {showSkeleton ? <PoseOverlay videoRef={videoRef} /> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-violet-900/80">
          <input
            type="checkbox"
            checked={showSkeleton}
            onChange={(e) => setShowSkeleton(e.target.checked)}
            className="h-3.5 w-3.5 accent-violet-600"
          />
          Show skeleton
        </label>
        <div className="flex items-center gap-2">
        {confirming ? (
          <>
            <span className="text-xs text-violet-900/70">Delete this video?</span>
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
            aria-label="Delete video"
            className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
          >
            🗑 Delete video
          </button>
        )}
        </div>
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
