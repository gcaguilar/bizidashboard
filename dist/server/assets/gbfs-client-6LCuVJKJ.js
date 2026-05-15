import { t as logger } from "./logger-9X1Y5g6X.js";
import { z } from "zod";
//#region src/lib/retry.ts
/**
* Retry utility with exponential backoff and jitter
* 
* Provides resilient HTTP request handling with automatic retry
* for transient failures (network errors, 5xx, 429 rate limit).
*/
/**
* Sleep helper for delays and testing
*/
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
* Check if an error is retryable
* - Network errors (TypeError from fetch)
* - 5xx server errors
* - 429 rate limit errors
*/
function isRetryableError(error) {
	if (error instanceof TypeError) return true;
	if (error instanceof Response) {
		const status = error.status;
		return status >= 500 || status === 429;
	}
	return false;
}
/**
* Extract status code from error for logging
*/
function getErrorStatus(error) {
	if (error instanceof Response) return error.status;
	if (error instanceof Error) return error.name;
	return "unknown";
}
/**
* Execute a function with exponential backoff retry
* 
* @param fn - Function to execute (should return a Promise)
* @param options - Retry configuration
* @returns Promise resolving to function result
* @throws Last error encountered if all retries exhausted
* 
* @example
* ```typescript
* const data = await withRetry(() => fetch(url).then(r => r.json()));
* ```
*/
async function withRetry(fn, options = {}) {
	const { maxRetries = 5, baseDelay = 1e3 } = options;
	let lastError;
	for (let attempt = 0; attempt <= maxRetries; attempt++) try {
		return await fn();
	} catch (error) {
		lastError = error;
		if (attempt === maxRetries) break;
		if (!isRetryableError(error)) throw error;
		const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1e3;
		logger.warn("retry.attempt_failed", {
			attempt: attempt + 1,
			totalAttempts: maxRetries + 1,
			status: getErrorStatus(error),
			delayMs: Math.round(delay)
		});
		await sleep(delay);
	}
	throw lastError;
}
//#endregion
//#region src/schemas/gbfs.ts
/**
* Zod schemas for GBFS (General Bikeshare Feed Specification) validation
* 
* These schemas provide runtime validation for Bizi API responses
* with version-agnostic parsing using .passthrough() for forward compatibility.
*/
/**
* Schema for individual station status
* 
* GBFS v2.3 station status fields with passthrough for forward compatibility.
* All number fields are validated as integers.
*/
var StationStatusSchema = z.object({
	station_id: z.string(),
	num_bikes_available: z.number().int().min(0),
	num_docks_available: z.number().int().min(0),
	is_installed: z.boolean(),
	is_renting: z.boolean(),
	is_returning: z.boolean(),
	last_reported: z.number().int()
}).passthrough();
/**
* Schema for GBFS response wrapper
* 
* Wraps the stations array with metadata about the feed.
*/
var GBFSResponseSchema = z.object({
	last_updated: z.number().int(),
	ttl: z.number().int(),
	version: z.string(),
	data: z.object({ stations: z.array(StationStatusSchema) }).passthrough()
}).passthrough();
/**
* Schema for individual feed in discovery file
*/
var FeedSchema = z.object({
	name: z.string(),
	url: z.string().url()
}).passthrough();
var StationInformationSchema = z.object({
	station_id: z.string(),
	name: z.string(),
	lat: z.number(),
	lon: z.number(),
	capacity: z.number().int().nonnegative().optional()
}).passthrough();
z.object({
	last_updated: z.number().int(),
	ttl: z.number().int(),
	version: z.string(),
	data: z.object({ stations: z.array(StationInformationSchema) }).passthrough()
}).passthrough();
/**
* Schema for GBFS discovery file
* 
* Contains available feeds including station_status.
*/
var GBFSDiscoverySchema = z.object({
	last_updated: z.number().int(),
	ttl: z.number().int(),
	version: z.string(),
	data: z.record(z.string(), z.object({ feeds: z.array(FeedSchema) }).passthrough())
}).passthrough();
/**
* Validates station data and throws on error with detailed message
* 
* @param data - Unknown data to validate
* @returns Validated StationStatus array
* @throws Error with validation details if data is invalid
*/
function validateStationData(data) {
	const result = GBFSResponseSchema.safeParse(data);
	if (!result.success) {
		console.error("[validation] GBFS response validation failed:", result.error.issues);
		throw new Error(`GBFS validation failed: ${result.error.message}`);
	}
	return result.data.data.stations;
}
/**
* Validates discovery file and throws on error with detailed message
* 
* @param data - Unknown data to validate
* @returns Validated GBFSDiscovery object
* @throws Error with validation details if data is invalid
*/
function validateDiscovery(data) {
	const result = GBFSDiscoverySchema.safeParse(data);
	if (!result.success) {
		console.error("[validation] GBFS discovery validation failed:", result.error.issues);
		throw new Error(`GBFS discovery validation failed: ${result.error.message}`);
	}
	return result.data;
}
/**
* Extracts station_status URL from discovery feeds
* 
* @param discovery - Validated GBFSDiscovery object
* @returns URL string for station_status feed, or null if not found
* @deprecated Use extractFeedUrl(discovery, 'station_status') instead
*/
function extractStationStatusUrl(discovery) {
	return extractFeedUrl(discovery, "station_status");
}
/**
* Extracts a specific feed URL from GBFS discovery
* 
* @param discovery - Validated GBFSDiscovery object
* @param feedName - Name of the feed to extract (e.g., 'station_status', 'station_information')
* @returns URL string for the feed, or null if not found
*/
function extractFeedUrl(discovery, feedName) {
	for (const locale of [
		"es",
		"en",
		"fr"
	]) {
		const feed = (discovery.data[locale]?.feeds)?.find((item) => item.name === feedName);
		if (feed?.url) return feed.url;
	}
	return null;
}
//#endregion
//#region src/services/gbfs-client.ts
/**
* GBFS API Client Service
* 
* Handles discovery file fetching, station status retrieval,
* and response validation with automatic retry logic.
*/
/** Bizi GBFS discovery URL */
var DISCOVERY_URL = process.env.GBFS_URL ?? process.env.GBFS_DISCOVERY_URL ?? "https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json";
/** Request timeout in milliseconds */
var REQUEST_TIMEOUT = Number(process.env.GBFS_REQUEST_TIMEOUT_MS ?? 2e4) || 2e4;
/** Retry configuration */
var MAX_RETRIES = Number(process.env.GBFS_MAX_RETRIES ?? 5) || 5;
var BASE_DELAY = Number(process.env.GBFS_RETRY_BASE_DELAY_MS ?? 1e3) || 1e3;
/** User-Agent header for API requests */
var USER_AGENT = "BiziDashboard/1.0";
var PRIVATE_IP_PATTERNS = [
	/^10\./,
	/^172\.(1[6-9]|2[0-9]|3[01])\./,
	/^192\.168\./,
	/^127\./,
	/^0\./,
	/^::1/,
	/^fc/i,
	/^fd/i,
	/^169\.254\./
];
var BLOCKED_HOSTNAMES = new Set([
	"localhost",
	"0.0.0.0",
	"127.0.0.1",
	"[::1]"
]);
function isBlockedUrl(urlString) {
	try {
		const hostname = new URL(urlString).hostname;
		if (BLOCKED_HOSTNAMES.has(hostname)) return true;
		if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return PRIVATE_IP_PATTERNS.some((re) => re.test(hostname));
		return false;
	} catch {
		return true;
	}
}
/**
* Fetch with timeout wrapper
*/
async function fetchWithTimeout(url, options, timeoutMs) {
	if (isBlockedUrl(url)) throw new Error(`SSRF protection: access to ${url} is blocked`);
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	try {
		try {
			return await fetch(url, {
				...options,
				signal: controller.signal
			});
		} catch (error) {
			const cause = error;
			const details = [
				`name=${cause?.name ?? "unknown"}`,
				`message=${cause?.message ?? "unknown error"}`,
				cause?.code ? `code=${cause.code}` : null,
				cause?.errno ? `errno=${cause.errno}` : null,
				cause?.syscall ? `syscall=${cause.syscall}` : null,
				cause?.address ? `address=${cause.address}` : null,
				cause?.port ? `port=${String(cause.port)}` : null
			].filter(Boolean).join(", ");
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
async function fetchDiscovery() {
	logger.info("gbfs.discovery_fetch_started", { discoveryUrl: DISCOVERY_URL });
	const response = await withRetry(() => fetchWithTimeout(DISCOVERY_URL, { headers: {
		"User-Agent": USER_AGENT,
		Accept: "application/json"
	} }, REQUEST_TIMEOUT), {
		maxRetries: MAX_RETRIES,
		baseDelay: BASE_DELAY
	});
	if (!response.ok) throw new Error(`Failed to fetch GBFS discovery: ${response.status} ${response.statusText} (${DISCOVERY_URL})`);
	let data;
	try {
		data = await response.json();
	} catch (error) {
		throw new Error(`Failed to parse GBFS discovery JSON: ${error instanceof Error ? error.message : "Unknown error"} (${DISCOVERY_URL})`);
	}
	const discovery = validateDiscovery(data);
	const feedCount = Object.values(discovery.data).reduce((acc, locale) => {
		return acc + locale.feeds.length;
	}, 0);
	logger.info("gbfs.discovery_fetch_succeeded", {
		discoveryUrl: DISCOVERY_URL,
		gbfsVersion: discovery.version,
		feedCount
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
async function fetchStationStatus(discovery) {
	const disc = discovery ?? await fetchDiscovery();
	const stationStatusUrl = extractStationStatusUrl(disc);
	if (!stationStatusUrl) {
		const availableFeeds = Object.values(disc.data).flatMap((locale) => locale.feeds.map((feed) => feed.name)).filter((name, index, list) => list.indexOf(name) === index).join(", ");
		throw new Error("Station status feed not found in GBFS discovery. Available feeds: " + availableFeeds);
	}
	logger.info("gbfs.station_status_fetch_started", { stationStatusUrl });
	const response = await withRetry(() => fetchWithTimeout(stationStatusUrl, { headers: {
		"User-Agent": USER_AGENT,
		Accept: "application/json"
	} }, REQUEST_TIMEOUT), {
		maxRetries: MAX_RETRIES,
		baseDelay: BASE_DELAY
	});
	if (!response.ok) throw new Error(`Failed to fetch station status: ${response.status} ${response.statusText} (${stationStatusUrl})`);
	let data;
	try {
		data = await response.json();
	} catch (error) {
		throw new Error(`Failed to parse station status JSON: ${error instanceof Error ? error.message : "Unknown error"} (${stationStatusUrl})`);
	}
	const stations = validateStationData(data);
	logger.info("gbfs.station_status_fetch_succeeded", {
		stationStatusUrl,
		stationCount: stations.length
	});
	const gbfsResponse = data;
	gbfsResponse.data.stations = stations;
	return gbfsResponse;
}
async function fetchStationInformation(discovery) {
	const stationInformationUrl = extractFeedUrl(discovery ?? await fetchDiscovery(), "station_information");
	if (!stationInformationUrl) throw new Error("Station information feed not found in GBFS discovery.");
	logger.info("gbfs.station_information_fetch_started", { stationInformationUrl });
	const response = await withRetry(() => fetchWithTimeout(stationInformationUrl, { headers: {
		"User-Agent": USER_AGENT,
		Accept: "application/json"
	} }, REQUEST_TIMEOUT), {
		maxRetries: MAX_RETRIES,
		baseDelay: BASE_DELAY
	});
	if (!response.ok) throw new Error(`Failed to fetch station information: ${response.status} ${response.statusText} (${stationInformationUrl})`);
	let data;
	try {
		data = await response.json();
	} catch (error) {
		throw new Error(`Failed to parse station information JSON: ${error instanceof Error ? error.message : "Unknown error"} (${stationInformationUrl})`);
	}
	const stations = validateStationInformation(data);
	logger.info("gbfs.station_information_fetch_succeeded", {
		stationInformationUrl,
		stationCount: stations.length
	});
	return stations;
}
//#endregion
export { extractStationStatusUrl as a, isBlockedUrl as i, fetchStationInformation as n, fetchStationStatus as r, fetchDiscovery as t };

//# sourceMappingURL=gbfs-client-6LCuVJKJ.js.map