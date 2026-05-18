'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MAX_DURATION_SECONDS = 5 * 60;

type Status = 'idle' | 'requesting' | 'recording' | 'reviewing';

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

export default function VideoRecorder({ onChange, disabled = false }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const mediaSupported = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined',
    [],
  );

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
  }, []);

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
      stopStream();
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: audioEnabled,
      });
      streamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
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
        stopStream();
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
            // Auto-stop at cap.
            if (recorderRef.current && recorderRef.current.state === 'recording') {
              recorderRef.current.stop();
            }
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setStatus('idle');
      stopStream();
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
  }, [audioEnabled, clearTick, elapsed, mediaSupported, onChange, stopStream]);

  const handleStop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

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
          <label className="flex items-center gap-2 text-sm text-violet-900/80">
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 accent-violet-600"
            />
            Include audio
          </label>
        </div>
      ) : null}

      {status === 'requesting' ? (
        <p className="text-sm text-violet-900/70">Asking for camera permission…</p>
      ) : null}

      {status === 'recording' ? (
        <div className="flex flex-col gap-2">
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={liveVideoRef}
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
