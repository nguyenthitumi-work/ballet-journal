import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import type { Level } from '@/lib/types';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage() {
  const { profile, onboarded } = await getSessionContext();

  if (onboarded) {
    redirect('/');
  }

  const initialName = profile.name ?? '';
  const initialDateOfBirth: string = profile.dateOfBirth ?? '';
  const initialLevel: Level = profile.level ?? 'Intermediate';

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to Plié!</h1>
        <p className="text-violet-900/80">
          A few quick questions and we&apos;ll get your journal ready.
        </p>
      </header>

      <OnboardingForm
        initialName={initialName}
        initialDateOfBirth={initialDateOfBirth}
        initialLevel={initialLevel}
      />
    </section>
  );
}
