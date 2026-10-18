import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { InteractiveComparisonData } from '@/lib/comparison-hub';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => () => undefined,
}));

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const data: InteractiveComparisonData = {
  defaultDimensionId: 'stations',
  dimensions: [
    {
      id: 'stations',
      label: 'Estaciones',
      description: 'Compara dos estaciones.',
      primary: true,
      defaultLeftId: '101',
      defaultRightId: '102',
      options: [
        {
          id: '101',
          label: 'Plaza España (101)',
          href: '/dashboard/estaciones/101',
          primaryLabel: 'Giro',
          primaryValue: 20,
          primaryDisplay: '20 pts',
          secondaryLabel: 'Snapshot',
          secondaryDisplay: '10/20 bicis',
          tertiaryLabel: 'Horas sin servicio',
          tertiaryDisplay: '1 h',
          note: 'Ultima muestra 2026-04-01 14:35',
          metrics: [
            { key: 'bikes', label: 'Bicis disponibles (media)', value: '10 bicis' },
            { key: 'anchors', label: 'Huecos libres (media)', value: '8 huecos' },
            { key: 'availability', label: 'Horas sin servicio', value: '1 h' },
            { key: 'tension', label: 'Tensión por anclaje', value: '1,00 pts/anclaje' },
          ],
          bands: [
            {
              id: 'morning',
              label: 'Mañana',
              rangeLabel: '06–11 h',
              avgBikes: 12,
              avgAnchors: 8,
              sampleCount: 10,
              status: 'green',
              peakHour: null,
            },
          ],
          reliabilityScore: 0.9,
          lat: 41.65,
          lon: -0.88,
        },
        {
          id: '102',
          label: 'Plaza Aragón (102)',
          href: '/dashboard/estaciones/102',
          primaryLabel: 'Giro',
          primaryValue: 14,
          primaryDisplay: '14 pts',
          secondaryLabel: 'Snapshot',
          secondaryDisplay: '6/18 bicis',
          tertiaryLabel: 'Horas sin servicio',
          tertiaryDisplay: '5 h',
          metrics: [
            { key: 'availability', label: 'Horas sin servicio', value: '5 h' },
          ],
          bands: [
            {
              id: 'morning',
              label: 'Mañana',
              rangeLabel: '06–11 h',
              avgBikes: 3,
              avgAnchors: 15,
              sampleCount: 10,
              status: 'amber',
              peakHour: 8,
            },
          ],
          reliabilityScore: 0.6,
          lat: 41.66,
          lon: -0.89,
        },
      ],
    },
  ],
  presets: [
    {
      id: 'nearest-alternative',
      emoji: '🔄',
      label: 'Estación A vs. su alternativa más cercana',
      description: 'Disponibilidad y fiabilidad frente a la estación más próxima.',
      dimensionId: 'stations',
      leftId: '101',
      rightId: '102',
      requiresGeolocation: true,
    },
    {
      id: 'saved-stations',
      emoji: '⭐',
      label: 'Estaciones guardadas en este dispositivo',
      description: 'Vuelve a tus comparaciones frecuentes guardadas con la estrella.',
      dimensionId: 'stations',
      leftId: null,
      rightId: null,
      requiresFavorites: true,
    },
  ],
};

describe('InteractiveComparePanel citizen assistant', () => {
  it('renders presets, verdict, metric columns and tide bands', async () => {
    const { InteractiveComparePanel } = await import(
      '@/app/comparar/_components/InteractiveComparePanel'
    );
    const markup = renderToStaticMarkup(
      <InteractiveComparePanel data={data} initialQuery={{}} />
    );

    expect(markup).toContain('Comparaciones rápidas');
    expect(markup).toContain('alternativa más cercana');
    expect(markup).toContain('Conclusión');
    expect(markup).toContain('43%');
    expect(markup).toContain('Efecto marea por franjas');
    expect(markup).toContain('Bicis disponibles (media)');
    expect(markup).toContain('data-status="green"');
    expect(markup).toContain('data-status="amber"');
    expect(markup).toContain('2 Estaciones');
    expect(markup).toContain('Lado A: seleccionar entidad');
    expect(markup).toContain('Comparaciones guardadas');
    expect(markup).toContain('Guardar esta comparación');
    expect(markup).toContain('Aún no has guardado ninguna comparación');
  });
});
