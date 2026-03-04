export const SITE_NAME = 'BiziDashboard';
export const SITE_TITLE = 'BiziDashboard Zaragoza';
export const SITE_DESCRIPTION =
  'Panel publico con analitica de estaciones Bizi Zaragoza: disponibilidad, alertas, patrones horarios y movilidad urbana.';

const FALLBACK_SITE_URL = 'http://localhost:3000';

export function getSiteUrl(): string {
  const candidate =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    FALLBACK_SITE_URL;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return FALLBACK_SITE_URL;
    }

    return parsed.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
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
