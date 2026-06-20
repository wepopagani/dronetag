'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function PublicFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-[72rem] px-4 py-8 sm:px-5 lg:px-6">
        <div className="grid gap-6 sm:grid-cols-[1.2fr_1fr] sm:gap-8 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png?v=3" alt="" width={512} height={512} className="h-8 w-8" unoptimized aria-hidden />
              <span className="text-sm font-bold text-[var(--color-navy)]">DroneTag</span>
            </div>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {t('home.footer.desc')}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{t('home.footer.legal')}</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link href="mailto:info@drone-tag.com" className="text-xs text-[var(--color-text)] hover:text-[var(--color-action)]">
                  {t('home.footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="mailto:info@drone-tag.com" className="text-xs text-[var(--color-text)] hover:text-[var(--color-action)]">
                  {t('home.footer.terms')}
                </Link>
              </li>
              <li>
                <Link href="mailto:info@drone-tag.com" className="text-xs text-[var(--color-text)] hover:text-[var(--color-action)]">
                  {t('home.footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="sm:text-right lg:text-right">
            <p className="text-xs text-[var(--color-text-secondary)]">{t('common.version')}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {t('home.footer', { year })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingDisclaimer() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-[72rem] px-4 pb-6 sm:px-5 lg:px-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-white/80 px-4 py-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        <p>{t('legal.platformDisclaimer')}</p>
      </div>
    </div>
  );
}
