import Link from 'next/link';
import { signOut } from '@/app/login/actions';

const TABS = [
  { href: '/', label: 'Today' },
  { href: '/skills', label: 'Skills' },
  { href: '/practice', label: 'Practice' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
] as const;

interface NavBarProps {
  email: string | null;
}

export function NavBar({ email }: NavBarProps) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-violet-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2 sm:justify-between sm:py-3">
        <Link
          href="/"
          className="hidden text-lg font-semibold tracking-tight text-violet-700 sm:block"
        >
          Ballet Journal
        </Link>
        <ul className="flex w-full items-center justify-around gap-1 sm:w-auto sm:gap-3">
          {TABS.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-violet-900/80 transition hover:bg-violet-50 hover:text-violet-700"
              >
                {t.label}
              </Link>
            </li>
          ))}
          {email ? (
            <li className="hidden sm:block">
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-violet-900/60 transition hover:bg-violet-50 hover:text-violet-700"
                  title={`Signed in as ${email}`}
                >
                  Sign out
                </button>
              </form>
            </li>
          ) : null}
        </ul>
      </div>
    </nav>
  );
}
