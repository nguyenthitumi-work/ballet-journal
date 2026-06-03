import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { getSession } from '@/lib/db/sessions';
import { getFlow } from '@/lib/db/flows';
import { listAsanas } from '@/lib/db/asanas';
import FlowPlayer, { type PlayerStep } from '../../_components/FlowPlayer';

const CARD_CLASS = 'rounded-2xl border border-violet-200 bg-white p-6 shadow-sm';

export default async function YogaPlayPage(props: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await props.params;
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const session = await getSession(userId, sessionId);
  if (session === null || session.discipline !== 'yoga') {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">We couldn&apos;t find that flow session.</h1>
          <p className="mt-2 text-violet-900/70">It may have been deleted.</p>
        </div>
        <Link href="/yoga/flows" className="text-sm text-violet-700 hover:underline">
          ← Back to flows
        </Link>
      </section>
    );
  }

  if (session.endedAt !== null) {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">This session is finished.</h1>
          <p className="mt-2 text-violet-900/70">Nice work — it&apos;s saved to your history.</p>
        </div>
        <Link
          href="/history"
          className="rounded-full bg-violet-600 px-6 py-3 text-center font-medium text-white hover:bg-violet-700"
        >
          View history
        </Link>
      </section>
    );
  }

  const flow = session.flowId ? await getFlow(userId, session.flowId) : null;
  if (flow === null) {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">Flow not found.</h1>
          <p className="mt-2 text-violet-900/70">We couldn&apos;t load this flow&apos;s poses.</p>
        </div>
        <Link href="/yoga/flows" className="text-sm text-violet-700 hover:underline">
          ← Back to flows
        </Link>
      </section>
    );
  }

  const asanas = await listAsanas(userId);
  const byId = new Map(asanas.map((a) => [a.id, a]));

  const steps: PlayerStep[] = flow.poses
    .map((p): PlayerStep | null => {
      const asana = byId.get(p.asanaId);
      if (!asana) return null;
      return {
        asanaId: p.asanaId,
        name: asana.name,
        sanskritName: asana.sanskritName,
        cues: asana.cues,
        side: p.side,
        holdSeconds: p.holdSeconds,
        breathCue: p.breathCue,
      };
    })
    .filter((s): s is PlayerStep => s !== null);

  if (steps.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <div className={CARD_CLASS}>
          <h1 className="text-xl font-medium">This flow has no poses.</h1>
        </div>
        <Link href="/yoga/flows" className="text-sm text-violet-700 hover:underline">
          ← Back to flows
        </Link>
      </section>
    );
  }

  return (
    <FlowPlayer
      sessionId={sessionId}
      userId={userId}
      flowName={flow.name}
      steps={steps}
    />
  );
}
