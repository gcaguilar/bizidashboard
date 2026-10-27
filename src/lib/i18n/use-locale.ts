import { useMemo } from 'react';
import { useLocation } from '@tanstack/react-router';
import { getLocaleFromPathname, type Locale } from '@/lib/i18n/locales';
import { createTranslator, type Translator } from '@/lib/i18n/messages';

/**
 * Current locale from the *public* URL (`publicHref` keeps the `/en` prefix
 * that the router rewrite strips from `pathname`). Falls back to Spanish.
 */
export function useLocale(): Locale {
  const location = useLocation();
  const publicPath = location?.publicHref ?? location?.pathname ?? '/';
  return getLocaleFromPathname(publicPath);
}

export function useT(): { locale: Locale; t: Translator } {
  const locale = useLocale();
  const t = useMemo(() => createTranslator(locale), [locale]);
  return { locale, t };
}
