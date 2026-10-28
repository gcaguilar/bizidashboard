import { describe, expect, it } from 'vitest';
import { Route } from '@/app/$';
import { Route as LegacyStationRoute } from '@/app/estaciones/$stationId';

const runLoader = Route.options.loader as unknown as (ctx: {
  params: { _splat: string };
}) => unknown;

function getRedirectTarget(path: string): string | null {
  try {
    runLoader({ params: { _splat: path } });
  } catch (error) {
    const maybeRedirect = error as { options?: { to?: string } };
    return maybeRedirect.options?.to ?? null;
  }

  return null;
}

function getRedirectStatus(path: string): number | null {
  try {
    runLoader({ params: { _splat: path } });
  } catch (error) {
    const maybeRedirect = error as { options?: { statusCode?: number } };
    return maybeRedirect.options?.statusCode ?? null;
  }

  return null;
}

describe('catch-all redirects', () => {
  it.each([
    ['zaragoza', '/dashboard'],
    ['madrid', '/dashboard'],
    ['barcelona', '/dashboard'],
    ['zaragoza/ayuda', '/metodologia'],
    ['madrid/flujo', '/dashboard/flujo'],
    ['barcelona/conclusiones', '/dashboard/conclusiones'],
    ['zaragoza/alertas', '/dashboard/alertas'],
    ['madrid/estaciones', '/dashboard/estaciones'],
  ])('resolves %s through the canonical route registry', (source, target) => {
    expect(getRedirectTarget(source)).toBe(target);
  });

  it('marks legacy catch-all redirects as permanent', () => {
    expect(getRedirectStatus('zaragoza')).toBe(308);
  });
});

describe('legacy station redirects', () => {
  it('sends /estaciones/:id to the public station page with a permanent redirect', () => {
    const loader = LegacyStationRoute.options.loader as unknown as (ctx: {
      params: { stationId: string };
    }) => unknown;

    let options: { to?: string; statusCode?: number; params?: { stationId?: string } } | null = null;
    try {
      loader({ params: { stationId: '135' } });
    } catch (error) {
      options = (error as { options?: typeof options }).options ?? null;
    }

    expect(options).toMatchObject({
      to: '/estadisticas/estaciones/$stationId',
      statusCode: 308,
      params: { stationId: '135' },
    });
  });
});
