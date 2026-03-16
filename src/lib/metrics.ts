/**
 * Persistent Metrics Store
 * 
 * Tracks pipeline metrics using database aggregation queries.
 * Metrics persist across restarts and provide observability into:
 * - Last successful poll timestamp
 * - Total rows collected
 * - Validation errors
 * - Data freshness
 * 
 * @module metrics
 */

import { prisma } from '@/lib/db'

// In-memory cache for metrics that change frequently
// This reduces database load for high-frequency operations
const metricsCache = {
  consecutiveFailures: 0,
  lastValidationErrors: 0,
  appStartTime: new Date(),
  lastCollectionResult: null as {
    success: boolean
    stationsCollected: number
    timestamp: Date
  } | null
}

const METRICS_CACHE_TTL_MS = 30_000

let metricsSnapshotCache: {
  value: PipelineMetrics
  expiresAt: number
} | null = null

function clearMetricsSnapshotCache(): void {
  metricsSnapshotCache = null
}

/**
 * Pipeline health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'down'

/**
 * Pipeline metrics for observability dashboard
 */
export type PipelineMetrics = {
  // Pipeline status
  lastSuccessfulPoll: Date | null
  totalRowsCollected: number
  pollsLast24Hours: number
  validationErrors: number
  consecutiveFailures: number
  
  // Data quality metrics
  lastDataFreshness: boolean
  lastStationCount: number
  averageStationsPerPoll: number
  
  // Health status
  healthStatus: HealthStatus
  healthReason: string | null
}

/**
 * System metrics
 */
export type SystemMetrics = {
  uptime: Date
  version: string
  environment: string
}

/**
 * Complete status response
 */
export type StatusResponse = {
  pipeline: PipelineMetrics
  quality: {
    freshness: {
      isFresh: boolean
      lastUpdated: Date | null
      maxAgeSeconds: number
    }
    volume: {
      recentStationCount: number
      averageStationsPerPoll: number
      expectedRange: { min: number; max: number }
    }
    lastCheck: Date | null
  }
  system: SystemMetrics
  timestamp: Date
}

/**
 * Get the total count of rows in StationStatus table
 */
async function getTotalRowsCollected(): Promise<number> {
  try {
    const count = await prisma.stationStatus.count()
    return count
  } catch (error) {
    console.error('[Metrics] Error counting total rows:', error)
    return 0
  }
}

/**
 * Get the count of polls in the last 24 hours
 * A "poll" is a distinct recordedAt timestamp
 */
async function getPollsLast24Hours(): Promise<number> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const result = await prisma.stationStatus.groupBy({
      by: ['recordedAt'],
      where: {
        recordedAt: {
          gte: twentyFourHoursAgo
        }
      }
    })
    
    return result.length
  } catch (error) {
    console.error('[Metrics] Error counting polls:', error)
    return 0
  }
}

/**
 * Get the timestamp of the last successful poll
 * Based on the most recent recordedAt in StationStatus
 */
async function getLastSuccessfulPoll(): Promise<Date | null> {
  try {
    const latest = await prisma.stationStatus.findFirst({
      orderBy: {
        recordedAt: 'desc'
      },
      select: {
        recordedAt: true
      }
    })
    
    return latest?.recordedAt || null
  } catch (error) {
    console.error('[Metrics] Error getting last poll:', error)
    return null
  }
}

/**
 * Get the most recent station count from the latest poll
 */
async function getLastStationCount(): Promise<number> {
  try {
    // Get the most recent recordedAt timestamp
    const latestTimestamp = await prisma.stationStatus.findFirst({
      orderBy: {
        recordedAt: 'desc'
      },
      select: {
        recordedAt: true
      }
    })
    
    if (!latestTimestamp) {
      return 0
    }
    
    // Count stations at that timestamp
    const count = await prisma.stationStatus.count({
      where: {
        recordedAt: latestTimestamp.recordedAt
      }
    })
    
    return count
  } catch (error) {
    console.error('[Metrics] Error getting station count:', error)
    return 0
  }
}

/**
 * Calculate average stations per poll over the last 7 days
 */
async function getAverageStationsPerPoll(): Promise<number> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const groupedPolls = await prisma.stationStatus.groupBy({
      by: ['recordedAt'],
      where: {
        recordedAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        _all: true
      }
    })

    if (groupedPolls.length === 0) {
      return 0
    }

    const totalStations = groupedPolls.reduce((sum, poll) => sum + poll._count._all, 0)
    return Math.round(totalStations / groupedPolls.length)
  } catch (error) {
    console.error('[Metrics] Error calculating average:', error)
    return 0
  }
}

/**
 * Check if the latest data is fresh (within 5 minutes)
 */
async function isDataFresh(): Promise<{ isFresh: boolean; lastUpdated: Date | null }> {
  const lastPoll = await getLastSuccessfulPoll()
  
  if (!lastPoll) {
    return { isFresh: false, lastUpdated: null }
  }
  
  const maxAgeMs = 5 * 60 * 1000 // 5 minutes
  const ageMs = Date.now() - lastPoll.getTime()
  
  return {
    isFresh: ageMs <= maxAgeMs,
    lastUpdated: lastPoll
  }
}

/**
 * Calculate health status based on pipeline metrics
 */
function calculateHealthStatus(
  lastPoll: Date | null,
  consecutiveFailures: number,
  validationErrors: number,
  polls24h: number
): { status: HealthStatus; reason: string | null } {
  // Down: No successful poll in the last hour or too many consecutive failures
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  if (consecutiveFailures >= 5) {
    return {
      status: 'down',
      reason: `Pipeline has ${consecutiveFailures} consecutive failures`
    }
  }
  
  if (!lastPoll || lastPoll < oneHourAgo) {
    return {
      status: 'down',
      reason: lastPoll 
        ? `No successful poll in the last hour (last: ${lastPoll.toISOString()})`
        : 'No successful polls yet'
    }
  }
  
  // Degraded: Fewer than expected polls (expect ~48 polls per day for 30-min interval)
  // or elevated validation errors
  if (polls24h < 40) {
    return {
      status: 'degraded',
      reason: `Only ${polls24h} polls in last 24h (expected ~48)`
    }
  }
  
  if (validationErrors > 10) {
    return {
      status: 'degraded',
      reason: `${validationErrors} validation errors accumulated`
    }
  }
  
  return { status: 'healthy', reason: null }
}

/**
 * Get the current version from package.json
 */
function getVersion(): string {
  try {
    // In Next.js, we can read package.json at build time
    // For runtime, we'll use a fallback or environment variable
    return process.env.npm_package_version || '0.1.0'
  } catch {
    return '0.1.0'
  }
}

/**
 * Record a collection attempt result
 * Called after each collection job run
 */
export function recordCollection(result: {
  success: boolean
  stationsCollected: number
  timestamp: Date
  error?: string
}): void {
  metricsCache.lastCollectionResult = {
    success: result.success,
    stationsCollected: result.stationsCollected,
    timestamp: result.timestamp
  }

  clearMetricsSnapshotCache()
  
  if (result.success) {
    metricsCache.consecutiveFailures = 0
  } else {
    metricsCache.consecutiveFailures++
  }
  
  console.log('[Metrics] Collection recorded:', {
    success: result.success,
    stations: result.stationsCollected,
    consecutiveFailures: metricsCache.consecutiveFailures,
    timestamp: result.timestamp.toISOString()
  })
}

/**
 * Increment the validation error counter
 * Called when data validation fails
 */
export function incrementValidationErrors(count: number = 1): void {
  metricsCache.lastValidationErrors += count
  clearMetricsSnapshotCache()
  console.warn(`[Metrics] ${count} validation error(s) recorded. Total: ${metricsCache.lastValidationErrors}`)
}

/**
 * Reset validation errors counter
 * Called after successful validation or on manual reset
 */
export function resetValidationErrors(): void {
  metricsCache.lastValidationErrors = 0
  clearMetricsSnapshotCache()
  console.log('[Metrics] Validation errors reset')
}

/**
 * Reset consecutive failures counter
 * Called after a successful collection
 */
export function resetConsecutiveFailures(): void {
  metricsCache.consecutiveFailures = 0
  clearMetricsSnapshotCache()
}

/**
 * Get current pipeline metrics
 */
export async function getMetrics(): Promise<PipelineMetrics> {
  const now = Date.now()

  if (metricsSnapshotCache && metricsSnapshotCache.expiresAt > now) {
    return metricsSnapshotCache.value
  }

  const [
    lastSuccessfulPoll,
    totalRowsCollected,
    pollsLast24Hours,
    lastStationCount,
    averageStationsPerPoll,
    freshness
  ] = await Promise.all([
    getLastSuccessfulPoll(),
    getTotalRowsCollected(),
    getPollsLast24Hours(),
    getLastStationCount(),
    getAverageStationsPerPoll(),
    isDataFresh()
  ])
  
  const { status: healthStatus, reason: healthReason } = calculateHealthStatus(
    lastSuccessfulPoll,
    metricsCache.consecutiveFailures,
    metricsCache.lastValidationErrors,
    pollsLast24Hours
  )
  
  const metrics: PipelineMetrics = {
    lastSuccessfulPoll,
    totalRowsCollected,
    pollsLast24Hours,
    validationErrors: metricsCache.lastValidationErrors,
    consecutiveFailures: metricsCache.consecutiveFailures,
    lastDataFreshness: freshness.isFresh,
    lastStationCount,
    averageStationsPerPoll,
    healthStatus,
    healthReason
  }

  metricsSnapshotCache = {
    value: metrics,
    expiresAt: now + METRICS_CACHE_TTL_MS
  }

  return metrics
}

/**
 * Get system metrics
 */
export function getSystemMetrics(): SystemMetrics {
  return {
    uptime: metricsCache.appStartTime,
    version: getVersion(),
    environment: process.env.NODE_ENV || 'development'
  }
}

type ErrorWithMeta = {
  cause?: unknown
  meta?: {
    driverAdapterError?: unknown
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function isMissingTableError(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase()

  if (message.includes('no such table') || message.includes('p2021')) {
    return true
  }

  if (error && typeof error === 'object') {
    const maybeError = error as ErrorWithMeta

    if (maybeError.cause && isMissingTableError(maybeError.cause)) {
      return true
    }

    if (
      maybeError.meta?.driverAdapterError &&
      isMissingTableError(maybeError.meta.driverAdapterError)
    ) {
      return true
    }
  }

  return false
}

/**
 * Get complete status for the API endpoint
 */
export async function getStatus(): Promise<StatusResponse> {
  const [pipeline, system] = await Promise.all([
    getMetrics(),
    Promise.resolve(getSystemMetrics())
  ])
  
  return {
    pipeline,
    quality: {
      freshness: {
        isFresh: pipeline.lastDataFreshness,
        lastUpdated: pipeline.lastSuccessfulPoll,
        maxAgeSeconds: 300 // 5 minutes
      },
      volume: {
        recentStationCount: pipeline.lastStationCount,
        averageStationsPerPoll: pipeline.averageStationsPerPoll,
        expectedRange: { min: 200, max: 500 }
      },
      lastCheck: pipeline.lastSuccessfulPoll
    },
    system,
    timestamp: new Date()
  }
}
