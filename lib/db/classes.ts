import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  classFromRow,
  classMemberFromRow,
  type Class,
  type ClassMember,
  type ClassMemberRow,
  type ClassRole,
  type ClassRow,
} from '@/lib/types';

export async function createClass(
  userId: string,
  name: string,
): Promise<Class> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('class')
    .insert({ name, owner_id: userId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  const cls = classFromRow(data as ClassRow);

  await addClassMember(cls.id, userId, 'teacher');

  return cls;
}

export async function getClasses(userId: string): Promise<Class[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('class_member')
    .select('class:class_id(*)')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data
    .map((row) => row.class)
    .filter((c) => c !== null && c !== undefined && !Array.isArray(c))
    .map((c) => classFromRow(c as unknown as ClassRow));
}

export async function getClassMembers(classId: string): Promise<ClassMember[]> {
  const supabase = await getServerSupabase();

  // Fetch class members
  const { data: members, error: membersError } = await supabase
    .from('class_member')
    .select('*')
    .eq('class_id', classId)
    .order('joined_at', { ascending: true });
  if (membersError) throw new Error(membersError.message);
  if (!members || members.length === 0) return [];

  // Fetch profiles for all user IDs
  const userIds = members.map(m => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profile')
    .select('user_id, name')
    .in('user_id', userIds);
  if (profilesError) throw new Error(profilesError.message);

  // Create a map for quick lookup
  const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) ?? []);

  // Combine members with profile names
  return members.map((r) => classMemberFromRow({
    class_id: r.class_id,
    user_id: r.user_id,
    role: r.role,
    joined_at: r.joined_at,
    user_name: profileMap.get(r.user_id) ?? null,
  } as ClassMemberRow));
}

export async function addClassMember(
  classId: string,
  userId: string,
  role: ClassRole,
): Promise<void> {
  const supabase = await getServerSupabase();

  // Check if user is already a member
  const { data: existing } = await supabase
    .from('class_member')
    .select('role')
    .eq('class_id', classId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // User is already a member, no error - just return
    return;
  }

  const { error } = await supabase
    .from('class_member')
    .insert({ class_id: classId, user_id: userId, role });
  if (error) throw new Error(error.message);
}

export async function removeClassMember(
  classId: string,
  userId: string,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('class_member')
    .delete()
    .eq('class_id', classId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function generateClassInviteCode(classId: string): Promise<string> {
  const supabase = await getServerSupabase();
  let code: string;
  for (let attempts = 0; attempts < 5; attempts++) {
    code = generateInviteCode();
    const { data: existing } = await supabase
      .from('class')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase
        .from('class')
        .update({ invite_code: code })
        .eq('id', classId);
      if (error) throw new Error(error.message);
      return code;
    }
    if (attempts === 4) throw new Error('Failed to generate unique code');
  }
  throw new Error('Failed to generate unique code');
}

export async function getClassByInviteCode(code: string): Promise<Class | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('class')
    .select('*')
    .eq('invite_code', code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return classFromRow(data as ClassRow);
}
