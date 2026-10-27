import { ANALYTICS_WINDOWS } from '@/analytics/types';
import type { RankingRow } from '@/lib/api-types';
import type { StationSeoSummary } from '@/lib/seo-stations';

/** Subconjunto de `StationSeoSummary` que pinta el diagnóstico de la portada. */
export type HomeDiagnosisSummary = Pick<
  StationSeoSummary,
  'station' | 'districtName' | 'currentOccupancy'
> & {
  turnover: Pick<RankingRow, 'turnoverScore'> | null;
  availability: Pick<RankingRow, 'emptyHours' | 'fullHours' | 'totalHours'> | null;
};

/** Disponibilidad histórica tal y como llega del ranking (números o strings). */
export type AvailabilityLike = {
  emptyHours: number | string | null;
  fullHours: number | string | null;
  totalHours: number | string | null;
} | null | undefined;

/**
 * Etiqueta ciudadana del problema dominante de una estación: vaciado o
 * saturación. Solo destaca la cara dominante y solo si explica al menos el 15%
 * del periodo; si no, no inventa diagnóstico (null).
 */
export function buildStationIssueLabel(availability: AvailabilityLike): string | null {
  if (!availability) {
    return null;
  }

  const emptyHours = Number(availability.emptyHours ?? 0);
  const fullHours = Number(availability.fullHours ?? 0);
  const totalHours = Number(availability.totalHours ?? 0);

  if (!Number.isFinite(emptyHours) || !Number.isFinite(fullHours) || totalHours <= 0) {
    return null;
  }

  const emptyShare = emptyHours / totalHours;
  const fullShare = fullHours / totalHours;
  const windowLabel = `últimos ${ANALYTICS_WINDOWS.rankingDays} días`;

  if (emptyShare >= fullShare && emptyShare >= 0.15) {
    return `Sin bicis el ${Math.round(emptyShare * 100)}% del tiempo (${windowLabel})`;
  }

  if (fullShare > emptyShare && fullShare >= 0.15) {
    return `Llena el ${Math.round(fullShare * 100)}% del tiempo (${windowLabel})`;
  }

  return null;
}

/** Foto actual de la estación, sin acoplar a utilidades de formato de React. */
export function buildStationCurrentLabel(station: {
  bikesAvailable: number;
  anchorsFree: number;
}): string {
  return `Ahora: ${station.bikesAvailable} bicis · ${station.anchorsFree} huecos`;
}
