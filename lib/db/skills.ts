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
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill_category')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SkillCategoryRow[]).map(categoryFromRow);
}

export async function listSkills(userId: string): Promise<Skill[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SkillRow[]).map(skillFromRow);
}

export async function listSkillsByCategory(
  userId: string,
  categoryId: CategoryId,
): Promise<Skill[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .order('difficulty', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SkillRow[]).map(skillFromRow);
}

export async function getSkill(userId: string, skillId: string): Promise<Skill | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill')
    .select('*')
    .eq('user_id', userId)
    .eq('id', skillId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return skillFromRow(data as SkillRow);
}

export async function setFocus(
  userId: string,
  skillId: string,
  focus: boolean,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('skill')
    .update({ is_currently_working_on: focus })
    .eq('user_id', userId)
    .eq('id', skillId);
  if (error) throw new Error(error.message);
}

export async function listFocusSkills(userId: string): Promise<Skill[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('skill')
    .select('*')
    .eq('user_id', userId)
    .eq('is_currently_working_on', true)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SkillRow[]).map(skillFromRow);
}

export async function setReferenceUrl(
  userId: string,
  skillId: string,
  referenceUrl: string | null,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('skill')
    .update({ reference_url: referenceUrl })
    .eq('user_id', userId)
    .eq('id', skillId);
  if (error) throw new Error(error.message);
}
