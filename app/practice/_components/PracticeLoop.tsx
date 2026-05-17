'use client';

import { useEffect, useState, useTransition } from 'react';

import { submitAttempt } from '../actions';

type CurrentSkill = {
  id: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  description: string | null;
  techniqueTips: string[];
  defaultDurationSeconds: number;
};

interface Props {
  sessionId: string;
  currentSkill: CurrentSkill;
  remainingSkills: { id: string; name: string }[];
  attemptsCount: number;
  totalSkillsCount: number;
}

const RATINGS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: 'Tough' },
  { value: 2, label: 'Tricky' },
  { value: 3, label: 'OK' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

const CARD_CLASS = 'rounded-2xl border border-pink-200 bg-white p-6 shadow-sm';
const PRIMARY_BTN_CLASS =
  'rounded-full bg-pink-600 px-6 py-3 font-medium text-white hover:bg-pink-700 disabled:opacity-50';

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function PracticeLoop({
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
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Parent passes `key={currentSkill.id}` so a skill change remounts this
  // component — useState above gives fresh initial values without an effect.
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
        await submitAttempt({
          sessionId,
          skillId: currentSkill.id,
          rating,
          notes,
          isMilestone,
          durationSeconds: seconds,
        });
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

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between text-sm text-pink-900/70">
        <span>{progressLabel}</span>
        <span aria-live="polite" className="font-mono">
          {formatMmSs(seconds)}
        </span>
      </header>

      <div className={`${CARD_CLASS} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{currentSkill.name}</h1>
          <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700">
            {currentSkill.categoryLabel}
          </span>
        </div>

        {currentSkill.description ? (
          <p className="text-pink-900/80">{currentSkill.description}</p>
        ) : null}

        {currentSkill.techniqueTips.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => setTipsOpen((v) => !v)}
              className="text-sm font-medium text-pink-700 hover:underline"
              aria-expanded={tipsOpen}
            >
              {tipsOpen ? 'Hide technique tips' : 'Show technique tips'}
            </button>
            {tipsOpen ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-pink-900/80">
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
          <legend className="text-sm font-medium text-pink-900/70">How did it feel?</legend>
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
                  className={`flex flex-col items-center gap-1 rounded-full border px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 ${
                    selected
                      ? 'border-pink-500 bg-pink-100 text-pink-900'
                      : 'border-pink-200 bg-white text-pink-900/80 hover:border-pink-400'
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
          <label htmlFor="notes" className="text-sm font-medium text-pink-900/70">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What worked? What was hard?"
            rows={3}
            disabled={isPending}
            className="w-full rounded-lg border border-pink-200 px-3 py-2 focus:border-pink-500 focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isMilestone}
            onChange={(e) => setIsMilestone(e.target.checked)}
            disabled={isPending}
            className="h-5 w-5 accent-pink-600"
          />
          <span>
            <span className="mr-1" aria-hidden>
              ⭐
            </span>
            Milestone — I nailed something new!
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setRecording((v) => !v)}
            className="self-start rounded-full border border-dashed border-pink-300 px-4 py-2 text-sm text-pink-700 hover:border-pink-500"
          >
            {recording ? 'Stop video (preview)' : 'Tap to record video (coming soon)'}
          </button>
          {recording ? (
            <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-pink-300 bg-pink-50 text-sm text-pink-700">
              Video recording will land in a later update.
            </div>
          ) : null}
        </div>
      </div>

      {remainingSkills.length > 0 ? (
        <div className={`${CARD_CLASS} flex flex-col gap-2`}>
          <p className="text-sm font-medium text-pink-900/70">Up next</p>
          <ul className="text-sm text-pink-900/80">
            {remainingSkills.slice(0, 3).map((s) => (
              <li key={s.id}>• {s.name}</li>
            ))}
            {remainingSkills.length > 3 ? (
              <li className="text-pink-900/60">
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
          {isPending ? 'Saving…' : 'Save & next'}
        </button>
      </div>
    </section>
  );
}
