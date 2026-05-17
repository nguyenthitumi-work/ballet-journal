import Link from 'next/link';

const TABS = [
  { href: '/', label: 'Today' },
  { href: '/skills', label: 'Skills' },
  { href: '/practice', label: 'Practice' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
] as const;

export function NavBar() {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-pink-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2 sm:justify-between sm:py-3">
        <Link href="/" className="hidden text-lg font-semibold tracking-tight text-pink-700 sm:block">
          Ballet Journal
        </Link>
        <ul className="flex w-full items-center justify-around gap-1 sm:w-auto sm:gap-3">
          {TABS.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-pink-900/80 transition hover:bg-pink-50 hover:text-pink-700"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
