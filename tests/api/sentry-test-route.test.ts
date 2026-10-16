import { serverHandlers } from '@tests/helpers/route-handlers';
import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/ops/sentry-test/index';

describe('POST /api/ops/sentry-test', () => {
  it('exposes POST handler through server options', () => {
    expect(Route.options.server).toBeDefined();
    expect(serverHandlers(Route).POST).toBeDefined();
    expect(typeof serverHandlers(Route).POST).toBe('function');
  });
});
