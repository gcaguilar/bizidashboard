import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/install/register/index';

describe('POST /api/install/register', () => {
  it('exposes POST and OPTIONS handlers', () => {
    expect(Route.options.server).toBeDefined();
    expect(Route.options.server!.handlers!.POST).toBeDefined();
    expect(typeof Route.options.server!.handlers!.POST).toBe('function');
    expect(Route.options.server!.handlers!.OPTIONS).toBeDefined();
    expect(typeof Route.options.server!.handlers!.OPTIONS).toBe('function');
  });
});
