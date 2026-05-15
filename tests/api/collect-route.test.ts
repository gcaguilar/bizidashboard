import { describe, expect, it } from 'vitest';
import { Route } from '@/app/api/collect/index';

describe('GET /api/collect', () => {
  it('exposes POST and GET handlers through server options', () => {
    expect(Route.options.server).toBeDefined();
    expect(Route.options.server!.handlers!.POST).toBeDefined();
    expect(typeof Route.options.server!.handlers!.POST).toBe('function');
    expect(Route.options.server!.handlers!.GET).toBeDefined();
    expect(typeof Route.options.server!.handlers!.GET).toBe('function');
  });
});
