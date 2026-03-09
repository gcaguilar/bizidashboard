import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/live/route';

describe('GET /api/health/live', () => {
  it('returns process liveness without dependency checks', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(payload.status).toBe('ok');
    expect(payload.ready).toBe(true);
    expect(payload.checks.process).toBe('ok');
  });
});
