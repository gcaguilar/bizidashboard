import type { RankingType } from '@/analytics/queries/read';

export type RawRankingRow = {
  id: number;
  stationId: string;
  turnoverScore: number;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
  windowStart: string;
  windowEnd: string;
};

/** Franjas (laborable / fin de semana + hora) con mayor ocupación media: estación más “llena” de bicis. */
export type PeakFullHourSlot = {
  dayType: string;
  hour: number;
  occupancyAvg: number;
  sampleCount: number;
};

export type EnrichedRankingRow = RawRankingRow & {
  stationName: string;
  districtName: string | null;
  problemHours: number;
  emptyHourShare: number;
  demandVsStressedHint:
    | 'huecos_con_rotacion_alta'
    | 'huecos_con_rotacion_media'
    | 'mucho_vacio_baja_demanda_estimada'
    | 'poco_estres_disponibilidad'
    | 'datos_incompletos';
  peakFullHours: PeakFullHourSlot[];
};

export type DistrictSpotlightRow = {
  districtName: string;
  stationId: string;
  stationName: string;
  turnoverScore: number;
  emptyHours: number;
  fullHours: number;
  problemHours: number;
  emptyHourShare: number;
  demandVsStressedHint: EnrichedRankingRow['demandVsStressedHint'];
  peakFullHours: PeakFullHourSlot[];
};

function quantile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) {
    return 0;
  }
  const clamped = Math.min(1, Math.max(0, q));
  const pos = clamped * (sortedAsc.length - 1);
  const base = Math.floor(pos);
  const next = Math.min(sortedAsc.length - 1, base + 1);
  const t = pos - base;
  return sortedAsc[base]! * (1 - t) + sortedAsc[next]! * t;
}

function turnoverThresholds(turnovers: number[]): { low: number; high: number } {
  const sorted = [...turnovers].sort((a, b) => a - b);
  return { low: quantile(sorted, 0.33), high: quantile(sorted, 0.66) };
}

const DEFAULT_PEAK_HOURS_TOP_N = 3;

/**
 * Por estación: las N franjas con mayor `occupancyAvg` (0–1, bicis/capacidad) en el patrón agregado.
 */
export function buildPeakFullHoursByStation(
  patterns: Array<{
    stationId: string;
    dayType: string;
    hour: number;
    occupancyAvg: number;
    sampleCount: number;
  }>,
  topN = DEFAULT_PEAK_HOURS_TOP_N
): Map<string, PeakFullHourSlot[]> {
  const byStation = new Map<string, typeof patterns>();
  for (const p of patterns) {
    const list = byStation.get(p.stationId) ?? [];
    list.push(p);
    byStation.set(p.stationId, list);
  }

  const out = new Map<string, PeakFullHourSlot[]>();
  for (const [stationId, list] of byStation) {
    const sorted = [...list].sort(
      (a, b) =>
        Number(b.occupancyAvg) - Number(a.occupancyAvg) ||
        Number(b.sampleCount) - Number(a.sampleCount)
    );
    const top = sorted.slice(0, topN).map((p) => ({
      dayType: p.dayType,
      hour: p.hour,
      occupancyAvg: Number(Number(p.occupancyAvg).toFixed(4)),
      sampleCount: p.sampleCount,
    }));
    out.set(stationId, top);
  }
  return out;
}

export function attachPeakFullHours<T extends { stationId: string }>(
  rows: T[],
  peakByStation: Map<string, PeakFullHourSlot[]>
): Array<T & { peakFullHours: PeakFullHourSlot[] }> {
  return rows.map((r) => ({
    ...r,
    peakFullHours: peakByStation.get(r.stationId) ?? [],
  }));
}

/**
 * Añade nombre de estación, barrio (distrito Zaragoza vía GeoJSON) y una lectura heurística:
 * muchas horas vacías + bajo turnover en el lote → posible baja demanda;
 * muchas horas vacías + alto turnover → huecos con rotación (demanda presente).
 */
export function enrichRankingRows(
  rows: RawRankingRow[],
  stationNameById: Map<string, string>,
  districtNameById: Map<string, string>
): EnrichedRankingRow[] {
  const turnovers = rows.map((r) => Number(r.turnoverScore));
  const { low, high } = turnoverThresholds(turnovers);

  return rows.map((row) => {
    const totalHours = Number(row.totalHours) || 0;
    const emptyHours = Number(row.emptyHours) || 0;
    const fullHours = Number(row.fullHours) || 0;
    const turnoverScore = Number(row.turnoverScore) || 0;
    const problemHours = emptyHours + fullHours;
    const emptyHourShare =
      totalHours > 0 ? Number((emptyHours / totalHours).toFixed(4)) : 0;

    let demandVsStressedHint: EnrichedRankingRow['demandVsStressedHint'];
    if (totalHours <= 0) {
      demandVsStressedHint = 'datos_incompletos';
    } else {
      const stress = emptyHours / totalHours;
      const highStress = stress >= 0.12 || emptyHours >= 24;
      if (!highStress) {
        demandVsStressedHint = 'poco_estres_disponibilidad';
      } else if (turnoverScore <= low) {
        demandVsStressedHint = 'mucho_vacio_baja_demanda_estimada';
      } else if (turnoverScore >= high) {
        demandVsStressedHint = 'huecos_con_rotacion_alta';
      } else {
        demandVsStressedHint = 'huecos_con_rotacion_media';
      }
    }

    return {
      ...row,
      stationName: stationNameById.get(row.stationId) ?? `Estación ${row.stationId}`,
      districtName: districtNameById.get(row.stationId) ?? null,
      problemHours,
      emptyHourShare,
      demandVsStressedHint,
      peakFullHours: [],
    };
  });
}

/** Una estación representativa por barrio: máximo estrés (availability) o máximo giro (turnover). */
export function buildDistrictSpotlight(
  enriched: EnrichedRankingRow[],
  type: RankingType
): DistrictSpotlightRow[] {
  const byDistrict = new Map<string, EnrichedRankingRow>();

  for (const row of enriched) {
    const district = row.districtName ?? 'Sin barrio asignado';
    const current = byDistrict.get(district);
    const score =
      type === 'availability' ? row.problemHours : Number(row.turnoverScore);
    const currentScore = current
      ? type === 'availability'
        ? current.problemHours
        : Number(current.turnoverScore)
      : -Infinity;

    if (!current || score > currentScore) {
      byDistrict.set(district, row);
    }
  }

  return Array.from(byDistrict.values())
    .map((r) => ({
      districtName: r.districtName ?? 'Sin barrio asignado',
      stationId: r.stationId,
      stationName: r.stationName,
      turnoverScore: r.turnoverScore,
      emptyHours: r.emptyHours,
      fullHours: r.fullHours,
      problemHours: r.problemHours,
      emptyHourShare: r.emptyHourShare,
      demandVsStressedHint: r.demandVsStressedHint,
      peakFullHours: r.peakFullHours,
    }))
    .sort((a, b) => a.districtName.localeCompare(b.districtName, 'es'));
}
