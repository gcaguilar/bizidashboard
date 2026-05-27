import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSeoPageConfig } from '@/lib/seo-pages';

vi.mock('server-only', () => ({}));

const { buildRebalancingReportMock, fetchStationsMock } = vi.hoisted(() => ({
  buildRebalancingReportMock: vi.fn(),
  fetchStationsMock: vi.fn(),
}));

vi.mock('@/lib/rebalancing-report', () => ({
  buildRebalancingReport: buildRebalancingReportMock,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();

  return {
    ...actual,
    fetchStations: fetchStationsMock,
  };
});

import { buildRedistribucionContent } from '@/lib/seo-landing.server';
import {
  REDISTRIBUCION_CACHE_CONTROL,
  Route as RedistribucionRoute,
} from '@/app/estadisticas/redistribucion';

const redistribucionConfig = getSeoPageConfig('redistribucion');

describe('redistribucion public landing cache contract', () => {
  beforeEach(() => {
    buildRebalancingReportMock.mockReset();
    fetchStationsMock.mockReset();
  });

  it('uses the rebalancing report generatedAt as the stable modified date', async () => {
    buildRebalancingReportMock.mockResolvedValue({
      generatedAt: '2026-04-01T10:00:00.000Z',
      summary: { totalStations: 130 },
      kpis: {
        service: {
          systemPctTimeEmpty: 0.12,
          systemPctTimeFull: 0.08,
        },
      },
    });

    const content = await buildRedistribucionContent(
      redistribucionConfig,
      '2026-05-27T12:00:00.000Z'
    );

    expect(content.generatedAt).toBe('2026-04-01T10:00:00.000Z');
    expect(content.stats[0]?.value).toBe('130');
  });

  it('uses the stations snapshot generatedAt when the report is unavailable', async () => {
    buildRebalancingReportMock.mockRejectedValue(new Error('report unavailable'));
    fetchStationsMock.mockResolvedValue({
      generatedAt: '2026-04-01T11:00:00.000Z',
      stations: [
        { id: '101', capacity: 20, bikesAvailable: 5 },
        { id: '102', capacity: 10, bikesAvailable: 10 },
      ],
    });

    const content = await buildRedistribucionContent(
      redistribucionConfig,
      '2026-05-27T12:00:00.000Z'
    );

    expect(content.generatedAt).toBe('2026-04-01T11:00:00.000Z');
    expect(content.stats[0]?.value).toBe('2');
  });

  it('exposes cache headers for the public document route', () => {
    const headers = (RedistribucionRoute.options as { headers: () => Record<string, string> })
      .headers();

    expect(headers['Cache-Control']).toBe(REDISTRIBUCION_CACHE_CONTROL);
    expect(headers['Cache-Control']).toBe(
      'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
    );
  });

  it('keeps the public landing detached from dashboard table modules', () => {
    const source = readFileSync('src/app/estadisticas/redistribucion.tsx', 'utf8');

    expect(source).not.toContain('RedistribucionClient');
    expect(source).not.toContain('RebalancingTable');
    expect(source).not.toContain("dashboard/redistribucion/_components");
  });

  it('defers public page-view tracking until idle time', () => {
    const source = readFileSync('src/app/_components/PublicPageViewTracker.tsx', 'utf8');

    expect(source).toContain('requestIdleCallback');
    expect(source).toContain('cancelIdleCallback');
  });

  it('caches only the redistribucion server-function payload explicitly', () => {
    const source = readFileSync('src/server-functions/seo-landing.ts', 'utf8');

    expect(source).toContain("slug === 'redistribucion'");
    expect(source).toContain("'seo-landing:redistribucion:snapshot'");
    expect(source).toContain('REDISTRIBUCION_SEO_CACHE_TTL_SECONDS = 300');
  });
});
