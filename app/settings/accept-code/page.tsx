import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getInviteByCode, acceptInvite } from '@/lib/db/families';
import { getClassByInviteCode, addClassMember } from '@/lib/db/classes';

export default async function AcceptCodePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { userId } = await getSessionContext();
  const params = await searchParams;
  const code = params.code?.toUpperCase();

  async function handleAcceptCode(formData: FormData) {
    'use server';
    const { userId: authUserId } = await getSessionContext();
    const inviteCode = formData.get('code') as string;

    if (!inviteCode?.trim()) {
      throw new Error('Please enter an invite code');
    }

    const normalizedCode = inviteCode.trim().toUpperCase();

    // First, try to find a formal invite (from invite table)
    const invite = await getInviteByCode(normalizedCode);
    if (invite) {
      await acceptInvite(invite.id, authUserId);
      redirect('/settings');
    }

    // If not found, try class invite code (from class table)
    const classInvite = await getClassByInviteCode(normalizedCode);
    if (classInvite) {
      // Add user as a student by default when joining via class code
      await addClassMember(classInvite.id, authUserId, 'student');
      redirect('/settings');
    }

    throw new Error('Invalid or expired invite code');
  }

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Accept Invite</h1>
        <p className="text-violet-900/80">
          Enter the invite code you received to join a family or class.
        </p>
      </header>

      <form action={handleAcceptCode} className="max-w-md">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-violet-900 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              defaultValue={code || ''}
              placeholder="ABC123"
              className="w-full px-4 py-3 text-lg font-mono uppercase border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
              autoFocus
              required
            />
            <p className="mt-2 text-xs text-violet-700">
              Code is not case-sensitive
            </p>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium"
          >
            Accept Invitation
          </button>
        </div>
      </form>
    </section>
  );
}
