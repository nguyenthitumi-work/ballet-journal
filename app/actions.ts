'use server';

import { revalidatePath } from 'next/cache';
import { setViewedDancerId, clearViewedDancerId } from '@/lib/viewContext';
import { getAuthUserId } from '@/lib/auth';

export async function setViewContextAction(dancerId: string): Promise<void> {
  const authUserId = await getAuthUserId();
  if (dancerId === authUserId) {
    await clearViewedDancerId();
  } else {
    await setViewedDancerId(dancerId);
  }
  revalidatePath('/', 'layout');
}
