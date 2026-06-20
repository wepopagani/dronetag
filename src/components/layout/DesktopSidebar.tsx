'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { logout } from '@/lib/firebase/auth';
import { classNames } from '@/lib/utils';
import { ACCOUNT_NAV_ITEMS, isAccountNavActive } from '@/components/layout/accountNavConfig';
import { NavIcons } from '@/components/layout/navIcons';

export function DesktopSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside
      className="hidden w-[var(--sidebar-width)] shrink-0 lg:flex lg:flex-col"
      aria-label={t('account.nav.sidebar')}
    >
      <div className="sticky top-[calc(var(--header-height)+var(--safe-top)+1rem)] flex max-h-[calc(100dvh-var(--header-height)-var(--safe-top)-2rem)] flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
        <div className="border-b border-[var(--color-border)] px-4 py-4">
          <Link href="/account" className="flex items-center gap-2.5">
            <span className="inline-flex overflow-hidden rounded-xl">
              <Image src="/logo.png?v=3" alt="DroneTag" width={512} height={512} className="h-9 w-9" unoptimized />
            </span>
            <span className="text-sm font-bold text-[var(--color-navy)]">DroneTag</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const active = isAccountNavActive(pathname ?? '', item);
              const Icon = NavIcons[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={classNames(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-[var(--color-action-light)] text-[var(--color-action)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text)]',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-[var(--color-border)] p-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-red-50 hover:text-red-600"
            onClick={() => void logout()}
          >
            <NavIcons.logout className="h-5 w-5 shrink-0" />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </aside>
  );
}
