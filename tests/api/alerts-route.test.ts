import { serverHandlers } from '@tests/helpers/route-handlers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActiveAlertsMock, withCacheMock } = vi.hoisted(() => ({
  getActiveAlertsMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getActiveAlerts: getActiveAlertsMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

import { Route } from '@/app/api/alerts/index';

const handler = serverHandlers(Route).GET!

function alertRow(id: number) {
  return {
    id,
    stationId: String(100 + id),
    alertType: 'LOW_BIKES',
    severity: 2,
    metricValue: 1,
    windowHours: 6,
    generatedAt: `2026-03-0${Math.min(id, 9)}T00:00:00.000Z`,
    isActive: true,
  };
}

describe('GET /api/alerts', () => {
  beforeEach(() => {
    getActiveAlertsMock.mockReset();
    withCacheMock.mockReset();
    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );
  });

  it('caches the base batch and slices it to the requested limit', async () => {
    getActiveAlertsMock.mockResolvedValue(Array.from({ length: 60 }, (_, i) => alertRow(i + 1)));

    const response = await handler({
      request: new Request('http://localhost/api/alerts?limit=25'),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(withCacheMock).toHaveBeenCalledWith(
      'alerts:active:limit=200',
      60,
      expect.any(Function)
    );
    // El lote base se pide una sola vez con el máximo; el límite se recorta.
    expect(getActiveAlertsMock).toHaveBeenCalledWith(200);
    expect(getActiveAlertsMock).toHaveBeenCalledTimes(1);
    expect(payload.limit).toBe(25);
    expect(payload.alerts).toHaveLength(25);
    expect(payload.generatedAt).toBeTypeOf('string');
  });

  it('shares the cache across different limits', async () => {
    getActiveAlertsMock.mockResolvedValue([alertRow(1)]);

    await handler({ request: new Request('http://localhost/api/alerts?limit=5') });
    await handler({ request: new Request('http://localhost/api/alerts?limit=10') });

    expect(withCacheMock).toHaveBeenCalledTimes(2);
    expect(withCacheMock).toHaveBeenNthCalledWith(
      1,
      'alerts:active:limit=200',
      60,
      expect.any(Function)
    );
    expect(withCacheMock).toHaveBeenNthCalledWith(
      2,
      'alerts:active:limit=200',
      60,
      expect.any(Function)
    );
    // Ambos límites comparten la misma clave: la deduplicación la hace el
    // withCache real (Redis + in-flight), aquí solo verificamos la clave.
    expect(getActiveAlertsMock).toHaveBeenCalledWith(200);
  });

  it('serves the cached generatedAt instead of regenerating it', async () => {
    getActiveAlertsMock.mockResolvedValue([alertRow(1)]);

    const first = await handler({ request: new Request('http://localhost/api/alerts') });
    const firstPayload = await first.json();

    // Segunda petición servida enteramente desde la caché.
    withCacheMock.mockResolvedValue({
      alerts: [alertRow(1)],
      generatedAt: firstPayload.generatedAt,
    });
    getActiveAlertsMock.mockClear();

    const second = await handler({ request: new Request('http://localhost/api/alerts') });
    const secondPayload = await second.json();

    expect(getActiveAlertsMock).not.toHaveBeenCalled();
    expect(secondPayload.generatedAt).toBe(firstPayload.generatedAt);
    expect(secondPayload.alerts).toHaveLength(1);
  });
});
