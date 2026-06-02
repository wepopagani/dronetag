'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AccountProvisionGate } from '@/components/account/AccountProvisionGate';
import { classNames } from '@/lib/utils';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login?redirect=/account');
  }, [user, loading, router]);

  if (loading) {
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

  if (!user) return null;

  const tabs = [
    { href: '/account/profile', label: t('account.tabProfile'), prefix: '/account/profile' },
    { href: '/account/operators', label: t('account.tab.operators'), prefix: '/account/operators' },
    { href: '/account/drones', label: t('account.tab.drones'), prefix: '/account/drones' },
    { href: '/account/insurances', label: t('account.tab.insurances'), prefix: '/account/insurances' },
    { href: '/account/certificates', label: t('account.tab.certificates'), prefix: '/account/certificates' },
    { href: '/account/documents', label: t('account.tab.documents'), prefix: '/account/documents' },
    { href: '/account/inbox', label: t('inbox.tab'), prefix: '/account/inbox' },
    { href: '/account/billing', label: t('account.tab.billing'), prefix: '/account/billing' },
    { href: '/account/orders', label: t('account.tabOrders'), prefix: '/account/orders' },
  ];

  return (
    <AccountProvisionGate>
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            {t('account.eyebrow')}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('account.title', { name: user.displayName ?? user.email ?? '' })}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t('account.subtitle')}</p>
        </div>

        <nav
          className="mt-6 flex items-center gap-1 overflow-x-auto border-b border-gray-200"
          aria-label="Account sections"
        >
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.prefix}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={classNames(
                  '-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition',
                  active
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">{children}</div>
    </div>
    </AccountProvisionGate>
  );
}
