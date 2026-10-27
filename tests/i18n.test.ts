import { describe, expect, it } from 'vitest';
import { createLocaleRewrite } from '@/lib/i18n/locale-rewrite';
import {
  getLocaleFromPathname,
  isTranslatedPath,
  localizePath,
  stripLocalePrefix,
} from '@/lib/i18n/locales';
import { createTranslator, MESSAGE_CATALOGS, translate } from '@/lib/i18n/messages';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { buildSeoHead } from '@/lib/seo-head';

function placeholders(value: string): string[] {
  return (value.match(/\{\w+\}/g) ?? []).sort();
}

describe('locale paths', () => {
  it('detects the locale from the public pathname', () => {
    expect(getLocaleFromPathname('/en')).toBe('en');
    expect(getLocaleFromPathname('/en/metodologia')).toBe('en');
    expect(getLocaleFromPathname('/en?x=1')).toBe('en');
    expect(getLocaleFromPathname('/')).toBe('es');
    expect(getLocaleFromPathname('/entrada')).toBe('es');
    expect(getLocaleFromPathname(undefined)).toBe('es');
  });

  it('strips the prefix and only localizes translated routes', () => {
    expect(stripLocalePrefix('/en')).toBe('/');
    expect(stripLocalePrefix('/en/metodologia')).toBe('/metodologia');
    expect(localizePath('/', 'en')).toBe('/en');
    expect(localizePath('/metodologia?x=1#a', 'en')).toBe('/en/metodologia?x=1#a');
    expect(localizePath('/estadisticas/estaciones/12', 'en')).toBe('/en/estadisticas/estaciones/12');
    expect(localizePath('/comparar', 'en')).toBe('/comparar');
    expect(isTranslatedPath('/estadisticas/estaciones')).toBe(false);
  });

  it('never changes Spanish paths', () => {
    for (const path of ['/', '/metodologia', '/estadisticas/estaciones/12', '/comparar?a=1', '/dashboard']) {
      expect(localizePath(path, 'es')).toBe(path);
    }
  });
});

describe('locale rewrite', () => {
  it('strips /en on input for translated routes only', () => {
    const rewrite = createLocaleRewrite();
    expect(rewrite.input({ url: new URL('https://x.test/en') }).pathname).toBe('/');
    expect(rewrite.input({ url: new URL('https://x.test/en/metodologia') }).pathname).toBe('/metodologia');
    expect(rewrite.input({ url: new URL('https://x.test/en/comparar') }).pathname).toBe('/en/comparar');
    expect(rewrite.input({ url: new URL('https://x.test/metodologia') }).pathname).toBe('/metodologia');
  });

  it('adds /en on output only while the current page is English', () => {
    const rewrite = createLocaleRewrite();
    rewrite.input({ url: new URL('https://x.test/metodologia') });
    expect(rewrite.output({ url: new URL('https://x.test/metodologia') }).pathname).toBe('/metodologia');

    rewrite.input({ url: new URL('https://x.test/en') });
    expect(rewrite.output({ url: new URL('https://x.test/metodologia') }).pathname).toBe('/en/metodologia');
    expect(rewrite.output({ url: new URL('https://x.test/') }).pathname).toBe('/en');
    expect(rewrite.output({ url: new URL('https://x.test/comparar') }).pathname).toBe('/comparar');
  });
});

describe('dictionary', () => {
  it('falls back to Spanish when an English entry is missing', () => {
    const key = 'nav.item.network' as const;
    const english = MESSAGE_CATALOGS.en;
    const original = english[key];
    delete english[key];
    try {
      expect(translate('en', key)).toBe(MESSAGE_CATALOGS.es[key]);
    } finally {
      english[key] = original;
    }
  });

  it('interpolates params', () => {
    expect(translate('es', 'product.balance.tense.explanation', { count: 3 })).toBe(
      '3 estaciones están vacías o llenas en la última muestra.',
    );
    expect(createTranslator('en')('product.balance.tense.explanation', { count: 3 })).toContain('3 stations');
  });

  it('keeps English entries aligned with Spanish keys and placeholders', () => {
    for (const [key, value] of Object.entries(MESSAGE_CATALOGS.en)) {
      const spanish = (MESSAGE_CATALOGS.es as Record<string, string>)[key];
      expect(spanish, `unknown English key ${key}`).toBeDefined();
      expect(placeholders(value as string), key).toEqual(placeholders(spanish));
    }
  });
});

describe('seo head', () => {
  it('keeps Spanish head for untranslated routes byte-identical', () => {
    const head = buildSeoHead({ title: 'T', description: 'D', path: '/comparar' });
    expect(head.links).toEqual([{ rel: 'canonical', href: expect.stringMatching(/\/comparar$/) }]);
    expect(head.meta).toContainEqual({ property: 'og:locale', content: 'es_ES' });
  });

  it('emits canonical per language plus hreflang on translated routes', () => {
    const es = buildSeoHead({ title: 'T', description: 'D', path: '/metodologia' });
    const en = buildSeoHead({ title: 'T', description: 'D', path: '/metodologia', locale: 'en' });

    expect(es.links[0].href).toMatch(/\/metodologia$/);
    expect(en.links[0].href).toMatch(/\/en\/metodologia$/);
    expect(en.meta).toContainEqual({ property: 'og:locale', content: 'en_US' });
    expect(en.links.filter((link) => link.hreflang)).toEqual(buildLocaleAlternates('/metodologia'));
    expect(buildLocaleAlternates('/metodologia').map((link) => link.hreflang)).toEqual(['es', 'en', 'x-default']);
    expect(buildLocaleAlternates('/comparar')).toEqual([]);
  });
});
