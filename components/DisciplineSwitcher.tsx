'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Switches between the two disciplines. Ballet lives at the root ("/") and
// owns all the existing tabs; Yoga lives under "/yoga". Purely navigational —
// the active pill is derived from the current path.
const DISCIPLINES = [
  { id: 'ballet', label: 'Ballet', href: '/' },
  { id: 'yoga', label: 'Yoga', href: '/yoga' },
] as const;

export function DisciplineSwitcher() {
  const pathname = usePathname();
  const onYoga = pathname === '/yoga' || pathname.startsWith('/yoga/');

  return (
    <div
      role="tablist"
      aria-label="Discipline"
      className="inline-flex items-center gap-0.5 rounded-full border border-violet-200 bg-violet-50 p-0.5"
    >
      {DISCIPLINES.map((d) => {
        const active = d.id === 'yoga' ? onYoga : !onYoga;
        return (
          <Link
            key={d.id}
            href={d.href}
            role="tab"
            aria-selected={active}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-violet-700 hover:text-violet-900'
            }`}
          >
            {d.label}
          </Link>
        );
      })}
    </div>
  );
}
