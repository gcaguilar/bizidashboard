// PostHog Cloud EU serves SDK assets from a dedicated CDN host. Allow both the
// configured ingestion host and this asset host only when a key is configured.
const DEFAULT_POSTHOG_ASSET_ORIGIN = 'https://eu-assets.i.posthog.com';

const DEFAULT_CONNECT_URLS = [
  'https://tile.openstreetmap.org',
  // Estilo vectorial oscuro (style.json, teselas y glifos) sin clave ni
  // registro. Ver `src/lib/map-style.ts`.
  'https://tiles.openfreemap.org',
];

// Tally es el proveedor incrustable por defecto del formulario de feedback
// (`FeedbackDialog`). Sin `frame-src` explícito, `default-src 'self'` bloquea
// el iframe y el formulario se queda en blanco.
const DEFAULT_FRAME_URLS = [
  'https://tally.so',
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

/**
 * Devuelve el origin del formulario de feedback configurado, o cadena vacía si
 * no está definido o no es una URL http(s) válida. Un valor inválido nunca debe
 * impedir el arranque del servidor: el fallback externo sigue disponible.
 */
function resolveFeedbackFrameOrigin(env) {
  const feedbackUrl = readFirst(env, [
    'VITE_FEEDBACK_URL',
    'NEXT_PUBLIC_FEEDBACK_URL',
  ]);

  if (!feedbackUrl) {
    return '';
  }

  try {
    return parseHttpUrl(feedbackUrl, 'FEEDBACK_URL').origin;
  } catch {
    return '';
  }
}

export function resolveExternalServiceConfig(env = process.env) {
  const posthogKey = readFirst(env, ['POSTHOG_KEY']);
  const posthogHost = readFirst(env, ['POSTHOG_HOST']) || 'https://eu.i.posthog.com';
  const sentryDsn = readFirst(env, [
    'SENTRY_DSN',
    'VITE_SENTRY_DSN',
    'NEXT_PUBLIC_SENTRY_DSN',
  ]);

  return {
    posthogKey,
    posthogHost,
    sentryDsn,
  };
}

export function buildContentSecurityPolicy(env = process.env) {
  const config = resolveExternalServiceConfig(env);
  const scriptOrigins = [];
  const connectOrigins = DEFAULT_CONNECT_URLS.map((value) => new URL(value).origin);
  const frameOrigins = DEFAULT_FRAME_URLS.map((value) => new URL(value).origin);

  if (config.posthogKey) {
    const posthogOrigin = parseHttpUrl(config.posthogHost, 'POSTHOG_HOST').origin;
    scriptOrigins.push(posthogOrigin, new URL(DEFAULT_POSTHOG_ASSET_ORIGIN).origin);
    connectOrigins.push(posthogOrigin, new URL(DEFAULT_POSTHOG_ASSET_ORIGIN).origin);
  }
  if (config.sentryDsn) {
    connectOrigins.push(parseHttpUrl(config.sentryDsn, 'SENTRY_DSN').origin);
  }

  const nominatimBaseUrl =
    env.NOMINATIM_BASE_URL?.trim() || 'https://nominatim.openstreetmap.org';
  connectOrigins.push(parseHttpUrl(nominatimBaseUrl, 'NOMINATIM_BASE_URL').origin);

  scriptOrigins.push(...parseOriginList(env.CSP_SCRIPT_SRC_ORIGINS, 'CSP_SCRIPT_SRC_ORIGINS'));
  connectOrigins.push(...parseOriginList(env.CSP_CONNECT_SRC_ORIGINS, 'CSP_CONNECT_SRC_ORIGINS'));
  frameOrigins.push(resolveFeedbackFrameOrigin(env));
  frameOrigins.push(...parseOriginList(env.CSP_FRAME_SRC_ORIGINS, 'CSP_FRAME_SRC_ORIGINS'));

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${unique(scriptOrigins).join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${unique(connectOrigins).join(' ')}`,
    `frame-src 'self' ${unique(frameOrigins).join(' ')}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join('; ');
}

export function getContentSecurityPolicyHeader(env = process.env) {
  return env.CSP_REPORT_ONLY?.trim().toLowerCase() === 'true'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}
