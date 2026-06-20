'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { PublicHeader } from '@/components/landing/PublicHeader';

export function isPublicDronePage(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/u' || pathname.startsWith('/u/');
}

function isLandingPage(pathname: string | null): boolean {
  return pathname === '/';
}

function isConsumerAuthPage(pathname: string | null): boolean {
  return pathname === '/login' || pathname === '/signup';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicDrone = isPublicDronePage(pathname);
  const landing = isLandingPage(pathname);
  const consumerAuth = isConsumerAuthPage(pathname);

  return (
    <>
      {!publicDrone ? (landing || consumerAuth ? <PublicHeader /> : <Navbar />) : null}
      <main className={publicDrone ? 'min-h-dvh overflow-x-safe' : 'min-h-dvh overflow-x-safe pt-header'}>
        {children}
      </main>
    </>
  );
}
