import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server-functions/seo-details', () => ({
  getPublicStationPageData: vi.fn(),
}));
vi.mock('@/server-functions/metodologia', () => ({
  getMethodologyPageData: vi.fn(),
}));

import { Route as HomeRoute } from '@/app/index';
import { Route as MethodologyRoute } from '@/app/metodologia';
import { Route as StationRoute } from '@/app/estadisticas/estaciones/$stationId';
import type { Locale } from '@/lib/i18n/locales';
import { buildOgLocaleMeta, localizeStructuredData } from '@/lib/i18n/seo';
import {
  buildSitemapAlternates,
  renderSitemapUrlEntry,
  SITEMAP_URLSET_OPEN,
} from '@/lib/i18n/sitemap';
import { buildSeoHead } from '@/lib/seo-head';
import { getSiteUrl } from '@/lib/site';

type Head = {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string; hreflang?: string }>;
};
type HeadFn = (ctx: unknown) => Head;

const headOf = (route: unknown): HeadFn => (route as { options: { head: HeadFn } }).options.head;

const TRANSLATED_HEADS: Array<{ name: string; head: (locale: Locale) => Head }> = [
  { name: 'home', head: (locale) => headOf(HomeRoute)({ match: { context: { locale } } }) },
  { name: 'methodology', head: (locale) => headOf(MethodologyRoute)({ match: { context: { locale } } }) },
  {
    name: 'station',
    head: (locale) =>
      headOf(StationRoute)({
        params: { stationId: '101' },
        loaderData: { summary: { station: { name: 'Plaza España' } } },
        match: { context: { locale } },
      }),
  },
];

describe.each(TRANSLATED_HEADS)('hreflang and locale meta of the $name route', ({ head }) => {
  const es = head('es');
  const en = head('en');
  const alternates = (value: Head) => value.links.filter((link) => link.hreflang);
  const canonical = (value: Head) => value.links.find((link) => link.rel === 'canonical')!.href;

  it('emits the same absolute and reciprocal hreflang set in both languages', () => {
    expect(alternates(es)).toEqual(alternates(en));
    expect(alternates(es).map((link) => link.hreflang)).toEqual(['es', 'en', 'x-default']);
    for (const link of alternates(es)) {
      expect(link.href.startsWith(`${getSiteUrl()}`)).toBe(true);
      expect(link.rel).toBe('alternate');
    }
  });

  it('keeps each canonical equal to its own hreflang entry, x-default to the Spanish one', () => {
    const byLang = Object.fromEntries(alternates(es).map((link) => [link.hreflang, link.href]));
    expect(canonical(es)).toBe(byLang.es);
    expect(canonical(en)).toBe(byLang.en);
    expect(byLang['x-default']).toBe(byLang.es);
    expect(byLang.en).toContain('/en');
  });

  it('declares og:locale and the other language as og:locale:alternate', () => {
    expect(es.meta).toContainEqual({ property: 'og:locale', content: 'es_ES' });
    expect(es.meta).toContainEqual({ property: 'og:locale:alternate', content: 'en_US' });
    expect(en.meta).toContainEqual({ property: 'og:locale', content: 'en_US' });
    expect(en.meta).toContainEqual({ property: 'og:locale:alternate', content: 'es_ES' });
  });
});

describe('pages without an English version', () => {
  it('emit no hreflang and no og:locale:alternate (Spanish head unchanged)', () => {
    const head = buildSeoHead({ title: 'T', description: 'D', path: '/comparar' });
    expect(head.links).toEqual([{ rel: 'canonical', href: `${getSiteUrl()}/comparar` }]);
    expect(head.meta.filter((entry) => entry.property?.startsWith('og:locale'))).toEqual([
      { property: 'og:locale', content: 'es_ES' },
    ]);
    expect(buildOgLocaleMeta('/dashboard', 'es')).toEqual([{ property: 'og:locale', content: 'es_ES' }]);
  });
});

describe('sitemap alternates', () => {
  const site = 'https://datosbizi.com';

  it('lists the full set from both the Spanish and the English entry', () => {
    const fromSpanish = buildSitemapAlternates('/metodologia', site);
    const fromEnglish = buildSitemapAlternates('/en/metodologia', site);
    expect(fromSpanish).toEqual(fromEnglish);
    expect(fromSpanish).toEqual([
      { hreflang: 'es', href: `${site}/metodologia` },
      { hreflang: 'en', href: `${site}/en/metodologia` },
      { hreflang: 'x-default', href: `${site}/metodologia` },
    ]);
    expect(buildSitemapAlternates('/en', site).map((link) => link.href)).toEqual([`${site}/`, `${site}/en`, `${site}/`]);
  });

  it('adds nothing to routes without an English version', () => {
    expect(buildSitemapAlternates('/comparar', site)).toEqual([]);
    const xml = renderSitemapUrlEntry({ href: '/comparar', changeFrequency: 'daily', priority: 0.5 }, site);
    expect(xml).not.toContain('xhtml');
    expect(xml).toBe(`  <url>
    <loc>${site}/comparar</loc>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>`);
  });

  it('declares the xhtml namespace', () => {
    expect(SITEMAP_URLSET_OPEN).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });
});

describe('localizeStructuredData', () => {
  const site = getSiteUrl();
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${site}/` },
          { '@type': 'ListItem', position: 2, name: 'Stats', item: `${site}/estadisticas` },
          { '@type': 'ListItem', position: 3, name: 'Station', item: `${site}/estadisticas/estaciones/7` },
        ],
      },
      { '@type': 'TechArticle', url: `${site}/metodologia`, inLanguage: 'es-ES' },
      { '@type': 'Dataset', url: `${site}/metodologia`, inLanguage: 'es-ES', distribution: [{ contentUrl: `${site}/api/x` }] },
      { '@type': 'FAQPage', mainEntity: [] },
    ],
  };

  it('returns the Spanish graph untouched', () => {
    expect(localizeStructuredData(graph, 'es')).toBe(graph);
  });

  it('points page nodes and translated breadcrumb items to /en with inLanguage en', () => {
    const result = localizeStructuredData(graph, 'en');
    const [breadcrumb, article, dataset, faq] = result['@graph'] as Array<Record<string, any>>;
    expect(article).toMatchObject({ url: `${site}/en/metodologia`, inLanguage: 'en' });
    expect(dataset).toMatchObject({ url: `${site}/en/metodologia`, inLanguage: 'en' });
    expect(dataset.distribution[0].contentUrl).toBe(`${site}/api/x`);
    expect(breadcrumb.itemListElement.map((item: { item: string }) => item.item)).toEqual([
      `${site}/en`,
      `${site}/estadisticas`,
      `${site}/en/estadisticas/estaciones/7`,
    ]);
    expect(faq).toEqual({ '@type': 'FAQPage', mainEntity: [] });
    // the input is never mutated
    expect((graph['@graph'][1] as Record<string, unknown>).url).toBe(`${site}/metodologia`);
  });
});
