const DEFAULT_CONNECT_URLS = [
  'https://tile.openstreetmap.org',
];

function readFirst(env, names) {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return '';
}

function parseHttpUrl(value, name) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${name} must use http or https.`);
  }

  return parsed;
}

function parseOriginList(value, name) {
  if (!value?.trim()) return [];

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => parseHttpUrl(entry, name).origin);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function resolveExternalServiceConfig(env = process.env) {
  const umamiScriptSrc = readFirst(env, [
    'VITE_UMAMI_SCRIPT_SRC',
    'NEXT_PUBLIC_UMAMI_SCRIPT_SRC',
  ]);
  const umamiWebsiteId = readFirst(env, [
    'VITE_UMAMI_WEBSITE_ID',
    'NEXT_PUBLIC_UMAMI_WEBSITE_ID',
  ]);
  const umamiHostUrl = readFirst(env, [
    'VITE_UMAMI_HOST_URL',
    'NEXT_PUBLIC_UMAMI_HOST_URL',
  ]);
  const sentryDsn = readFirst(env, [
    'SENTRY_DSN',
    'VITE_SENTRY_DSN',
    'NEXT_PUBLIC_SENTRY_DSN',
  ]);

  return {
    umamiScriptSrc,
    umamiWebsiteId,
    umamiHostUrl,
    sentryDsn,
  };
}

export function buildContentSecurityPolicy(env = process.env) {
  const config = resolveExternalServiceConfig(env);
  const scriptOrigins = ['https://fonts.googleapis.com'];
  const connectOrigins = DEFAULT_CONNECT_URLS.map((value) => new URL(value).origin);

  if (config.umamiScriptSrc) {
    scriptOrigins.push(parseHttpUrl(config.umamiScriptSrc, 'VITE_UMAMI_SCRIPT_SRC').origin);
  }
  if (config.umamiHostUrl) {
    connectOrigins.push(parseHttpUrl(config.umamiHostUrl, 'VITE_UMAMI_HOST_URL').origin);
  }
  if (config.sentryDsn) {
    connectOrigins.push(parseHttpUrl(config.sentryDsn, 'SENTRY_DSN').origin);
  }

  const nominatimBaseUrl =
    env.NOMINATIM_BASE_URL?.trim() || 'https://nominatim.openstreetmap.org';
  connectOrigins.push(parseHttpUrl(nominatimBaseUrl, 'NOMINATIM_BASE_URL').origin);

  scriptOrigins.push(...parseOriginList(env.CSP_SCRIPT_SRC_ORIGINS, 'CSP_SCRIPT_SRC_ORIGINS'));
  connectOrigins.push(...parseOriginList(env.CSP_CONNECT_SRC_ORIGINS, 'CSP_CONNECT_SRC_ORIGINS'));

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${unique(scriptOrigins).join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${unique(connectOrigins).join(' ')}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function getContentSecurityPolicyHeader(env = process.env) {
  return env.CSP_REPORT_ONLY?.trim().toLowerCase() === 'true'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}
