/**
 * GBFS API Client Service
 * 
 * Handles discovery file fetching, station status retrieval,
 * and response validation with automatic retry logic.
 */

import { lookup } from 'node:dns/promises';
import { withRetry, HttpError } from '@/lib/retry';
import { logger } from '@/lib/logger';
import type {
  GBFSDiscovery,
  GBFSResponse,
  StationInformation,
} from '@/schemas/gbfs';
import {
  extractFeedUrl,
  validateDiscovery,
  validateStationInformation,
  validateStationData,
  extractStationStatusUrl,
} from '@/schemas/gbfs';

/** Bizi GBFS discovery URL */
const DISCOVERY_URL =
  process.env.GBFS_URL ??
  process.env.GBFS_DISCOVERY_URL ??
  'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json';

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = Number(process.env.GBFS_REQUEST_TIMEOUT_MS ?? 20000) || 20000;

/** Retry configuration */
const MAX_RETRIES = Number(process.env.GBFS_MAX_RETRIES ?? 5) || 5;
const BASE_DELAY = Number(process.env.GBFS_RETRY_BASE_DELAY_MS ?? 1000) || 1000;

/** User-Agent header for API requests */
const USER_AGENT = 'BiziDashboard/1.0';

// ─── SSRF protection ────────────────────────────────────────────────────────

const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^::1/,
  /^fc/i,
  /^fd/i,
  /^169\.254\./,
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
]);

function stripIpv6Brackets(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;
}

function isBlockedIpLiteral(host: string): boolean {
  const ip = stripIpv6Brackets(host);

  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    return PRIVATE_IP_PATTERNS.some(re => re.test(ip));
  }

  // IPv6 literal (contiene ':' pero no es nombre DNS)
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    return (
      lower === '::1' ||
      lower === '::' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe80') ||
      lower.startsWith('::ffff:')
    );
  }

  return false;
}

export function isBlockedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return true;
    }

    const hostname = url.hostname;

    if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_HOSTNAMES.has(stripIpv6Brackets(hostname))) {
      return true;
    }

    if (isBlockedIpLiteral(hostname)) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

/**
 * Resuelve el hostname y rechaza si apunta a una IP privada, de enlace local
 * o de metadatos cloud. Si la resolucion DNS falla, se bloquea por defecto:
 * el colector solo habla con el proveedor GBFS conocido.
 */
export async function isBlockedResolvedHost(hostname: string): Promise<boolean> {
  if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_HOSTNAMES.has(stripIpv6Brackets(hostname))) {
    return true;
  }

  if (isBlockedIpLiteral(hostname)) {
    return true;
  }

  try {
    const addresses = await lookup(hostname, { all: true });
    return addresses.some(({ address }) => isBlockedIpLiteral(address));
  } catch {
    return true;
  }
}

/**
 * Fetch with timeout wrapper. Sigue redirects manualmente (maximo 5) y
 * revalida CADA destino intermedio contra la proteccion SSRF, incluyendo la
 * IP resuelta por DNS. Asi un feed o un 302 malicioso no puede dirigir el
 * fetch a un destino interno que el chequeo inicial habria bloqueado.
 */
const MAX_REDIRECTS = 5;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  if (isBlockedUrl(url)) {
    throw new Error(`SSRF protection: access to ${url} is blocked`);
  }

  let currentUrl = url;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const parsed = new URL(currentUrl);

    if (await isBlockedResolvedHost(parsed.hostname)) {
      throw new Error(`SSRF protection: resolved host of ${currentUrl} is blocked`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      try {
        response = await fetch(currentUrl, {
          ...options,
          redirect: 'manual',
          signal: controller.signal,
        });
      } catch (error) {
        const cause = error as NodeJS.ErrnoException & {
          address?: string;
          port?: number;
        };
        const details = [
          `name=${cause?.name ?? 'unknown'}`,
          `message=${cause?.message ?? 'unknown error'}`,
          cause?.code ? `code=${cause.code}` : null,
          cause?.errno ? `errno=${cause.errno}` : null,
          cause?.syscall ? `syscall=${cause.syscall}` : null,
          cause?.address ? `address=${cause.address}` : null,
          cause?.port ? `port=${String(cause.port)}` : null,
        ]
          .filter(Boolean)
          .join(', ');

        throw new Error(`Network error fetching ${currentUrl}: ${details}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      if (redirect === MAX_REDIRECTS) {
        throw new Error(`SSRF protection: too many redirects fetching ${url}`);
      }
      const nextUrl = new URL(location, currentUrl).toString();
      if (isBlockedUrl(nextUrl)) {
        throw new Error(`SSRF protection: redirect target ${nextUrl} is blocked`);
      }
      if (response.body) {
        await response.body.cancel().catch(() => undefined);
      }
      currentUrl = nextUrl;
      continue;
    }

    return response;
  }

  throw new Error(`SSRF protection: too many redirects fetching ${url}`);
}

/**
 * Fetch GBFS discovery file with retry and validation
 * 
 * @returns Validated GBFSDiscovery object
 * @throws Error if fetch or validation fails
 */
export async function fetchDiscovery(): Promise<GBFSDiscovery> {
  logger.info('gbfs.discovery_fetch_started', {
    discoveryUrl: DISCOVERY_URL,
  });
  
  const response = await withRetry(
    async () => {
      const res = await fetchWithTimeout(
        DISCOVERY_URL,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        },
        REQUEST_TIMEOUT
      );
      if (!res.ok) {
        throw new HttpError(
          `Failed to fetch GBFS discovery: ${res.status} ${res.statusText} (${DISCOVERY_URL})`,
          res.status
        );
      }
      return res;
    },
    { maxRetries: MAX_RETRIES, baseDelay: BASE_DELAY }
  );
  
  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse GBFS discovery JSON: ${error instanceof Error ? error.message : 'Unknown error'} (${DISCOVERY_URL})`
    );
  }
  
  const discovery = validateDiscovery(data);
  const feedCount = Object.values(discovery.data).reduce((acc, locale) => {
    return acc + locale.feeds.length;
  }, 0);
  logger.info('gbfs.discovery_fetch_succeeded', {
    discoveryUrl: DISCOVERY_URL,
    gbfsVersion: discovery.version,
    feedCount,
  });
  
  return discovery;
}

/**
 * Fetch station status with retry and validation
 * 
 * @param discovery - Optional pre-fetched discovery object (will fetch if not provided)
 * @returns Validated GBFSResponse with station status array
 * @throws Error if station_status feed not found, fetch fails, or validation fails
 */
export async function fetchStationStatus(
  discovery?: GBFSDiscovery
): Promise<GBFSResponse> {
  // Get discovery if not provided
  const disc = discovery ?? (await fetchDiscovery());
  
  // Extract station_status URL
  const stationStatusUrl = extractStationStatusUrl(disc);
  if (!stationStatusUrl) {
    const availableFeeds = Object.values(disc.data)
      .flatMap((locale) => locale.feeds.map((feed) => feed.name))
      .filter((name, index, list) => list.indexOf(name) === index)
      .join(', ');
    throw new Error(
      'Station status feed not found in GBFS discovery. Available feeds: ' +
        availableFeeds
    );
  }
  
  logger.info('gbfs.station_status_fetch_started', {
    stationStatusUrl,
  });
  
  const response = await withRetry(
    async () => {
      const res = await fetchWithTimeout(
        stationStatusUrl,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        },
        REQUEST_TIMEOUT
      );
      if (!res.ok) {
        throw new HttpError(
          `Failed to fetch station status: ${res.status} ${res.statusText} (${stationStatusUrl})`,
          res.status
        );
      }
      return res;
    },
    { maxRetries: MAX_RETRIES, baseDelay: BASE_DELAY }
  );
  
  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse station status JSON: ${error instanceof Error ? error.message : 'Unknown error'} (${stationStatusUrl})`
    );
  }
  
  const stations = validateStationData(data);
  logger.info('gbfs.station_status_fetch_succeeded', {
    stationStatusUrl,
    stationCount: stations.length,
  });

  const gbfsResponse = data as GBFSResponse;
  gbfsResponse.data.stations = stations;
  return gbfsResponse;
}

export async function fetchStationInformation(
  discovery?: GBFSDiscovery
): Promise<StationInformation[]> {
  const disc = discovery ?? (await fetchDiscovery());
  const stationInformationUrl = extractFeedUrl(disc, 'station_information');

  if (!stationInformationUrl) {
    throw new Error('Station information feed not found in GBFS discovery.');
  }

  logger.info('gbfs.station_information_fetch_started', {
    stationInformationUrl,
  });

  const response = await withRetry(
    async () => {
      const res = await fetchWithTimeout(
        stationInformationUrl,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        },
        REQUEST_TIMEOUT
      );
      if (!res.ok) {
        throw new HttpError(
          `Failed to fetch station information: ${res.status} ${res.statusText} (${stationInformationUrl})`,
          res.status
        );
      }
      return res;
    },
    { maxRetries: MAX_RETRIES, baseDelay: BASE_DELAY }
  );

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse station information JSON: ${error instanceof Error ? error.message : 'Unknown error'} (${stationInformationUrl})`
    );
  }

  const stations = validateStationInformation(data);
  logger.info('gbfs.station_information_fetch_succeeded', {
    stationInformationUrl,
    stationCount: stations.length,
  });
  return stations;
}

// Re-export helper for convenience
export { extractStationStatusUrl } from '@/schemas/gbfs';
