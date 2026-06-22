'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function AuthOrDivider() {
  const { t } = useLanguage();

  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-[var(--color-border)]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
          {t('auth.or')}
        </span>
      </div>
    </div>
  );
}
