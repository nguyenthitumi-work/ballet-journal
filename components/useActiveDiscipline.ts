'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export type Discipline = 'ballet' | 'yoga' | 'gym';

// Routes shared by every discipline. Visiting these should NOT switch the
// active discipline — you stay "in" whatever discipline you came from.
const NEUTRAL_ROUTES = new Set(['/history', '/settings', '/guide']);
const STORAGE_KEY = 'activeDiscipline';

/** The discipline a path belongs to, or null for shared/neutral routes. */
function disciplineFromPath(pathname: string): Discipline | null {
  if (pathname === '/yoga' || pathname.startsWith('/yoga/')) return 'yoga';
  if (pathname === '/gym' || pathname.startsWith('/gym/')) return 'gym';
  if (NEUTRAL_ROUTES.has(pathname)) return null;
  return 'ballet';
}

/**
 * The active discipline, sticky across shared routes. On a discipline route it
 * tracks the path and remembers it; on a shared route (History/Settings/Guide)
 * it keeps the last discipline. Because the nav lives in the persistent root
 * layout, in-app navigation keeps this state without a flash; only a hard
 * reload directly onto a shared route briefly shows the default.
 */
export function useActiveDiscipline(): Discipline {
  const pathname = usePathname();
  const fromPath = disciplineFromPath(pathname);
  const [discipline, setDiscipline] = useState<Discipline>(fromPath ?? 'ballet');

  useEffect(() => {
    let next: Discipline | null = fromPath;
    if (fromPath !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, fromPath);
      } catch {
        // ignore storage failures (private mode, etc.)
      }
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'yoga' || stored === 'gym' || stored === 'ballet') next = stored;
      } catch {
        // ignore
      }
    }
    if (next !== null) {
      // Syncing derived/persisted state to the path is the intended use here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiscipline(next);
    }
  }, [fromPath]);

  return discipline;
}
