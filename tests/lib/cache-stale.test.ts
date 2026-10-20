import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { store, client } = vi.hoisted(() => {
  const store = new Map<string, string>();
  const client = {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
  };

  return { store, client };
});

vi.mock('@/lib/cache/redis', () => ({
  getRedisClient: async () => client,
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { withStaleCache } from '@/lib/cache/cache';

const OPTIONS = { softTtlSeconds: 300, hardTtlSeconds: 900 };

describe('withStaleCache', () => {
  beforeEach(() => {
    store.clear();
    client.get.mockClear();
    client.set.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('serves a fresh value without calling the fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue('first');

    await expect(withStaleCache('key', OPTIONS, fetcher)).resolves.toBe('first');

    vi.setSystemTime(new Date('2026-04-15T10:01:00.000Z'));
    await expect(withStaleCache('key', OPTIONS, fetcher)).resolves.toBe('first');

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('serves the stale value and refreshes in the background', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    await withStaleCache('key', OPTIONS, fetcher);

    vi.setSystemTime(new Date('2026-04-15T10:06:00.000Z'));
    await expect(withStaleCache('key', OPTIONS, fetcher)).resolves.toBe('first');

    // El refresco se lanza sin bloquear; se resuelve en el siguiente turno.
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date('2026-04-15T10:06:30.000Z'));
    await expect(withStaleCache('key', OPTIONS, fetcher)).resolves.toBe('second');
  });

  it('waits for a refresh once the hard TTL has passed', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    await withStaleCache('key', OPTIONS, fetcher);

    vi.setSystemTime(new Date('2026-04-15T10:20:00.000Z'));
    await expect(withStaleCache('key', OPTIONS, fetcher)).resolves.toBe('second');
  });

  it('deduplicates concurrent cold misses', async () => {
    const fetcher = vi.fn().mockResolvedValue('value');

    await Promise.all([
      withStaleCache('key', OPTIONS, fetcher),
      withStaleCache('key', OPTIONS, fetcher),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
