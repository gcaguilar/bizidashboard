import { serverHandlers } from '@tests/helpers/route-handlers';
import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/token/refresh/index';

describe('POST /api/token/refresh', () => {
  it('exposes POST and OPTIONS handlers', () => {
    expect(Route.options.server).toBeDefined();
    expect(serverHandlers(Route).POST).toBeDefined();
    expect(typeof serverHandlers(Route).POST).toBe('function');
    expect(serverHandlers(Route).OPTIONS).toBeDefined();
    expect(typeof serverHandlers(Route).OPTIONS).toBe('function');
  });
});
