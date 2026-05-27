import { describe, expect, it } from 'vitest';
import { HOME_CACHE_CONTROL, Route as HomeRoute } from '@/app/index';

describe('home cache contract', () => {
  it('exposes a cacheable cache-control header on the public home route', () => {
    const headers = (HomeRoute.options as { headers: () => Record<string, string> }).headers();

    expect(headers['Cache-Control']).toBe(HOME_CACHE_CONTROL);
    expect(headers['Cache-Control']).toBe(
      'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600'
    );
  });
});
