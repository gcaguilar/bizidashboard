import type { PeakFullHourSlot, StationPatternRow } from '@/lib/api-types';

export type HourSpan = { startHour: number; endHour: number };

export type DayTypeBestTime = {
  dayType: string;
  noBikes: HourSpan[];
  noAnchors: HourSpan[];
  better: HourSpan[];
};

export type StationBestTime = {
  state: 'ok' | 'empty';
  byDayType: DayTypeBestTime[];
};

/** Muestras mínimas por franja para fiarse de la media histórica. */
export const MIN_PATTERN_SAMPLES = 3;
/** Por debajo de este promedio de bicis/huecos se considera "sin ...". */
export const SCARCE_THRESHOLD = 1;
/** A partir de este promedio hay margen cómodo de bicis y de huecos. */
export const COMFORT_THRESHOLD = 2;
const PEAK_FULL_OCCUPANCY = 0.9;
const MAX_SPANS = 3;

export function mergeHours(hours: number[]): HourSpan[] {
  const sorted = Array.from(new Set(hours)).sort((a, b) => a - b);
  const spans: HourSpan[] = [];
  for (const hour of sorted) {
    const last = spans[spans.length - 1];
    if (last && last.endHour === hour) {
      last.endHour = hour + 1;
    } else {
      spans.push({ startHour: hour, endHour: hour + 1 });
    }
  }
  return spans;
}

export function formatHourSpan(span: HourSpan): string {
  const pad = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;
  return `${pad(span.startHour)}-${pad(span.endHour)}`;
}

function limit(spans: HourSpan[]): HourSpan[] {
  return [...spans]
    .sort((a, b) => b.endHour - b.startHour - (a.endHour - a.startHour) || a.startHour - b.startHour)
    .slice(0, MAX_SPANS)
    .sort((a, b) => a.startHour - b.startHour);
}

/**
 * Deduce franjas habituales sin bicis / sin huecos / mejores a partir del
 * histórico por hora. Función pura: no inventa horas sin muestras suficientes.
 */
export function buildStationBestTime(
  patterns: StationPatternRow[],
  peakHours: PeakFullHourSlot[] = []
): StationBestTime {
  const reliable = patterns.filter(
    (row) =>
      Number.isFinite(row.hour) &&
      Number.isFinite(row.bikesAvg) &&
      Number.isFinite(row.anchorsAvg) &&
      row.sampleCount >= MIN_PATTERN_SAMPLES
  );
  const dayTypes = Array.from(new Set(reliable.map((row) => String(row.dayType)))).sort();

  const byDayType: DayTypeBestTime[] = dayTypes.map((dayType) => {
    const rows = reliable.filter((row) => String(row.dayType) === dayType);
    const noBikes = rows.filter((r) => r.bikesAvg < SCARCE_THRESHOLD).map((r) => r.hour);
    const noAnchorHours = rows.filter((r) => r.anchorsAvg < SCARCE_THRESHOLD).map((r) => r.hour);
    const coveredHours = new Set(rows.map((r) => r.hour));
    // Las horas llenas del ranking solo completan horas que el patrón no cubre.
    const peakExtra = peakHours
      .filter(
        (slot) =>
          String(slot.dayType) === dayType &&
          slot.sampleCount >= MIN_PATTERN_SAMPLES &&
          slot.occupancyAvg >= PEAK_FULL_OCCUPANCY &&
          !coveredHours.has(slot.hour)
      )
      .map((slot) => slot.hour);
    const better = rows
      .filter((r) => r.bikesAvg >= COMFORT_THRESHOLD && r.anchorsAvg >= COMFORT_THRESHOLD)
      .map((r) => r.hour);

    return {
      dayType,
      noBikes: limit(mergeHours(noBikes)),
      noAnchors: limit(mergeHours([...noAnchorHours, ...peakExtra])),
      better: limit(mergeHours(better)),
    };
  });

  return { state: byDayType.length > 0 ? 'ok' : 'empty', byDayType };
}
