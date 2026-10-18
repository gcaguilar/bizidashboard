import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { StationSnapshot } from '@/lib/api-types';

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
    useNavigate: () => vi.fn(),
  };
});

import { HomeLiveSection } from '@/app/_components/home/HomeLiveSection';

function buildStation(overrides: Partial<StationSnapshot> & { id: string }): StationSnapshot {
  return {
    name: `Estación ${overrides.id}`,
    lat: 41.65,
    lon: -0.88,
    capacity: 20,
    bikesAvailable: 5,
    anchorsFree: 5,
    recordedAt: '2026-04-01T11:59:00.000Z',
    ...overrides,
  };
}

const STATIONS: StationSnapshot[] = [
  buildStation({ id: '1' }),
  buildStation({ id: '2', bikesAvailable: 0 }),
  buildStation({ id: '3', anchorsFree: 0 }),
  buildStation({ id: '4' }),
  buildStation({ id: '5' }),
  buildStation({ id: '6' }),
];

describe('HomeLiveSection', () => {
  it('renders the search box, quick filters with counter, nearby chip and lazy map placeholder', () => {
    const html = renderToStaticMarkup(
      <HomeLiveSection
        stations={STATIONS}
        districts={[{ name: 'Centro', slug: 'centro' }]}
        problemStations={[]}
        mostUsedStations={[]}
      />,
    );

    expect(html).toContain('Busca y filtra la red');
    expect(html).toContain('Buscar tu estación, calle o barrio…');
    expect(html).toContain('Todas');
    expect(html).toContain('🚲 Con bicis libres');
    expect(html).toContain('🅿️ Con huecos libres');
    expect(html).toContain('6 de 6 estaciones');
    expect(html).toContain('📍 Mis estaciones cercanas');
    expect(html).toContain('/biciradar');
    expect(html).toContain('El mapa se carga al llegar aquí…');
  });
});
