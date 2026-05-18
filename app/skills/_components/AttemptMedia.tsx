'use client';

import { useEffect, useState } from 'react';
import { getPhotoSignedUrl } from '@/lib/storage/photos';
import { getVideoSignedUrl } from '@/lib/storage/videos';

interface Props {
  videoPath: string | null;
  photoPath: string | null;
}

export default function AttemptMedia({ videoPath, photoPath }: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoPath) return;
    let cancelled = false;
    (async () => {
      try {
        const url = await getVideoSignedUrl(videoPath);
        if (!cancelled) setVideoUrl(url);
      } catch (err) {
        if (!cancelled) setVideoError(err instanceof Error ? err.message : 'Could not load video.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [videoPath]);

  useEffect(() => {
    if (!photoPath) return;
    let cancelled = false;
    (async () => {
      try {
        const url = await getPhotoSignedUrl(photoPath);
        if (!cancelled) setPhotoUrl(url);
      } catch (err) {
        if (!cancelled) setPhotoError(err instanceof Error ? err.message : 'Could not load photo.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoPath]);

  if (!videoPath && !photoPath) return null;

  return (
    <div className="flex flex-col gap-2">
      {videoPath ? (
        videoUrl ? (
          <video
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full overflow-hidden rounded-lg bg-black"
          />
        ) : videoError ? (
          <p className="text-xs text-red-700">{videoError}</p>
        ) : (
          <p className="text-xs text-violet-900/50">Loading video…</p>
        )
      ) : null}
      {photoPath ? (
        photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Practice attempt"
            className="max-h-72 w-full rounded-lg object-contain"
          />
        ) : photoError ? (
          <p className="text-xs text-red-700">{photoError}</p>
        ) : (
          <p className="text-xs text-violet-900/50">Loading photo…</p>
        )
      ) : null}
    </div>
  );
}
