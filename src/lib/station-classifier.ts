import type {
  StationBaseMetrics,
  TimeBandMetrics,
  StationClassification,
  TargetBand,
} from '@/types/rebalancing';

export type MetricsWithSampleCount = StationBaseMetrics & { sampleCount?: number };

export type ClassificationResult = {
  classification: StationClassification;
  reasons: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function isPeakBand(band: TimeBandMetrics): boolean {
  return band.timeBand === 'morning_peak' || band.timeBand === 'evening_peak';
}

function isOffPeakBand(band: TimeBandMetrics): boolean {
  return band.timeBand === 'valley' || band.timeBand === 'night';
}

// ─── Individual classification rules ────────────────────────────────────────

/**
 * Rule F – Data review.
 * Checked FIRST to avoid acting on unreliable data.
 *
 * Triggers when:
 * - Occupancy is suspiciously stable (low variability) but rotation is high
 *   (sensor may be frozen while bikes move)
 * - OR very high persistence (bikes never move) combined with high reported bikes
 */
function checkDataReview(
  metrics: MetricsWithSampleCount,
  rotationPercentile: number
): string | null {
  // Frozen sensor: almost no variability but many samples suggest high activity
  if (metrics.variability < 0.02 && rotationPercentile > 50 && metrics.sampleCount > 20) {
    return (
      `Sensor sospechoso: variabilidad de ocupacion casi nula (${(metrics.variability * 100).toFixed(2)}%) ` +
      `con rotacion en percentil ${rotationPercentile} — posible sensor congelado.`
    );
  }
  // Extreme persistence with non-trivial bikes
  if (metrics.persistenceProxy > 0.85 && metrics.occupancyAvg > 0.3) {
    return (
      `Persistencia extrema: ${fmt(metrics.persistenceProxy)} de horas sin movimiento detectado. ` +
      `Verificar capacidad real y estado de anclajes.`
    );
  }
  return null;
}

/**
 * Rule A – Overstock (sobrestock estructural).
 *
 * Triggers when:
 * - High average occupancy (> 0.70)
 * - Low rotation relative to peers (< 40th percentile)
 * - High immobility (> 40% of hours no bikes moved)
 */
function checkOverstock(
  metrics: MetricsWithSampleCount,
  rotationPercentile: number
): string | null {
  if (
    metrics.occupancyAvg > 0.70 &&
    rotationPercentile < 40 &&
    metrics.persistenceProxy > 0.40
  ) {
    return (
      `Sobrestock estructural: ocupacion media ${fmt(metrics.occupancyAvg)}, ` +
      `rotacion en percentil ${rotationPercentile} (baja), ` +
      `${fmt(metrics.persistenceProxy)} de horas sin movimiento.`
    );
  }
  return null;
}

/**
 * Rule B – Deficit (deficit estructural).
 *
 * Triggers when:
 * - Low average occupancy (< 0.30)
 * - AND high empty time in at least one peak band (> 10%)
 */
function checkDeficit(
  metrics: MetricsWithSampleCount,
  timeBandMetrics: TimeBandMetrics[]
): string | null {
  if (metrics.occupancyAvg >= 0.30) return null;

  const peakBands = timeBandMetrics.filter(isPeakBand);
  const highEmptyPeak = peakBands.find((b) => b.pctTimeEmpty > 0.10);
  if (!highEmptyPeak) return null;

  return (
    `Deficit estructural: ocupacion media ${fmt(metrics.occupancyAvg)}, ` +
    `vacia el ${fmt(highEmptyPeak.pctTimeEmpty)} del tiempo en ${highEmptyPeak.timeBand}.`
  );
}

/**
 * Rule C – Peak saturation (saturacion puntual en hora punta).
 *
 * Triggers when:
 * - At least one peak band has high fullness (> 20%)
 * - AND off-peak bands are mostly normal (< 5%)
 */
function checkPeakSaturation(timeBandMetrics: TimeBandMetrics[]): string | null {
  const peakBands = timeBandMetrics.filter(isPeakBand);
  const offPeakBands = timeBandMetrics.filter(isOffPeakBand);

  const saturatedPeak = peakBands.find((b) => b.pctTimeFull > 0.20);
  if (!saturatedPeak) return null;

  const offPeakNormal = offPeakBands.every((b) => b.pctTimeFull < 0.05);
  if (!offPeakNormal) return null;

  return (
    `Saturacion puntual: llena el ${fmt(saturatedPeak.pctTimeFull)} del tiempo ` +
    `en ${saturatedPeak.timeBand}, normal fuera de picos.`
  );
}

/**
 * Rule D – Peak emptying (vaciado puntual en hora punta).
 *
 * Triggers when:
 * - At least one peak band has high empty time (> 20%)
 * - AND off-peak bands are mostly normal (< 5%)
 */
function checkPeakEmptying(timeBandMetrics: TimeBandMetrics[]): string | null {
  const peakBands = timeBandMetrics.filter(isPeakBand);
  const offPeakBands = timeBandMetrics.filter(isOffPeakBand);

  const emptyPeak = peakBands.find((b) => b.pctTimeEmpty > 0.20);
  if (!emptyPeak) return null;

  const offPeakNormal = offPeakBands.every((b) => b.pctTimeEmpty < 0.05);
  if (!offPeakNormal) return null;

  return (
    `Vaciado puntual: vacia el ${fmt(emptyPeak.pctTimeEmpty)} del tiempo ` +
    `en ${emptyPeak.timeBand}, se recupera fuera de picos.`
  );
}

// ─── Main classifier ─────────────────────────────────────────────────────────

/**
 * Classifies a station into one of six categories (A-F) with traceability reasons.
 *
 * Priority order (first match wins): F > A > B > C > D > E
 *
 * @param metrics          - Aggregate metrics over the analysis window
 * @param timeBandMetrics  - Metrics segmented by time band
 * @param targetBand       - Target occupancy band for the current time context
 * @param rotationPercentile - The station's rotationPerBike percentile (0-100) vs peers
 */
export function classifyStation(
  metrics: MetricsWithSampleCount,
  timeBandMetrics: TimeBandMetrics[],
  _targetBand: TargetBand,
  rotationPercentile: number
): ClassificationResult {
  // F – Data review (checked first)
  const dataReviewReason = checkDataReview(metrics, rotationPercentile);
  if (dataReviewReason) {
    return { classification: 'data_review', reasons: [dataReviewReason] };
  }

  // A – Overstock
  const overstockReason = checkOverstock(metrics, rotationPercentile);
  if (overstockReason) {
    return { classification: 'overstock', reasons: [overstockReason] };
  }

  // B – Deficit
  const deficitReason = checkDeficit(metrics, timeBandMetrics);
  if (deficitReason) {
    return { classification: 'deficit', reasons: [deficitReason] };
  }

  // C – Peak saturation
  const saturationReason = checkPeakSaturation(timeBandMetrics);
  if (saturationReason) {
    return { classification: 'peak_saturation', reasons: [saturationReason] };
  }

  // D – Peak emptying
  const emptyingReason = checkPeakEmptying(timeBandMetrics);
  if (emptyingReason) {
    return { classification: 'peak_emptying', reasons: [emptyingReason] };
  }

  // E – Balanced (default)
  return {
    classification: 'balanced',
    reasons: [
      `Estacion equilibrada: ocupacion media ${fmt(metrics.occupancyAvg)}, ` +
      `${fmt(metrics.pctTimeEmpty)} tiempo vacia, ${fmt(metrics.pctTimeFull)} tiempo llena.`,
    ],
  };
}

