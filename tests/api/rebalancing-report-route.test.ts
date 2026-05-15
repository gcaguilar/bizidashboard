import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/rebalancing-report/index';

describe('API rebalancing-report', () => {
  it('exposes GET handler through server options', () => {
    expect(Route.options.server).toBeDefined();
    expect(Route.options.server!.handlers!.GET).toBeDefined();
    expect(typeof Route.options.server!.handlers!.GET).toBe('function');
  });
});
