import { translations as en } from './en';
import { translations as de } from './de';
import { translations as es } from './es';
import { translations as fr } from './fr';
import { translations as it } from './it';

export type { TranslationKey, TranslationMap } from './schema';

// ─── Language definition (single source of truth) ────────────────────────────

export type Language = 'en' | 'it' | 'de' | 'es' | 'fr';

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italiano' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
];

// ─── Translation registry ────────────────────────────────────────────────────

const allTranslations: Record<Language, Record<string, string>> = {
  en,
  it,
  de,
  es,
  fr,
};

// ─── Dev-time missing key tracker ────────────────────────────────────────────

const reportedMissing = new Set<string>();

function warnMissing(key: string, lang: Language): void {
  if (process.env.NODE_ENV !== 'production') {
    const id = `${lang}:${key}`;
    if (!reportedMissing.has(id)) {
      reportedMissing.add(id);
      console.warn(`[i18n] Missing "${lang}" translation for key "${key}"`);
    }
  }
}

// ─── Translation function ────────────────────────────────────────────────────

/**
 * Retrieve a translated string.
 *
 * Resolution order:
 *   1. Requested language
 *   2. English fallback
 *   3. Raw key (dev warning emitted)
 *
 * Supports interpolation: t('policy.daysLeft', 'en', { days: 5 })
 */
export function t(
  key: string,
  lang: Language,
  params?: Record<string, string | number>,
): string {
  let value = allTranslations[lang]?.[key];

  if (!value && lang !== 'en') {
    warnMissing(key, lang);
    value = en[key as keyof typeof en];
  }

  if (!value) {
    if (lang === 'en') warnMissing(key, lang);
    return key;
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }

  return value;
}
