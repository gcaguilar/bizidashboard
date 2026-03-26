import { describe, expect, it } from 'vitest';
import { appRoutes } from '@/lib/routes';

describe('public route query helpers', () => {
  it('builds compare URLs with shareable selection params', () => {
    expect(
      appRoutes.compare({
        dimension: 'stations',
        left: '101',
        right: '202',
      })
    ).toBe('/comparar?dimension=stations&left=101&right=202');
  });

  it('builds explore URLs with global search params', () => {
    expect(appRoutes.explore({ q: 'api status' })).toBe('/explorar?q=api+status');
  });
});
