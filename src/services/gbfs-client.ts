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
  validateDiscovery,
  validateStationData,
  extractStationStatusUrl,
} from '@/schemas/gbfs';

/** Bizi GBFS discovery URL */
const DISCOVERY_URL = 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json';

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 10000;

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
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
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
    { maxRetries: 5, baseDelay: 1000 }
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
  console.log(
    `[gbfs] Discovery fetched successfully (version: ${discovery.version}, feeds: ${discovery.data.en.feeds.length})`
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
    throw new Error(
      'Station status feed not found in GBFS discovery. Available feeds: ' +
        disc.data.en.feeds.map(f => f.name).join(', ')
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
    { maxRetries: 5, baseDelay: 1000 }
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

// Re-export helper for convenience
export { extractStationStatusUrl } from '@/schemas/gbfs';
