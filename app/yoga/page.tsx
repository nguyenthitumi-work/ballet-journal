import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { ensureYogaBootstrapped } from '@/lib/yoga/bootstrap';
import { listAsanas } from '@/lib/db/asanas';
import { listFlows } from '@/lib/db/flows';
import { getDisciplineState } from '@/lib/db/disciplineProfile';
import { countDistinctSkillsToday } from '@/lib/db/sessions';
import { getWeeklySummary } from '@/lib/services/weeklySummary';
import { listUnlockedSceneIds } from '@/lib/db/rewards';
import { SUBJECT_CONFIG } from '@/lib/services/disciplineSubject';
import { StreakCard } from '@/components/home/StreakCard';
import { TodaysGoalCard } from '@/components/home/TodaysGoalCard';
import { WeeklySummaryCard } from '@/components/home/WeeklySummaryCard';
import { JourneyCard } from '@/components/home/JourneyCard';
import { pickTodaysFlow } from '@/lib/yoga/suggestion';
import { localDayOfWeek } from '@/lib/services/suggestion';
import {
  ASANA_CATEGORY_LABELS,
  YOGA_STYLE_LABELS,
  flowDurationLabel,
  type Asana,
  type AsanaCategory,
} from '@/lib/yoga/types';
import type { Level } from '@/lib/types';
import { parseYouTubeId, toEmbedUrl, youtubeSearchUrlFor } from '@/lib/youtube';
import { AsanaReferenceUrlForm } from './_components/AsanaReferenceUrlForm';
import { startFlow } from './actions';

const LOCAL_TZ = 'America/Los_Angeles';

// Yoga home — the asana (pose) library. Per-user data, mirroring
// app/skills/page.tsx: gate on the session context, lazily seed the user's
// yoga content on first visit, then read their own asanas from the DB.

const LEVEL_BADGE_CLASSES: Record<Level, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-amber-50 text-amber-700',
  Advanced: 'bg-violet-100 text-violet-700',
};

const CATEGORY_ORDER: AsanaCategory[] = [
  'standing',
  'balance',
  'backbend',
  'forward-fold',
  'twist',
  'seated',
  'inversion',
  'restorative',
];

function AsanaCard({ asana }: { asana: Asana }) {
  const videoId = asana.referenceUrl ? parseYouTubeId(asana.referenceUrl) : null;
  return (
    <article className="block rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:border-violet-400">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-violet-900">
            {asana.name}
          </h3>
          {asana.sanskritName ? (
            <p className="text-xs italic text-violet-900/60">{asana.sanskritName}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${LEVEL_BADGE_CLASSES[asana.level]}`}
        >
          {asana.level}
        </span>
      </div>
      {videoId ? (
        <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            src={toEmbedUrl(videoId)}
            title={`${asana.name} reference video`}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            className="h-full w-full"
          />
        </div>
      ) : null}
      {asana.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-violet-900/70">{asana.description}</p>
      ) : null}
      <details className="mt-3 group">
        <summary className="flex cursor-pointer items-center justify-between text-xs font-medium text-violet-700 hover:text-violet-900">
          <span>{videoId ? 'Change video' : '🎥 Add a demo video'}</span>
          <a
            href={youtubeSearchUrlFor(`${asana.name} yoga pose tutorial`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium underline-offset-2 hover:underline"
          >
            Search YouTube ↗
          </a>
        </summary>
        <div className="mt-3">
          <AsanaReferenceUrlForm asanaId={asana.id} initialUrl={asana.referenceUrl} />
        </div>
      </details>
      {asana.focus.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Focus">
          {asana.focus.slice(0, 3).map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      {asana.contraindications.length > 0 ? (
        <p className="mt-3 text-[11px] text-amber-700/90">
          ⚠ Take care: {asana.contraindications.join(', ')}
        </p>
      ) : null}
    </article>
  );
}

export default async function YogaHomePage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');
  await ensureYogaBootstrapped(userId);
  const [asanas, flows, state, todaysCount, weekly, unlockedSceneIds] = await Promise.all([
    listAsanas(userId),
    listFlows(userId),
    getDisciplineState(userId, 'yoga'),
    countDistinctSkillsToday(userId, LOCAL_TZ, 'yoga'),
    getWeeklySummary(userId, new Date(), 'yoga'),
    listUnlockedSceneIds(userId, 'yoga'),
  ]);
  const todaysFlow = pickTodaysFlow(flows, localDayOfWeek(new Date(), LOCAL_TZ));

  const byCategory = new Map<AsanaCategory, Asana[]>();
  for (const a of asanas) {
    const bucket = byCategory.get(a.category);
    if (bucket) bucket.push(a);
    else byCategory.set(a.category, [a]);
  }
  const orderedCategories = CATEGORY_ORDER.filter((c) => byCategory.has(c));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-violet-900">Yoga</h1>
        <p className="text-sm text-violet-900/70">
          Browse the asana library, or jump into a guided flow.
        </p>
        <nav className="mt-2 flex gap-2">
          <Link
            href="/yoga/flows"
            className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            Browse flows →
          </Link>
          <Link
            href="/yoga/progress"
            className="inline-flex items-center rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700 transition hover:border-violet-400"
          >
            Progress
          </Link>
        </nav>
      </header>

      <StreakCard streak={state.streak} />
      <WeeklySummaryCard summary={weekly} href="/yoga/summary" />
      <TodaysGoalCard
        todaysCount={todaysCount}
        goal={state.dailyGoal}
        unit={SUBJECT_CONFIG.yoga.unit}
        unitPlural={SUBJECT_CONFIG.yoga.unitPlural}
      />

      {todaysFlow ? (
        <form action={startFlow.bind(null, todaysFlow.id)}>
          <div className="flex flex-col gap-3 rounded-2xl border border-violet-300 bg-violet-50 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700/80">
                  Today&apos;s flow
                </p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-violet-900">
                  {todaysFlow.name}
                </h2>
                <p className="mt-1 text-sm text-violet-900/70">
                  {YOGA_STYLE_LABELS[todaysFlow.style]} · {flowDurationLabel(todaysFlow)} ·{' '}
                  {todaysFlow.poses.length} poses
                </p>
              </div>
              <span className="rounded-full bg-violet-200 px-3 py-1 text-xs font-medium text-violet-800">
                Suggested
              </span>
            </div>
            <div>
              <button
                type="submit"
                className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
              >
                Start
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {orderedCategories.length === 0 ? (
        <p className="rounded-2xl border border-violet-200 bg-white p-5 text-sm text-violet-900/70 shadow-sm">
          Your asana library is empty. Refresh to seed the starter poses.
        </p>
      ) : (
        orderedCategories.map((cat) => (
          <section key={cat} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-violet-900">
                {ASANA_CATEGORY_LABELS[cat]}
              </h2>
              <span className="text-xs text-violet-900/60">
                {byCategory.get(cat)?.length ?? 0} poses
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(byCategory.get(cat) ?? []).map((a) => (
                <AsanaCard key={a.id} asana={a} />
              ))}
            </div>
          </section>
        ))
      )}

      <JourneyCard unlockedSceneIds={unlockedSceneIds} href="/yoga/rewards" />
    </section>
  );
}
