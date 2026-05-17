import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/NavBar';
import { getAuthUser } from '@/lib/auth';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ballet Journal',
  description: 'A tiny notebook for tracking ballet practice.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Show the NavBar only for signed-in users. Public pages (/login,
  // /auth/callback) render bare. proxy.ts handles the auth gate.
  const user = await getAuthUser();

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-violet-50/40 text-violet-950">
        {user ? <NavBar email={user.email ?? null} /> : null}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
