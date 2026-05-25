import { describe, expect, it } from 'vitest';
import proxy from '@/proxy';

async function callProxy(path: string, method: string) {
  return proxy(new Request(`http://localhost${path}`, { method }));
}

describe('proxy API method guard', () => {
  it('returns JSON 405 instead of falling through to HTML for unsupported API methods', async () => {
    const response = await callProxy('/api/health/live', 'POST');
    const payload = await response.json();

    expect(response.status).toBe(405);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Allow')).toBe('GET');
    expect(payload.error).toBe('Method POST not allowed');
  });

  it('allows documented POST endpoints to reach their route handlers', async () => {
    const response = await callProxy('/api/token/refresh', 'POST');

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Request-Id')).toBeTruthy();
  });

  it('treats HEAD as valid for GET endpoints', async () => {
    const response = await callProxy('/api/status', 'HEAD');

    expect(response.status).toBe(200);
  });
});
