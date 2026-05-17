import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { isOnboarded } from '@/lib/db/profile';
import { listSkills, listFocusSkills } from '@/lib/db/skills';
import { listSessions } from '@/lib/db/sessions';
import { listAttemptsForSession } from '@/lib/db/sessions';
import { listPlans } from '@/lib/db/plans';
import ProfileForm from './_components/ProfileForm';

const sectionHeading = 'text-lg font-semibold text-pink-900 mb-3';
const card = 'rounded-2xl border border-pink-200 bg-white p-5 shadow-sm';

interface StatProps {
  label: string;
  value: number | string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-pink-700">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default async function SettingsPage() {
  const { userId, profile, onboarded } = await getSessionContext();

  if (!onboarded || !isOnboarded(profile)) {
    redirect('/onboarding');
  }

  const [skills, focusSkills, plans, sessions] = await Promise.all([
    listSkills(userId),
    listFocusSkills(userId),
    listPlans(userId),
    listSessions(userId),
  ]);

  const attemptsBySession = await Promise.all(
    sessions.map((s) => listAttemptsForSession(s.id)),
  );
  const totalAttempts = attemptsBySession.reduce((sum, arr) => sum + arr.length, 0);

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-pink-900/80">Manage your profile and see your journal stats.</p>
      </header>

      <section>
        <h2 className={sectionHeading}>Profile</h2>
        <div className={card}>
          <ProfileForm initialProfile={profile} />
        </div>
      </section>

      <section>
        <h2 className={sectionHeading}>Storage stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Skills" value={skills.length} />
          <Stat label="Focus skills" value={focusSkills.length} />
          <Stat label="Plans" value={plans.length} />
          <Stat label="Completed sessions" value={sessions.length} />
          <Stat label="Total attempts" value={totalAttempts} />
        </div>
      </section>

      <section>
        <h2 className={sectionHeading}>About</h2>
        <div className={`${card} flex flex-col gap-2`}>
          <div className="flex items-baseline justify-between">
            <span className="font-medium">Ballet Journal</span>
            <span className="text-sm text-pink-700">v0.1.0</span>
          </div>
          <p className="text-sm text-pink-900/80">
            A tiny notebook for tracking ballet practice — built with love for one dancer.
          </p>
          <a
            href="#"
            className="text-sm font-medium text-pink-700 underline hover:text-pink-900"
          >
            View README on GitHub
          </a>
        </div>
      </section>
    </section>
  );
}
