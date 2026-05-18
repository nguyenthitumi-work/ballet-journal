'use client';

/**
 * Client-side helpers for the `practice-photos` Supabase Storage bucket.
 *
 * Path convention (enforced by storage RLS): <auth.uid()>/<uuid>.<ext>
 * The first segment must match the user's auth UID, otherwise the policy
 * denies the operation.
 */

import { getBrowserSupabase } from '@/lib/supabase/browser';

const BUCKET = 'practice-photos';
const SIGNED_URL_TTL_SECONDS = 5 * 60;

export function buildPhotoPath(userId: string, mimeType: string): string {
  // Default to jpg; HEIC keeps its native extension so signed-URL playback
  // works on iOS Safari.
  let ext = 'jpg';
  if (mimeType.includes('webp')) ext = 'webp';
  else if (mimeType.includes('png')) ext = 'png';
  else if (mimeType.includes('heic')) ext = 'heic';
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${userId}/${id}.${ext}`;
}

export async function uploadPhotoBlob(path: string, blob: Blob): Promise<void> {
  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error(error.message);
}

export async function getPhotoSignedUrl(path: string): Promise<string> {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error('Signed URL was empty.');
  return data.signedUrl;
}

export async function deletePhotoBlob(path: string): Promise<void> {
  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
