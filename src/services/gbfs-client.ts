/**
 * GBFS API Client Service
 * 
 * Handles discovery file fetching, station status retrieval,
 * and response validation with automatic retry logic.
 */

import { withRetry } from '@/lib/retry';
import {
  GBFSDiscovery,
  GBFSResponse,
  StationInformation,
  extractFeedUrl,
  validateDiscovery,
  validateStationData,
  validateStationInformation,
  extractStationStatusUrl,
} from '@/schemas/gbfs';

/** Bizi GBFS discovery URL */
const DISCOVERY_URL =
  process.env.GBFS_DISCOVERY_URL ??
  'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json';

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = Number(process.env.GBFS_REQUEST_TIMEOUT_MS ?? 20000);

/** Retry configuration */
const MAX_RETRIES = Number(process.env.GBFS_MAX_RETRIES ?? 5);
const BASE_DELAY = Number(process.env.GBFS_RETRY_BASE_DELAY_MS ?? 1000);

/** User-Agent header for API requests */
const USER_AGENT = 'BiziDashboard/1.0';

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
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

      throw new Error(`Network error fetching ${url}: ${details}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch GBFS discovery file with retry and validation
 * 
 * @returns Validated GBFSDiscovery object
 * @throws Error if fetch or validation fails
 */
export async function fetchDiscovery(): Promise<GBFSDiscovery> {
  console.log('[gbfs] Fetching discovery file...');
  
  const response = await withRetry(
    () =>
      fetchWithTimeout(
        DISCOVERY_URL,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        },
        REQUEST_TIMEOUT
      ),
    { maxRetries: MAX_RETRIES, baseDelay: BASE_DELAY }
  );
  
  if (!response.ok) {
    throw new Error(
      `Failed to fetch GBFS discovery: ${response.status} ${response.statusText} (${DISCOVERY_URL})`
    );
  }
  
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
  console.log(
    `[gbfs] Discovery fetched successfully (version: ${discovery.version}, feeds: ${feedCount})`
  );
  
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
  
  console.log(`[gbfs] Fetching station status from: ${stationStatusUrl}`);
  
  const response = await withRetry(
    () =>
      fetchWithTimeout(
        stationStatusUrl,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        },
        REQUEST_TIMEOUT
      ),
    { maxRetries: MAX_RETRIES, baseDelay: BASE_DELAY }
  );
  
  if (!response.ok) {
    throw new Error(
      `Failed to fetch station status: ${response.status} ${response.statusText} (${stationStatusUrl})`
    );
  }
  
  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse station status JSON: ${error instanceof Error ? error.message : 'Unknown error'} (${stationStatusUrl})`
    );
  }
  
  const stations = validateStationData(data);
  console.log(`[gbfs] Station status fetched successfully (${stations.length} stations)`);
  
  // Return full response structure
  return data as GBFSResponse;
}

export async function fetchStationInformation(
  discovery?: GBFSDiscovery
): Promise<StationInformation[]> {
  const disc = discovery ?? (await fetchDiscovery());
  const stationInformationUrl = extractFeedUrl(disc, 'station_information');

  if (!stationInformationUrl) {
    throw new Error('Station information feed not found in GBFS discovery.');
  }

  console.log(`[gbfs] Fetching station information from: ${stationInformationUrl}`);

  const response = await withRetry(
    () =>
      fetchWithTimeout(
        stationInformationUrl,
        {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        },
        REQUEST_TIMEOUT
      ),
    { maxRetries: MAX_RETRIES, baseDelay: BASE_DELAY }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch station information: ${response.status} ${response.statusText} (${stationInformationUrl})`
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse station information JSON: ${error instanceof Error ? error.message : 'Unknown error'} (${stationInformationUrl})`
    );
  }

  const stations = validateStationInformation(data);
  console.log(`[gbfs] Station information fetched successfully (${stations.length} stations)`);
  return stations;
}

// Re-export helper for convenience
export { extractStationStatusUrl } from '@/schemas/gbfs';
