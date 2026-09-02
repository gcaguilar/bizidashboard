import { getMonthBounds, isValidMonthKey } from '@/lib/months';

export type TemporalDailySample = {
  day: string;
  demandScore: number;
  sampleCount: number;
};

export type PeriodCoverage = {
  monthKey: string;
  startAt: string;
  endAt: string;
  coveredDays: number;
  expectedDays: number;
  sampleCount: number;
  isClosed: boolean;
  isComplete: boolean;
  label: 'mes completo' | 'mes en curso' | 'periodo incompleto';
};

export type TemporalComparison = {
  left: PeriodCoverage;
  right: PeriodCoverage | null;
  isComparable: boolean;
  reason: string;
  periodLabel: string;
  normalizedDemandRatio: number | null;
};

function monthDate(monthKey: string, day = 1): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day));
}

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function previousMonthKey(monthKey: string): string | null {
  if (!isValidMonthKey(monthKey)) {
    return null;
  }

  const date = monthDate(monthKey);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return toMonthKey(date);
}

function monthDayCount(monthKey: string): number {
  const { start, endExclusive } = getMonthBounds(monthKey);
  return Math.round((Date.parse(endExclusive) - Date.parse(start)) / 86_400_000);
}

function dayKey(day: string): string | null {
  const match = /^(\d{4}-\d{2})-(\d{2})$/.exec(day);
  return match ? match[2] ?? null : null;
}

function sumDemand(rows: TemporalDailySample[]): number {
  return rows.reduce((sum, row) => sum + Number(row.demandScore), 0);
}

function filteredMonthRows(monthKey: string, rows: TemporalDailySample[]): TemporalDailySample[] {
  return rows.filter(
    (row) =>
      row.day.startsWith(`${monthKey}-`) &&
      Number.isFinite(Number(row.sampleCount)) &&
      Number(row.sampleCount) > 0
  );
}

export function buildPeriodCoverage(
  monthKey: string,
  rows: TemporalDailySample[],
  nowIso: string
): PeriodCoverage {
  const expectedDays = isValidMonthKey(monthKey) ? monthDayCount(monthKey) : 0;
  const now = new Date(nowIso);
  const currentMonth = toMonthKey(now);
  const isClosed = monthKey < currentMonth;
  const monthRows = filteredMonthRows(monthKey, rows);
  const coveredDays = new Set(monthRows.map((row) => row.day)).size;
  const isComplete = isClosed && coveredDays === expectedDays;
  const { start, endExclusive } = getMonthBounds(monthKey);

  return {
    monthKey,
    startAt: start,
    endAt: new Date(Date.parse(endExclusive) - 1).toISOString(),
    coveredDays,
    expectedDays,
    sampleCount: monthRows.reduce((sum, row) => sum + Number(row.sampleCount), 0),
    isClosed,
    isComplete,
    label: isComplete ? 'mes completo' : isClosed ? 'periodo incompleto' : 'mes en curso',
  };
}

/**
 * Compares a month only when its coverage supports a like-for-like reading.
 * For a running month, demand is normalized to the exact calendar days with
 * available samples in the previous month; missing days never become zeros.
 */
export function buildMonthlyTemporalComparison(input: {
  monthKey: string;
  referenceMonthKey?: string | null;
  rows: TemporalDailySample[];
  nowIso: string;
}): TemporalComparison {
  const left = buildPeriodCoverage(input.monthKey, input.rows, input.nowIso);
  const referenceMonthKey = input.referenceMonthKey ?? previousMonthKey(input.monthKey);
  const right = referenceMonthKey
    ? buildPeriodCoverage(referenceMonthKey, input.rows, input.nowIso)
    : null;

  if (!right) {
    return {
      left,
      right: null,
      isComparable: false,
      reason: 'No hay un periodo de referencia equivalente.',
      periodLabel: left.label,
      normalizedDemandRatio: null,
    };
  }

  const leftRows = filteredMonthRows(input.monthKey, input.rows);
  const rightRows = filteredMonthRows(right.monthKey, input.rows);

  if (left.isComplete && right.isComplete) {
    const rightDemand = sumDemand(rightRows);
    return {
      left,
      right,
      isComparable: rightDemand > 0,
      reason:
        rightDemand > 0
          ? 'Ambos meses están cerrados y tienen cobertura completa.'
          : 'El periodo de referencia no tiene demanda suficiente.',
      periodLabel: 'mes completo',
      normalizedDemandRatio:
        rightDemand > 0 ? (sumDemand(leftRows) - rightDemand) / rightDemand : null,
    };
  }

  if (!left.isClosed) {
    const leftDays = new Set(leftRows.map((row) => dayKey(row.day)).filter(Boolean));
    const matchingReferenceRows = rightRows.filter((row) => {
      const key = dayKey(row.day);
      return key !== null && leftDays.has(key);
    });
    const rightDays = new Set(matchingReferenceRows.map((row) => dayKey(row.day)).filter(Boolean));
    const hasEquivalentDays = leftDays.size > 0 && leftDays.size === rightDays.size;
    const referenceDemand = sumDemand(matchingReferenceRows);

    return {
      left,
      right: {
        ...right,
        coveredDays: rightDays.size,
        sampleCount: matchingReferenceRows.reduce((sum, row) => sum + Number(row.sampleCount), 0),
      },
      isComparable: hasEquivalentDays && referenceDemand > 0,
      reason:
        hasEquivalentDays && referenceDemand > 0
          ? 'Mes en curso comparado con los mismos días disponibles del mes anterior.'
          : 'No hay muestras equivalentes suficientes en el mes anterior.',
      periodLabel: hasEquivalentDays ? 'mismos días del mes anterior' : 'comparación no disponible todavía',
      normalizedDemandRatio:
        hasEquivalentDays && referenceDemand > 0
          ? (sumDemand(leftRows) - referenceDemand) / referenceDemand
          : null,
    };
  }

  return {
    left,
    right,
    isComparable: false,
    reason: 'El mes está cerrado pero faltan días o muestras para una comparación fiable.',
    periodLabel: 'comparación no disponible todavía',
    normalizedDemandRatio: null,
  };
}
