'use client';

/**
 * Sub-nav for the admin section, rendered by individual admin pages
 * underneath the page title.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { classNames } from '@/lib/utils';

export function AdminSubNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { href: '/admin', label: t('admin.nav.overview'), match: (p: string) => p === '/admin' },
    { href: '/admin/users', label: t('admin.nav.users'), match: (p: string) => p.startsWith('/admin/users') },
    { href: '/admin/drones', label: t('admin.nav.drones'), match: (p: string) => p.startsWith('/admin/drones') },
    { href: '/admin/reports', label: t('admin.nav.reports'), match: (p: string) => p.startsWith('/admin/reports') },
    { href: '/admin/verify', label: t('admin.nav.verify'), match: (p: string) => p.startsWith('/admin/verify') },
    { href: '/admin/plans', label: t('admin.nav.plans'), match: (p: string) => p.startsWith('/admin/plans') },
    { href: '/admin/nfc', label: t('admin.nav.nfc'), match: (p: string) => p.startsWith('/admin/nfc') },
  ];

  return (
    <nav className="overflow-x-auto border-b border-gray-200" aria-label="Admin sections">
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-4 sm:px-6 lg:px-8">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={classNames(
                '-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
