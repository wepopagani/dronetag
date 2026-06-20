'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AccountProvisionGate } from '@/components/account/AccountProvisionGate';
import { AccountAppShell } from '@/components/layout/AccountAppShell';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login?redirect=/account');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[var(--color-app-bg)] pt-header">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-action)]"
          role="status"
          aria-label={t('common.loading')}
        />
        <p className="text-sm text-[var(--color-text-secondary)]">{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AccountProvisionGate>
      <AccountAppShell>{children}</AccountAppShell>
    </AccountProvisionGate>
  );
}
