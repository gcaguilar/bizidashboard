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

export function validateRuntimeConfiguration(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const problems: string[] = [];
  const appUrl = process.env.APP_URL?.trim();
  const opsApiKey = getOpsApiKey();
  const mobileApiExpected =
    isTruthyEnv(process.env.MOBILE_API_ENABLED) ||
    shouldRequireSignedMobileRequests();

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
    if (!sessionSecret || sessionSecret.length < 32 || sessionSecret.includes('change-me')) {
      problems.push('SESSION_SECRET must be configured (min 32 chars, non-default) when developer login is enabled.');
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid runtime configuration: ${problems.join(' ')}`);
  }
}
