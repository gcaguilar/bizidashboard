import { serverHandlers } from '@tests/helpers/route-handlers';
import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/geo/search/index';

describe('POST /api/geo/search', () => {
  it('exposes POST and OPTIONS handlers', () => {
    expect(Route.options.server).toBeDefined();
    expect(serverHandlers(Route).GET).toBeDefined();
    expect(typeof serverHandlers(Route).GET).toBe('function');
    expect(serverHandlers(Route).POST).toBeDefined();
    expect(typeof serverHandlers(Route).POST).toBe('function');
    expect(serverHandlers(Route).OPTIONS).toBeDefined();
    expect(typeof serverHandlers(Route).OPTIONS).toBe('function');
  });

  it('returns JSON method guidance for GET requests', async () => {
    const response = await serverHandlers(Route).GET!({
      request: new Request('http://localhost/api/geo/search?q=plaza'),
    });
    const payload = await response.json();

    expect(response.status).toBe(405);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Allow')).toBe('POST, OPTIONS');
    expect(payload.error).toContain('Use POST');
  });
});
