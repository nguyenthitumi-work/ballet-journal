'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { signOut } from '@/app/login/actions';

interface MoreMenuItem {
  href: string;
  label: string;
}

interface MoreMenuProps {
  items: readonly MoreMenuItem[];
  email: string | null;
}

export function MoreMenu({ items, email }: MoreMenuProps) {
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
        onClick={() => setOpen((v) => !v)}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-violet-900/80 transition hover:bg-violet-50 hover:text-violet-700"
      >
        More
      </button>
      {open ? (
        <div
          id={panelId}
          role="menu"
          className="absolute right-0 bottom-full mb-2 w-44 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-lg sm:top-full sm:bottom-auto sm:mt-2 sm:mb-0"
        >
          <ul className="flex flex-col py-1">
            {items.map((item) => (
              <li key={item.href} role="none">
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-violet-900/80 hover:bg-violet-50 hover:text-violet-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {email ? (
              <li role="none" className="mt-1 border-t border-violet-100 pt-1">
                <form action={signOut}>
                  <button
                    type="submit"
                    role="menuitem"
                    title={`Signed in as ${email}`}
                    className="block w-full px-4 py-2 text-left text-sm text-violet-900/60 hover:bg-violet-50 hover:text-violet-700"
                  >
                    Sign out
                  </button>
                </form>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
