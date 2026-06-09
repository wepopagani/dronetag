'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { logout } from '@/lib/firebase/auth';
import { DEMO_MODE } from '@/lib/firebase/config';
import { ALLOW_PUBLIC_SIGNUP } from '@/lib/config/features';
import { LANGUAGES, type Language } from '@/lib/types';
import { classNames } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const inAdmin = pathname.startsWith('/admin');

  const navLinkClass =
    'rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 active:bg-gray-100';

  // Close the sheet on route change (e.g. after tapping a link).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scroll while the mobile sheet is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  function navItems(mobile: boolean) {
    const linkClass = mobile ? classNames(navLinkClass, 'block w-full text-left') : navLinkClass;

    return (
      <>
        <div className={classNames('flex items-center gap-2', mobile ? 'px-1 py-1' : 'px-3 py-0')}>
          <label htmlFor={mobile ? 'nav-language-mobile' : 'nav-language'} className="sr-only">
            {t('common.language')}
          </label>
          <select
            id={mobile ? 'nav-language-mobile' : 'nav-language'}
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className={classNames(
              'rounded-lg border border-gray-200 bg-white py-2.5 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20',
              mobile ? 'tap-44 w-full' : 'max-w-[9rem] py-1.5 pr-8 pl-2 text-xs text-gray-600',
            )}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {user ? (
          <>
            {isAdmin ? (
              <Link href="/admin" className={linkClass} onClick={closeMobile}>
                {t('nav.dashboard')}
              </Link>
            ) : null}
            {!inAdmin ? (
              <Link href="/account" className={linkClass} onClick={closeMobile}>
                {t('nav.account')}
              </Link>
            ) : null}
            <div className={mobile ? 'px-1 pt-1' : 'px-3 md:px-0'}>
              <Button
                type="button"
                variant="ghost"
                size={mobile ? 'lg' : 'sm'}
                className={classNames('tap-44', mobile && 'w-full justify-start')}
                onClick={() => {
                  closeMobile();
                  void logout();
                }}
              >
                {t('nav.logout')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className={linkClass} onClick={closeMobile}>
              {t('nav.login')}
            </Link>
            {ALLOW_PUBLIC_SIGNUP || DEMO_MODE ? (
              <Link
                href="/signup"
                className={classNames(
                  mobile
                    ? 'tap-44 block w-full rounded-lg bg-slate-900 px-3 py-3 text-center text-sm font-semibold text-white transition active:bg-slate-800'
                    : 'rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800',
                )}
                onClick={closeMobile}
              >
                {t('nav.signup')}
              </Link>
            ) : null}
          </>
        )}
      </>
    );
  }

  return (
    <header className="safe-pt fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      {DEMO_MODE ? (
        <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
          Demo Mode — running with sample data, no Firebase connected
        </div>
      ) : null}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-sm font-bold text-gray-900 transition hover:text-gray-700"
              onClick={closeMobile}
            >
              <span className="inline-flex shrink-0 overflow-hidden rounded-[0.65rem] sm:rounded-[0.75rem]">
                <Image
                  src="/logo.png?v=3"
                  alt="DroneTag"
                  width={512}
                  height={512}
                  className="block h-8 w-8 sm:h-9 sm:w-9"
                  priority
                  unoptimized
                />
              </span>
            </Link>
            {user && isAdmin ? (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                {t('nav.adminBadge')}
              </span>
            ) : null}
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {navItems(false)}
          </nav>

          <button
            type="button"
            className="tap-44 inline-flex shrink-0 items-center justify-center rounded-lg p-2.5 text-gray-600 active:bg-gray-100 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileOpen ? (
          <nav
            id="mobile-nav"
            className="flex flex-col gap-1 border-t border-gray-100 bg-white py-3 md:hidden"
            aria-label="Menu mobile"
          >
            {navItems(true)}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
