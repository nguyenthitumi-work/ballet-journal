'use client';

import { useEffect, useRef, useState } from 'react';
import PoseOverlay from '@/components/PoseOverlay';
import { getVideoSignedUrl } from '@/lib/storage/videos';
import { loadYouTubeIframeApi, type YouTubePlayer } from '@/lib/youtubePlayer';

interface Props {
  videoPath: string;
  youtubeVideoId: string;
  onClose: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1] as const;
type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export default function ReferenceCompare({ videoPath, youtubeVideoId, onClose }: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [ytReady, setYtReady] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const ytMountRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = await getVideoSignedUrl(videoPath);
        if (!cancelled) setVideoUrl(url);
      } catch (err) {
        if (!cancelled) {
          setVideoError(err instanceof Error ? err.message : 'Could not load video.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [videoPath]);

  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayer | null = null;
    (async () => {
      try {
        const YT = await loadYouTubeIframeApi();
        if (cancelled || !ytMountRef.current) return;
        player = new YT.Player(ytMountRef.current, {
          videoId: youtubeVideoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: () => {
              if (!cancelled) {
                ytPlayerRef.current = player;
                setYtReady(true);
              }
            },
            onError: () => {
              if (!cancelled) setYtError('YouTube could not play this video.');
            },
          },
        });
      } catch (err) {
        if (!cancelled) {
          setYtError(err instanceof Error ? err.message : 'Could not load YouTube player.');
        }
      }
    })();
    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        // Player may already be torn down; nothing to do.
      }
      ytPlayerRef.current = null;
    };
  }, [youtubeVideoId]);

  // Reflect external play/pause on the user clip (e.g. user hits the native
  // video controls) into our `playing` state so the master button label is
  // honest. We don't try to drive the YT side back from this — the YT API
  // doesn't expose a clean 'played by user' signal we can act on without
  // wiring onStateChange, and the master button stays correct either way.
  useEffect(() => {
    const v = userVideoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [videoUrl]);

  const handlePlayBoth = () => {
    userVideoRef.current?.play().catch(() => {
      // Autoplay block is fine — the user just tapped, so this should succeed.
    });
    ytPlayerRef.current?.playVideo();
    setPlaying(true);
  };

  const handlePauseBoth = () => {
    userVideoRef.current?.pause();
    ytPlayerRef.current?.pauseVideo();
    setPlaying(false);
  };

  const handleRestart = () => {
    const v = userVideoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => undefined);
    }
    ytPlayerRef.current?.seekTo(0, true);
    ytPlayerRef.current?.playVideo();
    setPlaying(true);
  };

  const handleRate = (next: PlaybackRate) => {
    setRate(next);
    if (userVideoRef.current) userVideoRef.current.playbackRate = next;
    ytPlayerRef.current?.setPlaybackRate(next);
  };

  return (
    <div className="rounded-2xl border border-violet-300 bg-violet-50/60 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-violet-900">
          Compare with reference
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-violet-300 px-3 py-1 text-xs text-violet-800 hover:bg-white"
        >
          Close
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-violet-700/80">
            Your attempt
          </span>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            {videoUrl ? (
              <video
                ref={userVideoRef}
                src={videoUrl}
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
                controls
                className="h-full w-full"
              />
            ) : videoError ? (
              <p className="p-3 text-xs text-red-200">{videoError}</p>
            ) : (
              <p className="p-3 text-xs text-violet-200">Loading video…</p>
            )}
            {videoUrl && showSkeleton ? <PoseOverlay videoRef={userVideoRef} /> : null}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-violet-700/80">
            Reference
          </span>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            <div ref={ytMountRef} className="h-full w-full" />
            {!ytReady && !ytError ? (
              <p className="absolute inset-0 flex items-center justify-center p-3 text-xs text-violet-200">
                Loading reference…
              </p>
            ) : null}
            {ytError ? (
              <p className="absolute right-2 bottom-2 left-2 rounded-lg bg-red-900/80 px-2 py-1 text-xs text-white">
                {ytError}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {playing ? (
          <button
            type="button"
            onClick={handlePauseBoth}
            className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
          >
            ⏸ Pause both
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePlayBoth}
            className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
          >
            ▶ Play both
          </button>
        )}
        <button
          type="button"
          onClick={handleRestart}
          className="rounded-full border border-violet-300 bg-white px-3 py-1.5 text-xs text-violet-800 hover:bg-violet-50"
        >
          ↻ Restart both
        </button>

        <div
          role="group"
          aria-label="Playback speed"
          className="ml-1 inline-flex overflow-hidden rounded-full border border-violet-300 bg-white"
        >
          {PLAYBACK_RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRate(r)}
              aria-pressed={rate === r}
              className={`px-3 py-1.5 text-xs font-medium ${
                rate === r
                  ? 'bg-violet-600 text-white'
                  : 'text-violet-800 hover:bg-violet-50'
              }`}
            >
              {r}×
            </button>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-2 text-xs text-violet-900/80">
          <input
            type="checkbox"
            checked={showSkeleton}
            onChange={(e) => setShowSkeleton(e.target.checked)}
            className="h-3.5 w-3.5 accent-violet-600"
          />
          Show skeleton (your clip)
        </label>
      </div>

      <p className="mt-2 text-xs text-violet-900/60">
        Tip: the two clips start together but won&apos;t stay frame-perfect — pause to
        compare a specific moment.
      </p>
    </div>
  );
}
