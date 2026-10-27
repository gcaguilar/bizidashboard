/**
 * Locale helpers. Pure (no React, no router) so they can be used from route
 * `head`, the sitemap and tests. See docs/i18n/english-version.md.
 */
export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

/** Prefix of every non-default locale (`/en`). */
export const LOCALE_PREFIX: Record<Exclude<Locale, 'es'>, string> = { en: '/en' };

export const HTML_LANG: Record<Locale, string> = { es: 'es', en: 'en' };
export const OG_LOCALE: Record<Locale, string> = { es: 'es_ES', en: 'en_US' };

/**
 * Internal (Spanish, unprefixed) pathnames that have an English version.
 * Anything else is never served nor linked under `/en`.
 */
export const TRANSLATED_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/$/,
  /^\/metodologia$/,
  /^\/estadisticas\/estaciones\/[^/]+$/,
];

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
}

export function isTranslatedPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return TRANSLATED_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** `/en` or `/en/...` -> `en`; everything else -> default locale. */
export function getLocaleFromPathname(pathname: string | null | undefined): Locale {
  if (!pathname) {
    return DEFAULT_LOCALE;
  }
  const [path] = pathname.split(/[?#]/, 1);
  return path === '/en' || path.startsWith('/en/') ? 'en' : DEFAULT_LOCALE;
}

/** Removes the locale prefix: `/en/metodologia` -> `/metodologia`, `/en` -> `/`. */
export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/en') {
    return '/';
  }
  return pathname.startsWith('/en/') ? pathname.slice('/en'.length) : pathname;
}

/**
 * Public pathname for `locale`. Untranslated routes (and the default locale)
 * keep the plain Spanish path, so English pages never link to a `/en` URL that
 * would not exist.
 */
export function localizePathname(pathname: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !isTranslatedPath(pathname)) {
    return pathname;
  }
  const normalized = normalizePathname(pathname);
  return normalized === '/' ? LOCALE_PREFIX.en : `${LOCALE_PREFIX.en}${normalized}`;
}

/** Same as `localizePathname` but keeps the query string and hash. */
export function localizePath(path: string, locale: Locale): string {
  const match = /^([^?#]*)(.*)$/.exec(path);
  const pathname = match?.[1] ?? path;
  const suffix = match?.[2] ?? '';
  return `${localizePathname(pathname, locale)}${suffix}`;
}
