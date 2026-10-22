import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCachedJsonMock, setCachedJsonMock } = vi.hoisted(() => ({
  getCachedJsonMock: vi.fn(),
  setCachedJsonMock: vi.fn(),
}));

vi.mock('@/lib/cache/cache', () => ({
  getCachedJson: getCachedJsonMock,
  setCachedJson: setCachedJsonMock,
}));

import {
  bumpRollupVersion,
  getRollupVersion,
  resetRollupVersionMemo,
} from '@/lib/cache/rollup-version';

describe('rollup version', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:15:00.000Z'));
    resetRollupVersionMemo();
    getCachedJsonMock.mockReset();
    setCachedJsonMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('falls back to a stable token before the first rollup', async () => {
    getCachedJsonMock.mockResolvedValue(null);

    await expect(getRollupVersion()).resolves.toBe('none');
  });

  it('reads redis at most every 30 seconds per process', async () => {
    getCachedJsonMock.mockResolvedValueOnce('a').mockResolvedValueOnce('b');

    await expect(getRollupVersion()).resolves.toBe('a');
    vi.advanceTimersByTime(29_000);
    await expect(getRollupVersion()).resolves.toBe('a');
    vi.advanceTimersByTime(2_000);
    await expect(getRollupVersion()).resolves.toBe('b');
    expect(getCachedJsonMock).toHaveBeenCalledTimes(2);
  });

  it('persists a new version without expiry and adopts it locally', async () => {
    const version = await bumpRollupVersion();

    expect(version).toBe('2026-10-22T10:15:00.000Z');
    expect(setCachedJsonMock).toHaveBeenCalledWith('analytics:rollup-version', version, null);
    await expect(getRollupVersion()).resolves.toBe(version);
    expect(getCachedJsonMock).not.toHaveBeenCalled();
  });
});
