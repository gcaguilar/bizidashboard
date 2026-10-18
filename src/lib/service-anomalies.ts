import { getServiceCause, type ServiceCause } from '@/lib/service-calendar';
import { median } from '@/lib/stats';

export type ServiceAnomalyDirection = 'up' | 'down';

export type ServiceAnomaly = {
  day: string;
  demandScore: number;
  baseline: number;
  deviationRatio: number;
  zScore: number | null;
  direction: ServiceAnomalyDirection;
  cause: ServiceCause | null;
};

export type ServiceAnomalyRow = {
  day: string;
  demandScore: number;
  sampleCount: number;
};

const ANOMALY_Z_THRESHOLD = 2.5;
const ANOMALY_FALLBACK_RATIO = 0.35;
const ANOMALY_LIMIT = 8;

function weekdayOf(day: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return null;
  }

  const parsed = new Date(`${day}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) {
    return null;
  }

  return parsed.getUTCDay();
}

/**
 * Detecta dias con un uso anormalmente alto o bajo comparando cada dia con la
 * mediana de su mismo dia de la semana (medida robusta). No atribuye causas: la
 * causa conocida se adjunta solo si aparece en el calendario curado.
 */
export function detectServiceAnomalies(rows: ServiceAnomalyRow[]): ServiceAnomaly[] {
  const threshold = ANOMALY_Z_THRESHOLD;
  const fallbackRatio = ANOMALY_FALLBACK_RATIO;
  const limit = ANOMALY_LIMIT;

  const validRows = rows.filter(
    (row) => Number.isFinite(row.demandScore) && Number(row.sampleCount) > 0
  );

  if (validRows.length < 4) {
    return [];
  }

  const byWeekday = new Map<number, number[]>();
  const allValues: number[] = [];

  for (const row of validRows) {
    const weekday = weekdayOf(row.day);

    if (weekday === null) {
      continue;
    }

    const bucket = byWeekday.get(weekday) ?? [];
    bucket.push(row.demandScore);
    byWeekday.set(weekday, bucket);
    allValues.push(row.demandScore);
  }

  const overallMedian = median(allValues);
  const baselines = new Map<number, { median: number; mad: number }>();

  for (const [weekday, values] of byWeekday.entries()) {
    // Con pocas muestras el dia de la semana no es una referencia fiable: se
    // cae a la mediana global para no marcar falsos positivos.
    const reference = values.length >= 3 ? values : allValues;
    const referenceMedian = median(reference);

    if (values.length >= 3) {
      baselines.set(weekday, { median: referenceMedian, mad: median(reference.map((value) => Math.abs(value - referenceMedian))) });
    }
  }

  const anomalies: ServiceAnomaly[] = [];

  for (const row of validRows) {
    const weekday = weekdayOf(row.day);

    if (weekday === null) {
      continue;
    }

    const baselineEntry = baselines.get(weekday);
    const baseline = baselineEntry ? baselineEntry.median : overallMedian;
    const dispersion = baselineEntry ? baselineEntry.mad : 0;
    const deviationRatio = baseline > 0 ? (row.demandScore - baseline) / baseline : 0;

    let zScore: number | null = null;
    let isAnomaly = false;

    if (baselineEntry && dispersion > 0) {
      zScore = (0.6745 * (row.demandScore - baseline)) / dispersion;
      isAnomaly = Math.abs(zScore) >= threshold;
    } else {
      isAnomaly = Math.abs(deviationRatio) >= fallbackRatio;
    }

    if (!isAnomaly) {
      continue;
    }

    anomalies.push({
      day: row.day,
      demandScore: Math.round(row.demandScore),
      baseline: Math.round(baseline),
      deviationRatio: Number(deviationRatio.toFixed(4)),
      zScore: zScore === null ? null : Number(zScore.toFixed(2)),
      direction: row.demandScore >= baseline ? 'up' : 'down',
      cause: getServiceCause(row.day),
    });
  }

  return anomalies
    .sort((left, right) => Math.abs(right.deviationRatio) - Math.abs(left.deviationRatio))
    .slice(0, limit);
}
