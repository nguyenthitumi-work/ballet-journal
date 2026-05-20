'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import {
  buildPhotoPath,
  deletePhotoBlob,
  uploadPhotoBlob,
} from '@/lib/storage/photos';
import {
  buildVideoPath,
  deleteVideoBlob,
  uploadVideoBlob,
} from '@/lib/storage/videos';
import { parseYouTubeId, toEmbedUrl, youtubeSearchUrl } from '@/lib/youtube';
import {
  attachPhotoToAttempt,
  attachVideoToAttempt,
  submitAttempt,
} from '../actions';
import PhotoCapture, { type CapturedPhoto } from './PhotoCapture';
import VideoRecorder, { type RecordedClip } from './VideoRecorder';

type CurrentSkill = {
  id: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  description: string | null;
  techniqueTips: string[];
  defaultDurationSeconds: number;
  referenceUrl: string | null;
  referenceUrlSuggested: string | null;
};

interface Props {
  userId: string;
  sessionId: string;
  currentSkill: CurrentSkill;
  remainingSkills: { id: string; name: string }[];
  attemptsCount: number;
  totalSkillsCount: number;
}

type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'failed';

const RATINGS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: 'Tough' },
  { value: 2, label: 'Tricky' },
  { value: 3, label: 'OK' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

const CARD_CLASS = 'rounded-2xl border border-violet-200 bg-white p-6 shadow-sm';
const PRIMARY_BTN_CLASS =
  'rounded-full bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50';

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function PracticeLoop({
  userId,
  sessionId,
  currentSkill,
  remainingSkills,
  attemptsCount,
  totalSkillsCount,
}: Props) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [notes, setNotes] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [recordedClip, setRecordedClip] = useState<RecordedClip | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [photoUploadStatus, setPhotoUploadStatus] = useState<UploadStatus>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Refs track the in-flight upload across re-renders. The handler closures
  // would otherwise capture stale state.
  const uploadPathRef = useRef<string | null>(null);
  const uploadPromiseRef = useRef<Promise<void> | null>(null);
  const photoUploadPathRef = useRef<string | null>(null);
  const photoUploadPromiseRef = useRef<Promise<void> | null>(null);
  const savedSuccessfullyRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // On unmount: if we uploaded media but never attached it (user navigated
  // away mid-flow), clean it up. Skipped after a successful Save & next.
  useEffect(() => {
    return () => {
      const vPath = uploadPathRef.current;
      const vPromise = uploadPromiseRef.current;
      if (vPath && !savedSuccessfullyRef.current) {
        Promise.resolve(vPromise)
          .catch(() => undefined)
          .then(() => deleteVideoBlob(vPath))
          .catch(() => undefined);
      }
      const pPath = photoUploadPathRef.current;
      const pPromise = photoUploadPromiseRef.current;
      if (pPath && !savedSuccessfullyRef.current) {
        Promise.resolve(pPromise)
          .catch(() => undefined)
          .then(() => deletePhotoBlob(pPath))
          .catch(() => undefined);
      }
    };
  }, []);

  const handleClipChange = useCallback(
    (newClip: RecordedClip | null) => {
      // Tear down the previous upload (if any). This covers re-record and
      // discard; both want the prior file gone from storage once it settles.
      const prevPath = uploadPathRef.current;
      const prevPromise = uploadPromiseRef.current;
      uploadPathRef.current = null;
      uploadPromiseRef.current = null;
      if (prevPath) {
        Promise.resolve(prevPromise)
          .catch(() => undefined)
          .then(() => deleteVideoBlob(prevPath))
          .catch(() => undefined);
      }

      if (newClip === null) {
        setRecordedClip(null);
        setUploadStatus('idle');
        return;
      }

      setRecordedClip(newClip);
      setUploadStatus('uploading');
      setError(null);

      const path = buildVideoPath(userId, newClip.blob.type);
      uploadPathRef.current = path;

      uploadPromiseRef.current = uploadVideoBlob(path, newClip.blob).then(
        () => {
          if (uploadPathRef.current === path) setUploadStatus('uploaded');
        },
        (err: unknown) => {
          if (uploadPathRef.current === path) {
            setUploadStatus('failed');
            setError(
              `Video upload failed: ${
                err instanceof Error ? err.message : 'unknown error'
              }. You can re-record or save without it.`,
            );
          }
          throw err;
        },
      );
    },
    [userId],
  );

  const handlePhotoChange = useCallback(
    (newPhoto: CapturedPhoto | null) => {
      const prevPath = photoUploadPathRef.current;
      const prevPromise = photoUploadPromiseRef.current;
      photoUploadPathRef.current = null;
      photoUploadPromiseRef.current = null;
      if (prevPath) {
        Promise.resolve(prevPromise)
          .catch(() => undefined)
          .then(() => deletePhotoBlob(prevPath))
          .catch(() => undefined);
      }

      if (newPhoto === null) {
        setCapturedPhoto(null);
        setPhotoUploadStatus('idle');
        return;
      }

      setCapturedPhoto(newPhoto);
      setPhotoUploadStatus('uploading');
      setError(null);

      const path = buildPhotoPath(userId, newPhoto.blob.type);
      photoUploadPathRef.current = path;

      photoUploadPromiseRef.current = uploadPhotoBlob(path, newPhoto.blob).then(
        () => {
          if (photoUploadPathRef.current === path) setPhotoUploadStatus('uploaded');
        },
        (err: unknown) => {
          if (photoUploadPathRef.current === path) {
            setPhotoUploadStatus('failed');
            setError(
              `Photo upload failed: ${
                err instanceof Error ? err.message : 'unknown error'
              }. You can retake or save without it.`,
            );
          }
          throw err;
        },
      );
    },
    [userId],
  );

  const stepNumber = attemptsCount + 1;
  const progressLabel = `${stepNumber} of ${totalSkillsCount}`;

  const handleSave = () => {
    if (rating === null) {
      setError('Pick how it felt before moving on.');
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const { attemptId } = await submitAttempt({
          sessionId,
          skillId: currentSkill.id,
          rating,
          notes,
          isMilestone,
          durationSeconds: seconds,
        });

        if (recordedClip) {
          const uploadPromise = uploadPromiseRef.current;
          const path = uploadPathRef.current;
          if (uploadPromise && path) {
            try {
              await uploadPromise;
              await attachVideoToAttempt({
                attemptId,
                videoPath: path,
                videoSizeBytes: recordedClip.blob.size,
              });
            } catch (uploadErr) {
              const msg =
                uploadErr instanceof Error ? uploadErr.message : 'unknown error';
              setError(
                `Practice was saved, but the video upload did not finish (${msg}).`,
              );
              // Don't rethrow — practice was logged; we just lost the video.
              // Still consider the page "saved successfully" so the orphan
              // cleanup doesn't fire on the path we just told the server about
              // (the attach failed, so the file is already an orphan anyway).
            }
          }
        }

        if (capturedPhoto) {
          const photoPromise = photoUploadPromiseRef.current;
          const photoPath = photoUploadPathRef.current;
          if (photoPromise && photoPath) {
            try {
              await photoPromise;
              await attachPhotoToAttempt({
                attemptId,
                photoPath,
                photoSizeBytes: capturedPhoto.sizeBytes,
              });
            } catch (uploadErr) {
              const msg =
                uploadErr instanceof Error ? uploadErr.message : 'unknown error';
              setError(
                `Practice was saved, but the photo upload did not finish (${msg}).`,
              );
            }
          }
        }

        savedSuccessfullyRef.current = true;
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

  const referenceVideoUrl =
    currentSkill.referenceUrl ?? currentSkill.referenceUrlSuggested;
  const referenceVideoId = referenceVideoUrl
    ? parseYouTubeId(referenceVideoUrl)
    : null;
  const isSuggestedOnly =
    referenceVideoId !== null && currentSkill.referenceUrl === null;

  const saveLabel = (() => {
    if (!isPending) return 'Save & next';
    if (recordedClip && uploadStatus === 'uploading') return 'Uploading video…';
    if (capturedPhoto && photoUploadStatus === 'uploading') return 'Uploading photo…';
    return 'Saving…';
  })();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between text-sm text-violet-900/70">
        <span>{progressLabel}</span>
        <span aria-live="polite" className="font-mono">
          {formatMmSs(seconds)}
        </span>
      </header>

      <div className={`${CARD_CLASS} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{currentSkill.name}</h1>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
            {currentSkill.categoryLabel}
          </span>
        </div>

        {currentSkill.description ? (
          <p className="text-violet-900/80">{currentSkill.description}</p>
        ) : null}

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-violet-900/70">
              Reference video
            </h2>
            <a
              href={youtubeSearchUrl(currentSkill.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-violet-700 underline-offset-2 hover:underline"
            >
              Search YouTube ↗
            </a>
          </div>
          {referenceVideoId ? (
            <>
              <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-black">
                <iframe
                  src={toEmbedUrl(referenceVideoId)}
                  title={`${currentSkill.name} reference video`}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  className="h-full w-full"
                />
              </div>
              {isSuggestedOnly ? (
                <p className="mt-2 text-xs text-violet-900/60">
                  Suggested video — a grown-up can confirm or change it on the
                  skill page.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-violet-900/60">
              No reference video set yet. A grown-up can add a YouTube link from
              the skill page.
            </p>
          )}
        </div>

        {currentSkill.techniqueTips.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => setTipsOpen((v) => !v)}
              className="text-sm font-medium text-violet-700 hover:underline"
              aria-expanded={tipsOpen}
            >
              {tipsOpen ? 'Hide technique tips' : 'Show technique tips'}
            </button>
            {tipsOpen ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-violet-900/80">
                {currentSkill.techniqueTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={`${CARD_CLASS} flex flex-col gap-4`}>
        <fieldset>
          <legend className="text-sm font-medium text-violet-900/70">How did it feel?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {RATINGS.map((r) => {
              const selected = rating === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRating(r.value)}
                  disabled={isPending}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-1 rounded-full border px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50 ${
                    selected
                      ? 'border-violet-500 bg-violet-100 text-violet-900'
                      : 'border-violet-200 bg-white text-violet-900/80 hover:border-violet-400'
                  }`}
                >
                  <span className="text-lg font-semibold">{r.value}</span>
                  <span className="text-xs">{r.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes" className="text-sm font-medium text-violet-900/70">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What worked? What was hard?"
            rows={3}
            disabled={isPending}
            className="w-full rounded-lg border border-violet-200 px-3 py-2 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isMilestone}
            onChange={(e) => setIsMilestone(e.target.checked)}
            disabled={isPending}
            className="h-5 w-5 accent-violet-600"
          />
          <span>
            <span className="mr-1" aria-hidden>
              ⭐
            </span>
            Milestone — I nailed something new!
          </span>
        </label>

        <VideoRecorder onChange={handleClipChange} disabled={isPending} />

        {recordedClip && uploadStatus === 'uploading' ? (
          <p className="text-xs text-violet-900/60">
            Uploading video to your account…
          </p>
        ) : null}
        {recordedClip && uploadStatus === 'uploaded' ? (
          <p className="text-xs text-emerald-700">Video ready.</p>
        ) : null}
        {recordedClip && uploadStatus === 'failed' ? (
          <p className="text-xs text-red-700">
            Video upload failed. You can re-record above, or tap Save & next to
            save without it.
          </p>
        ) : null}

        <PhotoCapture onChange={handlePhotoChange} disabled={isPending} />

        {capturedPhoto && photoUploadStatus === 'uploading' ? (
          <p className="text-xs text-violet-900/60">
            Uploading photo to your account…
          </p>
        ) : null}
        {capturedPhoto && photoUploadStatus === 'uploaded' ? (
          <p className="text-xs text-emerald-700">Photo ready.</p>
        ) : null}
        {capturedPhoto && photoUploadStatus === 'failed' ? (
          <p className="text-xs text-red-700">
            Photo upload failed. You can retake above, or tap Save & next to
            save without it.
          </p>
        ) : null}
      </div>

      {remainingSkills.length > 0 ? (
        <div className={`${CARD_CLASS} flex flex-col gap-2`}>
          <p className="text-sm font-medium text-violet-900/70">Up next</p>
          <ul className="text-sm text-violet-900/80">
            {remainingSkills.slice(0, 3).map((s) => (
              <li key={s.id}>• {s.name}</li>
            ))}
            {remainingSkills.length > 3 ? (
              <li className="text-violet-900/60">
                …and {remainingSkills.length - 3} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || rating === null}
          className={PRIMARY_BTN_CLASS}
        >
          {saveLabel}
        </button>
      </div>
    </section>
  );
}
