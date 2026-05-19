'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import type { Level, UserProfile } from '@/lib/types';
import { computeAge, isValidDateOfBirth, MIN_AGE, MAX_AGE } from '@/lib/age';
import { updateProfileAction } from '../actions';

const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
const MIN_DAILY_GOAL = 1;
const MAX_DAILY_GOAL = 10;

const LEVEL_HINTS: Record<Level, string> = {
  Beginner: 'Just starting out',
  Intermediate: 'A few years in (like Vag 2–3)',
  Advanced: 'Pointe & beyond',
};

const inputClass =
  'w-full rounded-lg border border-violet-200 px-3 py-2 focus:border-violet-500 focus:outline-none';

interface Props {
  initialProfile: UserProfile;
}

export default function ProfileForm({ initialProfile }: Props) {
  const [name, setName] = useState<string>(initialProfile.name ?? '');
  const [dateOfBirth, setDateOfBirth] = useState<string>(initialProfile.dateOfBirth ?? '');
  const [level, setLevel] = useState<Level>(initialProfile.level);
  const [dailySkillGoal, setDailySkillGoal] = useState<number>(initialProfile.dailySkillGoal);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const derivedAge = computeAge(dateOfBirth || null);

  const validate = (): string | null => {
    if (name.trim().length === 0) return 'Please tell us your name.';
    if (!dateOfBirth) return 'Please pick your birthday.';
    if (!isValidDateOfBirth(dateOfBirth)) {
      return `Birthday must be a real past date and put your age between ${MIN_AGE} and ${MAX_AGE}.`;
    }
    if (!LEVELS.includes(level)) return 'Please pick a level.';
    if (
      !Number.isInteger(dailySkillGoal) ||
      dailySkillGoal < MIN_DAILY_GOAL ||
      dailySkillGoal > MAX_DAILY_GOAL
    ) {
      return `Daily goal must be between ${MIN_DAILY_GOAL} and ${MAX_DAILY_GOAL} skills.`;
    }
    return null;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSaved(false);
      return;
    }
    setError(null);
    setSaved(false);

    const formData = new FormData();
    formData.set('name', name.trim());
    formData.set('dateOfBirth', dateOfBirth);
    formData.set('level', level);
    formData.set('dailySkillGoal', String(dailySkillGoal));

    startTransition(async () => {
      try {
        await updateProfileAction(formData);
        setSaved(true);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Something went wrong. Please try again.');
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="name" className="text-sm font-medium text-violet-900">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder="e.g. Mira"
          className={`${inputClass} mt-1`}
          disabled={isPending}
          required
        />
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="text-sm font-medium text-violet-900">
          Birthday
        </label>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => {
            setDateOfBirth(e.target.value);
            setSaved(false);
          }}
          className={`${inputClass} mt-1`}
          disabled={isPending}
          required
        />
        {derivedAge !== null ? (
          <p className="mt-1 text-sm text-violet-900/70">
            Age today: <span className="font-medium text-violet-900">{derivedAge}</span>
          </p>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-violet-900">Level</legend>
        {LEVELS.map((lvl) => (
          <label
            key={lvl}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition ${
              level === lvl
                ? 'border-violet-500 bg-violet-50'
                : 'border-violet-200 hover:border-violet-400'
            }`}
          >
            <input
              type="radio"
              name="level"
              value={lvl}
              checked={level === lvl}
              onChange={() => {
                setLevel(lvl);
                setSaved(false);
              }}
              disabled={isPending}
              className="mt-1 accent-violet-600"
              required
            />
            <span className="flex flex-col">
              <span className="font-medium">{lvl}</span>
              <span className="text-sm text-violet-900/70">{LEVEL_HINTS[lvl]}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="dailySkillGoal" className="text-sm font-medium text-violet-900">
          Daily goal
        </label>
        <input
          id="dailySkillGoal"
          name="dailySkillGoal"
          type="number"
          min={MIN_DAILY_GOAL}
          max={MAX_DAILY_GOAL}
          step={1}
          value={dailySkillGoal}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            setDailySkillGoal(Number.isFinite(n) ? n : 0);
            setSaved(false);
          }}
          className={`${inputClass} mt-1`}
          disabled={isPending}
          required
        />
        <p className="mt-1 text-sm text-violet-900/70">
          How many distinct skills to practice each day ({MIN_DAILY_GOAL}–{MAX_DAILY_GOAL}).
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        {saved && !isPending ? (
          <span className="text-sm text-violet-700" role="status">
            Saved!
          </span>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-violet-600 px-6 py-2.5 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
