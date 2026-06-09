'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';

/** True on anonymous public drone pages (`/u/[slug]`). */
export function isPublicDronePage(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/u' || pathname.startsWith('/u/');
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicDrone = isPublicDronePage(pathname);

  return (
    <>
      {!publicDrone ? <Navbar /> : null}
      <main className={publicDrone ? 'min-h-dvh' : 'min-h-screen pt-16'}>
        {children}
      </main>
    </>
  );
}
