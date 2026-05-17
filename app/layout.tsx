import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/NavBar';
import { getSessionContext } from '@/lib/session';

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
  await getSessionContext();

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-pink-50/40 text-pink-950">
        <NavBar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
