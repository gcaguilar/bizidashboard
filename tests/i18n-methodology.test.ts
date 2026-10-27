import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server-functions/metodologia', () => ({
  getMethodologyPageData: vi.fn(),
}));

import { Route as MethodologyRoute } from '@/app/metodologia';
import { getSiteUrl } from '@/lib/site';

type Head = {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string; hreflang?: string }>;
};

function methodologyHead(locale: 'es' | 'en'): Head {
  const head = (MethodologyRoute.options as unknown as { head: (ctx: unknown) => Head }).head;
  return head({ match: { context: { locale } } });
}

describe('methodology i18n', () => {
  it('keeps the Spanish head unchanged', () => {
    const head = methodologyHead('es');
    expect(head.meta).toContainEqual({ title: 'Metodología y calidad de datos de Bizi Zaragoza' });
    expect(head.meta).toContainEqual({
      name: 'description',
      content:
        'Descubre de dónde salen los datos de Bizi Zaragoza, cómo se actualizan, qué significan sus métricas y qué límites tienen las estimaciones.',
    });
    expect(head.links[0]).toEqual({ rel: 'canonical', href: `${getSiteUrl()}/metodologia` });
  });

  it('serves the English head with canonical and hreflang', () => {
    const head = methodologyHead('en');
    expect(head.links[0]).toEqual({ rel: 'canonical', href: `${getSiteUrl()}/en/metodologia` });
    expect(head.links.filter((link) => link.hreflang).map((link) => link.hreflang)).toEqual([
      'es',
      'en',
      'x-default',
    ]);
    expect(head.meta).toContainEqual({ title: 'Methodology and data quality of Bizi Zaragoza' });
  });
});
