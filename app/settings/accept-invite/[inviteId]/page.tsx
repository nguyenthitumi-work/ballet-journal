import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';
import { acceptInvite } from '@/lib/db/families';
import { inviteFromRow, type InviteRow } from '@/lib/types';

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const { inviteId } = await params;
  const { userId } = await getSessionContext();

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('invite')
    .select('*')
    .eq('id', inviteId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return (
      <section className="flex flex-col gap-6 py-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Invite Not Found</h1>
          <p className="text-violet-900/80">
            This invite link is invalid or has expired.
          </p>
        </header>
      </section>
    );
  }

  const invite = inviteFromRow(data as InviteRow);

  async function handleAccept() {
    'use server';
    const { userId: authUserId } = await getSessionContext();
    await acceptInvite(inviteId, authUserId);
    redirect('/settings');
  }

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Accept Invite</h1>
        <p className="text-violet-900/80">
          You've been invited to join as a <strong>{invite.targetRole}</strong>.
        </p>
      </header>

      <form action={handleAccept}>
        <button
          type="submit"
          className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium"
        >
          Accept Invitation
        </button>
      </form>
    </section>
  );
}
