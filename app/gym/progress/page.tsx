import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { ensureGymBootstrapped } from '@/lib/gym/bootstrap';
import { listGymSessions, listExerciseSets } from '@/lib/db/workouts';
import { listExercises } from '@/lib/db/exercises';

const TZ = 'America/Los_Angeles';
const CARD = 'rounded-2xl border border-violet-200 bg-white p-5 shadow-sm';

function ymdInTz(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${y}-${m}-${day}`;
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className={`${CARD} flex flex-col gap-1`}>
      <span className="text-3xl font-semibold tabular-nums text-violet-900">{value}</span>
      <span className="text-sm text-violet-900/60">{label}</span>
    </div>
  );
}

export default async function GymProgressPage() {
  const { userId, profile, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');
  await ensureGymBootstrapped(userId);

  const [sessions, sets, exercises] = await Promise.all([
    listGymSessions(userId),
    listExerciseSets(userId),
    listExercises(userId),
  ]);
  const nameById = new Map(exercises.map((e) => [e.id, e.name]));

  const totalVolume = sets.reduce(
    (sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0),
    0,
  );

  // Most-trained exercises by number of logged sets (tie-break by volume).
  const agg = new Map<string, { setsCount: number; volume: number; bestWeight: number }>();
  for (const s of sets) {
    const bucket = agg.get(s.exerciseId) ?? { setsCount: 0, volume: 0, bestWeight: 0 };
    bucket.setsCount += 1;
    bucket.volume += (s.reps ?? 0) * (s.weight ?? 0);
    bucket.bestWeight = Math.max(bucket.bestWeight, s.weight ?? 0);
    agg.set(s.exerciseId, bucket);
  }
  const topExercises = Array.from(agg.entries())
    .map(([id, v]) => ({ id, name: nameById.get(id) ?? 'Exercise', ...v }))
    .sort((a, b) => b.setsCount - a.setsCount || b.volume - a.volume)
    .slice(0, 5);
  const maxSets = topExercises.reduce((m, e) => Math.max(m, e.setsCount), 0);

  // Last 14 days of activity (sets per day, LA time).
  const today = new Date();
  const days: { ymd: string; label: string; sets: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const label = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'narrow' }).format(d);
    days.push({ ymd: ymdInTz(d), label, sets: 0 });
  }
  const dayByYmd = new Map(days.map((d) => [d.ymd, d]));
  for (const s of sets) {
    const day = dayByYmd.get(ymdInTz(new Date(s.attemptedAt)));
    if (day) day.sets += 1;
  }
  const maxDaySets = days.reduce((m, d) => Math.max(m, d.sets), 0);

  const hasData = sessions.length > 0 || sets.length > 0;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-violet-900">Gym progress</h1>
          <p className="text-sm text-violet-900/70">Your training over time.</p>
        </div>
        <Link href="/gym" className="text-sm text-violet-700 hover:underline">
          ← Gym
        </Link>
      </header>

      {!hasData ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-violet-950">No workouts logged yet.</p>
          <p className="max-w-sm text-violet-900/70">
            Finish a workout and your stats — volume, streak, and most-trained lifts — show up here.
          </p>
          <Link
            href="/gym/workouts"
            className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            Browse workouts
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard value={String(sessions.length)} label="Workouts" />
            <StatCard value={String(sets.length)} label="Sets logged" />
            <StatCard value={Math.round(totalVolume).toLocaleString()} label="Total volume" />
            <StatCard value={`${profile.streak}🔥`} label="Day streak" />
          </div>

          <div className={`${CARD} flex flex-col gap-3`}>
            <h2 className="text-sm font-semibold tracking-tight text-violet-900">Last 14 days</h2>
            <div className="flex items-end justify-between gap-1" aria-label="Sets per day">
              {days.map((d, i) => {
                const h = maxDaySets > 0 ? Math.round((d.sets / maxDaySets) * 56) : 0;
                return (
                  <div key={d.ymd} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-16 w-full items-end justify-center">
                      <div
                        className={`w-full max-w-5 rounded-t ${d.sets > 0 ? 'bg-violet-500' : 'bg-violet-100'}`}
                        style={{ height: `${Math.max(d.sets > 0 ? 4 : 2, h)}px` }}
                        title={`${d.sets} sets`}
                      />
                    </div>
                    <span className="text-[10px] text-violet-900/50">
                      {i % 2 === 0 ? d.label : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${CARD} flex flex-col gap-3`}>
            <h2 className="text-sm font-semibold tracking-tight text-violet-900">
              Most-trained exercises
            </h2>
            {topExercises.length === 0 ? (
              <p className="text-sm text-violet-900/60">No sets logged yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {topExercises.map((e) => (
                  <li key={e.id} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm text-violet-900/80">
                      <span className="font-medium text-violet-950">{e.name}</span>
                      <span className="tabular-nums text-violet-900/60">
                        {e.setsCount} sets{e.bestWeight > 0 ? ` · best ${e.bestWeight}` : ''}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-violet-100">
                      <div
                        className="h-full bg-violet-400"
                        style={{ width: `${maxSets > 0 ? (e.setsCount / maxSets) * 100 : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
