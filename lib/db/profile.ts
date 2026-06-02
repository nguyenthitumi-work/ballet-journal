import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { profileFromRow } from '@/lib/types';
import type { Level, UserProfile, UserProfileRow } from '@/lib/types';

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return profileFromRow(data as UserProfileRow);
}

export async function updateProfile(
  userId: string,
  patch: Partial<
    Pick<UserProfile, 'name' | 'dateOfBirth' | 'level' | 'dailySkillGoal' | 'colorTheme'>
  >,
): Promise<UserProfile> {
  const supabase = await getServerSupabase();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.dateOfBirth !== undefined) row.date_of_birth = patch.dateOfBirth;
  if (patch.level !== undefined) row.level = patch.level;
  if (patch.dailySkillGoal !== undefined) row.daily_skill_goal = patch.dailySkillGoal;
  if (patch.colorTheme !== undefined) row.color_theme = patch.colorTheme;

  const { data, error } = await supabase
    .from('user_profile')
    .update(row)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return profileFromRow(data as UserProfileRow);
}

export async function setStreak(
  userId: string,
  streak: number,
  lastPracticeDate: string,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('user_profile')
    .update({ streak, last_practice_date: lastPracticeDate })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function markRewardsBackfilled(userId: string): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('user_profile')
    .update({ rewards_backfilled_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export function isOnboarded(p: UserProfile | null): boolean {
  return Boolean(
    p &&
      p.name &&
      p.dateOfBirth &&
      (['Beginner', 'Intermediate', 'Advanced'] as Level[]).includes(p.level),
  );
}
