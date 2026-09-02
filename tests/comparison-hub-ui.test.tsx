import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ComparisonHubData } from '@/lib/comparison-hub';

vi.mock('@/app/comparar/_components/InteractiveComparePanel', () => ({
  InteractiveComparePanel: () => <div>Comparador interactivo</div>,
}));

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const partialMonthData: ComparisonHubData = {
  latestMonth: '2026-03',
  generatedAt: '2026-03-02T12:00:00.000Z',
  dataState: 'fresh',
  interactive: { defaultDimensionId: null, dimensions: [] },
  sections: [
    {
      id: 'historical',
      title: 'Comparativas históricas',
      description: 'Cortes temporales comparables.',
      cards: [
        {
          id: 'month-vs-month',
          eyebrow: 'Cambio mensual',
          title: 'Mes vs mes',
          summary: 'marzo de 2026 se compara con los mismos días de febrero de 2026.',
          metricA: 'marzo de 2026: 200 pts',
          metricB: 'febrero de 2026: 10.000 pts',
          delta: 'Demanda comparable +0%',
          note: 'mes en curso · mismos días del mes anterior · 2 de 31 días disponibles.',
          href: '/informes',
        },
      ],
    },
  ],
};

describe('comparison hub temporal UI', () => {
  it('does not render a raw -96% monthly change for two days versus a full month', async () => {
    const { CompareHubContent } = await import('@/app/comparar/_components/CompareHubContent');
    const markup = renderToStaticMarkup(
      <CompareHubContent data={partialMonthData} initialQuery={{}} />
    );

    expect(markup).toContain('Demanda comparable +0%');
    expect(markup).toContain('mes en curso');
    expect(markup).toContain('2 de 31 días disponibles');
    expect(markup).not.toContain('-96%');
  });
});
