import 'server-only';
import { cookies } from 'next/headers';
import { getAuthUserId } from '@/lib/auth';

const VIEW_CONTEXT_COOKIE = 'view_dancer_id';

export async function getViewedDancerId(): Promise<string> {
  const cookieStore = await cookies();
  const viewed = cookieStore.get(VIEW_CONTEXT_COOKIE)?.value;
  if (viewed) return viewed;
  return await getAuthUserId();
}

export async function setViewedDancerId(dancerId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(VIEW_CONTEXT_COOKIE, dancerId, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearViewedDancerId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(VIEW_CONTEXT_COOKIE);
}
