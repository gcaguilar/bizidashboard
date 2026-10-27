import { getSiteUrl } from '@/lib/site';
import { DEFAULT_LOCALE, HTML_LANG, isTranslatedPath, LOCALES, localizePathname, OG_LOCALE, type Locale } from '@/lib/i18n/locales';

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

export function ogLocale(locale: Locale): string {
  return OG_LOCALE[locale];
}

/**
 * `og:locale` plus one `og:locale:alternate` per other language, only for
 * routes that really have that translation. Untranslated routes emit just
 * `og:locale`, exactly as before.
 */
export function buildOgLocaleMeta(path: string, locale: Locale): Array<{ property: string; content: string }> {
  const meta = [{ property: 'og:locale', content: OG_LOCALE[locale] }];
  if (!isTranslatedPath(path)) {
    return meta;
  }
  for (const other of LOCALES) {
    if (other !== locale) {
      meta.push({ property: 'og:locale:alternate', content: OG_LOCALE[other] });
    }
  }
  return meta;
}

const PAGE_NODE_TYPES = new Set(['WebPage', 'TechArticle', 'Article', 'Dataset', 'CollectionPage']);

function localizeAbsoluteUrl(value: unknown, locale: Locale): unknown {
  if (typeof value !== 'string' || !value.startsWith(getSiteUrl())) {
    return value;
  }
  const rest = value.slice(getSiteUrl().length);
  if (rest !== '' && !rest.startsWith('/')) {
    return value;
  }
  return `${getSiteUrl()}${localizePathname(rest || '/', locale)}`;
}

/**
 * Points the page-level nodes of a Spanish JSON-LD graph (WebPage, TechArticle,
 * Dataset, ...) and the BreadcrumbList items to the URL of `locale`, and sets
 * `inLanguage` on those nodes. Untranslated routes keep their Spanish URL
 * (`localizePathname`), and Spanish output is returned untouched. FAQPage nodes
 * are left as delivered: their copy comes from loaders and stays Spanish.
 */
export function localizeStructuredData<T>(graph: T, locale: Locale): T {
  if (locale === DEFAULT_LOCALE) {
    return graph;
  }

  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      return node.map(visit);
    }
    if (node === null || typeof node !== 'object') {
      return node;
    }
    const record = node as Record<string, unknown>;
    const type = record['@type'];
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      result[key] = visit(value);
    }
    if (typeof type === 'string' && PAGE_NODE_TYPES.has(type)) {
      if ('url' in result) {
        result.url = localizeAbsoluteUrl(result.url, locale);
      }
      result.inLanguage = HTML_LANG[locale];
    }
    if (type === 'ListItem' && 'item' in result) {
      result.item = localizeAbsoluteUrl(result.item, locale);
    }
    return result;
  };

  return visit(graph) as T;
}
