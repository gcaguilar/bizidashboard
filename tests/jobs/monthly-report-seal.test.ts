import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  acquireJobLockMock,
  buildMonthlyReportMock,
  captureExceptionWithContextMock,
  getWatermarkMock,
  refreshMonthlyCriticalEpisodesMock,
} = vi.hoisted(() => ({
  acquireJobLockMock: vi.fn(),
  buildMonthlyReportMock: vi.fn(),
  captureExceptionWithContextMock: vi.fn(),
  getWatermarkMock: vi.fn(),
  refreshMonthlyCriticalEpisodesMock: vi.fn(),
}));

vi.mock('@/analytics/watermarks', () => ({
  getWatermark: getWatermarkMock,
}));

vi.mock('@/analytics/job-lock', () => ({
  acquireJobLock: acquireJobLockMock,
}));

vi.mock('@/lib/monthly-report', () => ({
  buildMonthlyReport: buildMonthlyReportMock,
}));

vi.mock('@/analytics/queries/monthly-report', () => ({
  refreshMonthlyCriticalEpisodes: refreshMonthlyCriticalEpisodesMock,
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: captureExceptionWithContextMock,
  captureWarningWithContext: vi.fn(),
}));

vi.mock('@sentry/tanstackstart-react', () => ({
  startSpan: <T>(_options: unknown, callback: () => T): T => callback(),
  withMonitor: <T>(_monitor: string, callback: () => T): T => callback(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  recentClosedMonths,
  runMonthlyReportSeal,
} from '@/jobs/monthly-report-seal';
import { REPORT_MONTHS_WINDOW } from '@/lib/months';

describe('monthly report seal job', () => {
  const releaseMock = vi.fn().mockResolvedValue(undefined);
  const refreshMock = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    acquireJobLockMock.mockReset();
    buildMonthlyReportMock.mockReset();
    captureExceptionWithContextMock.mockReset();
    refreshMonthlyCriticalEpisodesMock.mockReset();
    refreshMonthlyCriticalEpisodesMock.mockResolvedValue({ monthKey: '2026-03', episodes: 0 });
    getWatermarkMock.mockReset();
    getWatermarkMock.mockImplementation((_name: string, defaultDate: Date) => Promise.resolve(defaultDate));
    releaseMock.mockClear();
    refreshMock.mockReset();
    refreshMock.mockResolvedValue(true);
    acquireJobLockMock.mockResolvedValue({ refresh: refreshMock, release: releaseMock });
    buildMonthlyReportMock.mockResolvedValue({ hasReport: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.REPORT_PDF_BASE_URL;
  });

  it('lists the previous months, most recent first', () => {
    expect(recentClosedMonths('2026-04-15T10:00:00.000Z', 3)).toEqual([
      '2026-03',
      '2026-02',
      '2026-01',
    ]);
  });

  it('seals the whole published window and releases the lock', async () => {
    await runMonthlyReportSeal();

    const sealed = buildMonthlyReportMock.mock.calls.map((call) => call[0]);
    expect(sealed).toEqual(recentClosedMonths(new Date().toISOString(), REPORT_MONTHS_WINDOW));
    expect(sealed).toHaveLength(REPORT_MONTHS_WINDOW);
    expect(refreshMock).toHaveBeenCalledTimes(REPORT_MONTHS_WINDOW);
    expect(releaseMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionWithContextMock).not.toHaveBeenCalled();
  });

  it('recomputes the episodes of the newest closed month only until they cover its close', async () => {
    const [newestMonth] = recentClosedMonths(new Date().toISOString(), 1);

    await runMonthlyReportSeal();
    expect(refreshMonthlyCriticalEpisodesMock).toHaveBeenCalledTimes(1);
    expect(refreshMonthlyCriticalEpisodesMock).toHaveBeenCalledWith(newestMonth);
    expect(getWatermarkMock).toHaveBeenCalledWith(`critical-episodes:${newestMonth}`, expect.any(Date));

    refreshMonthlyCriticalEpisodesMock.mockClear();
    getWatermarkMock.mockResolvedValue(new Date());

    await runMonthlyReportSeal();
    expect(refreshMonthlyCriticalEpisodesMock).not.toHaveBeenCalled();
    expect(buildMonthlyReportMock).toHaveBeenCalledWith(newestMonth, expect.any(String));
  });

  it('warms the pdf of the newest closed months through the web api', async () => {
    process.env.REPORT_PDF_BASE_URL = 'http://web:3000';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    vi.stubGlobal('fetch', fetchMock);

    await runMonthlyReportSeal();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      'http://web:3000/api/reports?month='
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('format=pdf');
  });

  it('skips the run when another job holds the lock', async () => {
    acquireJobLockMock.mockResolvedValue(null);

    await runMonthlyReportSeal();

    expect(buildMonthlyReportMock).not.toHaveBeenCalled();
  });

  it('keeps sealing the rest of the months when one fails', async () => {
    const months = recentClosedMonths(new Date().toISOString(), REPORT_MONTHS_WINDOW);
    const failingMonth = months[1];

    buildMonthlyReportMock.mockImplementation(async (month: string) => {
      if (month === failingMonth) {
        throw new Error('series unavailable');
      }
      return { hasReport: true };
    });

    await runMonthlyReportSeal();

    expect(buildMonthlyReportMock.mock.calls.map((call) => call[0])).toEqual(months);
    expect(captureExceptionWithContextMock).toHaveBeenCalledTimes(1);
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });

  it('aborts when the lock is lost mid-run', async () => {
    refreshMock.mockResolvedValue(false);

    await runMonthlyReportSeal();

    expect(buildMonthlyReportMock).not.toHaveBeenCalled();
    expect(captureExceptionWithContextMock).toHaveBeenCalledTimes(1);
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });
});
