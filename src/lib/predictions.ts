import { DayType } from '@/analytics/types';
import {
  getStationPatterns,
  getStationStatusHistory,
  getStationWithLatestStatus,
} from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { clamp } from '@/lib/format';
import { getLocalBucket } from '@/analytics/time-buckets';
import {
  isBacktestReliable,
  runStationBacktest,
  type HorizonBacktest,
  type StationBacktestResult,
} from '@/lib/prediction-backtest';
import { getServiceCause } from '@/lib/service-calendar';
import { TIMEZONE } from '@/lib/timezone';

export type PredictionHorizonMinutes = 30 | 60;

export type StationPredictionPoint = {
  horizonMinutes: PredictionHorizonMinutes;
  predictedBikesAvailable: number | null;
  predictedAnchorsFree: number | null;
  confidence: number | null;
  /**
   * Semiancho del rango (bicis) calibrado con el backtest. Ausente si no hay
   * muestra suficiente; la vista cae entonces a la heurística por confianza.
   */
  rangeHalfWidth?: number;
  /** Acierto medido en el histórico; solo presente con muestra suficiente. */
  backtest?: Pick<HorizonBacktest, 'sampleCount' | 'mae' | 'hitRateWithin1' | 'hitRateWithinRange'>;
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

export type StationPredictionContext = {
  stationId: string;
  capacity: number;
  bikesAvailable: number;
  anchorsFree: number;
  patterns: StationPredictionPatternRow[];
  /** Snapshots recientes (hasta `now`) para estimar la tendencia; opcional. */
  recentSamples?: Array<{ recordedAt: Date; bikesAvailable: number }>;
};

const MODEL_VERSION = 'historical-baseline-v1';
const PREDICTION_HORIZONS: PredictionHorizonMinutes[] = [30, 60];

function normalizeDayType(value: DayType | string): DayType | null {
  if (value === DayType.WEEKDAY || value === 'WEEKDAY') {
    return DayType.WEEKDAY;
  }

  if (value === DayType.WEEKEND || value === 'WEEKEND') {
    return DayType.WEEKEND;
  }

  return null;
}

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Tipo de día efectivo: un festivo del calendario de servicio se comporta como
 * fin de semana. Solo `holiday`; eventos/huelgas no tienen patrón propio.
 */
function effectiveBucket(date: Date): { dayType: DayType; hour: number } {
  const bucket = getLocalBucket(date);
  if (
    bucket.dayType === DayType.WEEKDAY &&
    getServiceCause(dateKeyFormatter.format(date))?.kind === 'holiday'
  ) {
    return { dayType: DayType.WEEKEND, hour: bucket.hour };
  }
  return { dayType: bucket.dayType, hour: bucket.hour };
}

const TREND_WINDOW_MINUTES = 20;
const TREND_MIN_SPAN_MINUTES = 8;
const TREND_MIN_SAMPLES = 3;
const TREND_WEIGHT: Record<PredictionHorizonMinutes, number> = { 30: 0.3, 60: 0.15 };

/** Pendiente (bicis/min) de los últimos minutos; null si no hay datos suficientes. */
export function estimateRecentTrend(
  samples: StationPredictionContext['recentSamples'],
  now: Date
): number | null {
  if (!samples) return null;
  const from = now.getTime() - TREND_WINDOW_MINUTES * 60_000;
  const recent = samples
    .filter((s) => s.recordedAt.getTime() >= from && s.recordedAt.getTime() <= now.getTime())
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  if (recent.length < TREND_MIN_SAMPLES) return null;
  const spanMin =
    (recent[recent.length - 1].recordedAt.getTime() - recent[0].recordedAt.getTime()) / 60_000;
  if (spanMin < TREND_MIN_SPAN_MINUTES) return null;
  const t0 = recent[0].recordedAt.getTime();
  const xs = recent.map((s) => (s.recordedAt.getTime() - t0) / 60_000);
  const ys = recent.map((s) => s.bikesAvailable);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  if (den === 0) return null;
  return xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den;
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
  const currentBucket = effectiveBucket(now);
  const futureDate = new Date(now.getTime() + horizonMinutes * 60_000);
  const futureBucket = effectiveBucket(futureDate);
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
  const baseRatio = currentRatio * recencyWeight + (currentRatio + expectedDelta) * (1 - recencyWeight);
  const slope = estimateRecentTrend(context.recentSamples, now);
  const trendRatio =
    slope === null
      ? 0
      : clamp((slope * horizonMinutes * TREND_WEIGHT[horizonMinutes]) / capacity, -0.25, 0.25);
  const predictedRatio = clamp(baseRatio + trendRatio, 0, 1);
  const predictedBikes = roundPrediction(clamp(predictedRatio * capacity, 0, capacity));
  const predictedAnchors = roundPrediction(clamp(capacity - predictedBikes, 0, capacity));

  return {
    horizonMinutes,
    predictedBikesAvailable: predictedBikes,
    predictedAnchorsFree: predictedAnchors,
    confidence: computeConfidence(currentPattern, futurePattern),
  };
}

/**
 * Sustituye la confianza por muestras y añade rango/acierto medidos cuando el
 * backtest de ese horizonte tiene muestra suficiente. Sin ella, no cambia nada.
 */
export function applyBacktestCalibration(
  response: StationPredictionsResponse,
  backtest: StationBacktestResult | null | undefined
): StationPredictionsResponse {
  if (!backtest) return response;
  return {
    ...response,
    predictions: response.predictions.map((point) => {
      const bt = backtest.horizons.find((h) => h.horizonMinutes === point.horizonMinutes);
      if (!bt || !isBacktestReliable(bt) || point.predictedBikesAvailable === null) return point;
      return {
        ...point,
        confidence: Number(clamp(bt.hitRateWithinTolerance, 0.2, 0.95).toFixed(2)),
        rangeHalfWidth: bt.rangeHalfWidth,
        backtest: {
          sampleCount: bt.sampleCount,
          mae: bt.mae,
          hitRateWithin1: bt.hitRateWithin1,
          hitRateWithinRange: bt.hitRateWithinRange,
        },
      };
    }),
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

/**
 * Horizonte de 30–60 min: servir la respuesta de caché durante 60 s es
 * conservador respecto a la propia precisión del modelo.
 */
const PREDICTIONS_CACHE_TTL_SECONDS = 60;
/** El backtest recorre días de histórico: se recalcula como mucho cada hora. */
const BACKTEST_CACHE_TTL_SECONDS = 3600;
const BACKTEST_WINDOW_DAYS = 14;

async function getStationBacktest(
  stationId: string,
  capacity: number,
  patterns: StationPredictionPatternRow[],
  now: Date
): Promise<StationBacktestResult | null> {
  try {
    const since = new Date(now.getTime() - BACKTEST_WINDOW_DAYS * 24 * 3_600_000);
    const snapshots = await getStationStatusHistory(stationId, since, now);
    return runStationBacktest({
      stationId,
      capacity,
      snapshots,
      patterns,
      predict: estimateStationPredictions,
    });
  } catch {
    return null;
  }
}

export async function getStationPredictions(
  stationId: string,
  now?: Date
): Promise<StationPredictionsResponse | null> {
  // La consulta puntual es una fila por índice único y barata; resolverla antes
  // de tocar Redis deja el 404 sin caché (no se escribe `null` por cada
  // estación desconocida).
  const station = await getStationWithLatestStatus(stationId);

  if (!station) {
    return null;
  }

  const compute = async (): Promise<StationPredictionsResponse> => {
    const patterns = await getStationPatterns(stationId);

    const at = now ?? new Date();
    let recentSamples: StationPredictionContext['recentSamples'];
    try {
      recentSamples = await getStationStatusHistory(
        stationId,
        new Date(at.getTime() - TREND_WINDOW_MINUTES * 60_000),
        at
      );
    } catch {
      recentSamples = undefined;
    }

    const raw = estimateStationPredictions(
      {
        stationId,
        capacity: station.capacity,
        bikesAvailable: station.bikesAvailable,
        anchorsFree: station.anchorsFree,
        patterns,
        recentSamples,
      },
      at
    );

    if (raw.modelVersion === null) return raw;

    const backtest = now
      ? await getStationBacktest(stationId, station.capacity, patterns, at)
      : await withCache(
          `predictions:backtest:stationId=${stationId}`,
          BACKTEST_CACHE_TTL_SECONDS,
          () => getStationBacktest(stationId, station.capacity, patterns, at)
        );
    return applyBacktestCalibration(raw, backtest);
  };

  // Un `now` explícito (tests, backfills) salta la caché: el resultado debe
  // ser determinista respecto al instante pedido, no al último cálculo.
  if (now) {
    return compute();
  }

  return withCache(
    `predictions:stationId=${stationId}`,
    PREDICTIONS_CACHE_TTL_SECONDS,
    compute
  );
}

export function getEmptyStationPredictions(stationId: string): StationPredictionsResponse {
  return toEmptyPredictions(stationId);
}
