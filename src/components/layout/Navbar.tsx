'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode } from 'react';
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
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { ACCOUNT_NAV_ITEMS, isAccountNavActive } from '@/components/layout/accountNavConfig';
import { NavIcons } from '@/components/layout/navIcons';

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inAdmin = pathname.startsWith('/admin');
  const inAccount = pathname === '/account' || pathname.startsWith('/account/');

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const displayName = user?.displayName ?? user?.email ?? '';

  function drawerNavLink(href: string, label: string, icon: React.ReactNode, active: boolean) {
    return (
      <Link
        href={href}
        className={classNames(
          'tap-44 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
          active
            ? 'bg-[var(--color-action-light)] text-[var(--color-action)]'
            : 'text-[var(--color-text)] hover:bg-gray-50',
        )}
        onClick={() => setDrawerOpen(false)}
      >
        <span className="shrink-0">{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <>
      <header className="safe-pt fixed top-0 right-0 left-0 z-50 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md">
        {DEMO_MODE ? (
          <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
            Demo Mode — running with sample data, no Firebase connected
          </div>
        ) : null}
        <div className="mx-auto flex h-[var(--header-height)] max-w-7xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
          <Link href={user ? '/account' : '/'} className="flex shrink-0 items-center gap-2" onClick={() => setDrawerOpen(false)}>
            <span className="inline-flex overflow-hidden rounded-lg">
              <Image src="/logo.png?v=3" alt="DroneTag" width={512} height={512} className="h-7 w-7 sm:h-9 sm:w-9" priority unoptimized />
            </span>
            <span className="hidden text-sm font-bold text-[var(--color-navy)] sm:inline">DroneTag</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <label htmlFor="nav-language" className="sr-only">{t('common.language')}</label>
            <select
              id="nav-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="rounded-lg border border-[var(--color-border)] bg-white py-1.5 pr-8 pl-2 text-xs text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-action)] focus:ring-2 focus:ring-[var(--color-action)]/20"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
            {user ? (
              <>
                {isAdmin ? (
                  <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text)]">
                    {t('nav.dashboard')}
                  </Link>
                ) : null}
                {!inAdmin ? (
                  <Link href="/account" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text)]">
                    {t('nav.account')}
                  </Link>
                ) : null}
                <Button type="button" variant="ghost" size="sm" onClick={() => void logout()}>
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-gray-50">
                  {t('nav.login')}
                </Link>
                {ALLOW_PUBLIC_SIGNUP || DEMO_MODE ? (
                  <Link href="/signup" className="rounded-lg bg-[var(--color-navy)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
                    {t('nav.signup')}
                  </Link>
                ) : null}
              </>
            )}
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            {user ? (
              <Link
                href="/account/profile"
                className="tap-44 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-navy)] text-xs font-bold text-white"
                aria-label={t('nav.account')}
              >
                {userInitials(displayName)}
              </Link>
            ) : null}
            <button
              type="button"
              className="tap-44 inline-flex items-center justify-center rounded-xl p-2.5 text-[var(--color-text-secondary)] hover:bg-gray-100"
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              aria-label={drawerOpen ? t('nav.menuClose') : t('nav.menuOpen')}
              onClick={() => setDrawerOpen((o) => !o)}
            >
              {drawerOpen ? (
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
        </div>
      </header>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="DroneTag">
        <div className="flex flex-col gap-1 p-3" id="mobile-drawer">
          <div className="mb-2 px-3">
            <label htmlFor="nav-language-mobile" className="sr-only">{t('common.language')}</label>
            <select
              id="nav-language-mobile"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="tap-44 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>

          {user && !inAccount ? (
            <>
              {drawerNavLink('/account', t('account.nav.home'), <NavIcons.home className="h-5 w-5" />, false)}
              {ACCOUNT_NAV_ITEMS.filter((i) => i.href !== '/account').map((item) => {
                const Icon = NavIcons[item.icon];
                return (
                  <div key={item.href}>
                    {drawerNavLink(item.href, t(item.labelKey), <Icon className="h-5 w-5" />, isAccountNavActive(pathname ?? '', item))}
                  </div>
                );
              })}
            </>
          ) : null}

          {!user ? (
            <>
              {drawerNavLink('/', t('nav.home'), <NavIcons.home className="h-5 w-5" />, pathname === '/')}
              {drawerNavLink('/login', t('nav.login'), <NavIcons.profile className="h-5 w-5" />, pathname === '/login')}
              {ALLOW_PUBLIC_SIGNUP || DEMO_MODE
                ? drawerNavLink('/signup', t('nav.signup'), <NavIcons.certificates className="h-5 w-5" />, pathname === '/signup')
                : null}
            </>
          ) : (
            <>
              {isAdmin ? drawerNavLink('/admin', t('nav.dashboard'), <NavIcons.settings className="h-5 w-5" />, inAdmin) : null}
              <button
                type="button"
                className="tap-44 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                onClick={() => { setDrawerOpen(false); void logout(); }}
              >
                <NavIcons.logout className="h-5 w-5 shrink-0" />
                {t('nav.logout')}
              </button>
            </>
          )}
        </div>
      </MobileDrawer>
    </>
  );
}
