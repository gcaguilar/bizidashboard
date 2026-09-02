import { CITY_CONFIGS, DEFAULT_CITY, isValidCity } from './constants';

function getCity(): string {
  const city = process.env.CITY || DEFAULT_CITY;
  return city.toLowerCase();
}

export function getCurrentCityKey() {
  const cityKey = getCity();
  return isValidCity(cityKey) ? cityKey : DEFAULT_CITY;
}

export function getCityName(): string {
  return CITY_CONFIGS[getCurrentCityKey()].name;
}

export const SITE_NAME = 'BiziDashboard';
export const SITE_TITLE = `BiziDashboard ${getCityName()}`;
export const SITE_DESCRIPTION =
  `Panel público con datos de estaciones Bizi ${getCityName()}: disponibilidad, alertas, patrones horarios y movilidad urbana.`;
export const SEO_SITE_NAME = 'DatosBizi';
export const SEO_SITE_TITLE = `${SEO_SITE_NAME} ${getCityName()}`;
export const SEO_SITE_DESCRIPTION =
  `DatosBizi reúne estaciones Bizi ${getCityName()}, disponibilidad, análisis de uso, informes mensuales y datos abiertos en un único observatorio público.`;

// Keep production metadata valid even if APP_URL/VITE_APP_URL is missing.
// Local development still uses an explicit APP_URL from .env.example/.env.local.
const FALLBACK_SITE_URL = 'https://datosbizi.com';

function ensureProtocol(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function normalizeHttpOrigin(candidate: string, fallback: string): string {
  try {
    const parsed = new URL(ensureProtocol(candidate.trim()));
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fallback;
    }

    return parsed.origin;
  } catch {
    return fallback;
  }
}

export function getSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin !== FALLBACK_SITE_URL) {
    return normalizeHttpOrigin(window.location.origin, FALLBACK_SITE_URL);
  }

  const candidate =
    import.meta.env.VITE_APP_URL?.trim() ||
    (typeof process !== 'undefined' && process.env.APP_URL?.trim()) ||
    (typeof process !== 'undefined' && process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) ||
    (typeof process !== 'undefined' && process.env.VERCEL_URL?.trim()) ||
    FALLBACK_SITE_URL;

  return normalizeHttpOrigin(candidate, FALLBACK_SITE_URL);
}

/** Resolves the public origin of the current request behind a reverse proxy. */
export function getRequestSiteUrl(request: Request): string {
  const configuredOrigin = process.env.AUTH0_PUBLIC_ORIGIN?.trim();
  if (configuredOrigin) {
    return normalizeHttpOrigin(configuredOrigin, getSiteUrl());
  }

  if (process.env.NODE_ENV === 'production') {
    return getSiteUrl();
  }

  const requestUrl = new URL(request.url);
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const protocol = forwardedProto === 'http' || forwardedProto === 'https'
    ? forwardedProto
    : requestUrl.protocol.replace(':', '');
  const host = forwardedHost || requestUrl.host;

  if ((protocol === 'http' || protocol === 'https') && host) {
    return `${protocol}://${host}`;
  }

  return getSiteUrl();
}

export function isFallbackSiteUrl(url: string): boolean {
  try {
    const parsed = new URL(ensureProtocol(url.trim()));
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return true;
  }
}

export function getRobotsBaseUrl(): string {
  const candidate = process.env.ROBOTS_BASE_URL?.trim();

  if (!candidate) {
    return getSiteUrl();
  }

  return normalizeHttpOrigin(candidate, getSiteUrl());
}

export function getRobotsSitemapUrl(): string {
  return `${getRobotsBaseUrl()}/sitemap.xml`;
}

export function getGoogleSiteVerificationToken(): string | undefined {
  const rawToken = process.env.GOOGLE_SITE_VERIFICATION?.trim();

  if (!rawToken) {
    return undefined;
  }

  const normalizedToken = rawToken
    .replace(/^google-site-verification:\s*/i, '')
    .replace(/\.html$/i, '')
    .trim();

  return normalizedToken || undefined;
}
