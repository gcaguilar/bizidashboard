import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  getStationsWithLatestStatusMock,
  getSharedDatasetSnapshotMock,
} = vi.hoisted(() => ({
  getStationsWithLatestStatusMock: vi.fn(),
  getSharedDatasetSnapshotMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getStationsWithLatestStatus: getStationsWithLatestStatusMock,
}));

vi.mock('@/services/shared-data', () => ({
  getSharedDatasetSnapshot: getSharedDatasetSnapshotMock,
}));

import { Route } from '@/app/api/stations/index';
import { fetchStations } from '@/lib/api';

const handler = Route.options.server!.handlers!.GET!

describe('GET /api/stations', () => {
  beforeEach(() => {
    getStationsWithLatestStatusMock.mockReset();
    getSharedDatasetSnapshotMock.mockReset();

    getSharedDatasetSnapshotMock.mockResolvedValue({
      coverage: {
        generatedAt: '2026-01-01T00:00:00.000Z',
        lastRecordedAt: '2026-01-01T00:00:00.000Z',
        totalDays: 9,
        totalSamples: 144,
      },
      pipeline: {
        pipeline: {
          healthStatus: 'healthy',
        },
        quality: {
          freshness: {
            isFresh: true,
          },
          volume: {
            expectedRange: { min: 1, max: 400 },
          },
        },
      },
    });
  });

  it('returns stations payload', async () => {
    getStationsWithLatestStatusMock.mockResolvedValue([
      {
        id: '101',
        name: 'Plaza Espana',
        lat: 41.6488,
        lon: -0.8891,
        capacity: 20,
        bikesAvailable: 9,
        anchorsFree: 11,
        recordedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const response = await handler({ request: new Request('http://localhost/api/stations') });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.stations).toHaveLength(1);
    expect(payload.generatedAt).toBeTypeOf('string');
    expect(payload.dataState).toBe('ok');
  });

  it('maps station fields correctly in CSV exports', async () => {
    getStationsWithLatestStatusMock.mockResolvedValue([
      {
        id: '101',
        name: 'Plaza Espana',
        lat: 41.6488,
        lon: -0.8891,
        capacity: 20,
        bikesAvailable: 9,
        anchorsFree: 11,
        recordedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const response = await handler({ request: new Request('http://localhost/api/stations?format=csv') });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(body).toContain('"stationId","stationName","lat","lon","capacity","bikesAvailable","anchorsFree","recordedAt"');
    expect(body).toContain('"101","Plaza Espana","41.6488","-0.8891","20","9","11","2026-01-01T00:00:00.000Z"');
  });

  it('normalizes Date timestamps before exposing station snapshots', async () => {
    const recordedAt = new Date('2026-01-01T00:00:00.000Z');

    getStationsWithLatestStatusMock.mockResolvedValue([
      {
        id: '101',
        name: 'Plaza Espana',
        lat: 41.6488,
        lon: -0.8891,
        capacity: 20,
        bikesAvailable: 9,
        anchorsFree: 11,
        recordedAt,
      },
    ]);

    const payload = await fetchStations();

    expect(payload.stations[0]?.recordedAt).toBe(recordedAt.toISOString());
  });

  it('returns an empty degraded payload when station retrieval fails', async () => {
    getStationsWithLatestStatusMock.mockRejectedValue(new Error('db unavailable'));

    const response = await handler({ request: new Request('http://localhost/api/stations') });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.stations).toEqual([]);
    expect(payload.dataState).toBe('empty');
  });
});
