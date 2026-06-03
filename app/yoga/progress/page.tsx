import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { ensureYogaBootstrapped } from '@/lib/yoga/bootstrap';
import { listYogaSessions, listAsanaAttempts } from '@/lib/db/flows';
import { listAsanas } from '@/lib/db/asanas';
import { getDisciplineState } from '@/lib/db/disciplineProfile';

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

export default async function YogaProgressPage() {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');
  await ensureYogaBootstrapped(userId);

  const [sessions, attempts, asanas, state] = await Promise.all([
    listYogaSessions(userId),
    listAsanaAttempts(userId),
    listAsanas(userId),
    getDisciplineState(userId, 'yoga'),
  ]);
  const nameById = new Map(asanas.map((a) => [a.id, a.name]));

  const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  // Most-practiced poses, by number of holds (ties broken by total time).
  const poseAgg = new Map<string, { count: number; seconds: number }>();
  for (const a of attempts) {
    const bucket = poseAgg.get(a.asanaId) ?? { count: 0, seconds: 0 };
    bucket.count += 1;
    bucket.seconds += a.durationSeconds;
    poseAgg.set(a.asanaId, bucket);
  }
  const topPoses = Array.from(poseAgg.entries())
    .map(([id, v]) => ({ id, name: nameById.get(id) ?? 'Pose', ...v }))
    .sort((a, b) => b.count - a.count || b.seconds - a.seconds)
    .slice(0, 5);
  const maxPoseCount = topPoses.reduce((m, p) => Math.max(m, p.count), 0);

  // Last 14 days of activity (minutes per day, in LA time).
  const today = new Date();
  const days: { ymd: string; label: string; minutes: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const ymd = ymdInTz(d);
    const label = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'narrow' }).format(d);
    days.push({ ymd, label, minutes: 0 });
  }
  const dayByYmd = new Map(days.map((d) => [d.ymd, d]));
  for (const s of sessions) {
    const ymd = ymdInTz(new Date(s.startedAt));
    const day = dayByYmd.get(ymd);
    if (day) day.minutes += Math.round((s.durationSeconds ?? 0) / 60);
  }
  const maxDayMinutes = days.reduce((m, d) => Math.max(m, d.minutes), 0);

  const hasData = sessions.length > 0;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-violet-900">Yoga progress</h1>
          <p className="text-sm text-violet-900/70">Your practice over time.</p>
        </div>
        <Link href="/yoga" className="text-sm text-violet-700 hover:underline">
          ← Yoga
        </Link>
      </header>

      {!hasData ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-violet-950">No yoga practice yet.</p>
          <p className="max-w-sm text-violet-900/70">
            Finish a flow and your stats — minutes, streak, and most-practiced poses — show up here.
          </p>
          <Link
            href="/yoga/flows"
            className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
          >
            Browse flows
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard value={String(sessions.length)} label="Flows completed" />
            <StatCard value={`${totalMinutes}`} label="Total minutes" />
            <StatCard value={`${state.streak}🔥`} label="Day streak" />
          </div>

          <div className={`${CARD} flex flex-col gap-3`}>
            <h2 className="text-sm font-semibold tracking-tight text-violet-900">
              Last 14 days
            </h2>
            <div className="flex items-end justify-between gap-1" aria-label="Daily minutes">
              {days.map((d, i) => {
                const h = maxDayMinutes > 0 ? Math.round((d.minutes / maxDayMinutes) * 56) : 0;
                return (
                  <div key={d.ymd} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-16 w-full items-end justify-center">
                      <div
                        className={`w-full max-w-5 rounded-t ${d.minutes > 0 ? 'bg-violet-500' : 'bg-violet-100'}`}
                        style={{ height: `${Math.max(d.minutes > 0 ? 4 : 2, h)}px` }}
                        title={`${d.minutes} min`}
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
              Most-practiced poses
            </h2>
            {topPoses.length === 0 ? (
              <p className="text-sm text-violet-900/60">No poses logged yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {topPoses.map((p) => (
                  <li key={p.id} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm text-violet-900/80">
                      <span className="font-medium text-violet-950">{p.name}</span>
                      <span className="tabular-nums text-violet-900/60">
                        {p.count}× · {Math.round(p.seconds / 60)} min
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-violet-100">
                      <div
                        className="h-full bg-violet-400"
                        style={{ width: `${maxPoseCount > 0 ? (p.count / maxPoseCount) * 100 : 0}%` }}
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
