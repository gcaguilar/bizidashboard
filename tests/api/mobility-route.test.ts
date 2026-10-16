import { serverHandlers } from '@tests/helpers/route-handlers';
import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/mobility/index';

describe('GET /api/mobility', () => {
  it('exposes GET handler through server options', () => {
    expect(Route.options.server).toBeDefined();
    expect(serverHandlers(Route).GET).toBeDefined();
    expect(typeof serverHandlers(Route).GET).toBe('function');
  });
});
