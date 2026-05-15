import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/app-versions/index';

describe('GET /api/app-versions', () => {
  it('exposes GET handler through server options', () => {
    expect(Route.options.server).toBeDefined();
    expect(Route.options.server!.handlers!.GET).toBeDefined();
    expect(typeof Route.options.server!.handlers!.GET).toBe('function');
  });
});
