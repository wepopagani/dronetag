'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { classNames } from '@/lib/utils';
import { ACCOUNT_NAV_ITEMS, isAccountNavActive } from '@/components/layout/accountNavConfig';
import { NavIcons } from '@/components/layout/navIcons';
import { AccountMoreSheet } from '@/components/layout/AccountMoreSheet';

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = ACCOUNT_NAV_ITEMS.filter((i) => i.mobilePrimary);
  const overflowActive = ACCOUNT_NAV_ITEMS.some(
    (i) => !i.mobilePrimary && isAccountNavActive(pathname ?? '', i),
  );

  return (
    <>
      <nav
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-[var(--color-border)] bg-white/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
        aria-label={t('account.nav.mobile')}
      >
        <ul className="mx-auto flex h-[var(--bottom-nav-height)] max-w-lg items-stretch justify-around px-0.5">
          {primary.map((item) => {
            const active = isAccountNavActive(pathname ?? '', item);
            const Icon = NavIcons[item.icon];
            return (
              <li key={item.href} className="flex min-w-0 flex-1">
                <Link
                  href={item.href}
                  className={classNames(
                    'tap-44 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-[9px] font-medium leading-none transition-colors sm:text-[10px]',
                    active
                      ? 'text-[var(--color-action)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={classNames('h-5 w-5 shrink-0', active && 'stroke-[2.25]')} />
                  <span className="max-w-full truncate px-0.5">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex min-w-0 flex-1">
            <button
              type="button"
              className={classNames(
                'tap-44 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-[9px] font-medium leading-none transition-colors sm:text-[10px]',
                overflowActive || moreOpen
                  ? 'text-[var(--color-action)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
              )}
              aria-expanded={moreOpen}
              aria-controls="account-more-sheet"
              onClick={() => setMoreOpen(true)}
            >
              <NavIcons.more className="h-5 w-5 shrink-0" />
              <span>{t('account.nav.more')}</span>
            </button>
          </li>
        </ul>
      </nav>

      <AccountMoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
