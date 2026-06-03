import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  familyFromRow,
  familyMemberFromRow,
  inviteFromRow,
  type Discipline,
  type Family,
  type FamilyMember,
  type FamilyMemberRow,
  type FamilyRole,
  type FamilyRow,
  type Invite,
  type InviteRow,
} from '@/lib/types';

export async function createFamily(
  userId: string,
  name: string,
  discipline: Discipline = 'ballet',
): Promise<Family> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('family')
    .insert({ name, created_by: userId, discipline })
    .select('*')
    .single();
  if (error) throw new Error(`Failed to create family: ${error.message}`);

  const family = familyFromRow(data as FamilyRow);

  // Add creator as a dancer in the family
  try {
    await addFamilyMember(family.id, userId, 'dancer');
  } catch (err) {
    console.error('Failed to add creator to family:', err);
    throw new Error(`Created family but failed to add you as member: ${err instanceof Error ? err.message : String(err)}`);
  }

  return family;
}

export async function getFamilies(
  userId: string,
  discipline?: Discipline,
): Promise<Family[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('family_member')
    .select('family:family_id(*)')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data
    .map((row) => row.family)
    .filter((f) => f !== null && f !== undefined && !Array.isArray(f))
    .map((f) => familyFromRow(f as unknown as FamilyRow))
    .filter((f) => !discipline || f.discipline === discipline);
}

export async function getFamilyMembers(
  familyId: string,
): Promise<FamilyMember[]> {
  const supabase = await getServerSupabase();

  // Fetch family members
  const { data: members, error: membersError } = await supabase
    .from('family_member')
    .select('*')
    .eq('family_id', familyId)
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
  return members.map((r) => familyMemberFromRow({
    family_id: r.family_id,
    user_id: r.user_id,
    role: r.role,
    joined_at: r.joined_at,
    user_name: profileMap.get(r.user_id) ?? null,
  } as FamilyMemberRow));
}

export async function addFamilyMember(
  familyId: string,
  userId: string,
  role: FamilyRole,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('family_member')
    .insert({ family_id: familyId, user_id: userId, role });
  if (error) throw new Error(error.message);
}

export async function removeFamilyMember(
  familyId: string,
  userId: string,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('family_member')
    .delete()
    .eq('family_id', familyId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

function generateShortCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createInvite(opts: {
  createdBy: string;
  targetFamilyId?: string;
  targetClassId?: string;
  targetRole: FamilyRole | 'teacher' | 'student';
  code?: boolean;
  email?: string;
  expiresInDays?: number;
}): Promise<Invite> {
  const supabase = await getServerSupabase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (opts.expiresInDays ?? 30));

  let code: string | null = null;
  if (opts.code) {
    for (let attempts = 0; attempts < 5; attempts++) {
      code = generateShortCode();
      const { data: existing } = await supabase
        .from('invite')
        .select('id')
        .eq('code', code)
        .is('accepted_at', null)
        .maybeSingle();
      if (!existing) break;
      if (attempts === 4) throw new Error('Failed to generate unique code');
    }
  }

  const row = {
    target_family_id: opts.targetFamilyId ?? null,
    target_class_id: opts.targetClassId ?? null,
    target_role: opts.targetRole,
    code,
    email: opts.email ?? null,
    expires_at: expiresAt.toISOString(),
    created_by: opts.createdBy,
  };

  const { data, error } = await supabase
    .from('invite')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return inviteFromRow(data as InviteRow);
}

export async function getInviteByCode(code: string): Promise<Invite | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('invite')
    .select('*')
    .eq('code', code)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return inviteFromRow(data as InviteRow);
}

export async function getPendingInvitesForUser(
  userId: string,
): Promise<Invite[]> {
  const supabase = await getServerSupabase();

  // Only fetch code-based invites (no email invites since we removed that feature)
  const { data, error } = await supabase
    .from('invite')
    .select('*')
    .is('accepted_at', null)
    .not('code', 'is', null)
    .gt('expires_at', new Date().toISOString());
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data.map((r) => inviteFromRow(r as InviteRow));
}

export async function acceptInvite(
  inviteId: string,
  userId: string,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { data: invite, error: fetchError } = await supabase
    .from('invite')
    .select('*')
    .eq('id', inviteId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (!invite) throw new Error('Invite not found or expired');

  const inv = inviteFromRow(invite as InviteRow);

  if (inv.targetFamilyId) {
    await addFamilyMember(inv.targetFamilyId, userId, inv.targetRole as FamilyRole);
  } else if (inv.targetClassId) {
    const { error: memberError } = await supabase
      .from('class_member')
      .insert({
        class_id: inv.targetClassId,
        user_id: userId,
        role: inv.targetRole,
      });
    if (memberError) throw new Error(memberError.message);
  }

  const { error: updateError } = await supabase
    .from('invite')
    .update({ accepted_at: new Date().toISOString(), accepted_by: userId })
    .eq('id', inviteId);
  if (updateError) throw new Error(updateError.message);
}

export interface ViewableDancer {
  userId: string;
  name: string | null;
  source: 'self' | 'family' | 'class';
  familyId?: string;
  classId?: string;
}

export async function getViewableDancers(
  viewerId: string,
): Promise<ViewableDancer[]> {
  const supabase = await getServerSupabase();
  const dancers: ViewableDancer[] = [];

  // Always include self
  const { data: profile } = await supabase
    .from('user_profile')
    .select('user_id, name')
    .eq('user_id', viewerId)
    .maybeSingle();
  if (profile) {
    dancers.push({
      userId: profile.user_id,
      name: profile.name,
      source: 'self',
    });
  }

  // Find dancers in families where viewer is a parent
  // Step 1: Get all families where viewer is a member
  const { data: viewerFamilies } = await supabase
    .from('family_member')
    .select('family_id')
    .eq('user_id', viewerId);

  if (viewerFamilies && viewerFamilies.length > 0) {
    const familyIds = viewerFamilies.map((f) => f.family_id);

    // Step 2: Get all dancers in those families (excluding viewer)
    const { data: familyDancers } = await supabase
      .from('family_member')
      .select('family_id, user_id, role')
      .in('family_id', familyIds)
      .eq('role', 'dancer')
      .neq('user_id', viewerId);

    if (familyDancers) {
      // Step 3: Get profiles for those dancers
      const dancerIds = familyDancers.map((d) => d.user_id);
      if (dancerIds.length > 0) {
        const { data: dancerProfiles } = await supabase
          .from('user_profile')
          .select('user_id, name')
          .in('user_id', dancerIds);

        if (dancerProfiles) {
          for (const dancer of familyDancers) {
            const profile = dancerProfiles.find((p) => p.user_id === dancer.user_id);
            dancers.push({
              userId: dancer.user_id,
              name: profile?.name || null,
              source: 'family',
              familyId: dancer.family_id,
            });
          }
        }
      }
    }
  }

  // Find students in classes where viewer is a teacher
  // Step 1: Get all classes where viewer is a member
  const { data: viewerClasses } = await supabase
    .from('class_member')
    .select('class_id')
    .eq('user_id', viewerId);

  if (viewerClasses && viewerClasses.length > 0) {
    const classIds = viewerClasses.map((c) => c.class_id);

    // Step 2: Get all students in those classes (excluding viewer)
    const { data: classStudents } = await supabase
      .from('class_member')
      .select('class_id, user_id, role')
      .in('class_id', classIds)
      .eq('role', 'student')
      .neq('user_id', viewerId);

    if (classStudents) {
      // Step 3: Get profiles for those students
      const studentIds = classStudents.map((s) => s.user_id);
      if (studentIds.length > 0) {
        const { data: studentProfiles } = await supabase
          .from('user_profile')
          .select('user_id, name')
          .in('user_id', studentIds);

        if (studentProfiles) {
          for (const student of classStudents) {
            // Don't add if already in list (from family)
            if (!dancers.find((d) => d.userId === student.user_id)) {
              const profile = studentProfiles.find((p) => p.user_id === student.user_id);
              dancers.push({
                userId: student.user_id,
                name: profile?.name || null,
                source: 'class',
                classId: student.class_id,
              });
            }
          }
        }
      }
    }
  }

  return dancers;
}
