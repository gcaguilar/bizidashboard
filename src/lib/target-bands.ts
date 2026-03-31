import type { StationType, TimeBand, TargetBand } from '@/types/rebalancing';
import { hourToTimeBand } from '@/analytics/queries/rebalancing';

// ─── Band configuration ──────────────────────────────────────────────────────

/**
 * Default target occupancy bands (min, max) per station type and time band.
 *
 * These are initial values based on operational intuition and the guidelines
 * in the requirements. They should be calibrated per city after observing
 * real intervention outcomes.
 *
 * Occupancy ratio = bikesAvailable / capacity (0–1).
 */
export const DEFAULT_TARGET_BANDS: Record<StationType, Record<TimeBand, TargetBand>> = {
  residential: {
    // Empties in the morning (people ride to work), fills in the evening
    morning_peak: { min: 0.25, max: 0.55 }, // already low, keep some bikes
    valley:       { min: 0.30, max: 0.65 },
    evening_peak: { min: 0.40, max: 0.70 }, // people returning, needs space
    night:        { min: 0.50, max: 0.80 }, // fills overnight for next morning
  },
  offices: {
    // Fills in the morning (commuters arrive), empties in the evening
    morning_peak: { min: 0.55, max: 0.85 }, // arrivals, needs space for docking
    valley:       { min: 0.40, max: 0.70 },
    evening_peak: { min: 0.20, max: 0.55 }, // departures, needs bikes available
    night:        { min: 0.15, max: 0.50 },
  },
  intermodal: {
    // Transit hubs need consistent availability all day
    morning_peak: { min: 0.40, max: 0.70 },
    valley:       { min: 0.40, max: 0.70 },
    evening_peak: { min: 0.40, max: 0.70 },
    night:        { min: 0.30, max: 0.65 },
  },
  tourist: {
    // High variability; keep wider bands during tourist hours
    morning_peak: { min: 0.30, max: 0.65 },
    valley:       { min: 0.35, max: 0.65 },
    evening_peak: { min: 0.35, max: 0.65 },
    night:        { min: 0.25, max: 0.60 },
  },
  leisure: {
    // Evening/night peaks; quiet during the day
    morning_peak: { min: 0.25, max: 0.60 },
    valley:       { min: 0.30, max: 0.65 },
    evening_peak: { min: 0.40, max: 0.70 }, // evening activity
    night:        { min: 0.40, max: 0.72 }, // nocturnal activity
  },
  mixed: {
    // Moderate default bands with extra tolerance
    morning_peak: { min: 0.30, max: 0.65 },
    valley:       { min: 0.30, max: 0.65 },
    evening_peak: { min: 0.30, max: 0.65 },
    night:        { min: 0.25, max: 0.65 },
  },
};

// ─── Public helpers ──────────────────────────────────────────────────────────

/**
 * Returns the target occupancy band for a given station type and time band.
 */
export function getTargetBand(type: StationType, timeBand: TimeBand): TargetBand {
  return DEFAULT_TARGET_BANDS[type]?.[timeBand] ?? DEFAULT_TARGET_BANDS.mixed[timeBand];
}

/**
 * Determines the current time band based on the local hour (0–23).
 * Delegates to the shared hourToTimeBand helper.
 */
export { hourToTimeBand as getCurrentTimeBand } from '@/analytics/queries/rebalancing';

/**
 * Returns all four bands for a station type, useful for full-day analysis.
 */
export function getAllBands(type: StationType): Record<TimeBand, TargetBand> {
  return DEFAULT_TARGET_BANDS[type] ?? DEFAULT_TARGET_BANDS.mixed;
}

/**
 * Checks whether an occupancy ratio is within the given band.
 */
export function isWithinBand(occupancy: number, band: TargetBand): boolean {
  return occupancy >= band.min && occupancy <= band.max;
}

/**
 * Returns how far the occupancy is from the band:
 * negative = below minimum, positive = above maximum, 0 = within band.
 */
export function bandDeviation(occupancy: number, band: TargetBand): number {
  if (occupancy < band.min) return occupancy - band.min; // negative
  if (occupancy > band.max) return occupancy - band.max; // positive
  return 0;
}
