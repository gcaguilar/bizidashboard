import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server-functions/seo-details', () => ({
  getPublicStationPageData: vi.fn(),
}));

import { Route as StationRoute } from '@/app/estadisticas/estaciones/$stationId';
import { translate } from '@/lib/i18n/messages';
import { getSiteUrl } from '@/lib/site';

type Head = {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string; hreflang?: string }>;
};

function stationHead(locale: 'es' | 'en'): Head {
  const head = (StationRoute.options as unknown as { head: (ctx: unknown) => Head }).head;
  return head({
    params: { stationId: '101' },
    loaderData: { summary: { station: { name: 'Plaza España' } } },
    match: { context: { locale } },
  });
}

describe('station sheet i18n', () => {
  it('keeps the Spanish title, description, og:locale and canonical', () => {
    const head = stationHead('es');
    const siteUrl = getSiteUrl();

    expect(head.meta).toContainEqual({ title: 'Plaza España | Estación Bizi Zaragoza | DatosBizi' });
    expect(head.meta).toContainEqual({
      name: 'description',
      content: 'Consulta bicis, huecos, ocupación y patrones de uso de Plaza España, estación Bizi de Zaragoza.',
    });
    expect(head.meta).toContainEqual({ property: 'og:locale', content: 'es_ES' });
    expect(head.meta).toContainEqual({
      property: 'og:url',
      content: `${siteUrl}/estadisticas/estaciones/101`,
    });
    expect(head.links[0]).toEqual({
      rel: 'canonical',
      href: `${siteUrl}/estadisticas/estaciones/101`,
    });
  });

  it('emits reciprocal hreflang links for both languages', () => {
    const siteUrl = getSiteUrl();
    const alternates = stationHead('en').links.filter((link) => link.hreflang);

    expect(alternates).toEqual([
      { rel: 'alternate', hreflang: 'es', href: `${siteUrl}/estadisticas/estaciones/101` },
      { rel: 'alternate', hreflang: 'en', href: `${siteUrl}/en/estadisticas/estaciones/101` },
      { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}/estadisticas/estaciones/101` },
    ]);
    expect(stationHead('en').links[0].href).toBe(`${siteUrl}/en/estadisticas/estaciones/101`);
    expect(stationHead('en').meta).toContainEqual({ property: 'og:locale', content: 'en_US' });
  });

  it('keeps Spanish copy of the sheet body', () => {
    expect(translate('es', 'station.action.good', { name: 'Plaza España', bikes: 5, anchors: 3 })).toBe(
      'Plaza España tiene 5 bicis y 3 huecos libres. Buena opción ahora.',
    );
    expect(translate('es', 'station.alert.good', { bikes: 5, anchors: 3 })).toBe(
      '✅ Buena opción: 5 bicis y 3 huecos libres.',
    );
    expect(translate('es', 'station.faq.easyBike.answer', { dayType: 'Entre semana', hours: '08:00-09:00', percent: '60 %' })).toBe(
      'Entre semana sobre 08:00-09:00, con una ocupación media del 60 %.',
    );
    expect(translate('en', 'station.related.title')).toBe('Nearby alternatives');
  });
});
