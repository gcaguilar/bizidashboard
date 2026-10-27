import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeDiagnosis } from '@/app/_components/home/HomeDiagnosis';
import { buildStationCurrentLabel, buildStationIssueLabel } from '@/lib/home-diagnosis';
import type { StationSeoSummary } from '@/lib/seo-stations';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return { ...actual, useLocation: () => ({ pathname: '/', publicHref: '/' }) };
});

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/StationFavoriteButton', () => ({
  StationFavoriteButton: () => <button type="button">star</button>,
}));

function availabilityRow(
  emptyHours: number | string,
  fullHours: number | string,
  totalHours: number | string,
): NonNullable<StationSeoSummary['availability']> {
  return { emptyHours, fullHours, totalHours } as unknown as NonNullable<
    StationSeoSummary['availability']
  >;
}

function buildSummary({
  id,
  name,
  districtName = null,
  bikesAvailable = 5,
  anchorsFree = 5,
  availability = null,
  turnoverScore,
  currentOccupancy = 0.4,
}: {
  id: string;
  name: string;
  districtName?: string | null;
  bikesAvailable?: number;
  anchorsFree?: number;
  availability?: StationSeoSummary['availability'];
  turnoverScore?: number;
  currentOccupancy?: number;
}): StationSeoSummary {
  return {
    station: {
      id,
      name,
      lat: 41.65,
      lon: -0.88,
      capacity: 20,
      bikesAvailable,
      anchorsFree,
      recordedAt: '2026-04-01T11:59:00.000Z',
    },
    districtName,
    districtSlug: districtName ? 'distrito' : null,
    turnover:
      turnoverScore === undefined
        ? null
        : ({ turnoverScore } as unknown as StationSeoSummary['turnover']),
    availability,
    peakHours: [],
    currentOccupancy,
    cityAverageOccupancy: 0.3,
    indexabilityInput: {} as StationSeoSummary['indexabilityInput'],
    indexability: {} as StationSeoSummary['indexability'],
  };
}

describe('buildStationIssueLabel', () => {
  it('highlights the dominant problem with the shared ranking window', () => {
    expect(buildStationIssueLabel(availabilityRow(60, 10, 100))).toBe(
      'Sin bicis el 60% del tiempo (últimos 14 días)',
    );
    expect(buildStationIssueLabel(availabilityRow(10, 80, 100))).toBe(
      'Llena el 80% del tiempo (últimos 14 días)',
    );
  });

  it('does not invent a diagnosis when neither problem reaches 15% of the period', () => {
    expect(buildStationIssueLabel(availabilityRow(5, 8, 100))).toBeNull();
  });

  it('returns null without availability data or without documented hours', () => {
    expect(buildStationIssueLabel(null)).toBeNull();
    expect(buildStationIssueLabel(undefined)).toBeNull();
    expect(buildStationIssueLabel(availabilityRow(60, 10, 0))).toBeNull();
  });

  it('coerces the string values that arrive from raw SQL rows', () => {
    expect(buildStationIssueLabel(availabilityRow('60', '10', '100'))).toContain('60%');
  });
});

describe('buildStationCurrentLabel', () => {
  it('describes the current bikes and anchors in plain language', () => {
    expect(buildStationCurrentLabel({ bikesAvailable: 7, anchorsFree: 3 })).toBe(
      'Ahora: 7 bicis · 3 huecos',
    );
  });
});

describe('HomeDiagnosis', () => {
  it('renders both tabs, the citizen labels, the district and the station links', () => {
    const html = renderToStaticMarkup(
      <HomeDiagnosis
        problemStations={[
          buildSummary({
            id: 'a',
            name: 'Plaza Aragón',
            districtName: 'Centro',
            availability: availabilityRow(60, 10, 100),
            currentOccupancy: 0.12,
          }),
          buildSummary({
            id: 'b',
            name: 'Delicias Sur',
            districtName: 'Delicias',
            availability: availabilityRow(10, 80, 100),
          }),
        ]}
        mostUsedStations={[
          buildSummary({
            id: 'c',
            name: 'Paseo Independencia',
            districtName: 'Centro',
            turnoverScore: 120,
            bikesAvailable: 9,
            anchorsFree: 2,
          }),
        ]}
        filter="all"
      />,
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('Conviene revisar');
    expect(html).toContain('Más movimiento');
    expect(html).toContain('Sin bicis el 60% del tiempo (últimos 14 días)');
    expect(html).toContain('Llena el 80% del tiempo (últimos 14 días)');
    expect(html).toContain('Zona de mucho movimiento');
    expect(html).toContain('Ahora: 9 bicis · 2 huecos');
    expect(html).toContain('Centro');
    expect(html).toContain('/estadisticas/estaciones/a');
  });

  it('explains when the active quick filter leaves no station to review', () => {
    const html = renderToStaticMarkup(
      <HomeDiagnosis
        problemStations={[buildSummary({ id: 'd', name: 'Sin bicis ahora', bikesAvailable: 0 })]}
        mostUsedStations={[]}
        filter="bikes"
      />,
    );

    expect(html).toContain('Ninguna estación encaja con este filtro.');
  });
});
