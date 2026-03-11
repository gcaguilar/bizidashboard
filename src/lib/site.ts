export const SITE_NAME = 'BiziDashboard';
export const SITE_TITLE = 'BiziDashboard Zaragoza';
export const SITE_DESCRIPTION =
  'Panel publico con analitica de estaciones Bizi Zaragoza: disponibilidad, alertas, patrones horarios y movilidad urbana.';

const FALLBACK_SITE_URL = 'http://localhost:3000';

function normalizeHttpOrigin(candidate: string, fallback: string): string {
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fallback;
    }

    return parsed.origin;
  } catch {
    return fallback;
  }
}

export function getSiteUrl(): string {
  const candidate =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    FALLBACK_SITE_URL;

  return normalizeHttpOrigin(candidate, FALLBACK_SITE_URL);
}

export function isFallbackSiteUrl(url: string): boolean {
  return normalizeHttpOrigin(url, FALLBACK_SITE_URL) === FALLBACK_SITE_URL;
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
