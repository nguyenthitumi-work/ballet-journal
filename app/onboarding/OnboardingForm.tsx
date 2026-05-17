'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import type { Level } from '@/lib/types';
import { submitOnboarding } from './actions';

const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
const MIN_AGE = 3;
const MAX_AGE = 120;

const LEVEL_HINTS: Record<Level, string> = {
  Beginner: 'Just starting out',
  Intermediate: 'A few years in (like Vag 2–3)',
  Advanced: 'Pointe & beyond',
};

interface Props {
  initialName: string;
  initialAge: number | '';
  initialLevel: Level;
}

const inputClass =
  'w-full rounded-lg border border-pink-200 px-3 py-2 focus:border-pink-500 focus:outline-none';

export default function OnboardingForm({ initialName, initialAge, initialLevel }: Props) {
  const [name, setName] = useState<string>(initialName);
  const [age, setAge] = useState<number | ''>(initialAge);
  const [level, setLevel] = useState<Level>(initialLevel);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validate = (): string | null => {
    if (name.trim().length === 0) return 'Please tell us your name.';
    if (age === '' || !Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
      return `Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}.`;
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
    formData.set('age', String(age));
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
      <section className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">Hi! What should we call you?</h2>
        <p className="mt-1 text-sm text-pink-900/70">Your first name is perfect.</p>
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

      <section className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">How old are you?</h2>
        <p className="mt-1 text-sm text-pink-900/70">So we can pick the right skills for you.</p>
        <label htmlFor="age" className="sr-only">
          Age
        </label>
        <input
          id="age"
          name="age"
          type="number"
          inputMode="numeric"
          min={MIN_AGE}
          max={MAX_AGE}
          value={age}
          onChange={(e) => {
            const v = e.target.value;
            setAge(v === '' ? '' : Number(v));
          }}
          placeholder="10"
          className={`${inputClass} mt-4`}
          disabled={isPending}
          required
        />
      </section>

      <section className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">What level are you dancing at?</h2>
        <p className="mt-1 text-sm text-pink-900/70">Don&apos;t worry — you can change this later.</p>
        <fieldset className="mt-4 flex flex-col gap-2">
          <legend className="sr-only">Level</legend>
          {LEVELS.map((lvl) => (
            <label
              key={lvl}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition ${
                level === lvl
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-pink-200 hover:border-pink-400'
              }`}
            >
              <input
                type="radio"
                name="level"
                value={lvl}
                checked={level === lvl}
                onChange={() => setLevel(lvl)}
                disabled={isPending}
                className="mt-1 accent-pink-600"
                required
              />
              <span className="flex flex-col">
                <span className="font-medium">{lvl}</span>
                <span className="text-sm text-pink-900/70">{LEVEL_HINTS[lvl]}</span>
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
          className="rounded-full bg-pink-600 px-6 py-2.5 font-medium text-white hover:bg-pink-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'All set!'}
        </button>
      </div>
    </form>
  );
}
