'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, type Language } from '@/lib/types';

export function PublicDroneChrome({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-dvh bg-gray-100/70">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2 sm:px-6">
          <span className="text-[11px] font-semibold tracking-[0.12em] text-gray-400">DRONETAG</span>
          <label className="sr-only" htmlFor="public-lang">
            {t('common.language')}
          </label>
          <select
            id="public-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-600 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-400/20"
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
