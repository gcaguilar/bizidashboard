import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { acquireJobLockMock, buildRebalancingReportMock, captureExceptionMock } = vi.hoisted(() => ({
  acquireJobLockMock: vi.fn(),
  buildRebalancingReportMock: vi.fn(),
  captureExceptionMock: vi.fn(),
}));

vi.mock('@/analytics/job-lock', () => ({
  acquireJobLock: acquireJobLockMock,
}));

vi.mock('@/lib/rebalancing-report', () => ({
  buildRebalancingReport: buildRebalancingReportMock,
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: captureExceptionMock,
  captureWarningWithContext: vi.fn(),
}));

vi.mock('@sentry/tanstackstart-react', () => ({
  withMonitor: <T>(_monitor: string, callback: () => T): T => callback(),
  startSpan: <T>(_options: unknown, callback: () => T): T => callback(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { runRebalancingPrewarm } from '@/jobs/rebalancing-prewarm';

describe('rebalancing prewarm job', () => {
  const releaseMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    acquireJobLockMock.mockReset();
    buildRebalancingReportMock.mockReset();
    captureExceptionMock.mockReset();
    releaseMock.mockClear();

    acquireJobLockMock.mockResolvedValue({ release: releaseMock });
    buildRebalancingReportMock.mockResolvedValue({
      summary: { totalStations: 275 },
    });
  });

  it('rebuilds the 15, 7 and 30-day base reports under the prewarm lock and releases it', async () => {
    await runRebalancingPrewarm();

    expect(acquireJobLockMock).toHaveBeenCalledWith('rebalancing-prewarm', expect.any(Number));
    expect(buildRebalancingReportMock.mock.calls.map(([options]) => options)).toEqual([
      { days: 15 },
      { days: 7 },
      { days: 30 },
    ]);
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });

  it('skips the report when another process holds the lock', async () => {
    acquireJobLockMock.mockResolvedValue(null);

    await runRebalancingPrewarm();

    expect(buildRebalancingReportMock).not.toHaveBeenCalled();
  });

  it('releases the lock and reports the failure when the report cannot be built', async () => {
    buildRebalancingReportMock.mockRejectedValue(new Error('db down'));

    await runRebalancingPrewarm();

    expect(releaseMock).toHaveBeenCalledTimes(1);
    expect(buildRebalancingReportMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
  });
});
