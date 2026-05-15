import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/ops/sentry-test/index';

describe('POST /api/ops/sentry-test', () => {
  it('exposes POST handler through server options', () => {
    expect(Route.options.server).toBeDefined();
    expect(Route.options.server!.handlers!.POST).toBeDefined();
    expect(typeof Route.options.server!.handlers!.POST).toBe('function');
  });
});
