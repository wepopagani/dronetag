'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAccount } from '@/lib/firebase/account';
import { logout } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * End-user accounts are admin-provisioned. If Auth exists but `users/{uid}`
 * does not, block the account area and show a clear message.
 */
export function AccountProvisionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [checking, setChecking] = useState(true);
  const [provisioned, setProvisioned] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (isAdmin) {
      router.replace('/admin');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const account = await getAccount(user.uid);
        if (!cancelled) setProvisioned(Boolean(account));
      } catch {
        if (!cancelled) setProvisioned(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, isAdmin, router]);

  if (loading || checking) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-gray-50">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"
          role="status"
          aria-label={t('common.loading')}
        />
        <p className="text-sm text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  if (!user || isAdmin) return null;

  if (!provisioned) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-4 py-16 sm:px-6">
        <Card padding="lg" className="w-full text-center">
          <h2 className="text-lg font-semibold text-gray-900">{t('account.notProvisioned.title')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('account.notProvisioned.body')}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" variant="secondary" onClick={() => void logout()}>
              {t('nav.logout')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
