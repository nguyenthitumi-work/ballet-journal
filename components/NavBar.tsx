import Link from 'next/link';
import { ViewContextSwitcher } from './ViewContextSwitcher';
import { DisciplineSwitcher } from './DisciplineSwitcher';
import { NavTabs } from './NavTabs';
import type { ViewableDancer } from '@/lib/db/families';

interface NavBarProps {
  email: string | null;
  viewableDancers?: ViewableDancer[];
  currentDancerId?: string;
}

export function NavBar({ email, viewableDancers, currentDancerId }: NavBarProps) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-violet-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2 sm:justify-between sm:py-3">
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/" className="text-lg font-semibold tracking-tight text-violet-700">
            Practice Journal
          </Link>
          <DisciplineSwitcher />
        </div>
        {viewableDancers && currentDancerId && (
          <ViewContextSwitcher dancers={viewableDancers} currentDancerId={currentDancerId} />
        )}
        <NavTabs email={email} />
      </div>
    </nav>
  );
}
