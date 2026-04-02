import { URL } from 'node:url';

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

export function getMobileAllowedHeaders(): string {
  return DEFAULT_MOBILE_ALLOWED_HEADERS.join(', ');
}

export function validateRuntimeConfiguration(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const problems: string[] = [];
  const appUrl = process.env.APP_URL?.trim();
  const opsApiKey = getOpsApiKey();

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-me')) {
    problems.push('JWT_SECRET must be configured with a non-default value in production.');
  }

  if (!process.env.SIGNATURE_SECRET || process.env.SIGNATURE_SECRET.includes('change-me')) {
    problems.push('SIGNATURE_SECRET must be configured with a non-default value in production.');
  }

  if (!opsApiKey || opsApiKey.includes('change-me')) {
    problems.push('OPS_API_KEY or COLLECT_API_KEY must be configured with a non-default value in production.');
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

  if (problems.length > 0) {
    throw new Error(`Invalid runtime configuration: ${problems.join(' ')}`);
  }
}

