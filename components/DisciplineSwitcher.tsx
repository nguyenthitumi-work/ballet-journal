'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { useActiveDiscipline } from './useActiveDiscipline';

// Switches between disciplines. Ballet lives at the root ("/") and owns all the
// existing tabs; Yoga lives under "/yoga", Gym under "/gym". Collapsed into a
// dropdown so the nav stays uncluttered as disciplines grow. Purely
// navigational — the current discipline is derived from the path.
const DISCIPLINES = [
  { id: 'ballet', label: 'Ballet', href: '/' },
  { id: 'yoga', label: 'Yoga', href: '/yoga' },
  { id: 'gym', label: 'Gym', href: '/gym' },
] as const;

export function DisciplineSwitcher() {
  const currentId = useActiveDiscipline();
  const current = DISCIPLINES.find((d) => d.id === currentId) ?? DISCIPLINES[0];

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent | TouchEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        aria-label={`Discipline: ${current.label}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 transition hover:border-violet-400"
      >
        <span>{current.label}</span>
        <span aria-hidden className={`transition ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="menu"
          className="absolute left-0 top-full z-20 mt-2 w-36 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-lg"
        >
          <ul className="flex flex-col py-1">
            {DISCIPLINES.map((d) => {
              const active = d.id === currentId;
              return (
                <li key={d.id} role="none">
                  <Link
                    href={d.href}
                    role="menuitem"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-4 py-2 text-sm transition hover:bg-violet-50 ${
                      active ? 'font-medium text-violet-700' : 'text-violet-900/80'
                    }`}
                  >
                    <span>{d.label}</span>
                    {active ? (
                      <span aria-hidden className="text-violet-600">
                        ✓
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
