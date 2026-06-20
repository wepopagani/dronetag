'use client';

import { type ReactNode } from 'react';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { MobileBottomNavigation } from '@/components/layout/MobileBottomNavigation';

export function AccountAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-safe bg-[var(--color-app-bg)] pb-bottom-nav lg:pb-0">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-3 sm:px-6 sm:py-4 lg:py-6">
        <DesktopSidebar />
        <div className="min-w-0 flex-1 overflow-x-safe">{children}</div>
      </div>
      <MobileBottomNavigation />
    </div>
  );
}
