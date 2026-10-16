import { describe, it, expect, vi, beforeEach } from 'vitest';

const { scheduleMock, withMonitorMock, loggerInfoMock, loggerErrorMock, stopMock } = vi.hoisted(() => ({
  scheduleMock: vi.fn(),
  withMonitorMock: vi.fn(),
  loggerInfoMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  stopMock: vi.fn(),
}));

vi.mock('node-cron', () => ({ schedule: scheduleMock }));
vi.mock('@sentry/tanstackstart-react', () => ({ withMonitor: withMonitorMock }));
vi.mock('@/lib/logger', () => ({
  logger: { info: loggerInfoMock, warn: vi.fn(), error: loggerErrorMock },
}));

import { defineCronJob } from '@/jobs/cron-job';

function definition(overrides: Partial<Parameters<typeof defineCronJob>[0]> = {}) {
  return defineCronJob({
    monitor: 'bizi-collection',
    logPrefix: 'collection',
    schedule: '*/2 * * * *',
    timezone: 'Europe/Madrid',
    run: async () => {},
    ...overrides,
  });
}

describe('defineCronJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scheduleMock.mockReturnValue({ stop: stopMock });
    withMonitorMock.mockImplementation(async (_name: string, cb: () => Promise<void>) => cb());
  });

  it('registers a cron schedule with the timezone and runOnInit', () => {
    const job = definition();
    job.start();

    expect(scheduleMock).toHaveBeenCalledTimes(1);
    const [expression, , options] = scheduleMock.mock.calls[0];
    expect(expression).toBe('*/2 * * * *');
    expect(options).toMatchObject({ scheduled: true, timezone: 'Europe/Madrid', runOnInit: true });
    expect(loggerInfoMock).toHaveBeenCalledWith('collection.cron_started', { schedule: '*/2 * * * *' });
  });

  it('does not register twice', () => {
    const job = definition();
    job.start();
    job.start();

    expect(scheduleMock).toHaveBeenCalledTimes(1);
    expect(loggerInfoMock).toHaveBeenCalledWith('collection.cron_already_running');
  });

  it('wraps the tick body in a Sentry cron monitor', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const job = definition({ monitor: 'analytics-aggregation', logPrefix: 'analytics', run });
    job.start();

    const tick = scheduleMock.mock.calls[0][1] as () => Promise<void>;
    await tick();

    expect(withMonitorMock).toHaveBeenCalledWith(
      'analytics-aggregation',
      expect.any(Function),
      { schedule: { type: 'crontab', value: '*/2 * * * *' }, timezone: 'Europe/Madrid' }
    );
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('swallows run errors so the process does not crash', async () => {
    withMonitorMock.mockRejectedValueOnce(new Error('boom'));
    const job = definition();
    job.start();

    const tick = scheduleMock.mock.calls[0][1] as () => Promise<void>;
    await expect(tick()).resolves.toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledWith('collection.cron_failed', { error: expect.any(Error) });
  });

  it('tracks scheduled state and stops the task', () => {
    const job = definition();
    expect(job.isScheduled()).toBe(false);

    job.start();
    expect(job.isScheduled()).toBe(true);

    job.stop();
    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(job.isScheduled()).toBe(false);
  });
});
