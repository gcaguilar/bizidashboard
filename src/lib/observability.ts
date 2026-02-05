/**
 * Five Pillars of Data Observability Implementation
 * 
 * 1. Freshness: Data is recent (last_updated within threshold)
 * 2. Volume: Expected number of records (station count within range)
 * 3. Schema: Structure matches expected (validated externally, checked here)
 * 4. Distribution: Values are in expected ranges (bikes >= 0, docks >= 0)
 * 5. Lineage: Source is traceable (GBFS version logged)
 */

import { prisma } from '@/lib/db'

/**
 * Quality thresholds from RESEARCH.md
 */
export const QUALITY_THRESHOLDS = {
  freshness: {
    maxAgeSeconds: 300 // 5 minutes per GBFS spec
  },
  volume: {
    minStations: 200,
    maxStations: 500,
    expectedStations: 276 // Bizi has ~276 stations
  },
  distribution: {
    minBikes: 0,
    minDocks: 0
  },
  lineage: {
    minVersion: '2.0'
  }
} as const

/**
 * Individual pillar check result
 */
export type PillarCheck = {
  name: string
  passed: boolean
  message: string
  details?: Record<string, unknown>
}

/**
 * Complete data observability metrics
 */
export type DataObservabilityMetrics = {
  // Metadata
  timestamp: Date
  collectionId: string
  
  // Five Pillars
  freshness: {
    lastUpdated: Date
    ageSeconds: number
    maxAgeSeconds: number
    isFresh: boolean
  }
  volume: {
    stationCount: number
    previousCount: number | null
    expectedRange: { min: number; max: number }
    isValid: boolean
  }
  schema: {
    isValid: boolean
    errors: string[]
  }
  distribution: {
    negativeBikesCount: number
    negativeDocksCount: number
    zeroCapacityCount: number
    isValid: boolean
  }
  lineage: {
    gbfsVersion: string
    sourceUrl: string
    isValid: boolean
  }
  
  // Overall
  allChecksPassed: boolean
  warnings: string[]
  errors: string[]
}

/**
 * Input data for quality validation
 */
export type ValidationInput = {
  // Raw GBFS data
  lastUpdated: number // Unix timestamp
  stations: Array<{
    station_id: string
    num_bikes_available: number
    num_docks_available: number
  }>
  
  // GBFS metadata
  gbfsVersion: string
  sourceUrl: string
  
  // Collection tracking
  collectionId: string
}

/**
 * Check if data is fresh (Pillar 1)
 * Data should be recent (last_updated within 5 minutes)
 */
function checkFreshness(
  lastUpdated: number,
  maxAgeSeconds: number = QUALITY_THRESHOLDS.freshness.maxAgeSeconds
): DataObservabilityMetrics['freshness'] {
  const lastUpdatedDate = new Date(lastUpdated * 1000)
  const now = new Date()
  const ageSeconds = Math.floor((now.getTime() - lastUpdatedDate.getTime()) / 1000)
  
  return {
    lastUpdated: lastUpdatedDate,
    ageSeconds,
    maxAgeSeconds,
    isFresh: ageSeconds <= maxAgeSeconds
  }
}

/**
 * Check volume is within expected range (Pillar 2)
 * Bizi has ~276 stations, we expect 200-500
 */
async function checkVolume(
  stationCount: number
): Promise<DataObservabilityMetrics['volume']> {
  // Get previous count for comparison
  const previousCount = await getPreviousStationCount()
  
  return {
    stationCount,
    previousCount,
    expectedRange: {
      min: QUALITY_THRESHOLDS.volume.minStations,
      max: QUALITY_THRESHOLDS.volume.maxStations
    },
    isValid: stationCount >= QUALITY_THRESHOLDS.volume.minStations && 
             stationCount <= QUALITY_THRESHOLDS.volume.maxStations
  }
}

/**
 * Get the count of stations from the previous collection
 * For anomaly detection (sudden drops/spikes)
 */
async function getPreviousStationCount(): Promise<number | null> {
  try {
    // Get the second most recent distinct recordedAt timestamp
    const recentTimestamps = await prisma.stationStatus.groupBy({
      by: ['recordedAt'],
      orderBy: {
        recordedAt: 'desc'
      },
      take: 2
    })

    if (recentTimestamps.length < 2) {
      return null // No previous collection
    }

    const previousTimestamp = recentTimestamps[1].recordedAt

    const count = await prisma.stationStatus.count({
      where: {
        recordedAt: previousTimestamp
      }
    })

    return count
  } catch {
    return null
  }
}

/**
 * Check schema validity (Pillar 3)
 * Schema is validated externally by Zod, we check the result
 */
function checkSchema(
  schemaErrors: string[] = []
): DataObservabilityMetrics['schema'] {
  return {
    isValid: schemaErrors.length === 0,
    errors: schemaErrors
  }
}

/**
 * Check value distribution (Pillar 4)
 * Values should be in expected ranges (bikes >= 0, docks >= 0)
 */
function checkDistribution(
  stations: ValidationInput['stations']
): DataObservabilityMetrics['distribution'] {
  let negativeBikesCount = 0
  let negativeDocksCount = 0
  let zeroCapacityCount = 0

  for (const station of stations) {
    if (station.num_bikes_available < 0) {
      negativeBikesCount++
    }
    if (station.num_docks_available < 0) {
      negativeDocksCount++
    }
    // Check for stations with 0 total capacity (bikes + docks = 0)
    if (station.num_bikes_available + station.num_docks_available === 0) {
      zeroCapacityCount++
    }
  }

  return {
    negativeBikesCount,
    negativeDocksCount,
    zeroCapacityCount,
    isValid: negativeBikesCount === 0 && negativeDocksCount === 0
  }
}

/**
 * Check lineage (Pillar 5)
 * Source should be traceable with valid GBFS version
 */
function checkLineage(
  gbfsVersion: string,
  sourceUrl: string
): DataObservabilityMetrics['lineage'] {
  // Check GBFS version starts with "2." (version 2.x)
  const isValid = gbfsVersion.startsWith('2.')

  return {
    gbfsVersion,
    sourceUrl,
    isValid
  }
}

/**
 * Main validation function - checks all Five Pillars
 * 
 * @param input Validation input data
 * @param schemaErrors Any schema validation errors from Zod (empty array if valid)
 * @returns Complete observability metrics
 */
export async function validateDataQuality(
  input: ValidationInput,
  schemaErrors: string[] = []
): Promise<DataObservabilityMetrics> {
  const timestamp = new Date()
  const warnings: string[] = []
  const errors: string[] = []

  // Check each pillar
  const freshness = checkFreshness(input.lastUpdated)
  const volume = await checkVolume(input.stations.length)
  const schema = checkSchema(schemaErrors)
  const distribution = checkDistribution(input.stations)
  const lineage = checkLineage(input.gbfsVersion, input.sourceUrl)

  // Collect warnings and errors
  if (!freshness.isFresh) {
    const message = `Data is stale: ${freshness.ageSeconds}s old (max: ${freshness.maxAgeSeconds}s)`
    if (freshness.ageSeconds > freshness.maxAgeSeconds * 2) {
      errors.push(message)
    } else {
      warnings.push(message)
    }
  }

  if (!volume.isValid) {
    const message = `Volume anomaly: ${volume.stationCount} stations (expected ${volume.expectedRange.min}-${volume.expectedRange.max})`
    errors.push(message)
  } else if (volume.previousCount !== null) {
    // Check for significant change from previous
    const changePercent = Math.abs(volume.stationCount - volume.previousCount) / volume.previousCount * 100
    if (changePercent > 20) {
      warnings.push(`Volume changed ${changePercent.toFixed(1)}% from previous collection (${volume.previousCount} → ${volume.stationCount})`)
    }
  }

  if (!schema.isValid) {
    errors.push(`Schema validation failed: ${schema.errors.join(', ')}`)
  }

  if (!distribution.isValid) {
    if (distribution.negativeBikesCount > 0) {
      errors.push(`${distribution.negativeBikesCount} stations have negative bike counts`)
    }
    if (distribution.negativeDocksCount > 0) {
      errors.push(`${distribution.negativeDocksCount} stations have negative dock counts`)
    }
  }

  if (distribution.zeroCapacityCount > 0) {
    warnings.push(`${distribution.zeroCapacityCount} stations report zero capacity`)
  }

  if (!lineage.isValid) {
    errors.push(`Invalid GBFS version: ${lineage.gbfsVersion} (expected 2.x)`)
  }

  const allChecksPassed = 
    freshness.isFresh && 
    volume.isValid && 
    schema.isValid && 
    distribution.isValid && 
    lineage.isValid &&
    errors.length === 0

  return {
    timestamp,
    collectionId: input.collectionId,
    freshness,
    volume,
    schema,
    distribution,
    lineage,
    allChecksPassed,
    warnings,
    errors
  }
}

/**
 * Log observability metrics for monitoring
 * 
 * @param metrics Observability metrics to log
 */
export function logObservabilityMetrics(metrics: DataObservabilityMetrics): void {
  const logData = {
    timestamp: metrics.timestamp.toISOString(),
    collectionId: metrics.collectionId,
    allChecksPassed: metrics.allChecksPassed,
    freshness: {
      isFresh: metrics.freshness.isFresh,
      ageSeconds: metrics.freshness.ageSeconds
    },
    volume: {
      isValid: metrics.volume.isValid,
      stationCount: metrics.volume.stationCount
    },
    schema: {
      isValid: metrics.schema.isValid,
      errorCount: metrics.schema.errors.length
    },
    distribution: {
      isValid: metrics.distribution.isValid,
      negativeBikes: metrics.distribution.negativeBikesCount,
      negativeDocks: metrics.distribution.negativeDocksCount
    },
    lineage: {
      isValid: metrics.lineage.isValid,
      version: metrics.lineage.gbfsVersion
    },
    warnings: metrics.warnings,
    errors: metrics.errors
  }

  if (metrics.allChecksPassed) {
    console.log('[Observability] Data quality checks passed:', JSON.stringify(logData))
  } else {
    console.warn('[Observability] Data quality issues detected:', JSON.stringify(logData))
  }
}

/**
 * Check if data should be stored based on quality metrics
 * Data with critical errors should still be stored for debugging,
 * but flagged appropriately
 * 
 * @param metrics Observability metrics
 * @returns Whether storage should proceed
 */
export function shouldStoreData(metrics: DataObservabilityMetrics): boolean {
  // Always store data - we want to see even bad data for debugging
  // But log appropriately
  if (!metrics.allChecksPassed) {
    console.warn(`[Observability] Storing data with ${metrics.errors.length} errors and ${metrics.warnings.length} warnings`)
  }
  return true
}
