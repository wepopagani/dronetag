/**
 * Translation type schema.
 *
 * TranslationKey — union of every valid key (derived from en.ts)
 * TranslationMap — the shape each language file must satisfy
 *
 * If a key is missing from any language file, TypeScript will flag it.
 * If an unknown key is added, TypeScript will flag it.
 */
export type { TranslationKey } from './en';
export type { TranslationKey as _TK } from './en';

import type { TranslationKey } from './en';

/** Every language file must export an object matching this type exactly. */
export type TranslationMap = Record<TranslationKey, string>;
