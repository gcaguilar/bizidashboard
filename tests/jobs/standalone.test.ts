import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const collectionStartMock = vi.fn();
const collectionStopMock = vi.fn();
const analyticsStartMock = vi.fn();
const analyticsStopMock = vi.fn();
const reportSealStartMock = vi.fn();
const reportSealStopMock = vi.fn();
const reportDigestStartMock = vi.fn();
const reportDigestStopMock = vi.fn();
const loggerInfoMock = vi.fn();
const acquireLockMock = vi.fn();
const lockReleaseMock = vi.fn();
const syncDailySystemStatsMock = vi.fn();

vi.mock('@/jobs/bizi-collection', () => ({
  startCollectionJob: collectionStartMock,
  stopCollectionJob: collectionStopMock,
}));

vi.mock('@/jobs/analytics-aggregation', () => ({
  startAnalyticsAggregationJob: analyticsStartMock,
  stopAnalyticsAggregationJob: analyticsStopMock,
}));

vi.mock('@/jobs/monthly-report-seal', () => ({
  startMonthlyReportSealJob: reportSealStartMock,
  stopMonthlyReportSealJob: reportSealStopMock,
}));

vi.mock('@/jobs/monthly-report-digest', () => ({
  startMonthlyReportDigestJob: reportDigestStartMock,
  stopMonthlyReportDigestJob: reportDigestStopMock,
}));

vi.mock('@/analytics/job-lock', () => ({
  acquireJobLock: acquireLockMock,
}));

vi.mock('@/analytics/queries/daily-system', () => ({
  startOfUtcDay: () => new Date('2026-10-20T00:00:00.000Z'),
  syncDailySystemStats: syncDailySystemStatsMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: loggerInfoMock,
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('standalone jobs', () => {
  let setTimeoutSpy: ReturnType<typeof vi.spyOn>;
  let clearTimeoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    collectionStartMock.mockReset();
    collectionStopMock.mockReset();
    analyticsStartMock.mockReset();
    analyticsStopMock.mockReset();
    loggerInfoMock.mockReset();
    acquireLockMock.mockReset();
    lockReleaseMock.mockReset();
    syncDailySystemStatsMock.mockReset();
    acquireLockMock.mockResolvedValue({ release: lockReleaseMock });
    syncDailySystemStatsMock.mockResolvedValue({ seeded: true, days: 0 });

    setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((_fn, _ms) => {
      return { unref: () => {} } as ReturnType<typeof setTimeout>;
    });

    clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ENABLE_INTERNAL_JOBS;
    delete process.env.NODE_ENV;
  });

  it('should not start jobs when ENABLE_INTERNAL_JOBS is empty', async () => {
    process.env.ENABLE_INTERNAL_JOBS = '';
    await import('@/jobs/standalone');
    expect(collectionStartMock).not.toHaveBeenCalled();
  });

  it('should not start jobs when ENABLE_INTERNAL_JOBS is "0"', async () => {
    process.env.ENABLE_INTERNAL_JOBS = '0';
    await import('@/jobs/standalone');
    expect(collectionStartMock).not.toHaveBeenCalled();
  });

  it('should start collection job when ENABLE_INTERNAL_JOBS is "1"', async () => {
    process.env.ENABLE_INTERNAL_JOBS = '1';
    process.env.NODE_ENV = 'production';
    await import('@/jobs/standalone');
    expect(collectionStartMock).toHaveBeenCalledTimes(1);
    expect(loggerInfoMock).toHaveBeenCalledWith('jobs.initializing');
    expect(loggerInfoMock).toHaveBeenCalledWith('jobs.collection_started');
  });

  it('should seed the daily system series at startup', async () => {
    process.env.ENABLE_INTERNAL_JOBS = '1';
    process.env.NODE_ENV = 'production';
    await import('@/jobs/standalone');

    await vi.waitFor(() => {
      expect(acquireLockMock).toHaveBeenCalledWith(
        'daily-system-stat-bootstrap',
        expect.any(Number)
      );
      expect(syncDailySystemStatsMock).toHaveBeenCalledTimes(1);
    });
    expect(lockReleaseMock).toHaveBeenCalledTimes(1);
  });

  it('should schedule analytics aggregation with 2min delay', async () => {
    process.env.ENABLE_INTERNAL_JOBS = '1';
    process.env.NODE_ENV = 'production';
    await import('@/jobs/standalone');
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2 * 60 * 1000);
  });

  it('should only start jobs once (idempotent)', async () => {
    process.env.ENABLE_INTERNAL_JOBS = '1';
    process.env.NODE_ENV = 'production';
    const { initJobs } = await import('@/jobs/standalone');
    initJobs();
    initJobs();
    initJobs();
    expect(collectionStartMock).toHaveBeenCalledTimes(1);
  });

  it('should stop all jobs when shutdownJobs is called', async () => {
    process.env.ENABLE_INTERNAL_JOBS = '1';
    process.env.NODE_ENV = 'production';
    const { shutdownJobs } = await import('@/jobs/standalone');
    shutdownJobs();
    expect(collectionStopMock).toHaveBeenCalledTimes(1);
    expect(analyticsStopMock).toHaveBeenCalledTimes(1);
    expect(reportSealStopMock).toHaveBeenCalledTimes(1);
    expect(reportDigestStopMock).toHaveBeenCalledTimes(1);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  it('should not start jobs when NODE_ENV is test', async () => {
    process.env.ENABLE_INTERNAL_JOBS = '1';
    process.env.NODE_ENV = 'test';
    await import('@/jobs/standalone');
    expect(collectionStartMock).not.toHaveBeenCalled();
  });

  it('should accept various truthy values for ENABLE_INTERNAL_JOBS', async () => {
    for (const value of ['true', 'yes', 'on']) {
      vi.resetModules();
      vi.clearAllMocks();
      collectionStartMock.mockReset();
      loggerInfoMock.mockReset();
      setTimeoutSpy.mockReset();
      clearTimeoutSpy.mockReset();
      process.env.ENABLE_INTERNAL_JOBS = value;
      process.env.NODE_ENV = 'production';
      await import('@/jobs/standalone');
      expect(collectionStartMock).toHaveBeenCalledTimes(1);
    }
  });
});
