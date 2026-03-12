import { DayType } from '@/analytics/types';
import { getStationPatterns, getStationsWithLatestStatus } from '@/analytics/queries/read';
import { getLocalBucket } from '@/analytics/time-buckets';

export type PredictionHorizonMinutes = 30 | 60;

export type StationPredictionPoint = {
  horizonMinutes: PredictionHorizonMinutes;
  predictedBikesAvailable: number | null;
  predictedAnchorsFree: number | null;
  confidence: number | null;
};

export type StationPredictionsResponse = {
  stationId: string;
  generatedAt: string;
  modelVersion: string | null;
  predictions: StationPredictionPoint[];
};

type StationPredictionPatternRow = {
  dayType: DayType | string;
  hour: number;
  bikesAvg: number;
  anchorsAvg: number;
  occupancyAvg: number;
  sampleCount: number;
};

type StationPredictionContext = {
  stationId: string;
  capacity: number;
  bikesAvailable: number;
  anchorsFree: number;
  patterns: StationPredictionPatternRow[];
};

const MODEL_VERSION = 'historical-baseline-v1';
const PREDICTION_HORIZONS: PredictionHorizonMinutes[] = [30, 60];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeDayType(value: DayType | string): DayType | null {
  if (value === DayType.WEEKDAY || value === 'WEEKDAY') {
    return DayType.WEEKDAY;
  }

  if (value === DayType.WEEKEND || value === 'WEEKEND') {
    return DayType.WEEKEND;
  }

  return null;
}

function roundPrediction(value: number): number {
  return Math.round(value);
}

function toEmptyPredictions(stationId: string): StationPredictionsResponse {
  return {
    stationId,
    generatedAt: new Date().toISOString(),
    modelVersion: null,
    predictions: PREDICTION_HORIZONS.map((horizonMinutes) => ({
      horizonMinutes,
      predictedBikesAvailable: null,
      predictedAnchorsFree: null,
      confidence: null,
    })),
  };
}

function resolvePattern(
  rows: StationPredictionPatternRow[],
  dayType: DayType,
  hour: number
): StationPredictionPatternRow | null {
  return rows.find((row) => normalizeDayType(row.dayType) === dayType && row.hour === hour) ?? null;
}

function computeConfidence(
  currentPattern: StationPredictionPatternRow | null,
  futurePattern: StationPredictionPatternRow | null
): number | null {
  const sampleCount = (currentPattern?.sampleCount ?? 0) + (futurePattern?.sampleCount ?? 0);

  if (sampleCount <= 0) {
    return null;
  }

  const confidence = 0.42 + Math.min(sampleCount, 120) / 240;
  return Number(clamp(confidence, 0.42, 0.92).toFixed(2));
}

function predictPoint(
  context: StationPredictionContext,
  horizonMinutes: PredictionHorizonMinutes,
  now: Date
): StationPredictionPoint {
  const currentBucket = getLocalBucket(now);
  const futureDate = new Date(now.getTime() + horizonMinutes * 60_000);
  const futureBucket = getLocalBucket(futureDate);
  const currentPattern = resolvePattern(context.patterns, currentBucket.dayType, currentBucket.hour);
  const futurePattern = resolvePattern(context.patterns, futureBucket.dayType, futureBucket.hour);

  if (!futurePattern) {
    return {
      horizonMinutes,
      predictedBikesAvailable: null,
      predictedAnchorsFree: null,
      confidence: null,
    };
  }

  const capacity = Math.max(0, context.capacity);

  if (capacity <= 0) {
    return {
      horizonMinutes,
      predictedBikesAvailable: 0,
      predictedAnchorsFree: 0,
      confidence: computeConfidence(currentPattern, futurePattern),
    };
  }

  const currentBikes = clamp(context.bikesAvailable, 0, capacity);
  const currentRatio = currentBikes / capacity;
  const currentPatternRatio = clamp(currentPattern?.occupancyAvg ?? currentRatio, 0, 1);
  const futurePatternRatio = clamp(futurePattern.occupancyAvg, 0, 1);
  const expectedDelta = futurePatternRatio - currentPatternRatio;
  const recencyWeight = horizonMinutes === 30 ? 0.7 : 0.48;
  const predictedRatio = clamp(currentRatio * recencyWeight + (currentRatio + expectedDelta) * (1 - recencyWeight), 0, 1);
  const predictedBikes = roundPrediction(clamp(predictedRatio * capacity, 0, capacity));
  const predictedAnchors = roundPrediction(clamp(capacity - predictedBikes, 0, capacity));

  return {
    horizonMinutes,
    predictedBikesAvailable: predictedBikes,
    predictedAnchorsFree: predictedAnchors,
    confidence: computeConfidence(currentPattern, futurePattern),
  };
}

export function estimateStationPredictions(
  context: StationPredictionContext,
  now: Date = new Date()
): StationPredictionsResponse {
  if (context.patterns.length === 0) {
    return toEmptyPredictions(context.stationId);
  }

  return {
    stationId: context.stationId,
    generatedAt: now.toISOString(),
    modelVersion: MODEL_VERSION,
    predictions: PREDICTION_HORIZONS.map((horizonMinutes) => predictPoint(context, horizonMinutes, now)),
  };
}

export async function getStationPredictions(
  stationId: string,
  now: Date = new Date()
): Promise<StationPredictionsResponse | null> {
  const [stations, patterns] = await Promise.all([
    getStationsWithLatestStatus(),
    getStationPatterns(stationId),
  ]);

  const station = stations.find((entry) => entry.id === stationId);

  if (!station) {
    return null;
  }

  return estimateStationPredictions(
    {
      stationId,
      capacity: station.capacity,
      bikesAvailable: station.bikesAvailable,
      anchorsFree: station.anchorsFree,
      patterns,
    },
    now
  );
}

export function getEmptyStationPredictions(stationId: string): StationPredictionsResponse {
  return toEmptyPredictions(stationId);
}
