'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreMenu } from './MoreMenu';
import { useActiveDiscipline, type Discipline } from './useActiveDiscipline';

interface Tab {
  href: string;
  label: string;
}

// Primary tabs per discipline. The discipline "home" routes ('/', '/yoga',
// '/gym') are the first tab in each set; History is shared across all three.
const PRIMARY_TABS: Record<Discipline, readonly Tab[]> = {
  ballet: [
    { href: '/', label: 'Today' },
    { href: '/skills', label: 'Skills' },
    { href: '/practice', label: 'Practice' },
    { href: '/history', label: 'History' },
  ],
  yoga: [
    { href: '/yoga', label: 'Asanas' },
    { href: '/yoga/flows', label: 'Flows' },
    { href: '/yoga/progress', label: 'Progress' },
    { href: '/history?d=yoga', label: 'History' },
  ],
  gym: [
    { href: '/gym', label: 'Exercises' },
    { href: '/gym/workouts', label: 'Workouts' },
    { href: '/gym/progress', label: 'Progress' },
    { href: '/history?d=gym', label: 'History' },
  ],
};

// "More" menu per discipline. Milestones/Badges/Summary are ballet features;
// yoga/gym keep just Guide + Settings (MoreMenu appends Sign out).
const MORE_ITEMS: Record<Discipline, readonly Tab[]> = {
  ballet: [
    { href: '/milestones', label: 'Milestones' },
    { href: '/badges', label: 'Badges' },
    { href: '/summary', label: 'Summary' },
    { href: '/guide', label: 'Guide' },
    { href: '/settings', label: 'Settings' },
  ],
  yoga: [
    { href: '/guide', label: 'Guide' },
    { href: '/settings?d=yoga', label: 'Settings' },
  ],
  gym: [
    { href: '/guide', label: 'Guide' },
    { href: '/settings?d=gym', label: 'Settings' },
  ],
};

// Discipline "home" routes need an exact match so they don't stay highlighted
// on their own sub-pages (e.g. /yoga shouldn't be active on /yoga/flows).
const HOME_ROUTES = new Set(['/', '/yoga', '/gym']);

function isActive(pathname: string, href: string): boolean {
  const path = href.split('?')[0]; // ignore query (e.g. /history?d=yoga)
  if (HOME_ROUTES.has(path)) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function NavTabs({ email }: { email: string | null }) {
  const pathname = usePathname();
  const discipline = useActiveDiscipline();
  const tabs = PRIMARY_TABS[discipline];
  const moreItems = MORE_ITEMS[discipline];

  return (
    <ul className="flex w-full items-center justify-around gap-1 sm:w-auto sm:gap-3">
      {tabs.map((t) => {
        const active = isActive(pathname, t.href);
        return (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? 'bg-violet-100 text-violet-800'
                  : 'text-violet-900/80 hover:bg-violet-50 hover:text-violet-700'
              }`}
            >
              {t.label}
            </Link>
          </li>
        );
      })}
      <li>
        <MoreMenu items={moreItems} email={email} />
      </li>
    </ul>
  );
}
