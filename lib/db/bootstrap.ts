import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { SEED_SKILLS } from '@/lib/data/seedSkills';
import { SEED_PLANS } from '@/lib/data/seedPlans';
import { CATEGORY_BY_LABEL } from '@/lib/types';

export async function ensureUserBootstrapped(userId: string): Promise<void> {
  const supabase = await getServerSupabase();

  // Race-safe: layout and page render in parallel and both call this with the
  // same user_id on first login. Use upsert+ignoreDuplicates so the database
  // resolves the race at the user_id unique constraint. .select() returns
  // only rows actually inserted — if empty, another request beat us to it and
  // is (or has) seeded skills/plans.
  const { data: inserted, error: profileError } = await supabase
    .from('user_profile')
    .upsert(
      {
        user_id: userId,
        name: null,
        date_of_birth: null,
        level: 'Beginner',
        streak: 0,
        last_practice_date: null,
        daily_skill_goal: 3,
      },
      { onConflict: 'user_id', ignoreDuplicates: true },
    )
    .select('id');
  if (profileError) throw new Error(`Failed to create profile: ${profileError.message}`);
  if (!inserted || inserted.length === 0) return;

  const skillRows = SEED_SKILLS.map((s) => ({
    user_id: userId,
    category_id: CATEGORY_BY_LABEL[s.category],
    name: s.name,
    description: s.description,
    technique_tips: s.techniqueTips,
    trains: s.trains,
    difficulty: s.difficulty,
    level: s.level,
    default_duration_seconds: s.defaultDurationSeconds,
    is_currently_working_on: false,
  }));

  const { data: insertedSkills, error: skillError } = await supabase
    .from('skill')
    .insert(skillRows)
    .select('id, name');
  if (skillError) throw new Error(`Failed to seed skills: ${skillError.message}`);

  const idByName = new Map<string, string>(
    (insertedSkills ?? []).map((r) => [r.name, r.id]),
  );

  const planRows = SEED_PLANS.map((p) => ({
    user_id: userId,
    name: p.name,
    description: p.description,
    is_built_in: true,
    ordered_skill_ids: p.skillNames
      .map((n) => idByName.get(n))
      .filter((id): id is string => Boolean(id)),
  }));

  const { error: planError } = await supabase.from('practice_plan').insert(planRows);
  if (planError) throw new Error(`Failed to seed plans: ${planError.message}`);
}
