'use client';

import { useState, useTransition } from 'react';
import { sendOtp, verifyOtp } from './actions';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await sendOtp(email);
        setStep('code');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await verifyOtp(email, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  if (step === 'code') {
    return (
      <form onSubmit={handleVerify} className="flex w-full max-w-sm flex-col gap-3">
        <p className="text-sm text-violet-900/80">
          We sent a verification code to <strong>{email}</strong>. Enter it below.
        </p>
        <label className="flex flex-col gap-1 text-left">
          <span className="text-sm font-medium text-violet-900/80">Verification code</span>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Enter code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            className="rounded-full border border-violet-300 px-5 py-2.5 text-center tracking-[0.3em] outline-none focus:border-violet-500"
          />
        </label>
        <button
          type="submit"
          disabled={isPending || token.length < 6}
          className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
        >
          {isPending ? 'Verifying…' : 'Verify code'}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setToken('');
            setError(null);
          }}
          className="text-sm text-violet-900/70 underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="flex w-full max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-violet-900/80">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="rounded-full border border-violet-300 px-5 py-2.5 outline-none focus:border-violet-500"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
      >
        {isPending ? 'Sending…' : 'Send code'}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
