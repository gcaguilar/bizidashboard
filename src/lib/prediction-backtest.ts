/**
 * Backtest puro del modelo de predicción por estación.
 *
 * Reproduce, sobre el histórico de snapshots, la predicción que el modelo
 * habría dado a 30/60 min y la compara con lo observado después. Con ello se
 * calcula, por horizonte: MAE (bicis), % de aciertos con +-1 bici, un
 * semiancho de rango empírico (cuantil 80 % del error absoluto) y el % de
 * aciertos dentro de ese rango.
 *
 * Límites (documentados a propósito):
 * - Es un backtest "in-sample": los patrones (`StationPattern`) se calculan
 *   con el mismo histórico que se evalúa, así que el acierto medido es algo
 *   optimista frente al acierto real fuera de muestra.
 * - Los orígenes se muestrean cada `originStepMinutes` (no cada snapshot) para
 *   acotar el coste; los orígenes consecutivos están correlacionados, por lo
 *   que el nº de muestras no equivale a nº de casos independientes.
 * - El valor "observado" es el snapshot más cercano al instante objetivo
 *   dentro de `targetToleranceMinutes`; sin él, el origen se descarta.
 * - No modela eventos excepcionales (huelgas, meteo, obras).
 */
import type {
  PredictionHorizonMinutes,
  StationPredictionContext,
  StationPredictionsResponse,
} from '@/lib/predictions';

export type BacktestSnapshot = {
  recordedAt: Date;
  bikesAvailable: number;
};

export type HorizonBacktest = {
  horizonMinutes: PredictionHorizonMinutes;
  sampleCount: number;
  /** Error absoluto medio, en bicis. */
  mae: number;
  /** Fracción [0,1] de predicciones a +-1 bici de lo observado. */
  hitRateWithin1: number;
  /** Fracción [0,1] a +-tolerancia (10 % de capacidad, mínimo 1). */
  hitRateWithinTolerance: number;
  /** Semiancho empírico (cuantil 80 % del error absoluto), mínimo 1. */
  rangeHalfWidth: number;
  /** Fracción [0,1] de observaciones dentro de +-rangeHalfWidth. */
  hitRateWithinRange: number;
};

export type StationBacktestResult = {
  stationId: string;
  horizons: HorizonBacktest[];
};

export type PredictFn = (context: StationPredictionContext, now: Date) => StationPredictionsResponse;

export type BacktestInput = {
  stationId: string;
  capacity: number;
  snapshots: BacktestSnapshot[];
  patterns: StationPredictionContext['patterns'];
  predict: PredictFn;
  horizons?: PredictionHorizonMinutes[];
  originStepMinutes?: number;
  targetToleranceMinutes?: number;
  /** Ventana de muestras recientes que se entrega al modelo (tendencia). */
  recentWindowMinutes?: number;
};

/** Por debajo de este nº de pares el acierto medido no se muestra ni calibra. */
export const MIN_BACKTEST_SAMPLES = 30;
export const RANGE_QUANTILE = 0.8;
const MINUTE = 60_000;

export function toleranceBikes(capacity: number): number {
  return Math.max(1, Math.round(capacity * 0.1));
}

export function isBacktestReliable(
  backtest: Pick<HorizonBacktest, 'sampleCount'> | null | undefined
): boolean {
  return !!backtest && backtest.sampleCount >= MIN_BACKTEST_SAMPLES;
}

function quantile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  const index = Math.min(sortedAsc.length - 1, Math.ceil(q * sortedAsc.length) - 1);
  return sortedAsc[Math.max(0, index)];
}

/** Índice del snapshot más cercano a `target` (lista ordenada), o -1. */
function nearestIndex(times: number[], target: number, toleranceMs: number): number {
  let lo = 0;
  let hi = times.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  let best = -1;
  let bestDiff = Infinity;
  for (const i of [lo - 1, lo]) {
    if (i < 0 || i >= times.length) continue;
    const diff = Math.abs(times[i] - target);
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }
  return bestDiff <= toleranceMs ? best : -1;
}

export function runStationBacktest(input: BacktestInput): StationBacktestResult {
  const horizons = input.horizons ?? [30, 60];
  const stepMs = (input.originStepMinutes ?? 30) * MINUTE;
  const toleranceMs = (input.targetToleranceMinutes ?? 7) * MINUTE;
  const recentMs = (input.recentWindowMinutes ?? 20) * MINUTE;
  const capacity = Math.max(0, input.capacity);

  const snapshots = input.snapshots
    .filter((s) => Number.isFinite(s.bikesAvailable) && !Number.isNaN(s.recordedAt.getTime()))
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const times = snapshots.map((s) => s.recordedAt.getTime());

  const errors = new Map<PredictionHorizonMinutes, number[]>(horizons.map((h) => [h, []]));

  if (capacity > 0 && input.patterns.length > 0) {
    let nextOrigin = -Infinity;
    for (let i = 0; i < snapshots.length; i += 1) {
      if (times[i] < nextOrigin) continue;
      nextOrigin = times[i] + stepMs;

      const recent: BacktestSnapshot[] = [];
      for (let j = i; j >= 0 && times[i] - times[j] <= recentMs; j -= 1) {
        recent.unshift(snapshots[j]);
      }

      const origin = snapshots[i];
      const bikes = Math.min(Math.max(origin.bikesAvailable, 0), capacity);
      const response = input.predict(
        {
          stationId: input.stationId,
          capacity,
          bikesAvailable: bikes,
          anchorsFree: capacity - bikes,
          patterns: input.patterns,
          recentSamples: recent,
        },
        origin.recordedAt
      );

      for (const point of response.predictions) {
        const bucket = errors.get(point.horizonMinutes);
        if (!bucket || point.predictedBikesAvailable === null) continue;
        const target = times[i] + point.horizonMinutes * MINUTE;
        const idx = nearestIndex(times, target, toleranceMs);
        if (idx < 0 || idx === i) continue;
        const observed = Math.min(Math.max(snapshots[idx].bikesAvailable, 0), capacity);
        bucket.push(Math.abs(point.predictedBikesAvailable - observed));
      }
    }
  }

  const tolerance = toleranceBikes(capacity);
  return {
    stationId: input.stationId,
    horizons: horizons.map((horizonMinutes) => {
      const abs = errors.get(horizonMinutes) ?? [];
      const n = abs.length;
      const sorted = [...abs].sort((a, b) => a - b);
      const rangeHalfWidth = Math.max(1, quantile(sorted, RANGE_QUANTILE));
      const share = (predicate: (e: number) => boolean) =>
        n === 0 ? 0 : abs.filter(predicate).length / n;
      return {
        horizonMinutes,
        sampleCount: n,
        mae: n === 0 ? 0 : Number((abs.reduce((a, b) => a + b, 0) / n).toFixed(2)),
        hitRateWithin1: Number(share((e) => e <= 1).toFixed(3)),
        hitRateWithinTolerance: Number(share((e) => e <= tolerance).toFixed(3)),
        rangeHalfWidth,
        hitRateWithinRange: Number(share((e) => e <= rangeHalfWidth).toFixed(3)),
      };
    }),
  };
}
