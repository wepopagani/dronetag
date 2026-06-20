'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { logout } from '@/lib/firebase/auth';
import { classNames } from '@/lib/utils';
import { ACCOUNT_NAV_ITEMS, isAccountNavActive } from '@/components/layout/accountNavConfig';
import { NavIcons } from '@/components/layout/navIcons';

type AccountMoreSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AccountMoreSheet({ isOpen, onClose }: AccountMoreSheetProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const overflow = ACCOUNT_NAV_ITEMS.filter((i) => !i.mobilePrimary);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" id="account-more-sheet">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-navy)]/40 backdrop-blur-[2px]"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        className="absolute right-0 bottom-0 left-0 max-h-[min(75dvh,32rem)] overflow-y-auto rounded-t-[1.25rem] border border-[var(--color-border)] bg-white shadow-2xl"
        style={{ paddingBottom: 'calc(1rem + var(--safe-bottom))' }}
      >
        <div className="flex justify-center py-3">
          <span className="h-1 w-10 rounded-full bg-gray-200" aria-hidden />
        </div>
        <p className="px-5 pb-2 text-sm font-semibold text-[var(--color-text)]">
          {t('account.nav.more')}
        </p>
        <ul className="px-3 pb-2">
          {overflow.map((item) => {
            const active = isAccountNavActive(pathname ?? '', item);
            const Icon = NavIcons[item.icon];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={classNames(
                    'tap-44 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[var(--color-action-light)] text-[var(--color-action)]'
                      : 'text-[var(--color-text)] hover:bg-gray-50',
                  )}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-[var(--color-border)] px-3 pt-2">
          <button
            type="button"
            className="tap-44 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={() => { onClose(); void logout(); }}
          >
            <NavIcons.logout className="h-5 w-5 shrink-0" />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
