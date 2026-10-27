import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchStations,
  fetchStationsSnapshot,
  resetStationsCache,
  STATIONS_CLIENT_TTL_MS,
} from '@/lib/fetch-stations';

describe('fetchStations', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    resetStationsCache();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => ({
      ok: true,
      json: async () => ({ stations: [{ id: '1' }], generatedAt: '2026-01-01T00:00:00.000Z' }),
    }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shares in-flight requests and caches for the TTL', async () => {
    await Promise.all([fetchStations(), fetchStations()]);
    await fetchStations();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(STATIONS_CLIENT_TTL_MS + 1);
    await fetchStations();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('exposes generatedAt in the snapshot', async () => {
    const snapshot = await fetchStationsSnapshot();
    expect(snapshot.generatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects when the signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(fetchStations({ signal: controller.signal })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on HTTP errors and does not cache them', async () => {
    fetchMock.mockImplementationOnce(async () => ({ ok: false, status: 429 }));
    await expect(fetchStations()).rejects.toThrow('HTTP 429');
    await expect(fetchStations()).resolves.toHaveLength(1);
  });
});
