import { describe, expect, it } from 'vitest';
import { getRequestSiteUrl } from '@/lib/site';

describe('getRequestSiteUrl', () => {
  it('uses the public forwarded origin behind Cloudflare', () => {
    const request = new Request('http://internal:3000/api/auth/login', {
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'datosbizi.com',
      },
    });

    expect(getRequestSiteUrl(request)).toBe('https://datosbizi.com');
  });

  it('falls back to the request origin without forwarded headers', () => {
    const request = new Request('https://datosbizi.com/api/auth/login');
    expect(getRequestSiteUrl(request)).toBe('https://datosbizi.com');
  });

  it('prefers the explicit Auth0 public origin', () => {
    const previous = process.env.AUTH0_PUBLIC_ORIGIN;
    process.env.AUTH0_PUBLIC_ORIGIN = 'https://datosbizi.com';
    try {
      const request = new Request('https://attacker.example/api/auth/login');
      expect(getRequestSiteUrl(request)).toBe('https://datosbizi.com');
    } finally {
      if (previous === undefined) delete process.env.AUTH0_PUBLIC_ORIGIN;
      else process.env.AUTH0_PUBLIC_ORIGIN = previous;
    }
  });
});
