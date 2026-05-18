'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import type { Level } from '@/lib/types';
import { computeAge, isValidDateOfBirth, MIN_AGE, MAX_AGE } from '@/lib/age';
import { submitOnboarding } from './actions';

const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];

const LEVEL_HINTS: Record<Level, string> = {
  Beginner: 'Just starting out',
  Intermediate: 'A few years in (like Vag 2–3)',
  Advanced: 'Pointe & beyond',
};

interface Props {
  initialName: string;
  initialDateOfBirth: string;
  initialLevel: Level;
}

const inputClass =
  'w-full rounded-lg border border-violet-200 px-3 py-2 focus:border-violet-500 focus:outline-none';

export default function OnboardingForm({
  initialName,
  initialDateOfBirth,
  initialLevel,
}: Props) {
  const [name, setName] = useState<string>(initialName);
  const [dateOfBirth, setDateOfBirth] = useState<string>(initialDateOfBirth);
  const [level, setLevel] = useState<Level>(initialLevel);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const derivedAge = computeAge(dateOfBirth || null);

  const validate = (): string | null => {
    if (name.trim().length === 0) return 'Please tell us your name.';
    if (!dateOfBirth) return 'Please pick your birthday.';
    if (!isValidDateOfBirth(dateOfBirth)) {
      return `Birthday must be a real past date and put your age between ${MIN_AGE} and ${MAX_AGE}.`;
    }
    if (!LEVELS.includes(level)) return 'Please pick a level.';
    return null;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set('name', name.trim());
    formData.set('dateOfBirth', dateOfBirth);
    formData.set('level', level);

    startTransition(async () => {
      try {
        await submitOnboarding(formData);
      } catch (err) {
        if (err instanceof Error) {
          // Next's redirect() throws a special error that should not be caught visibly.
          // It has a `digest` starting with 'NEXT_REDIRECT'.
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">Hi! What should we call you?</h2>
        <p className="mt-1 text-sm text-violet-900/70">Your first name is perfect.</p>
        <label htmlFor="name" className="sr-only">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mira"
          className={`${inputClass} mt-4`}
          disabled={isPending}
          required
        />
      </section>

      <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">When is your birthday?</h2>
        <p className="mt-1 text-sm text-violet-900/70">
          So we can pick the right skills for you. We&apos;ll figure out your age from this.
        </p>
        <label htmlFor="dateOfBirth" className="sr-only">
          Birthday
        </label>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className={`${inputClass} mt-4`}
          disabled={isPending}
          required
        />
        {derivedAge !== null ? (
          <p className="mt-2 text-sm text-violet-900/70">
            That makes you <span className="font-medium text-violet-900">{derivedAge}</span>{' '}
            years old today.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">What level are you dancing at?</h2>
        <p className="mt-1 text-sm text-violet-900/70">Don&apos;t worry — you can change this later.</p>
        <fieldset className="mt-4 flex flex-col gap-2">
          <legend className="sr-only">Level</legend>
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
                onChange={() => setLevel(lvl)}
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
      </section>

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
          type="submit"
          disabled={isPending}
          className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'All set!'}
        </button>
      </div>
    </form>
  );
}
