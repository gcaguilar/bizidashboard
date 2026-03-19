import { prisma } from '@/lib/db'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'

/**
 * Station status data from GBFS API (before database storage)
 */
export type GBFSStationStatus = {
  station_id: string
  num_bikes_available: number
  num_docks_available: number
  recorded_at: number // Snapshot timestamp from GBFS response last_updated
}

export type GBFSStationInformation = {
  station_id: string
  name: string
  lat: number
  lon: number
  capacity?: number
}

/**
 * Result of storing station statuses
 */
export type StorageResult = {
  success: boolean
  count: number
  errors: Array<{
    stationId: string
    error: string
  }>
}

/**
 * Storage metrics for observability
 */
export type StorageMetrics = {
  insertedCount: number
  duplicateCount: number
  errorCount: number
  durationMs: number
}

/**
 * Store multiple station statuses in a transaction
 * Handles duplicates by catching unique constraint errors
 * 
 * @param statuses Array of GBFS station statuses
 * @returns Storage result with success status and count
 */
export async function storeStationStatuses(
  statuses: GBFSStationStatus[]
): Promise<StorageResult & { duplicateCount: number }> {
  const result: StorageResult & { duplicateCount: number } = {
    success: true,
    count: 0,
    duplicateCount: 0,
    errors: []
  }

  try {
    const data = statuses.map(status => ({
      stationId: status.station_id,
      bikesAvailable: status.num_bikes_available,
      anchorsFree: status.num_docks_available,
      recordedAt: new Date(status.recorded_at * 1000)
    }))

    const { count } = await prisma.stationStatus.createMany({
      data,
      skipDuplicates: true,
    })

    result.count = count
    result.duplicateCount = data.length - count

  } catch (error) {
    result.success = false
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Log each status that failed (only if it's a batch-level error)
    if (result.errors.length === 0) {
      statuses.forEach(status => {
        result.errors.push({
          stationId: status.station_id,
          error: errorMessage
        })
      })
    }

    captureExceptionWithContext(error, {
      area: 'services.data-storage',
      operation: 'storeStationStatuses',
      extra: {
        statusCount: statuses.length,
      },
    })
    console.error('[Storage] Failed to store station statuses:', error)
  }

  return result
}

import { Prisma } from '@prisma/client'

export async function upsertStations(
  stations: GBFSStationInformation[]
): Promise<{ createdOrUpdated: number }> {
  if (stations.length === 0) return { createdOrUpdated: 0 };

  const values = stations.map(station => 
    Prisma.sql`(${station.station_id}, ${station.name}, ${station.lat}, ${station.lon}, ${station.capacity ?? 0}, true, NOW(), NOW())`
  );

  await prisma.$executeRaw`
    INSERT INTO "Station" (id, name, lat, lon, capacity, "isActive", "createdAt", "updatedAt")
    VALUES ${Prisma.join(values)}
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      capacity = EXCLUDED.capacity,
      "isActive" = EXCLUDED."isActive",
      "updatedAt" = NOW();
  `;

  return { createdOrUpdated: stations.length };
}

export async function getStationMetadataCount(): Promise<number> {
  return prisma.station.count()
}

/**
 * Get the total count of station status records
 * Used for volume anomaly detection
 * 
 * @returns Total count of records
 */
export async function getStationCount(): Promise<number> {
  return prisma.stationStatus.count()
}

/**
 * Get the timestamp of the most recent collection
 * Used for freshness checks
 * 
 * @returns Date of most recent recordedAt, or null if no data
 */
export async function getLastCollectionTime(): Promise<Date | null> {
  const latest = await prisma.stationStatus.findFirst({
    orderBy: {
      recordedAt: 'desc'
    },
    select: {
      recordedAt: true
    }
  })

  return latest?.recordedAt ?? null
}

/**
 * Get station count within a time range
 * Useful for debugging volume issues
 * 
 * @param start Start of time range (inclusive)
 * @param end End of time range (inclusive)
 * @returns Count of records in range
 */
export async function getStationCountInRange(
  start: Date,
  end: Date
): Promise<number> {
  return prisma.stationStatus.count({
    where: {
      recordedAt: {
        gte: start,
        lte: end
      }
    }
  })
}

/**
 * Get the count of unique stations with recent data
 * Used to verify coverage across all stations
 * 
 * @param since Only count records after this time
 * @returns Number of unique station IDs
 */
export async function getActiveStationCount(since: Date): Promise<number> {
  const result = await prisma.stationStatus.groupBy({
    by: ['stationId'],
    where: {
      recordedAt: {
        gte: since
      }
    },
    _count: {
      stationId: true
    }
  })

  return result.length
}
