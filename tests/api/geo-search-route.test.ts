import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/geo/search/index';

describe('POST /api/geo/search', () => {
  it('exposes POST and OPTIONS handlers', () => {
    expect(Route.options.server).toBeDefined();
    expect(Route.options.server!.handlers!.GET).toBeDefined();
    expect(typeof Route.options.server!.handlers!.GET).toBe('function');
    expect(Route.options.server!.handlers!.POST).toBeDefined();
    expect(typeof Route.options.server!.handlers!.POST).toBe('function');
    expect(Route.options.server!.handlers!.OPTIONS).toBeDefined();
    expect(typeof Route.options.server!.handlers!.OPTIONS).toBe('function');
  });

  it('returns JSON method guidance for GET requests', async () => {
    const response = await Route.options.server!.handlers!.GET!({
      request: new Request('http://localhost/api/geo/search?q=plaza'),
    });
    const payload = await response.json();

    expect(response.status).toBe(405);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Allow')).toBe('POST, OPTIONS');
    expect(payload.error).toContain('Use POST');
  });
});
