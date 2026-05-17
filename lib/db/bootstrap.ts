import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { SEED_SKILLS } from '@/lib/data/seedSkills';
import { SEED_PLANS } from '@/lib/data/seedPlans';
import { CATEGORY_BY_LABEL } from '@/lib/types';

export async function ensureDeviceBootstrapped(deviceId: string): Promise<void> {
  const supabase = getServerSupabase();

  const { data: existing } = await supabase
    .from('user_profile')
    .select('device_id')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (existing) return;

  const { error: profileError } = await supabase.from('user_profile').insert({
    device_id: deviceId,
    name: null,
    age: null,
    level: 'Beginner',
    streak: 0,
    last_practice_date: null,
  });
  if (profileError) throw new Error(`Failed to create profile: ${profileError.message}`);

  const skillRows = SEED_SKILLS.map((s) => ({
    device_id: deviceId,
    category_id: CATEGORY_BY_LABEL[s.category],
    name: s.name,
    description: s.description,
    technique_tips: s.techniqueTips,
    difficulty: s.difficulty,
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
    device_id: deviceId,
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
