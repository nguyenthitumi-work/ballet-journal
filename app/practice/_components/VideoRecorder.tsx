'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MAX_DURATION_SECONDS = 5 * 60;
const CANVAS_FPS = 30;

type Status = 'idle' | 'requesting' | 'recording' | 'reviewing';
type Facing = 'user' | 'environment';

export interface RecordedClip {
  blob: Blob;
  durationSeconds: number;
}

interface Props {
  onChange: (clip: RecordedClip | null) => void;
  disabled?: boolean;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Draw a video frame onto a fixed-size canvas, preserving aspect ratio
// (letterbox/pillarbox). Canvas dimensions stay fixed across camera flips so
// the MediaRecorder track resolution doesn't change mid-recording.
function drawVideoFit(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvasW: number,
  canvasH: number,
): void {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasW, canvasH);
    return;
  }
  const cAspect = canvasW / canvasH;
  const vAspect = vw / vh;
  let dw: number;
  let dh: number;
  if (vAspect > cAspect) {
    dw = canvasW;
    dh = canvasW / vAspect;
  } else {
    dh = canvasH;
    dw = canvasH * vAspect;
  }
  const dx = (canvasW - dw) / 2;
  const dy = (canvasH - dh) / 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.drawImage(video, dx, dy, dw, dh);
}

async function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 1 && video.videoWidth > 0) return;
  await new Promise<void>((resolve) => {
    const onLoaded = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      resolve();
    };
    video.addEventListener('loadedmetadata', onLoaded);
  });
}

export default function VideoRecorder({ onChange, disabled = false }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hasAudioTrack, setHasAudioTrack] = useState(false);
  const [facing, setFacing] = useState<Facing>('user');
  const [flipping, setFlipping] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  // Camera + recording pipeline refs.
  // Data flow:
  //   camera → srcVideoEl (offscreen) → RAF → canvas → captureStream → recorder
  //                                  ↘
  //                                   preview <video> in DOM (user-visible)
  // Flip swaps the camera track behind srcVideoEl; the canvas keeps drawing,
  // so the recorder sees an uninterrupted single stream.
  const streamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const srcVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // Callback ref: the visible <video> preview element only mounts once status
  // flips to 'recording'. Attach the stream the moment React gives us the node.
  const setLiveVideoEl = useCallback((el: HTMLVideoElement | null) => {
    liveVideoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  const mediaSupported = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined',
    [],
  );

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const cleanupPipeline = useCallback(() => {
    stopRaf();
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    if (srcVideoRef.current) {
      srcVideoRef.current.srcObject = null;
      srcVideoRef.current = null;
    }
    streamRef.current = null;
    canvasRef.current = null;
  }, [stopRaf]);

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const revokeRecorded = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
  }, [recordedUrl]);

  useEffect(() => {
    return () => {
      clearTick();
      cleanupPipeline();
      revokeRecorded();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = useCallback(async () => {
    if (!mediaSupported) {
      setError('Video recording is not supported in this browser.');
      return;
    }
    setError(null);
    setStatus('requesting');
    try {
      // Try with audio first; fall back to video-only if the mic is unavailable
      // or permission was denied. Audio can be muted live via the in-recording
      // toggle, so we always attempt to acquire it up front.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: true,
        });
      } catch (audioErr) {
        if (
          audioErr instanceof DOMException &&
          (audioErr.name === 'NotAllowedError' || audioErr.name === 'NotFoundError')
        ) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facing } },
            audio: false,
          });
        } else {
          throw audioErr;
        }
      }
      streamRef.current = stream;
      videoTrackRef.current = stream.getVideoTracks()[0] ?? null;
      audioTrackRef.current = stream.getAudioTracks()[0] ?? null;
      const hasAudio = audioTrackRef.current !== null;
      setHasAudioTrack(hasAudio);
      if (hasAudio && audioTrackRef.current) {
        audioTrackRef.current.enabled = audioEnabled;
      }

      // Offscreen source video — drives the canvas via drawImage. Kept off the
      // DOM so we don't depend on React render timing for the recorder setup.
      const srcVideo = document.createElement('video');
      srcVideo.muted = true;
      srcVideo.playsInline = true;
      srcVideo.autoplay = true;
      srcVideo.srcObject = stream;
      srcVideoRef.current = srcVideo;
      await srcVideo.play().catch(() => {});
      await waitForVideoMetadata(srcVideo);

      const canvasW = srcVideo.videoWidth || 720;
      const canvasH = srcVideo.videoHeight || 1280;
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context not available.');
      }

      const draw = () => {
        if (canvasRef.current && srcVideoRef.current) {
          drawVideoFit(ctx, srcVideoRef.current, canvasW, canvasH);
        }
        rafRef.current = requestAnimationFrame(draw);
      };
      rafRef.current = requestAnimationFrame(draw);

      const captureStream =
        typeof canvas.captureStream === 'function' ? canvas.captureStream(CANVAS_FPS) : null;
      if (!captureStream) {
        throw new Error('This browser cannot capture the canvas for recording.');
      }
      const recordingStream = new MediaStream();
      for (const t of captureStream.getVideoTracks()) recordingStream.addTrack(t);
      if (audioTrackRef.current) recordingStream.addTrack(audioTrackRef.current);

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(recordingStream, { mimeType })
        : new MediaRecorder(recordingStream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'video/webm',
        });
        chunksRef.current = [];
        const url = URL.createObjectURL(blob);
        setRecordedUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        const duration =
          startedAtRef.current !== null
            ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
            : elapsed;
        startedAtRef.current = null;
        cleanupPipeline();
        clearTick();
        setStatus('reviewing');
        onChange({ blob, durationSeconds: duration });
      };

      startedAtRef.current = Date.now();
      setElapsed(0);
      recorder.start();
      setStatus('recording');

      tickRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION_SECONDS) {
            if (recorderRef.current && recorderRef.current.state === 'recording') {
              recorderRef.current.stop();
            }
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setStatus('idle');
      cleanupPipeline();
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Camera permission was denied.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No camera was found on this device.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Could not start the camera.');
      }
    }
  }, [audioEnabled, cleanupPipeline, clearTick, elapsed, facing, mediaSupported, onChange]);

  const handleStop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      if (audioTrackRef.current) {
        audioTrackRef.current.enabled = next;
      }
      return next;
    });
  }, []);

  const handleFlip = useCallback(async () => {
    if (flipping) return;
    if (status !== 'recording') return;
    if (!streamRef.current || !srcVideoRef.current) return;
    setFlipping(true);
    const nextFacing: Facing = facing === 'user' ? 'environment' : 'user';
    try {
      // Request video only — keep the existing audio track running so the
      // recording's audio is uninterrupted.
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing } },
        audio: false,
      });
      const nextVideoTrack = nextStream.getVideoTracks()[0];
      if (!nextVideoTrack) {
        throw new Error('Could not get a video track from the other camera.');
      }

      // Stop the previous camera track; build a new preview stream from the
      // new video track + persistent audio track.
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
      }
      videoTrackRef.current = nextVideoTrack;

      const newPreviewStream = new MediaStream();
      newPreviewStream.addTrack(nextVideoTrack);
      if (audioTrackRef.current) newPreviewStream.addTrack(audioTrackRef.current);
      streamRef.current = newPreviewStream;

      // Update the offscreen source video; the RAF loop keeps drawing into the
      // canvas, so the MediaRecorder never sees a discontinuity.
      srcVideoRef.current.srcObject = newPreviewStream;
      await srcVideoRef.current.play().catch(() => {});

      // Update the visible preview.
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = newPreviewStream;
        liveVideoRef.current.play().catch(() => {});
      }

      setFacing(nextFacing);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('The other camera is not available on this device.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Could not flip the camera.');
      }
    } finally {
      setFlipping(false);
    }
  }, [facing, flipping, status]);

  const handleDiscard = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setElapsed(0);
    setStatus('idle');
    onChange(null);
  }, [onChange, recordedUrl]);

  const handleReRecord = useCallback(() => {
    handleDiscard();
    void handleStart();
  }, [handleDiscard, handleStart]);

  if (!mediaSupported) {
    return (
      <p className="text-sm text-violet-900/60">
        Video recording is not supported in this browser.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {status === 'idle' ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={disabled}
            className="rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-200 disabled:opacity-50"
          >
            🎥 Record video
          </button>
        </div>
      ) : null}

      {status === 'requesting' ? (
        <p className="text-sm text-violet-900/70">Asking for camera permission…</p>
      ) : null}

      {status === 'recording' ? (
        <div className="flex flex-col gap-2">
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={setLiveVideoEl}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
              <span
                aria-hidden
                className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500"
              />
              <span className="font-mono">{formatMmSs(elapsed)}</span>
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                type="button"
                role="switch"
                aria-checked={audioEnabled}
                onClick={handleToggleAudio}
                disabled={!hasAudioTrack}
                aria-label={audioEnabled ? 'Mute audio' : 'Unmute audio'}
                className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white hover:bg-black/80 disabled:opacity-50"
              >
                <span aria-hidden>{audioEnabled && hasAudioTrack ? '🔊' : '🔇'}</span>
                {hasAudioTrack ? (audioEnabled ? 'Audio on' : 'Audio off') : 'No mic'}
              </button>
              <button
                type="button"
                onClick={() => void handleFlip()}
                disabled={flipping}
                aria-label="Flip camera"
                className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white hover:bg-black/80 disabled:opacity-50"
              >
                <span aria-hidden>🔄</span>
                {flipping ? 'Flipping…' : 'Flip'}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStop}
            className="self-start rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            ⏹ Stop ({formatMmSs(MAX_DURATION_SECONDS - elapsed)} left)
          </button>
        </div>
      ) : null}

      {status === 'reviewing' && recordedUrl ? (
        <div className="flex flex-col gap-2">
          <video
            src={recordedUrl}
            controls
            playsInline
            className="aspect-video w-full overflow-hidden rounded-xl bg-black"
          />
          <p className="text-xs text-violet-900/60">
            Saved with this attempt when you tap &ldquo;Save &amp; next.&rdquo;
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReRecord}
              disabled={disabled}
              className="rounded-full border border-violet-300 px-4 py-2 text-sm text-violet-800 hover:bg-violet-50 disabled:opacity-50"
            >
              Re-record
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={disabled}
              className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
