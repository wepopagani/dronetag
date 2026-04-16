'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      titleKey: 'home.feature1Title',
      descKey: 'home.feature1Desc',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 14.25v1.5a2.25 2.25 0 002.25 2.25h1.5m-3.75-3.75h3.75m-3.75 0v3.75m3.75-3.75v3.75" />
        </svg>
      ),
      titleKey: 'home.feature2Title',
      descKey: 'home.feature2Desc',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      titleKey: 'home.feature3Title',
      descKey: 'home.feature3Desc',
    },
  ] as const;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-gray-400">
            <span className="inline-block h-px w-8 bg-gray-300" aria-hidden />
            DRONETAG
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {t('home.hero')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
            {t('home.subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/login" size="lg">
              {t('home.cta')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-gray-100 bg-gray-50/70">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {features.map(({ icon, titleKey, descKey }) => (
              <div key={titleKey}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                  {icon}
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {t(titleKey)}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  {t(descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System description */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm leading-relaxed text-gray-500">
            {t('home.systemDesc')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-gray-400 sm:flex-row">
            <span>{t('home.footer', { year: new Date().getFullYear() })}</span>
            <span>{t('common.version')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
