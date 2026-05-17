import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { skillFromRow, categoryFromRow } from '@/lib/types';
import type {
  CategoryId,
  Skill,
  SkillCategory,
  SkillCategoryRow,
  SkillRow,
} from '@/lib/types';

export async function listCategories(): Promise<SkillCategory[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('skill_category')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SkillCategoryRow[]).map(categoryFromRow);
}

export async function listSkills(deviceId: string): Promise<Skill[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('skill')
    .select('*')
    .eq('device_id', deviceId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SkillRow[]).map(skillFromRow);
}

export async function listSkillsByCategory(
  deviceId: string,
  categoryId: CategoryId,
): Promise<Skill[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('skill')
    .select('*')
    .eq('device_id', deviceId)
    .eq('category_id', categoryId)
    .order('difficulty', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SkillRow[]).map(skillFromRow);
}

export async function getSkill(deviceId: string, skillId: string): Promise<Skill | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('skill')
    .select('*')
    .eq('device_id', deviceId)
    .eq('id', skillId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return skillFromRow(data as SkillRow);
}

export async function setFocus(
  deviceId: string,
  skillId: string,
  focus: boolean,
): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('skill')
    .update({ is_currently_working_on: focus })
    .eq('device_id', deviceId)
    .eq('id', skillId);
  if (error) throw new Error(error.message);
}

export async function listFocusSkills(deviceId: string): Promise<Skill[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('skill')
    .select('*')
    .eq('device_id', deviceId)
    .eq('is_currently_working_on', true)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SkillRow[]).map(skillFromRow);
}

export async function setReferenceUrl(
  deviceId: string,
  skillId: string,
  referenceUrl: string | null,
): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('skill')
    .update({ reference_url: referenceUrl })
    .eq('device_id', deviceId)
    .eq('id', skillId);
  if (error) throw new Error(error.message);
}
