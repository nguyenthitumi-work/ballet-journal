import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { profileFromRow } from '@/lib/types';
import type { Level, UserProfile, UserProfileRow } from '@/lib/types';

export async function getProfile(deviceId: string): Promise<UserProfile | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('device_id', deviceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return profileFromRow(data as UserProfileRow);
}

export async function updateProfile(
  deviceId: string,
  patch: Partial<Pick<UserProfile, 'name' | 'age' | 'level'>>,
): Promise<UserProfile> {
  const supabase = getServerSupabase();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.age !== undefined) row.age = patch.age;
  if (patch.level !== undefined) row.level = patch.level;

  const { data, error } = await supabase
    .from('user_profile')
    .update(row)
    .eq('device_id', deviceId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return profileFromRow(data as UserProfileRow);
}

export async function setStreak(
  deviceId: string,
  streak: number,
  lastPracticeDate: string,
): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('user_profile')
    .update({ streak, last_practice_date: lastPracticeDate })
    .eq('device_id', deviceId);
  if (error) throw new Error(error.message);
}

export function isOnboarded(p: UserProfile | null): boolean {
  return Boolean(p && p.name && p.age && (['Beginner', 'Intermediate', 'Advanced'] as Level[]).includes(p.level));
}
