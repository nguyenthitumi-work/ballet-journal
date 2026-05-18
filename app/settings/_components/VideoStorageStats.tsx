'use client';

import { useState, useTransition } from 'react';
import { deleteAllVideosForUser } from '../actions';

interface Props {
  initialVideoCount: number;
  initialTotalBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function VideoStorageStats({
  initialVideoCount,
  initialTotalBytes,
}: Props) {
  const [videoCount, setVideoCount] = useState(initialVideoCount);
  const [totalBytes, setTotalBytes] = useState(initialTotalBytes);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeleteAll = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteAllVideosForUser();
        setVideoCount(0);
        setTotalBytes(0);
        setConfirming(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete videos.');
      }
    });
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-violet-900">Practice videos</p>
          <p className="text-xs text-violet-900/60">
            Stored privately in Supabase Storage. Each video can only be viewed
            by you.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">{videoCount}</div>
          <div className="text-xs text-violet-900/60">{formatBytes(totalBytes)}</div>
        </div>
      </div>

      {videoCount > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <span className="text-sm text-violet-900/80">
                Delete all {videoCount} videos? This cannot be undone.
              </span>
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
                onClick={handleDeleteAll}
                disabled={isPending}
                className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Deleting…' : 'Yes, delete all'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              Delete all videos
            </button>
          )}
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
