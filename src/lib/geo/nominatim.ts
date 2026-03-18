import { getCachedJson, setCachedJson } from '@/lib/cache/cache';
import { getSiteUrl, isFallbackSiteUrl, SITE_NAME } from '@/lib/site';

const PUBLIC_NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const NOMINATIM_BASE_URL = normalizeBaseUrl(
  process.env.NOMINATIM_BASE_URL,
  PUBLIC_NOMINATIM_BASE_URL
);
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const NOMINATIM_MIN_INTERVAL_MS = Math.max(
  parseInteger(
    process.env.NOMINATIM_MIN_INTERVAL_MS,
    NOMINATIM_BASE_URL === PUBLIC_NOMINATIM_BASE_URL ? 1000 : 0
  ),
  0
);

let nextNominatimRequestAt = 0;
let nominatimQueue: Promise<void> = Promise.resolve();
let hasWarnedWeakIdentity = false;

export type GeoSearchResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: 'address' | 'place' | 'station';
};

export type GeoReverseResult = {
  address: string;
  city: string;
  district?: string;
  lat: number;
  lon: number;
};

function normalizeBaseUrl(rawValue: string | undefined, fallback: string): string {
  const value = rawValue?.trim();
  if (!value) {
    return fallback;
  }

  return value.replace(/\/+$/, '') || fallback;
}

function parseInteger(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function withNominatimRateLimit<T>(task: () => Promise<T>): Promise<T> {
  const queuedTask = nominatimQueue.catch(() => undefined).then(async () => {
    const waitMs = Math.max(0, nextNominatimRequestAt - Date.now());
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    nextNominatimRequestAt = Date.now() + NOMINATIM_MIN_INTERVAL_MS;
    return task();
  });

  nominatimQueue = queuedTask.then(
    () => undefined,
    () => undefined
  );

  return queuedTask;
}

function getNominatimContactEmail(): string | undefined {
  const value = process.env.NOMINATIM_CONTACT_EMAIL?.trim();
  return value || undefined;
}

function getNominatimReferer(): string | undefined {
  const siteUrl = getSiteUrl();
  return isFallbackSiteUrl(siteUrl) ? undefined : siteUrl;
}

function getNominatimUserAgent(): string {
  const configuredUserAgent = process.env.NOMINATIM_USER_AGENT?.trim();
  if (configuredUserAgent) {
    return configuredUserAgent;
  }

  const referer = getNominatimReferer();
  const contactEmail = getNominatimContactEmail();
  const identityParts = [referer, contactEmail].filter(Boolean);

  if (identityParts.length > 0) {
    return `${SITE_NAME}/1.0 (${identityParts.join("; ")})`;
  }

  return `${SITE_NAME}/1.0`;
}

function warnIfPublicNominatimIdentityLooksWeak(): void {
  if (hasWarnedWeakIdentity || NOMINATIM_BASE_URL !== PUBLIC_NOMINATIM_BASE_URL) {
    return;
  }

  if (getNominatimReferer() || getNominatimContactEmail() || process.env.NOMINATIM_USER_AGENT?.trim()) {
    return;
  }

  hasWarnedWeakIdentity = true;
  console.warn(
    '[Nominatim] Public API configured without APP_URL/NEXT_PUBLIC_APP_URL, NOMINATIM_CONTACT_EMAIL or NOMINATIM_USER_AGENT. This may trigger 403 blocks.'
  );
}

function applyCommonParams(url: URL, locale: string): void {
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('accept-language', locale);
  url.searchParams.set('addressdetails', '1');

  const contactEmail = getNominatimContactEmail();
  if (contactEmail) {
    url.searchParams.set('email', contactEmail);
  }
}

function buildHeaders(locale: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': locale,
    'User-Agent': getNominatimUserAgent(),
  };

  const referer = getNominatimReferer();
  if (referer) {
    headers.Referer = referer;
  }

  return headers;
}

async function fetchNominatim(url: URL, locale: string): Promise<Response> {
  warnIfPublicNominatimIdentityLooksWeak();

  return withNominatimRateLimit(async () => {
    const response = await fetch(url.toString(), {
      headers: buildHeaders(locale),
    });

    if (!response.ok) {
      const responseText = (await response.text()).trim();
      const policyHint =
        response.status === 403
          ? ' Possible causes: invalid or generic User-Agent/Referer, more than 1 req/s, or autocomplete/bulk usage forbidden by the public Nominatim policy.'
          : '';
      const detail = responseText ? ` Response: ${responseText.slice(0, 200)}` : '';

      throw new Error(`Nominatim API error: ${response.status}.${policyHint}${detail}`);
    }

    return response;
  });
}

export async function searchLocations(
  query: string,
  limit = 10,
  locale = 'es'
): Promise<GeoSearchResult[]> {
  const cacheKey = `geo:search:${query}:${limit}:${locale}`;
  
  const cached = await getCachedJson<GeoSearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL(`${NOMINATIM_BASE_URL}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));
  applyCommonParams(url, locale);

  const response = await fetchNominatim(url, locale);

  const data = (await response.json()) as Array<{
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      neighbourhood?: string;
      suburb?: string;
    };
  }>;

  const results: GeoSearchResult[] = data.map((item) => ({
    id: String(item.place_id),
    name: item.display_name.split(',')[0] || item.display_name,
    address: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    type: item.type === 'house' || item.type === 'building' ? 'address' : 'place',
  }));

  await setCachedJson(cacheKey, results, CACHE_TTL_SECONDS);

  return results;
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  locale = 'es'
): Promise<GeoReverseResult> {
  const cacheKey = `geo:reverse:${lat.toFixed(4)}:${lon.toFixed(4)}:${locale}`;
  
  const cached = await getCachedJson<GeoReverseResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  applyCommonParams(url, locale);

  const response = await fetchNominatim(url, locale);

  const data = (await response.json()) as {
    display_name: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      neighbourhood?: string;
      suburb?: string;
    };
  };

  const city = data.address?.city || data.address?.town || data.address?.village || '';
  const district = data.address?.neighbourhood || data.address?.suburb;

  const result: GeoReverseResult = {
    address: data.display_name,
    city,
    district,
    lat,
    lon,
  };

  await setCachedJson(cacheKey, result, CACHE_TTL_SECONDS);

  return result;
}
