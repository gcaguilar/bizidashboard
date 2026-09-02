import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NetworkBriefing } from '@/app/dashboard/_components/NetworkBriefing';
import { buildNetworkBriefing } from '@/lib/network-briefing';
import { selectComparableHourlyBaseline } from '@/lib/network-briefing-baseline';

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const input = {
  stations: [{ id: '1', name: 'Plaza Aragón', lat: 0, lon: 0, capacity: 20, bikesAvailable: 0, anchorsFree: 20, recordedAt: '2026-04-01T11:59:00.000Z' }],
  activeAlertsCount: 3,
  coverageDays: 141,
  lastUpdatedAt: '2026-04-01T11:59:00.000Z',
  pipelineHealthy: true,
};

describe('network briefing', () => {
  it('finds a historical sample for the same local weekday and hour', () => {
    const reference = new Date('2026-04-01T21:00:00.000Z');
    const baseline = selectComparableHourlyBaseline([
      { bucketStart: new Date('2026-03-25T22:00:00.000Z'), stationCount: 120, criticalStationsCount: 8 },
      { bucketStart: new Date('2026-03-26T21:00:00.000Z'), stationCount: 20, criticalStationsCount: 2 },
    ], reference, 120);
    expect(baseline?.criticalStationsCount).toBe(8);
  });

  it('builds a deterministic, bounded briefing without a comparison baseline', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T12:00:00.000Z'));
    const briefing = buildNetworkBriefing(input);

    expect(briefing.current).toContain('1 estación no tiene bicis o anclajes libres');
    expect(briefing.focus).toContain('Plaza Aragón');
    expect(briefing.comparison).toContain('Aún no hay otro momento comparable');
    expect(briefing.dataQuality).toContain('141 días');
    expect(briefing.warning).toBeNull();
    vi.useRealTimers();
  });

  it('does not infer a network conclusion from insufficient evidence', () => {
    const briefing = buildNetworkBriefing({ ...input, stations: [], coverageDays: 0, lastUpdatedAt: null });
    expect(briefing.state).toBe('insufficient');
    expect(briefing.current).toContain('no hay datos suficientes');
  });

  it('renders ready, loading, incomplete and error states clearly', () => {
    const briefing = buildNetworkBriefing(input);
    expect(renderToStaticMarkup(<NetworkBriefing briefing={briefing} />)).toContain('Lectura de la red hoy');
    expect(renderToStaticMarkup(<NetworkBriefing state="loading" />)).toContain('Cargando briefing');
    expect(renderToStaticMarkup(<NetworkBriefing state="incomplete" briefing={briefing} />)).toContain('Evidencia insuficiente');
    expect(renderToStaticMarkup(<NetworkBriefing state="error" />)).toContain('No se pudo construir');
  });
});
