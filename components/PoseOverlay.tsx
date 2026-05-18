'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision';
import { getPoseLandmarker } from '@/lib/pose/landmarker';

type Status = 'loading' | 'ready' | 'error';

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
}

// Mounted only when the parent wants the overlay visible — that way each
// enable starts in a clean 'loading' state without re-initialising state from
// inside the effect.
export default function PoseOverlay({ videoRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(-1);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let landmarker: PoseLandmarker | null = null;
    let drawingUtils: DrawingUtils | null = null;
    const canvasAtMount = canvasRef.current;

    (async () => {
      try {
        landmarker = await getPoseLandmarker();
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        drawingUtils = new DrawingUtils(ctx);
        setStatus('ready');

        const tick = () => {
          if (cancelled) return;
          const video = videoRef.current;
          const canvasEl = canvasRef.current;
          const ctx2d = canvasEl?.getContext('2d') ?? null;

          if (!video || !canvasEl || !ctx2d || !landmarker || !drawingUtils) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          if (
            video.videoWidth > 0 &&
            (canvasEl.width !== video.videoWidth ||
              canvasEl.height !== video.videoHeight)
          ) {
            canvasEl.width = video.videoWidth;
            canvasEl.height = video.videoHeight;
          }

          // Only run inference when the displayed frame changed — covers play,
          // pause-after-seek, and step. detectForVideo wants monotonically
          // increasing timestamps, so feed it performance.now() (not currentTime).
          const frameTime = video.currentTime;
          if (
            video.readyState >= 2 &&
            frameTime !== lastFrameTimeRef.current
          ) {
            lastFrameTimeRef.current = frameTime;
            try {
              const result = landmarker.detectForVideo(video, performance.now());
              ctx2d.clearRect(0, 0, canvasEl.width, canvasEl.height);
              for (const landmarks of result.landmarks) {
                drawingUtils.drawConnectors(
                  landmarks,
                  PoseLandmarker.POSE_CONNECTIONS,
                  { color: '#a78bfa', lineWidth: 3 },
                );
                drawingUtils.drawLandmarks(landmarks, {
                  color: '#7c3aed',
                  radius: 3,
                });
              }
            } catch {
              // Transient per-frame errors (e.g. a frame the decoder hasn't
              // surfaced yet) shouldn't kill the loop.
            }
          }

          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Could not load pose model.',
        );
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (canvasAtMount) {
        const ctx = canvasAtMount.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasAtMount.width, canvasAtMount.height);
      }
    };
  }, [videoRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {status === 'loading' ? (
        <div className="pointer-events-none absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
          Loading pose model…
        </div>
      ) : null}
      {status === 'error' && errorMessage ? (
        <div className="absolute right-2 bottom-2 left-2 rounded-lg bg-red-900/80 px-2 py-1 text-xs text-white">
          {errorMessage}
        </div>
      ) : null}
    </>
  );
}
