import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export async function getAuthUser(): Promise<User | null> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getAuthUserId(): Promise<string> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error(
      'Not authenticated — proxy.ts should have redirected to /login before reaching this code.',
    );
  }
  return user.id;
}
