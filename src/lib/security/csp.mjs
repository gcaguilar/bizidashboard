const DEFAULT_CONNECT_URLS = [
  'https://tile.openstreetmap.org',
  // Teselas oscuras (retina) por defecto y glifos para la capa de recuento de
  // clústeres. Ver `src/lib/map-style.ts`.
  'https://a.basemaps.cartocdn.com',
  'https://b.basemaps.cartocdn.com',
  'https://c.basemaps.cartocdn.com',
  'https://d.basemaps.cartocdn.com',
  'https://demotiles.maplibre.org',
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
  const umamiScriptSrc = readFirst(env, [
    'UMAMI_SCRIPT_SRC',
    'VITE_UMAMI_SCRIPT_SRC',
    'NEXT_PUBLIC_UMAMI_SCRIPT_SRC',
  ]);
  const umamiWebsiteId = readFirst(env, [
    'UMAMI_WEBSITE_ID',
    'VITE_UMAMI_WEBSITE_ID',
    'NEXT_PUBLIC_UMAMI_WEBSITE_ID',
  ]);
  const umamiHostUrl = readFirst(env, [
    'UMAMI_HOST_URL',
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
  const frameOrigins = DEFAULT_FRAME_URLS.map((value) => new URL(value).origin);

  if (config.umamiScriptSrc) {
    scriptOrigins.push(parseHttpUrl(config.umamiScriptSrc, 'UMAMI_SCRIPT_SRC').origin);
  }
  if (config.umamiHostUrl) {
    connectOrigins.push(parseHttpUrl(config.umamiHostUrl, 'UMAMI_HOST_URL').origin);
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
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${unique(connectOrigins).join(' ')}`,
    `frame-src 'self' ${unique(frameOrigins).join(' ')}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function getContentSecurityPolicyHeader(env = process.env) {
  return env.CSP_REPORT_ONLY?.trim().toLowerCase() === 'true'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}
