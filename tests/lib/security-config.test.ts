import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateRuntimeConfiguration } from '@/lib/security/config';

function configureProduction() {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('JWT_SECRET', 'production-jwt-secret');
  vi.stubEnv('SIGNATURE_SECRET', 'production-signature-secret');
  vi.stubEnv('OPS_API_KEY', 'production-ops-key');
  vi.stubEnv('REDIS_URL', 'redis://redis:6379');
  vi.stubEnv('APP_URL', 'https://datosbizi.com');
}

describe('runtime security configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('requires explicit mobile origins when mobile clients are enabled', () => {
    configureProduction();
    vi.stubEnv('MOBILE_API_ENABLED', 'true');
    vi.stubEnv('MOBILE_API_ALLOWED_ORIGINS', '');

    expect(() => validateRuntimeConfiguration()).toThrow(
      /MOBILE_API_ALLOWED_ORIGINS is required/
    );
  });

  it('accepts valid explicit mobile origins', () => {
    configureProduction();
    vi.stubEnv('MOBILE_API_ENABLED', 'true');
    vi.stubEnv('MOBILE_API_ALLOWED_ORIGINS', 'capacitor://app.example');

    expect(() => validateRuntimeConfiguration()).not.toThrow();
  });
});
