import { getSiteUrl } from '@/lib/site';
import { HTML_LANG, isTranslatedPath, localizePathname, OG_LOCALE, type Locale } from '@/lib/i18n/locales';

type LinkEntry = { rel: string; href: string; hreflang?: string };

/** Absolute URL of `path` (Spanish internal path) in `locale`. */
export function localizedUrl(path: string, locale: Locale): string {
  return `${getSiteUrl()}${localizePathname(path, locale)}`;
}

/**
 * hreflang set for a translated route (`es`, `en`, `x-default` = Spanish).
 * Returns nothing for routes without an English twin, so their HTML is
 * untouched.
 */
export function buildLocaleAlternates(path: string): LinkEntry[] {
  if (!isTranslatedPath(path)) {
    return [];
  }
  return [
    { rel: 'alternate', hreflang: HTML_LANG.es, href: localizedUrl(path, 'es') },
    { rel: 'alternate', hreflang: HTML_LANG.en, href: localizedUrl(path, 'en') },
    { rel: 'alternate', hreflang: 'x-default', href: localizedUrl(path, 'es') },
  ];
}

/** Canonical URL plus alternates for `path` rendered in `locale`. */
export function buildLocaleLinks(path: string, locale: Locale): LinkEntry[] {
  return [
    { rel: 'canonical', href: localizedUrl(path, locale) },
    ...buildLocaleAlternates(path),
  ];
}

export function ogLocale(locale: Locale): string {
  return OG_LOCALE[locale];
}
