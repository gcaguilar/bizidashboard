import { estimateStationPredictions } from '@/lib/predictions';
import { getLocalBucket, getLocalHour } from '@/analytics/time-buckets';
import type { RiskAssessment, TargetBand } from '@/types/rebalancing';
import { isWithinBand } from '@/lib/target-bands';

// Re-export for callers who need to determine current hour
export { getLocalHour };

export type PatternRow = {
  dayType: string;
  hour: number;
  occupancyAvg: number;
  bikesAvg: number;
  anchorsAvg: number;
  sampleCount: number;
};

// ─── Extended prediction horizons ────────────────────────────────────────────

type ExtendedHorizon = 30 | 60 | 120 | 180;

// Recency weights per horizon: at 3h, pattern dominates over current state
const RECENCY_WEIGHTS: Record<ExtendedHorizon, number> = {
  30: 0.70,
  60: 0.48,
  120: 0.30,
  180: 0.20,
};

type PredictionPoint = {
  horizonMinutes: number;
  predictedBikesAvailable: number | null;
  predictedAnchorsFree: number | null;
  confidence: number | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolvePattern(
  patterns: PatternRow[],
  dayType: string,
  hour: number
): PatternRow | null {
  return patterns.find((p) => p.dayType === dayType && p.hour === hour) ?? null;
}

/**
 * Extends the existing historical-baseline prediction engine to 120 and 180 minute horizons.
 * Uses lower recency weights at longer horizons (pattern dominates over current state).
 */
function predictAtHorizon(
  capacity: number,
  currentBikes: number,
  patterns: PatternRow[],
  horizonMinutes: ExtendedHorizon,
  now: Date
): PredictionPoint {
  if (capacity <= 0 || patterns.length === 0) {
    return { horizonMinutes, predictedBikesAvailable: null, predictedAnchorsFree: null, confidence: null };
  }

  const currentBucket = getLocalBucket(now);
  const futureDate = new Date(now.getTime() + horizonMinutes * 60_000);
  const futureBucket = getLocalBucket(futureDate);

  const currentPattern = resolvePattern(patterns, currentBucket.dayType, currentBucket.hour);
  const futurePattern = resolvePattern(patterns, futureBucket.dayType, futureBucket.hour);

  if (!futurePattern) {
    return { horizonMinutes, predictedBikesAvailable: null, predictedAnchorsFree: null, confidence: null };
  }

  const currentRatio = clamp(currentBikes / capacity, 0, 1);
  const currentPatternRatio = clamp(currentPattern?.occupancyAvg ?? currentRatio, 0, 1);
  const futurePatternRatio = clamp(futurePattern.occupancyAvg, 0, 1);
  const expectedDelta = futurePatternRatio - currentPatternRatio;

  const recencyWeight = RECENCY_WEIGHTS[horizonMinutes];
  const predictedRatio = clamp(
    currentRatio * recencyWeight + (currentRatio + expectedDelta) * (1 - recencyWeight),
    0,
    1
  );

  const predictedBikes = Math.round(clamp(predictedRatio * capacity, 0, capacity));
  const predictedAnchors = Math.round(clamp(capacity - predictedBikes, 0, capacity));

  const sampleCount = (currentPattern?.sampleCount ?? 0) + futurePattern.sampleCount;
  const confidence = sampleCount > 0
    ? Number(clamp(0.42 + Math.min(sampleCount, 120) / 240, 0.42, 0.92).toFixed(2))
    : null;

  return { horizonMinutes, predictedBikesAvailable: predictedBikes, predictedAnchorsFree: predictedAnchors, confidence };
}

// ─── Risk probability ────────────────────────────────────────────────────────

/**
 * Converts a predicted bike count into a risk of reaching zero (0–1).
 * Risk rises sharply below 20% of capacity.
 */
function computeEmptyRisk(predictedBikes: number | null, capacity: number): number {
  if (predictedBikes === null || capacity <= 0) return 0;
  const ratio = predictedBikes / capacity;
  if (ratio <= 0) return 1.0;
  if (ratio >= 0.20) return 0;
  // Smooth ramp: 0 bikes = 1.0, 20% capacity = 0
  return clamp(1 - ratio / 0.20, 0, 1);
}

/**
 * Converts a predicted anchor count into a risk of reaching zero (0–1).
 */
function computeFullRisk(predictedAnchors: number | null, capacity: number): number {
  if (predictedAnchors === null || capacity <= 0) return 0;
  const ratio = predictedAnchors / capacity;
  if (ratio <= 0) return 1.0;
  if (ratio >= 0.20) return 0;
  return clamp(1 - ratio / 0.20, 0, 1);
}

// ─── Self-correction and recovery ───────────────────────────────────────────

/**
 * Estimates whether the station will return to target band without intervention.
 *
 * Walks forward through hourly patterns up to 6 hours. If the predicted occupancy
 * enters the target band before 6h, returns the estimated minutes to recovery.
 */
function estimateRecovery(
  capacity: number,
  currentBikes: number,
  patterns: PatternRow[],
  targetBand: TargetBand,
  now: Date
): { recoveryMinutes: number | null; selfCorrectionProbability: number } {
  if (capacity <= 0 || patterns.length === 0) {
    return { recoveryMinutes: null, selfCorrectionProbability: 0 };
  }

  const CHECK_POINTS: ExtendedHorizon[] = [30, 60, 120, 180];
  const maxMinutes = 360; // 6 hours

  for (const horizon of CHECK_POINTS) {
    if (horizon > maxMinutes) break;
    const point = predictAtHorizon(capacity, currentBikes, patterns, horizon, now);
    if (point.predictedBikesAvailable === null) continue;

    const predictedOccupancy = point.predictedBikesAvailable / capacity;
    if (isWithinBand(predictedOccupancy, targetBand)) {
      const confidence = point.confidence ?? 0.5;
      return {
        recoveryMinutes: horizon,
        selfCorrectionProbability: confidence * 0.9,
      };
    }
  }

  return { recoveryMinutes: null, selfCorrectionProbability: 0 };
}

// ─── Demand forecast ────────────────────────────────────────────────────────

/**
 * Estimates demand score (rotation proxy) for the next N hours
 * by summing the historical pattern's implicit activity (sampleCount proxy).
 */
function estimateDemand(
  patterns: PatternRow[],
  hours: number,
  now: Date
): number {
  let total = 0;
  for (let h = 0; h < hours; h++) {
    const future = new Date(now.getTime() + h * 60 * 60_000);
    const bucket = getLocalBucket(future);
    const pattern = resolvePattern(patterns, bucket.dayType, bucket.hour);
    if (pattern) {
      // Use avg bikes swing as demand proxy: higher swing = more activity
      total += Math.abs(pattern.occupancyAvg - 0.5) * 10;
    }
  }
  return total;
}

// ─── Main function ───────────────────────────────────────────────────────────

/**
 * Performs a full risk assessment for a station at the current moment.
 *
 * Uses the existing `historical-baseline-v1` prediction engine for 30/60 min,
 * and extends to 120/180 min with lower recency weights.
 */
export function assessStationRisk(
  stationId: string,
  capacity: number,
  bikesAvailable: number,
  patterns: PatternRow[],
  targetBand: TargetBand,
  now: Date = new Date()
): RiskAssessment {
  if (capacity <= 0 || patterns.length === 0) {
    return {
      riskEmptyAt1h: 0,
      riskEmptyAt3h: 0,
      riskFullAt1h: 0,
      riskFullAt3h: 0,
      demandNextHour: 0,
      demandNext3Hours: 0,
      selfCorrectionProbability: 0,
      estimatedRecoveryMinutes: null,
      confidence: 0,
    };
  }

  // Use existing engine for 30/60 min predictions
  const shortPredictions = estimateStationPredictions(
    { stationId, capacity, bikesAvailable, anchorsFree: capacity - bikesAvailable, patterns },
    now
  );

  const pred60 = shortPredictions.predictions.find((p) => p.horizonMinutes === 60);
  const pred120 = predictAtHorizon(capacity, bikesAvailable, patterns, 120, now);
  const pred180 = predictAtHorizon(capacity, bikesAvailable, patterns, 180, now);

  const avgConfidence =
    [pred60?.confidence, pred120.confidence, pred180.confidence]
      .filter((c): c is number => c !== null)
      .reduce((sum, c, _, arr) => sum + c / arr.length, 0) || 0;

  const { recoveryMinutes, selfCorrectionProbability } = estimateRecovery(
    capacity,
    bikesAvailable,
    patterns,
    targetBand,
    now
  );

  return {
    riskEmptyAt1h: computeEmptyRisk(pred60?.predictedBikesAvailable ?? null, capacity),
    riskEmptyAt3h: computeEmptyRisk(pred180.predictedBikesAvailable, capacity),
    riskFullAt1h: computeFullRisk(pred60?.predictedAnchorsFree ?? null, capacity),
    riskFullAt3h: computeFullRisk(pred180.predictedAnchorsFree, capacity),
    demandNextHour: estimateDemand(patterns, 1, now),
    demandNext3Hours: estimateDemand(patterns, 3, now),
    selfCorrectionProbability,
    estimatedRecoveryMinutes: recoveryMinutes,
    confidence: avgConfidence,
  };
}
