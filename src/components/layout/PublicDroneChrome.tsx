'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, type Language } from '@/lib/types';

export function PublicDroneChrome({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-dvh bg-gray-100/70">
      <div className="safe-pt sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="safe-px mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5 sm:px-6">
          <span className="text-xs font-bold tracking-[0.14em] text-gray-500 sm:text-[11px] sm:font-semibold sm:text-gray-400">
            DRONETAG
          </span>
          <label className="sr-only" htmlFor="public-lang">
            {t('common.language')}
          </label>
          <select
            id="public-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="tap-44 min-w-[7.5rem] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 sm:min-w-0 sm:px-2 sm:py-1 sm:text-[11px] sm:text-gray-600"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {children}
    </div>
  );
}
