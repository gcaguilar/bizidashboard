import { isKnownInsecureSecret } from '@/lib/security/known-insecure-secrets';
import { logger } from '@/lib/logger';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const DEFAULT_MOBILE_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Installation-Id',
  'X-Request-Id',
];

export function isTruthyEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ENABLED_VALUES.has(value.trim().toLowerCase());
}

export function getOpsApiKey(): string | null {
  const value = process.env.OPS_API_KEY ?? process.env.COLLECT_API_KEY;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getPublicApiKey(): string | null {
  const trimmed = process.env.PUBLIC_API_KEY?.trim();
  return trimmed ? trimmed : null;
}

export function shouldRequireSignedMobileRequests(): boolean {
  return isTruthyEnv(process.env.REQUIRE_SIGNED_MOBILE_REQUESTS);
}

export function getMobileAllowedOrigins(): string[] {
  const configuredOrigins = (process.env.MOBILE_API_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const appUrl = process.env.APP_URL?.trim();

  if (appUrl) {
    try {
      configuredOrigins.unshift(new URL(appUrl).origin);
    } catch {
      // Ignore malformed APP_URL here. The startup validator will catch it.
    }
  }

  return Array.from(new Set(configuredOrigins));
}

export function getConfiguredMobileOrigins(): string[] {
  return (process.env.MOBILE_API_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getMobileAllowedHeaders(): string {
  return DEFAULT_MOBILE_ALLOWED_HEADERS.join(', ');
}

/**
 * Checks every secret-shaped env var that's actually set against the known
 * dev-default/placeholder list, regardless of NODE_ENV. Unlike
 * validateRuntimeConfiguration(), this never requires a var to be present —
 * it only flags one that's present and matches a known-insecure value — so
 * it's safe to run in dev/staging/preview environments that legitimately
 * leave secrets unset. Warns instead of throwing: an env misconfigured this
 * way in a non-production environment shouldn't crash the boot, but should
 * be visible.
 */
function warnOnWeakSecrets(): void {
  const candidates: Array<[name: string, value: string | undefined]> = [
    ['JWT_SECRET', process.env.JWT_SECRET],
    ['SIGNATURE_SECRET', process.env.SIGNATURE_SECRET],
    ['SESSION_SECRET', process.env.SESSION_SECRET],
    ['OPS_API_KEY', process.env.OPS_API_KEY],
    ['COLLECT_API_KEY', process.env.COLLECT_API_KEY],
    ['PUBLIC_API_KEY', process.env.PUBLIC_API_KEY],
  ];

  for (const [name, value] of candidates) {
    if (value && isKnownInsecureSecret(value)) {
      logger.warn('security_config.weak_secret_detected', { name });
    }
  }
}

export function validateRuntimeConfiguration(): void {
  if (process.env.NODE_ENV !== 'test') {
    warnOnWeakSecrets();
  }

  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const problems: string[] = [];
  const appUrl = process.env.APP_URL?.trim();
  const opsApiKey = getOpsApiKey();
  const mobileApiExpected =
    isTruthyEnv(process.env.MOBILE_API_ENABLED) ||
    shouldRequireSignedMobileRequests();

  if (!process.env.JWT_SECRET || isKnownInsecureSecret(process.env.JWT_SECRET)) {
    problems.push('JWT_SECRET must be configured with a non-default value in production.');
  }

  if (!process.env.SIGNATURE_SECRET || isKnownInsecureSecret(process.env.SIGNATURE_SECRET)) {
    problems.push('SIGNATURE_SECRET must be configured with a non-default value in production.');
  }

  if (!opsApiKey || isKnownInsecureSecret(opsApiKey)) {
    problems.push('OPS_API_KEY or COLLECT_API_KEY must be configured with a non-default value in production.');
  }

  const publicApiKey = getPublicApiKey();
  if (publicApiKey && isKnownInsecureSecret(publicApiKey)) {
    problems.push('PUBLIC_API_KEY must not be a default/placeholder value in production.');
  }

  if (!process.env.REDIS_URL?.trim()) {
    problems.push('REDIS_URL is required in production for shared rate limiting and cache coordination.');
  }

  if (!appUrl) {
    problems.push('APP_URL is required in production.');
  } else {
    try {
      const parsed = new URL(appUrl);
      if (parsed.protocol !== 'https:') {
        problems.push('APP_URL must use https in production.');
      }
    } catch {
      problems.push('APP_URL must be a valid absolute URL in production.');
    }
  }

  const configuredMobileOrigins = getConfiguredMobileOrigins();
  for (const origin of configuredMobileOrigins) {
    try {
      const parsed = new URL(origin);
      const normalizedOrigin = parsed.origin === 'null'
        ? `${parsed.protocol}//${parsed.host}`
        : parsed.origin;
      if (
        !parsed.protocol ||
        !parsed.host ||
        normalizedOrigin !== origin ||
        (parsed.pathname !== '' && parsed.pathname !== '/') ||
        parsed.search ||
        parsed.hash
      ) {
        problems.push(`MOBILE_API_ALLOWED_ORIGINS contains an invalid origin: ${origin}.`);
      }
    } catch {
      problems.push(`MOBILE_API_ALLOWED_ORIGINS contains an invalid origin: ${origin}.`);
    }
  }

  if (mobileApiExpected && configuredMobileOrigins.length === 0) {
    problems.push(
      'MOBILE_API_ALLOWED_ORIGINS is required when MOBILE_API_ENABLED or REQUIRE_SIGNED_MOBILE_REQUESTS is enabled.'
    );
  }

  // OAuth M2M API access (AUTH0_DOMAIN present implies the feature is meant to be live)
  if (process.env.AUTH0_DOMAIN?.trim()) {
    if (!process.env.AUTH0_AUDIENCE?.trim()) {
      problems.push('AUTH0_AUDIENCE is required in production when AUTH0_DOMAIN is set.');
    }
    if (!process.env.AUTH0_MGMT_CLIENT_ID?.trim() || !process.env.AUTH0_MGMT_CLIENT_SECRET?.trim()) {
      problems.push(
        'AUTH0_MGMT_CLIENT_ID and AUTH0_MGMT_CLIENT_SECRET are required in production when AUTH0_DOMAIN is set.'
      );
    }
  }

  // Developer login portal (AUTH0_LOGIN_CLIENT_ID present implies the feature is meant to be live)
  if (process.env.AUTH0_LOGIN_CLIENT_ID?.trim()) {
    if (!process.env.AUTH0_LOGIN_CLIENT_SECRET?.trim()) {
      problems.push('AUTH0_LOGIN_CLIENT_SECRET is required in production when AUTH0_LOGIN_CLIENT_ID is set.');
    }
    const sessionSecret = process.env.SESSION_SECRET?.trim();
    if (!sessionSecret || sessionSecret.length < 32 || isKnownInsecureSecret(sessionSecret)) {
      problems.push('SESSION_SECRET must be configured (min 32 chars, non-default) when developer login is enabled.');
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid runtime configuration: ${problems.join(' ')}`);
  }
}
