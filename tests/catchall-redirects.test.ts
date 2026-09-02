import { describe, expect, it } from 'vitest';
import { Route } from '@/app/$';

function getRedirectTarget(path: string): string | null {
  try {
    Route.options.loader?.({
      params: { _splat: path },
    } as never);
  } catch (error) {
    const maybeRedirect = error as { options?: { to?: string } };
    return maybeRedirect.options?.to ?? null;
  }

  return null;
}

function getRedirectStatus(path: string): number | null {
  try {
    Route.options.loader?.({ params: { _splat: path } } as never);
  } catch (error) {
    const maybeRedirect = error as { options?: { status?: number } };
    return maybeRedirect.options?.status ?? null;
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
