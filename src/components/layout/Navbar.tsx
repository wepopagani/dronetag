'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { logout } from '@/lib/firebase/auth';
import { DEMO_MODE } from '@/lib/firebase/config';
import { LANGUAGES, type Language } from '@/lib/types';
import { classNames } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass =
    'rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900';

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      {DEMO_MODE ? (
        <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
          Demo Mode — running with sample data, no Firebase connected
        </div>
      ) : null}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-bold text-gray-900 transition hover:text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              <Image src="/logo.png" alt="DroneTag" width={662} height={166} className="h-8 w-auto sm:h-9" priority />
            </Link>
            {user ? (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                {t('nav.adminBadge')}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
            aria-expanded={mobileOpen}
            aria-label="Menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        <nav
          className={classNames(
            'absolute top-16 right-0 left-0 flex-col gap-1 border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:static md:flex md:max-w-none md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0 md:shadow-none',
            mobileOpen ? 'flex' : 'hidden md:flex'
          )}
        >
          {user ? (
            <>
              <Link href="/admin" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                {t('nav.dashboard')}
              </Link>
              <div className="flex items-center gap-2 px-3 py-2 md:py-0">
                <label htmlFor="nav-language" className="sr-only">
                  {t('common.language')}
                </label>
                <select
                  id="nav-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="max-w-[9rem] rounded-md border border-gray-200 bg-white py-1.5 pr-8 pl-2 text-xs text-gray-600 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400/20"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="px-3 md:px-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full md:w-auto"
                  onClick={() => {
                    setMobileOpen(false);
                    void logout();
                  }}
                >
                  {t('nav.logout')}
                </Button>
              </div>
            </>
          ) : (
            <Link href="/login" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t('nav.login')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
