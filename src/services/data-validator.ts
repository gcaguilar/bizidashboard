import { storeStationStatuses, GBFSStationStatus } from './data-storage'
import { 
  validateDataQuality, 
  logObservabilityMetrics,
  shouldStoreData,
  ValidationInput,
  DataObservabilityMetrics 
} from '@/lib/observability'
import { incrementValidationErrors } from '@/lib/metrics'

/**
 * Raw GBFS status response structure
 */
export type GBFSStatusResponse = {
  last_updated: number // Unix timestamp
  ttl: number // Time to live in seconds
  version: string // GBFS version (e.g., "2.3")
  data: {
    stations: Array<{
      station_id: string
      num_bikes_available: number
      num_docks_available: number
      num_bikes_disabled?: number
      num_docks_disabled?: number
      is_installed?: boolean
      is_renting?: boolean
      is_returning?: boolean
      last_reported?: number
    }>
  }
}

/**
 * Validation result including quality metrics and storage result
 */
export type ValidationResult = {
  success: boolean
  stored: boolean
  metrics: DataObservabilityMetrics
  storageResult?: {
    count: number
    duplicateCount: number
    errors: Array<{ stationId: string; error: string }>
  }
  errors: string[]
  warnings: string[]
}

/**
 * Options for validation and storage
 */
export type ValidateAndStoreOptions = {
  /** Skip storage if validation fails (default: false - store anyway for debugging) */
  skipStorageOnError?: boolean
  /** Source URL for lineage tracking */
  sourceUrl: string
  /** Collection ID for tracking this specific collection run */
  collectionId?: string
  /** Schema validation errors from external validation (e.g., Zod) */
  schemaErrors?: string[]
}

/**
 * Generate a unique collection ID
 */
function generateCollectionId(): string {
  return `col-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Convert GBFS timestamp (Unix seconds) to UTC Date
 */
function toUTCDate(unixTimestamp: number): Date {
  return new Date(unixTimestamp * 1000)
}

/**
 * Orchestrates the complete validation and storage pipeline:
 * 1. Validate data quality (Five Pillars)
 * 2. Log observability metrics
 * 3. Store valid data
 * 4. Return comprehensive result
 * 
 * @param response Raw GBFS status response
 * @param options Validation and storage options
 * @returns Complete validation result
 */
export async function validateAndStore(
  response: GBFSStatusResponse,
  options: ValidateAndStoreOptions
): Promise<ValidationResult> {
  const collectionId = options.collectionId ?? generateCollectionId()
  const result: ValidationResult = {
    success: true,
    stored: false,
    metrics: null as unknown as DataObservabilityMetrics,
    errors: [],
    warnings: []
  }

  try {
    // Step 1: Prepare validation input
    const validationInput: ValidationInput = {
      lastUpdated: response.last_updated,
      stations: response.data.stations.map(s => ({
        station_id: s.station_id,
        num_bikes_available: s.num_bikes_available,
        num_docks_available: s.num_docks_available
      })),
      gbfsVersion: response.version,
      sourceUrl: options.sourceUrl,
      collectionId
    }

    // Step 2: Run Five Pillars quality validation
    const metrics = await validateDataQuality(
      validationInput,
      options.schemaErrors ?? []
    )
    result.metrics = metrics

    // Step 3: Log observability metrics
    logObservabilityMetrics(metrics)

    // Copy warnings and errors to result
    result.warnings = [...metrics.warnings]
    result.errors = [...metrics.errors]

    // Track validation errors for observability dashboard
    if (metrics.errors.length > 0) {
      incrementValidationErrors(metrics.errors.length)
    }

    // Step 4: Determine if we should store
    const shouldStore = shouldStoreData(metrics)
    const skipStorage = options.skipStorageOnError && !metrics.allChecksPassed

    if (!shouldStore || skipStorage) {
      console.log(`[Validator] Skipping storage for collection ${collectionId}`)
      result.success = metrics.allChecksPassed
      return result
    }

    // Step 5: Convert GBFS data to storage format with UTC timestamps
    const stationStatuses: GBFSStationStatus[] = response.data.stations.map(station => ({
      station_id: station.station_id,
      num_bikes_available: station.num_bikes_available,
      num_docks_available: station.num_docks_available,
      last_reported: station.last_reported ?? response.last_updated
    }))

    // Step 6: Store in database
    const storageResult = await storeStationStatuses(stationStatuses)

    result.storageResult = {
      count: storageResult.count,
      duplicateCount: storageResult.duplicateCount,
      errors: storageResult.errors
    }

    if (storageResult.success) {
      result.stored = true
      console.log(`[Validator] Stored ${storageResult.count} station statuses (collection: ${collectionId})`)
      
      if (storageResult.duplicateCount > 0) {
        result.warnings.push(`${storageResult.duplicateCount} duplicate entries skipped`)
      }
    } else {
      result.success = false
      result.errors.push(`Storage failed: ${storageResult.errors.length} errors`)
      storageResult.errors.forEach(e => {
        result.errors.push(`Station ${e.stationId}: ${e.error}`)
      })
    }

    // Overall success requires both validation and storage to pass
    result.success = metrics.allChecksPassed && storageResult.success

  } catch (error) {
    result.success = false
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.errors.push(`Validation pipeline failed: ${errorMessage}`)
    console.error('[Validator] Pipeline error:', error)
  }

  return result
}

/**
 * Quick validation without storage
 * Useful for health checks and dry runs
 * 
 * @param response Raw GBFS status response
 * @param sourceUrl Source URL for lineage
 * @returns Quality metrics without storage
 */
export async function validateOnly(
  response: GBFSStatusResponse,
  sourceUrl: string
): Promise<DataObservabilityMetrics> {
  const validationInput: ValidationInput = {
    lastUpdated: response.last_updated,
    stations: response.data.stations.map(s => ({
      station_id: s.station_id,
      num_bikes_available: s.num_bikes_available,
      num_docks_available: s.num_docks_available
    })),
    gbfsVersion: response.version,
    sourceUrl,
    collectionId: generateCollectionId()
  }

  const metrics = await validateDataQuality(validationInput, [])
  logObservabilityMetrics(metrics)

  return metrics
}

/**
 * Check if the validator is properly configured
 * Used for health checks
 */
export async function checkValidatorHealth(): Promise<{
  healthy: boolean
  errors: string[]
}> {
  const errors: string[] = []

  // Check that required modules are available
  try {
    // Import test (modules already loaded if we got here)
    if (typeof validateDataQuality !== 'function') {
      errors.push('validateDataQuality function not available')
    }
    if (typeof storeStationStatuses !== 'function') {
      errors.push('storeStationStatuses function not available')
    }
  } catch (error) {
    errors.push(`Module check failed: ${error instanceof Error ? error.message : 'Unknown'}`)
  }

  return {
    healthy: errors.length === 0,
    errors
  }
}
