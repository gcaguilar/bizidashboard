import { HTML_LANG, isTranslatedPath, localizePathname, stripLocalePrefix } from '@/lib/i18n/locales';

/** `xmlns:xhtml` is required for the `<xhtml:link rel="alternate">` annotations. */
export const SITEMAP_URLSET_OPEN =
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

export type SitemapUrlEntry = {
  /** Public pathname, Spanish (`/metodologia`) or English (`/en/metodologia`). */
  href: string;
  lastModified?: string;
  changeFrequency: string;
  priority: number;
};

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Adds the `/en/...` URL of each translated route; Spanish entries are unchanged. */
export function withEnglishAlternates<T extends { href: string }>(entries: T[]): T[] {
  return [
    ...entries,
    ...entries
      .filter((entry) => isTranslatedPath(entry.href))
      .map((entry) => ({ ...entry, href: localizePathname(entry.href, 'en') })),
  ];
}

/**
 * Reciprocal `hreflang` annotations (`es`, `en`, `x-default` = Spanish) for a
 * sitemap entry. Every URL of the set must list the whole set, itself
 * included. Returns nothing for routes without an English version.
 */
export function buildSitemapAlternates(href: string, siteUrl: string): Array<{ hreflang: string; href: string }> {
  const spanishPath = stripLocalePrefix(href);
  if (!isTranslatedPath(spanishPath)) {
    return [];
  }
  const spanish = `${siteUrl}${localizePathname(spanishPath, 'es')}`;
  const english = `${siteUrl}${localizePathname(spanishPath, 'en')}`;
  return [
    { hreflang: HTML_LANG.es, href: spanish },
    { hreflang: HTML_LANG.en, href: english },
    { hreflang: 'x-default', href: spanish },
  ];
}

export function renderSitemapUrlEntry(entry: SitemapUrlEntry, siteUrl: string): string {
  const alternates = buildSitemapAlternates(entry.href, siteUrl)
    .map(
      (alternate) =>
        `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeXml(alternate.href)}"/>\n`,
    )
    .join('');
  const lastModified = entry.lastModified ? `    <lastmod>${entry.lastModified}</lastmod>\n` : '';

  return `  <url>
    <loc>${escapeXml(`${siteUrl}${entry.href}`)}</loc>
${alternates}${lastModified}    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}
