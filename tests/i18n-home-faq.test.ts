import { describe, expect, it } from 'vitest';
import { buildHomeFaqPage } from '@/app/index';
import { getCityName } from '@/lib/site';
import { translate } from '@/lib/i18n/messages';

describe('home FAQPage JSON-LD', () => {
  const params = { city: getCityName() };
  const keys = ['nearest', 'mostBikes', 'updates'] as const;

  it.each(['es', 'en'] as const)('uses the %s copy and declares inLanguage', (locale) => {
    const faq = buildHomeFaqPage(locale);
    expect(faq['@type']).toBe('FAQPage');
    expect(faq.inLanguage).toBe(locale);
    expect(faq.mainEntity).toEqual(
      keys.map((key) => ({
        '@type': 'Question',
        name: translate(locale, `home.faq.${key}.question`, params),
        acceptedAnswer: { '@type': 'Answer', text: translate(locale, `home.faq.${key}.answer`, params) },
      })),
    );
  });

  it('serves English questions on /en and keeps Spanish unchanged', () => {
    expect(buildHomeFaqPage('en').mainEntity[0].name).toBe('How can I tell if my nearest station has bikes?');
    expect(buildHomeFaqPage('es').mainEntity[0].name).toBe(
      '¿Cómo saber si hay bicis disponibles en mi estación más cercana?',
    );
  });
});
