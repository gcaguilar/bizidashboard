import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { homeMessages } from './home';
import { navMessages } from './nav';
import { productMessages } from './product';

/**
 * Central dictionary. Add a new area by creating `messages/<area>.ts` and
 * spreading it below (keep one line per area so parallel edits do not clash).
 */
const spanish = {
  ...homeMessages.es,
  ...navMessages.es,
  ...productMessages.es,
};

export type MessageKey = keyof typeof spanish;

const english: Partial<Record<MessageKey, string>> = {
  ...homeMessages.en,
  ...navMessages.en,
  ...productMessages.en,
};

const CATALOGS: Record<Locale, Partial<Record<MessageKey, string>>> = {
  es: spanish,
  en: english,
};

export type MessageParams = Record<string, string | number>;

function interpolate(template: string, params?: MessageParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}

/** Translates `key`; a missing English entry falls back to Spanish. */
export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
  const template = CATALOGS[locale][key] ?? spanish[key];
  return interpolate(template, params);
}

export type Translator = (key: MessageKey, params?: MessageParams) => string;

export function createTranslator(locale: Locale = DEFAULT_LOCALE): Translator {
  return (key, params) => translate(locale, key, params);
}

/** Exposed for tests (catalog completeness / placeholder parity). */
export const MESSAGE_CATALOGS = { es: spanish, en: english } as const;
