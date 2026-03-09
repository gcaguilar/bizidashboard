import { beforeEach, describe, expect, it, vi } from 'vitest';

const { countMock, findManyMock } = vi.hoisted(() => ({
  countMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    stationAlert: {
      count: countMock,
      findMany: findManyMock,
    },
  },
}));

import { GET } from '@/app/api/alerts/history/route';

describe('GET /api/alerts/history', () => {
  beforeEach(() => {
    countMock.mockReset();
    findManyMock.mockReset();
  });

  it('applies filters and pagination for JSON responses', async () => {
    countMock.mockResolvedValue(3);
    findManyMock.mockResolvedValue([
      {
        id: 91,
        stationId: '101',
        station: { name: 'Plaza Espana' },
        alertType: 'LOW_BIKES',
        severity: 2,
        metricValue: 1.5,
        windowHours: 3,
        generatedAt: new Date('2026-03-09T10:00:00.000Z'),
        isActive: false,
      },
    ]);

    const response = await GET(
      new Request(
        'http://localhost/api/alerts/history?state=resolved&stationId=101&alertType=LOW_BIKES&severity=2&from=2026-03-01T00:00:00.000Z&to=2026-03-09T23:59:59.999Z&limit=2&offset=1'
      ) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.pagination.total).toBe(3);
    expect(payload.pagination.returned).toBe(1);
    expect(payload.alerts[0].stationName).toBe('Plaza Espana');
    expect(payload.alerts[0].isActive).toBe(false);

    expect(countMock).toHaveBeenCalledTimes(1);
    expect(findManyMock).toHaveBeenCalledTimes(1);

    const countArgs = countMock.mock.calls[0]?.[0] as {
      where: {
        isActive: boolean;
        stationId: string;
        alertType: string;
        severity: number;
        generatedAt: { gte: Date; lte: Date };
      };
    };

    expect(countArgs.where.isActive).toBe(false);
    expect(countArgs.where.stationId).toBe('101');
    expect(countArgs.where.alertType).toBe('LOW_BIKES');
    expect(countArgs.where.severity).toBe(2);
    expect(countArgs.where.generatedAt.gte.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(countArgs.where.generatedAt.lte.toISOString()).toBe('2026-03-09T23:59:59.999Z');

    const findManyArgs = findManyMock.mock.calls[0]?.[0] as {
      take: number;
      skip: number;
      orderBy: Array<{ generatedAt?: string; id?: string }>;
    };

    expect(findManyArgs.take).toBe(2);
    expect(findManyArgs.skip).toBe(1);
    expect(findManyArgs.orderBy).toEqual([{ generatedAt: 'desc' }, { id: 'desc' }]);
  });

  it('returns CSV output when format=csv', async () => {
    countMock.mockResolvedValue(1);
    findManyMock.mockResolvedValue([
      {
        id: 12,
        stationId: '210',
        station: { name: 'Puente de Piedra' },
        alertType: 'LOW_ANCHORS',
        severity: 1,
        metricValue: 2.1,
        windowHours: 3,
        generatedAt: new Date('2026-03-09T08:30:00.000Z'),
        isActive: true,
      },
    ]);

    const response = await GET(
      new Request('http://localhost/api/alerts/history?format=csv&state=active') as never
    );
    const csvBody = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(response.headers.get('content-disposition')).toContain('alerts-history-');
    expect(csvBody).toContain('id,stationId,stationName,alertType,severity,metricValue,windowHours,generatedAt,state');
    expect(csvBody).toContain('Puente de Piedra');
    expect(csvBody).toContain('active');
  });

  it('returns 400 when filters are invalid', async () => {
    const response = await GET(
      new Request('http://localhost/api/alerts/history?severity=9&state=invalid') as never
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('Invalid state');
    expect(countMock).not.toHaveBeenCalled();
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it('returns 400 when from is after to', async () => {
    const response = await GET(
      new Request('http://localhost/api/alerts/history?from=2026-03-10&to=2026-03-01') as never
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('Invalid date range');
    expect(countMock).not.toHaveBeenCalled();
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it('returns 500 when alert retrieval fails', async () => {
    countMock.mockRejectedValue(new Error('db down'));

    const response = await GET(new Request('http://localhost/api/alerts/history') as never);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to fetch alert history');
  });
});
