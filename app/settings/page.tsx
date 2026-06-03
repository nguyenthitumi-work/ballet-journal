import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { isOnboarded } from '@/lib/db/profile';
import { listSkills, listFocusSkills } from '@/lib/db/skills';
import {
  getUserVideoStats,
  listAttemptsForSession,
  listSessions,
} from '@/lib/db/sessions';
import { listPlans } from '@/lib/db/plans';
import { getFamilies, getFamilyMembers } from '@/lib/db/families';
import { getClasses, getClassMembers } from '@/lib/db/classes';
import { getServerSupabase } from '@/lib/supabase/server';
import type { FamilyMember, ClassMember } from '@/lib/types';
import ProfileForm from './_components/ProfileForm';
import ThemePicker from './_components/ThemePicker';
import VideoStorageStats from './_components/VideoStorageStats';
import FamilyPanel from './_components/FamilyPanel';
import ClassPanel from './_components/ClassPanel';
import { RoleBadges } from './_components/RoleBadges';

const sectionHeading = 'text-lg font-semibold text-violet-900 mb-3';
const card = 'rounded-2xl border border-violet-200 bg-white p-5 shadow-sm';

interface StatProps {
  label: string;
  value: number | string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl border border-violet-200 bg-white p-3 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-violet-700">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

type Discipline = 'ballet' | 'yoga' | 'gym';
const DISCIPLINE_LABELS: Record<Discipline, string> = {
  ballet: 'Ballet',
  yoga: 'Yoga',
  gym: 'Gym',
};

function parseDiscipline(value: string | string[] | undefined): Discipline {
  const v = Array.isArray(value) ? value[0] : value;
  return v === 'yoga' || v === 'gym' ? v : 'ballet';
}

export default async function SettingsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId, profile, onboarded } = await getSessionContext();

  if (!onboarded || !isOnboarded(profile)) {
    redirect('/onboarding');
  }

  const sp = await props.searchParams;
  const discipline = parseDiscipline(sp.d);

  const [skills, focusSkills, plans, sessions, videoStats, families, classes] = await Promise.all([
    listSkills(userId),
    listFocusSkills(userId),
    listPlans(userId),
    listSessions(userId),
    getUserVideoStats(userId),
    getFamilies(userId, discipline),
    getClasses(userId, discipline),
  ]);

  const familyMembersMap: Record<string, any[]> = {};
  for (const family of families) {
    familyMembersMap[family.id] = await getFamilyMembers(family.id);
  }

  const classMembersMap: Record<string, any[]> = {};
  for (const cls of classes) {
    classMembersMap[cls.id] = await getClassMembers(cls.id);
  }

  const attemptsBySession = await Promise.all(
    sessions.map((s) => listAttemptsForSession(s.id)),
  );
  const totalAttempts = attemptsBySession.reduce((sum, arr) => sum + arr.length, 0);

  // Collect all memberships for this user to display role badges
  const userFamilyMemberships: FamilyMember[] = [];
  const userClassMemberships: ClassMember[] = [];

  for (const family of families) {
    const members = familyMembersMap[family.id] || [];
    const userMembership = members.find((m) => m.userId === userId);
    if (userMembership) {
      userFamilyMemberships.push(userMembership);
    }
  }

  for (const cls of classes) {
    const members = classMembersMap[cls.id] || [];
    const userMembership = members.find((m) => m.userId === userId);
    if (userMembership) {
      userClassMemberships.push(userMembership);
    }
  }

  // Fetch pending invite codes for each family
  const familyInviteCodes: Record<string, string | null> = {};
  const supabase = await getServerSupabase();

  for (const family of families) {
    const { data } = await supabase
      .from('invite')
      .select('code')
      .eq('target_family_id', family.id)
      .is('accepted_at', null)
      .not('code', 'is', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    familyInviteCodes[family.id] = data?.code || null;
  }

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <RoleBadges
          familyMemberships={userFamilyMemberships}
          classMemberships={userClassMemberships}
        />
        <p className="text-violet-900/80">Manage your profile and see your journal stats.</p>
      </header>

      <section>
        <h2 className={sectionHeading}>Profile</h2>
        <div className={card}>
          <ProfileForm initialProfile={profile} />
        </div>
      </section>

      <section>
        <h2 className={sectionHeading}>Appearance</h2>
        <div className={card}>
          <p className="mb-3 text-sm text-violet-900/80">
            Pick a color for the app. It saves to your profile and follows you across devices.
          </p>
          <ThemePicker current={profile.colorTheme} />
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
        <div className="mt-3">
          <VideoStorageStats
            initialVideoCount={videoStats.videoCount}
            initialTotalBytes={videoStats.totalBytes}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-violet-900">{DISCIPLINE_LABELS[discipline]} family</h2>
          <a
            href="/settings/accept-code"
            className="text-sm text-violet-700 hover:text-violet-900 underline"
          >
            Have an invite code?
          </a>
        </div>
        <div className={card}>
          <FamilyPanel
            families={families}
            familyMembers={familyMembersMap}
            inviteCodes={familyInviteCodes}
            userId={userId}
            discipline={discipline}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-violet-900">{DISCIPLINE_LABELS[discipline]} classes</h2>
          <a
            href="/settings/accept-code"
            className="text-sm text-violet-700 hover:text-violet-900 underline"
          >
            Have an invite code?
          </a>
        </div>
        <div className={card}>
          <ClassPanel classes={classes} classMembers={classMembersMap} userId={userId} discipline={discipline} />
        </div>
      </section>

      <section>
        <h2 className={sectionHeading}>About</h2>
        <div className={`${card} flex flex-col gap-2`}>
          <div className="flex items-baseline justify-between">
            <span className="font-medium">Practice Journal</span>
            <span className="text-sm text-violet-700">v0.1.0</span>
          </div>
          <p className="text-sm text-violet-900/80">
            A tiny notebook for tracking ballet practice — built with love for one dancer.
          </p>
          <a
            href="https://github.com/nguyenthitumi-work/-ballet-journal/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-violet-700 underline hover:text-violet-900"
          >
            View README on GitHub
          </a>
        </div>
      </section>
    </section>
  );
}
