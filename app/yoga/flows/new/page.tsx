import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { ensureYogaBootstrapped } from '@/lib/yoga/bootstrap';
import { listAsanas } from '@/lib/db/asanas';
import FlowBuilder, { type BuilderAsana } from '../_components/FlowBuilder';

export default async function NewFlowPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');
  await ensureYogaBootstrapped(userId);

  const asanas = await listAsanas(userId);
  const builderAsanas: BuilderAsana[] = asanas.map((a) => ({
    id: a.id,
    name: a.name,
    defaultHoldSeconds: a.defaultHoldSeconds,
  }));

  return <FlowBuilder asanas={builderAsanas} />;
}
