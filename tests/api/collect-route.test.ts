import { serverHandlers } from '@tests/helpers/route-handlers';
import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/collect/index';

describe('GET /api/collect', () => {
  it('exposes POST and GET handlers through server options', () => {
    expect(Route.options.server).toBeDefined();
    expect(serverHandlers(Route).POST).toBeDefined();
    expect(typeof serverHandlers(Route).POST).toBe('function');
    expect(serverHandlers(Route).GET).toBeDefined();
    expect(typeof serverHandlers(Route).GET).toBe('function');
  });
});
