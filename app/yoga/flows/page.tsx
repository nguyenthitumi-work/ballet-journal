import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { ensureYogaBootstrapped } from '@/lib/yoga/bootstrap';
import { listFlows } from '@/lib/db/flows';
import { listAsanas } from '@/lib/db/asanas';
import {
  YOGA_STYLE_LABELS,
  flowDurationLabel,
  type YogaFlow,
} from '@/lib/yoga/types';
import type { Level } from '@/lib/types';
import { startFlow } from '../actions';

// Yoga flows — ready-made, timed sequences (per-user data).
//
// SCAFFOLD NOTE: the "start flow" action should reuse the ballet
// practice-session engine (lib/db/sessions.ts + app/practice). A flow becomes a
// PracticeSession (discipline = 'yoga') whose steps are timed holds; each hold
// records a skill_attempt via asana_id, so History, streaks, rewards and the
// MediaPipe pose overlay all work unchanged.

const LEVEL_BADGE_CLASSES: Record<Level, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-amber-50 text-amber-700',
  Advanced: 'bg-violet-100 text-violet-700',
};

function FlowCard({ flow, nameById }: { flow: YogaFlow; nameById: Map<string, string> }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-violet-900">
            {flow.name}
          </h3>
          <p className="text-xs text-violet-900/60">
            {YOGA_STYLE_LABELS[flow.style]} · {flowDurationLabel(flow)} · {flow.poses.length} poses
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${LEVEL_BADGE_CLASSES[flow.level]}`}
        >
          {flow.level}
        </span>
      </div>
      {flow.description ? <p className="text-sm text-violet-900/70">{flow.description}</p> : null}
      <ol className="flex flex-col gap-1 text-sm text-violet-900/80">
        {flow.poses.map((p, i) => {
          const sideLabel = p.side === 'center' ? '' : ` (${p.side})`;
          return (
            <li key={`${p.asanaId}-${i}`} className="flex justify-between gap-3">
              <span>
                {nameById.get(p.asanaId) ?? 'Pose'}
                {sideLabel}
              </span>
              <span className="shrink-0 tabular-nums text-violet-900/50">{p.holdSeconds}s</span>
            </li>
          );
        })}
      </ol>
      <form action={startFlow.bind(null, flow.id)}>
        <button
          type="submit"
          disabled={flow.poses.length === 0}
          className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
        >
          Start flow
        </button>
      </form>
    </article>
  );
}

export default async function YogaFlowsPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');
  await ensureYogaBootstrapped(userId);

  const [flows, asanas] = await Promise.all([listFlows(userId), listAsanas(userId)]);
  const nameById = new Map(asanas.map((a) => [a.id, a.name]));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-violet-900">Flows</h1>
        <p className="text-sm text-violet-900/70">
          Guided, timed sequences. Pick one and follow along.
        </p>
        <nav className="mt-2 flex gap-2">
          <Link
            href="/yoga"
            className="inline-flex items-center rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700 transition hover:border-violet-400"
          >
            ← Asana library
          </Link>
          <Link
            href="/yoga/flows/new"
            className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            + New flow
          </Link>
        </nav>
      </header>

      {flows.length === 0 ? (
        <p className="rounded-2xl border border-violet-200 bg-white p-5 text-sm text-violet-900/70 shadow-sm">
          No flows yet. Refresh to seed the starter flows.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {flows.map((flow) => (
            <FlowCard key={flow.id} flow={flow} nameById={nameById} />
          ))}
        </div>
      )}
    </section>
  );
}
