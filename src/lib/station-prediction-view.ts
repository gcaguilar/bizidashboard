import type { DataState } from '@/lib/data-state';
import { clamp } from '@/lib/format';
import { OCCUPANCY_THRESHOLDS } from '@/lib/network-health';
import type { StationPredictionsResponse } from '@/lib/predictions';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import {
  getStationPredictionCopy,
  formatPredictionAccuracy,
  formatPredictionSentence,
  type PredictionConfidenceLevel,
} from '@/lib/station-prediction-copy';
import { isBacktestReliable } from '@/lib/prediction-backtest';
import { TIMEZONE } from '@/lib/timezone';

export type StationPredictionRow = {
  horizonMinutes: number;
  timeLabel: string;
  bikes: number;
  low: number;
  high: number;
  confidence: PredictionConfidenceLevel;
  sentence: string;
  /** Acierto medido (+-1 bici) o null si no hay muestra suficiente. */
  accuracy: { percent: number; text: string } | null;
};

export type StationPredictionView = {
  /** `ok` con filas fiables; `partial` si alguna es de confianza baja; `empty` sin datos. */
  state: Extract<DataState, 'ok' | 'partial' | 'empty'>;
  rows: StationPredictionRow[];
  advice: string | null;
  /** `measured` si alguna fila trae acierto medido; si no, la tarjeta degrada. */
  accuracy: 'measured' | 'unmeasured';
};

const timeFormatter = new Intl.DateTimeFormat('es-ES', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function confidenceLevel(confidence: number): PredictionConfidenceLevel {
  if (confidence >= 0.75) return 'alta';
  if (confidence >= 0.55) return 'media';
  return 'baja';
}

/**
 * Rango heurístico (no un intervalo estadístico): el modelo solo expone una
 * confianza 0.42-0.92, así que el semiancho crece cuando baja la confianza y
 * con el horizonte. Cota mínima de 1 bici.
 */
export function predictionRange(
  bikes: number,
  capacity: number,
  confidence: number,
  horizonMinutes: number
): { low: number; high: number } {
  const horizonFactor = horizonMinutes >= 60 ? 1.25 : 1;
  const halfWidth = Math.max(1, Math.round(capacity * (1 - confidence) * 0.5 * horizonFactor));
  return {
    low: clamp(bikes - halfWidth, 0, capacity),
    high: clamp(bikes + halfWidth, 0, capacity),
  };
}

export function buildStationPredictionView(input: {
  predictions: StationPredictionsResponse | null | undefined;
  capacity: number;
  now?: Date;
  locale?: Locale;
}): StationPredictionView {
  const { predictions, capacity } = input;
  const locale = input.locale ?? DEFAULT_LOCALE;
  const copy = getStationPredictionCopy(locale);
  const base = input.now ?? new Date(predictions?.generatedAt ?? Date.now());
  const empty: StationPredictionView = {
    state: 'empty',
    rows: [],
    advice: null,
    accuracy: 'unmeasured',
  };

  if (!predictions || !Number.isFinite(capacity) || capacity <= 0 || Number.isNaN(base.getTime())) {
    return empty;
  }

  const rows: StationPredictionRow[] = [];
  for (const point of predictions.predictions) {
    if (
      point.predictedBikesAvailable === null ||
      point.confidence === null ||
      !Number.isFinite(point.predictedBikesAvailable)
    ) {
      continue;
    }
    const bikes = clamp(Math.round(point.predictedBikesAvailable), 0, capacity);
    // Rango calibrado con backtest si existe; si no, heurística por confianza.
    const measuredHalfWidth =
      point.rangeHalfWidth !== undefined && Number.isFinite(point.rangeHalfWidth)
        ? Math.max(1, Math.round(point.rangeHalfWidth))
        : null;
    const { low, high } =
      measuredHalfWidth === null
        ? predictionRange(bikes, capacity, point.confidence, point.horizonMinutes)
        : { low: clamp(bikes - measuredHalfWidth, 0, capacity), high: clamp(bikes + measuredHalfWidth, 0, capacity) };
    const measured = point.backtest && isBacktestReliable(point.backtest) ? point.backtest : null;
    const percent = measured ? Math.round(clamp(measured.hitRateWithin1, 0, 1) * 100) : null;
    const confidence = confidenceLevel(point.confidence);
    const timeLabel = timeFormatter.format(new Date(base.getTime() + point.horizonMinutes * 60_000));
    rows.push({
      horizonMinutes: point.horizonMinutes,
      timeLabel,
      bikes,
      low,
      high,
      confidence,
      sentence: formatPredictionSentence({ timeLabel, bikes, low, high, confidence }, locale),
      accuracy:
        percent === null
          ? null
          : { percent, text: formatPredictionAccuracy({ horizonMinutes: point.horizonMinutes, percent }, locale) },
    });
  }

  if (rows.length === 0) return empty;

  const occupancy = rows[0].bikes / capacity;
  const advice =
    occupancy > OCCUPANCY_THRESHOLDS.nearlyFull
      ? copy.adviceFillsSoon
      : occupancy < OCCUPANCY_THRESHOLDS.nearlyEmpty
        ? copy.adviceEmptiesSoon
        : copy.adviceStable;

  return {
    state: rows.some((row) => row.confidence === 'baja') ? 'partial' : 'ok',
    rows,
    advice,
    accuracy: rows.some((row) => row.accuracy) ? 'measured' : 'unmeasured',
  };
}
