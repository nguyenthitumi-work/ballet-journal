import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { getProfile, setStreak } from '@/lib/db/profile';
import type { Discipline, Level } from '@/lib/types';

export interface DisciplineState {
  level: Level;
  streak: number;
  lastPracticeDate: string | null;
}

const DEFAULT_STATE: DisciplineState = {
  level: 'Beginner',
  streak: 0,
  lastPracticeDate: null,
};

interface DisciplineProfileRow {
  level: Level;
  streak: number;
  last_practice_date: string | null;
}

// Per-discipline streak/level. Ballet reads from the original user_profile (so
// existing ballet behavior is untouched); yoga and gym read from
// discipline_profile, lazily creating a row on first access.
export async function getDisciplineState(
  userId: string,
  discipline: Discipline,
): Promise<DisciplineState> {
  if (discipline === 'ballet') {
    const profile = await getProfile(userId);
    if (!profile) return DEFAULT_STATE;
    return {
      level: profile.level,
      streak: profile.streak,
      lastPracticeDate: profile.lastPracticeDate,
    };
  }

  const supabase = await getServerSupabase();
  await supabase
    .from('discipline_profile')
    .upsert({ user_id: userId, discipline }, { onConflict: 'user_id,discipline', ignoreDuplicates: true });

  const { data, error } = await supabase
    .from('discipline_profile')
    .select('level, streak, last_practice_date')
    .eq('user_id', userId)
    .eq('discipline', discipline)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as DisciplineProfileRow | null;
  if (!row) return DEFAULT_STATE;
  return {
    level: row.level,
    streak: row.streak,
    lastPracticeDate: row.last_practice_date,
  };
}

// Advance a discipline's streak. Ballet writes to user_profile (existing path);
// yoga/gym write to discipline_profile.
export async function setDisciplineStreak(
  userId: string,
  discipline: Discipline,
  streak: number,
  lastPracticeDate: string,
): Promise<void> {
  if (discipline === 'ballet') {
    await setStreak(userId, streak, lastPracticeDate);
    return;
  }
  const supabase = await getServerSupabase();
  const { error } = await supabase.from('discipline_profile').upsert(
    {
      user_id: userId,
      discipline,
      streak,
      last_practice_date: lastPracticeDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,discipline' },
  );
  if (error) throw new Error(error.message);
}

export async function setDisciplineLevel(
  userId: string,
  discipline: Discipline,
  level: Level,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from('discipline_profile').upsert(
    {
      user_id: userId,
      discipline,
      level,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,discipline' },
  );
  if (error) throw new Error(error.message);
}
