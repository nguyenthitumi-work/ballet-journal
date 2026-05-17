'use server';

import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';

export async function sendOtp(email: string): Promise<void> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Please enter a valid email.');
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({ email: trimmed });
  if (error) throw new Error(error.message);
}

export async function verifyOtp(email: string, token: string): Promise<void> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedToken = token.trim();
  if (!trimmedEmail || !trimmedToken) {
    throw new Error('Email and code are required.');
  }
  if (!/^\d{6,10}$/.test(trimmedToken)) {
    throw new Error('Please enter the verification code from your email.');
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.verifyOtp({
    email: trimmedEmail,
    token: trimmedToken,
    type: 'email',
  });
  if (error) throw new Error(error.message);

  redirect('/');
}

export async function signOut(): Promise<void> {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect('/login');
}
