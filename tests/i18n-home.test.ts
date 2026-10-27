import { describe, expect, it } from 'vitest';
import { Route as HomeRoute } from '@/app/index';
import { translate } from '@/lib/i18n/messages';
import { getCityName, getSiteUrl, SEO_HOME_DESCRIPTION, SEO_HOME_TITLE } from '@/lib/site';

type Head = {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string; hreflang?: string }>;
};

function homeHead(locale: 'es' | 'en'): Head {
  const head = (HomeRoute.options as unknown as { head: (ctx: unknown) => Head }).head;
  return head({ match: { context: { locale } } });
}

describe('home i18n', () => {
  it('keeps the Spanish dictionary in sync with the SEO constants in site.ts', () => {
    const params = { city: getCityName() };
    expect(translate('es', 'home.seo.title', params)).toBe(SEO_HOME_TITLE);
    expect(translate('es', 'home.seo.description', params)).toBe(SEO_HOME_DESCRIPTION);
  });

  it('keeps the Spanish head: same title, og:locale and canonical without trailing slash', () => {
    const head = homeHead('es');
    expect(head.meta).toContainEqual({ title: SEO_HOME_TITLE });
    expect(head.meta).toContainEqual({ property: 'og:locale', content: 'es_ES' });
    expect(head.meta).toContainEqual({ property: 'og:url', content: getSiteUrl() });
    expect(head.links[0]).toEqual({ rel: 'canonical', href: getSiteUrl() });
  });

  it('declares hreflang alternates that point to the canonical of each language', () => {
    const alternates = homeHead('es').links.filter((link) => link.hreflang);
    expect(alternates).toEqual([
      { rel: 'alternate', hreflang: 'es', href: getSiteUrl() },
      { rel: 'alternate', hreflang: 'en', href: `${getSiteUrl()}/en` },
      { rel: 'alternate', hreflang: 'x-default', href: getSiteUrl() },
    ]);
  });

  it('serves an English head with its own canonical', () => {
    const head = homeHead('en');
    expect(head.links[0]).toEqual({ rel: 'canonical', href: `${getSiteUrl()}/en` });
    expect(head.meta).toContainEqual({ property: 'og:locale', content: 'en_US' });
    expect(head.meta.find((entry) => entry.title)?.title).toContain('live');
  });
});
