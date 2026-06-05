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
    <nav className="sticky top-0 z-10 border-b border-violet-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-3xl flex-col px-4 py-2 sm:py-3">
        {/* Line 1: app name + discipline switcher (and the view switcher, when present). */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-700 to-violet-900 text-base font-bold text-white shadow-sm shadow-violet-300/50 transition group-hover:scale-105"
              >
                PJ
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-violet-900 sm:text-3xl">
                Practice Journal
              </span>
            </Link>
            <DisciplineSwitcher />
          </div>
          {viewableDancers && currentDancerId && (
            <ViewContextSwitcher dancers={viewableDancers} currentDancerId={currentDancerId} />
          )}
        </div>
        {/* Line 2: primary tabs. Same layout on mobile and desktop. */}
        <div className="mt-3 border-t border-violet-100 pt-2">
          <NavTabs email={email} />
        </div>
      </div>
    </nav>
  );
}
