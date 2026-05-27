import { describe, expect, it } from 'vitest';
import { HOME_CACHE_CONTROL, Route as HomeRoute } from '@/app/index';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('home cache contract', () => {
  it('exposes a cacheable cache-control header on the public home route', () => {
    const headers = (HomeRoute.options as { headers: () => Record<string, string> }).headers();

    expect(headers['Cache-Control']).toBe(HOME_CACHE_CONTROL);
    expect(headers['Cache-Control']).toBe(
      'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
    );
  });

  it('does not precache the home html in the service worker', () => {
    const source = readSource('public/sw.js');

    expect(source).toContain("const CACHE_NAME = 'datosbizi-v2'");
    expect(source).toContain('const urlsToCache = []');
    expect(source).not.toContain("const urlsToCache = ['/']");
    expect(source).toContain("request.mode === 'navigate'");
    expect(source).toContain('fetch(request).catch(() => caches.match(request))');
  });
});
