'use client';

/**
 * Client-side helpers for the `practice-videos` Supabase Storage bucket.
 *
 * Path convention (enforced by storage RLS): <auth.uid()>/<uuid>.<ext>
 * The first segment must match the user's auth UID, otherwise the policy
 * denies the operation.
 */

import { getBrowserSupabase } from '@/lib/supabase/browser';

const BUCKET = 'practice-videos';
const SIGNED_URL_TTL_SECONDS = 5 * 60;

export function buildVideoPath(userId: string, mimeType: string): string {
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${userId}/${id}.${ext}`;
}

export async function uploadVideoBlob(path: string, blob: Blob): Promise<void> {
  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'video/webm',
    upsert: false,
  });
  if (error) throw new Error(error.message);
}

export async function getVideoSignedUrl(path: string): Promise<string> {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error('Signed URL was empty.');
  return data.signedUrl;
}

export async function deleteVideoBlob(path: string): Promise<void> {
  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
