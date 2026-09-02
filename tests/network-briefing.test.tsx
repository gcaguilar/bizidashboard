import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NetworkBriefing } from '@/app/dashboard/_components/NetworkBriefing';
import { buildNetworkBriefing } from '@/lib/network-briefing';

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
  it('builds a deterministic, bounded briefing without a comparison baseline', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T12:00:00.000Z'));
    const briefing = buildNetworkBriefing(input);

    expect(briefing.current).toContain('1 estación está en estado crítico');
    expect(briefing.focus).toContain('Plaza Aragón');
    expect(briefing.comparison).toContain('Datos actuales disponibles');
    expect(briefing.dataQuality).toContain('141 días');
    expect(briefing.warning).toBeNull();
    vi.useRealTimers();
  });

  it('does not infer a network conclusion from insufficient evidence', () => {
    const briefing = buildNetworkBriefing({ ...input, stations: [], coverageDays: 0, lastUpdatedAt: null });
    expect(briefing.state).toBe('insufficient');
    expect(briefing.current).toContain('No hay evidencia suficiente');
  });

  it('renders ready, loading, incomplete and error states clearly', () => {
    const briefing = buildNetworkBriefing(input);
    expect(renderToStaticMarkup(<NetworkBriefing briefing={briefing} />)).toContain('Lectura de la red hoy');
    expect(renderToStaticMarkup(<NetworkBriefing state="loading" />)).toContain('Cargando briefing');
    expect(renderToStaticMarkup(<NetworkBriefing state="incomplete" briefing={briefing} />)).toContain('Evidencia insuficiente');
    expect(renderToStaticMarkup(<NetworkBriefing state="error" />)).toContain('No se pudo construir');
  });
});
