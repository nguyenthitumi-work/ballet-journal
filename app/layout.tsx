import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/NavBar';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { getAuthUser } from '@/lib/auth';
import { getProfile } from '@/lib/db/profile';
import { getViewableDancers } from '@/lib/db/families';
import { getViewedDancerId } from '@/lib/viewContext';
import { DEFAULT_THEME, normalizeTheme, type ThemeId } from '@/lib/themes';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Practice Journal',
  description: 'Track your ballet, yoga, and gym practice.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Show the NavBar only for signed-in users. Public pages (/login,
  // /auth/callback) render bare. proxy.ts handles the auth gate.
  const user = await getAuthUser();

  let viewableDancers;
  let currentDancerId;
  let theme: ThemeId = DEFAULT_THEME;
  if (user) {
    viewableDancers = await getViewableDancers(user.id);
    currentDancerId = await getViewedDancerId();
    const profile = await getProfile(user.id);
    theme = normalizeTheme(profile?.colorTheme);
  }

  return (
    <html lang="en" data-theme={theme} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-violet-50/40 text-violet-950">
        <ServiceWorkerRegister />
        {user ? (
          <NavBar
            email={user.email ?? null}
            viewableDancers={viewableDancers}
            currentDancerId={currentDancerId}
          />
        ) : null}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
