import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('site URL resolution', () => {
  it('uses APP_URL when provided', async () => {
    vi.stubEnv('APP_URL', 'https://datosbizi.com');
    const { getSiteUrl } = await import('@/lib/site');
    expect(getSiteUrl()).toBe('https://datosbizi.com');
  });

  it('uses VERCEL_PROJECT_PRODUCTION_URL when APP_URL is missing', async () => {
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'datosbizi.com');
    const { getSiteUrl } = await import('@/lib/site');
    expect(getSiteUrl()).toBe('https://datosbizi.com');
  });

  it('uses VERCEL_URL when no explicit public URL is configured', async () => {
    vi.stubEnv('APP_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('VERCEL_URL', 'bizidashboard.vercel.app');
    const { getSiteUrl } = await import('@/lib/site');
    expect(getSiteUrl()).toBe('https://bizidashboard.vercel.app');
  });
});
