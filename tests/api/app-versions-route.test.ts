import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { captureExceptionWithContextMock } = vi.hoisted(() => ({
  captureExceptionWithContextMock: vi.fn(),
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: captureExceptionWithContextMock,
}));

const originalAppVersions = process.env.APP_VERSIONS;

async function loadRoute() {
  vi.resetModules();
  return import('@/app/api/app-versions/route');
}

describe('GET /api/app-versions', () => {
  beforeEach(() => {
    captureExceptionWithContextMock.mockReset();
    delete process.env.APP_VERSIONS;
  });

  afterAll(() => {
    if (originalAppVersions === undefined) {
      delete process.env.APP_VERSIONS;
      return;
    }

    process.env.APP_VERSIONS = originalAppVersions;
  });

  it('returns configured versions when env shape is valid', async () => {
    process.env.APP_VERSIONS = JSON.stringify({
      minVersion: '2.0.0',
      maxVersion: '3.1.0',
      versions: [{ version: '2.5.0', allowed: true }],
    });

    const { GET } = await loadRoute();
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.minVersion).toBe('2.0.0');
    expect(payload.versions).toEqual([{ version: '2.5.0', allowed: true }]);
    expect(captureExceptionWithContextMock).not.toHaveBeenCalled();
  });

  it('falls back to defaults when env shape is invalid', async () => {
    process.env.APP_VERSIONS = JSON.stringify({
      minVersion: 2,
      maxVersion: '3.1.0',
      versions: [],
    });

    const { GET } = await loadRoute();
    const response = await GET();
    const payload = await response.json();

    expect(payload.minVersion).toBe('1.0.0');
    expect(payload.maxVersion).toBe('999.999.999');
    expect(payload.versions).toEqual([]);
    expect(captureExceptionWithContextMock).toHaveBeenCalledTimes(1);
  });
});
