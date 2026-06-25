import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyMobileCors,
  buildMobileCorsHeaders,
  handleMobilePreflight,
  rejectDisallowedMobileOrigin,
} from '@/lib/security/http';

const allowedOrigin = 'capacitor://mobile.example';

function request(origin?: string) {
  return new Request('https://datosbizi.com/api/token/refresh', {
    method: 'POST',
    headers: origin ? { Origin: origin } : undefined,
  });
}

describe('mobile API CORS', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([200, 400, 429, 500])(
    'adds the allowed origin to a %s response',
    (status) => {
      vi.stubEnv('APP_URL', 'https://datosbizi.com');
      vi.stubEnv('MOBILE_API_ALLOWED_ORIGINS', allowedOrigin);

      const response = applyMobileCors(request(allowedOrigin), new Response(null, { status }));

      expect(response.status).toBe(status);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(allowedOrigin);
      expect(response.headers.get('Vary')).toBe('Origin');
    }
  );

  it('rejects an unlisted origin without ACAO', async () => {
    vi.stubEnv('MOBILE_API_ALLOWED_ORIGINS', allowedOrigin);

    const response = rejectDisallowedMobileOrigin(request('https://evil.example'));

    expect(response?.status).toBe(403);
    expect(response?.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(response?.headers.get('Vary')).toBe('Origin');
  });

  it('returns the mobile preflight contract for an allowed origin', () => {
    vi.stubEnv('MOBILE_API_ALLOWED_ORIGINS', allowedOrigin);

    const response = handleMobilePreflight(request(allowedOrigin));

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(allowedOrigin);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'Content-Type, Authorization, X-Installation-Id, X-Request-Id'
    );
  });

  it('never emits a wildcard origin', () => {
    vi.stubEnv('MOBILE_API_ALLOWED_ORIGINS', allowedOrigin);
    expect(Object.values(buildMobileCorsHeaders(request(allowedOrigin)))).not.toContain('*');
  });
});
