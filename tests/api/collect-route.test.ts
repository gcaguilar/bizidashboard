import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { runCollectionMock, getJobStateMock, isCollectionScheduledMock } = vi.hoisted(() => ({
  runCollectionMock: vi.fn(),
  getJobStateMock: vi.fn(),
  isCollectionScheduledMock: vi.fn(),
}));

vi.mock('@/jobs/bizi-collection', () => ({
  runCollection: runCollectionMock,
  getJobState: getJobStateMock,
  isCollectionScheduled: isCollectionScheduledMock,
}));

import { GET, POST } from '@/app/api/collect/route';

type EnvKey =
  | 'NODE_ENV'
  | 'COLLECT_API_KEY'
  | 'COLLECT_RATE_LIMIT_MAX'
  | 'COLLECT_RATE_LIMIT_WINDOW_MS';

const originalEnv: Record<EnvKey, string | undefined> = {
  NODE_ENV: process.env.NODE_ENV,
  COLLECT_API_KEY: process.env.COLLECT_API_KEY,
  COLLECT_RATE_LIMIT_MAX: process.env.COLLECT_RATE_LIMIT_MAX,
  COLLECT_RATE_LIMIT_WINDOW_MS: process.env.COLLECT_RATE_LIMIT_WINDOW_MS,
};

function restoreEnvValue(key: EnvKey, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;

  if (value === undefined) {
    delete env[key];
    return;
  }

  env[key] = value;
}

describe('GET /api/collect', () => {
  beforeEach(() => {
    getJobStateMock.mockReset();
    isCollectionScheduledMock.mockReset();
  });

  it('returns collector state snapshot', async () => {
    getJobStateMock.mockReturnValue({
      lastRun: new Date('2026-01-01T00:00:00.000Z'),
      lastSuccess: new Date('2026-01-01T00:00:00.000Z'),
      consecutiveFailures: 0,
      totalRuns: 10,
      totalSuccesses: 9,
    });
    isCollectionScheduledMock.mockReturnValue(true);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.totalRuns).toBe(10);
    expect(payload.isScheduled).toBe(true);
  });
});

describe('POST /api/collect', () => {
  beforeEach(() => {
    runCollectionMock.mockReset();

    restoreEnvValue('NODE_ENV', 'test');
    delete process.env.COLLECT_API_KEY;
    delete process.env.COLLECT_RATE_LIMIT_MAX;
    delete process.env.COLLECT_RATE_LIMIT_WINDOW_MS;
  });

  afterAll(() => {
    restoreEnvValue('NODE_ENV', originalEnv.NODE_ENV);
    restoreEnvValue('COLLECT_API_KEY', originalEnv.COLLECT_API_KEY);
    restoreEnvValue('COLLECT_RATE_LIMIT_MAX', originalEnv.COLLECT_RATE_LIMIT_MAX);
    restoreEnvValue('COLLECT_RATE_LIMIT_WINDOW_MS', originalEnv.COLLECT_RATE_LIMIT_WINDOW_MS);
  });

  it('rejects request when API key is required and missing', async () => {
    process.env.COLLECT_API_KEY = 'top-secret';

    const response = await POST(
      new Request('http://localhost/api/collect', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '198.51.100.10',
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized collect trigger.');
    expect(runCollectionMock).not.toHaveBeenCalled();
  });

  it('fails closed in production when API key is missing', async () => {
    restoreEnvValue('NODE_ENV', 'production');

    const response = await POST(
      new Request('http://localhost/api/collect', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '198.51.100.20',
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toContain('COLLECT_API_KEY');
    expect(runCollectionMock).not.toHaveBeenCalled();
  });

  it('runs collection when API key is valid', async () => {
    process.env.COLLECT_API_KEY = 'top-secret';

    runCollectionMock.mockResolvedValue({
      success: true,
      stationCount: 88,
      recordedAt: new Date('2026-01-01T01:00:00.000Z'),
      quality: null,
      duration: 1234,
      warnings: [],
      timestamp: new Date('2026-01-01T01:00:01.000Z'),
    });

    const response = await POST(
      new Request('http://localhost/api/collect', {
        method: 'POST',
        headers: {
          'x-collect-api-key': 'top-secret',
          'x-forwarded-for': '198.51.100.30',
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.stationCount).toBe(88);
    expect(runCollectionMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get('x-ratelimit-limit')).toBe('6');
  });

  it('rate limits repeated requests from the same client', async () => {
    process.env.COLLECT_API_KEY = 'top-secret';
    process.env.COLLECT_RATE_LIMIT_MAX = '2';
    process.env.COLLECT_RATE_LIMIT_WINDOW_MS = '60000';

    runCollectionMock.mockResolvedValue({
      success: true,
      stationCount: 10,
      recordedAt: new Date('2026-01-01T01:00:00.000Z'),
      quality: null,
      duration: 500,
      warnings: [],
      timestamp: new Date('2026-01-01T01:00:01.000Z'),
    });

    const headers = {
      'x-collect-api-key': 'top-secret',
      'x-forwarded-for': '198.51.100.40',
    };

    const first = await POST(new Request('http://localhost/api/collect', { method: 'POST', headers }));
    const second = await POST(new Request('http://localhost/api/collect', { method: 'POST', headers }));
    const third = await POST(new Request('http://localhost/api/collect', { method: 'POST', headers }));
    const payload = await third.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(payload.error).toBe('Too many requests for /api/collect.');
    expect(third.headers.get('retry-after')).toBeTruthy();
    expect(runCollectionMock).toHaveBeenCalledTimes(2);
  });
});
