/**
 * Zod schemas for GBFS (General Bikeshare Feed Specification) validation
 * 
 * These schemas provide runtime validation for Bizi API responses
 * with version-agnostic parsing using .passthrough() for forward compatibility.
 */

import { z } from 'zod';

/**
 * Schema for individual station status
 * 
 * GBFS v2.3 station status fields with passthrough for forward compatibility.
 * All number fields are validated as integers.
 */
export const StationStatusSchema = z.object({
  station_id: z.string(),
  num_bikes_available: z.number().int().min(0),
  num_docks_available: z.number().int().min(0),
  is_installed: z.boolean(),
  is_renting: z.boolean(),
  is_returning: z.boolean(),
  last_reported: z.number().int(),
}).passthrough();

/**
 * Schema for GBFS response wrapper
 * 
 * Wraps the stations array with metadata about the feed.
 */
export const GBFSResponseSchema = z.object({
  last_updated: z.number().int(),
  ttl: z.number().int(),
  version: z.string(),
  data: z.object({
    stations: z.array(StationStatusSchema),
  }).passthrough(),
}).passthrough();

/**
 * Schema for individual feed in discovery file
 */
const FeedSchema = z.object({
  name: z.string(),
  url: z.string().url(),
}).passthrough();

const StationInformationSchema = z.object({
  station_id: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  capacity: z.number().int().nonnegative().optional(),
}).passthrough();

const GBFSStationInformationResponseSchema = z.object({
  last_updated: z.number().int(),
  ttl: z.number().int(),
  version: z.string(),
  data: z.object({
    stations: z.array(StationInformationSchema),
  }).passthrough(),
}).passthrough();

/**
 * Schema for GBFS discovery file
 * 
 * Contains available feeds including station_status.
 */
export const GBFSDiscoverySchema = z.object({
  last_updated: z.number().int(),
  ttl: z.number().int(),
  version: z.string(),
  data: z.record(
    z.string(),
    z.object({
      feeds: z.array(FeedSchema),
    }).passthrough()
  ),
}).passthrough();

/**
 * TypeScript types inferred from schemas
 */
export type StationStatus = z.infer<typeof StationStatusSchema>;
export type GBFSResponse = z.infer<typeof GBFSResponseSchema>;
export type GBFSDiscovery = z.infer<typeof GBFSDiscoverySchema>;
export type StationInformation = z.infer<typeof StationInformationSchema>;

/**
 * Validates station data and throws on error with detailed message
 * 
 * @param data - Unknown data to validate
 * @returns Validated StationStatus array
 * @throws Error with validation details if data is invalid
 */
export function validateStationData(data: unknown): StationStatus[] {
  const result = GBFSResponseSchema.safeParse(data);
  
  if (!result.success) {
    console.error('[validation] GBFS response validation failed:', result.error.issues);
    throw new Error(
      `GBFS validation failed: ${result.error.message}`
    );
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
export function validateDiscovery(data: unknown): GBFSDiscovery {
  const result = GBFSDiscoverySchema.safeParse(data);
  
  if (!result.success) {
    console.error('[validation] GBFS discovery validation failed:', result.error.issues);
    throw new Error(
      `GBFS discovery validation failed: ${result.error.message}`
    );
  }
  
  return result.data;
}

export function validateStationInformation(data: unknown): StationInformation[] {
  const result = GBFSStationInformationResponseSchema.safeParse(data);

  if (!result.success) {
    console.error(
      '[validation] GBFS station_information validation failed:',
      result.error.issues
    );
    throw new Error(`GBFS station_information validation failed: ${result.error.message}`);
  }

  return result.data.data.stations;
}

/**
 * Extracts station_status URL from discovery feeds
 * 
 * @param discovery - Validated GBFSDiscovery object
 * @returns URL string for station_status feed, or null if not found
 */
export function extractStationStatusUrl(discovery: GBFSDiscovery): string | null {
  const primaryFeeds =
    discovery.data.es?.feeds ?? discovery.data.en?.feeds ?? discovery.data.fr?.feeds ?? [];
  const feed = primaryFeeds.find((f) => f.name === 'station_status');
  return feed?.url ?? null;
}

export function extractFeedUrl(discovery: GBFSDiscovery, feedName: string): string | null {
  const locales = ['es', 'en', 'fr'] as const;

  for (const locale of locales) {
    const feeds = discovery.data[locale]?.feeds;
    const feed = feeds?.find((item) => item.name === feedName);
    if (feed?.url) {
      return feed.url;
    }
  }

  return null;
}
