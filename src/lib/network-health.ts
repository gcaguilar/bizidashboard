import type { StationSnapshot } from '@/lib/api-types';
import { formatInteger, formatPercent } from '@/lib/format';

export const NETWORK_HEALTH_THRESHOLDS = {
  /** Proporción máxima de estaciones sin disponibilidad para estado verde. */
  greenUnavailableShare: 0.15,
  /** Proporción a partir de la cual el estado es rojo. */
  redUnavailableShare: 0.35,
  /** Minutos sin actualizar a partir de los cuales el estado es rojo. */
  staleDataMinutes: 30,
} as const;

export type NetworkHealthLevel = 'green' | 'yellow' | 'red' | 'unknown';

export type NetworkHealth = {
  level: NetworkHealthLevel;
  /** Etiqueta corta ciudadana, p. ej. "Red en estado óptimo". */
  label: string;
  /** Motivo del nivel en texto llano con cifras. */
  description: string;
  /** 0..1; proporción de estaciones sin bicis o sin huecos libres; 0 cuando no hay estaciones. */
  unavailableShare: number;
  criticalStationsCount: number;
  totalStations: number;
};

const HEALTH_LABELS: Record<NetworkHealthLevel, string> = {
  green: 'Red en estado óptimo',
  yellow: 'Afectaciones moderadas',
  red: 'Incidencia generalizada',
  unknown: 'Sin datos ahora mismo',
};

/**
 * Una estación "sin disponibilidad" no sirve ahora mismo: no se puede coger una
 * bici (no quedan) o no se puede dejar (no hay huecos libres).
 */
export function hasNoAvailability(station: StationSnapshot): boolean {
  return station.bikesAvailable <= 0 || station.anchorsFree <= 0;
}

/**
 * Umbrales únicos de ocupación para "casi vacía" / "casi llena" en paneles,
 * filtros y avisos ciudadanos. La escala de color del mapa (`map-colors.ts`) y
 * el motor de redistribución usan sus propias bandas a propósito.
 */
export const OCCUPANCY_THRESHOLDS = {
  nearlyEmpty: 0.15,
  nearlyFull: 0.85,
} as const;

/** Ocupación (bicis / capacidad) acotada a 0..1; 0 si la capacidad no es válida. */
export function getOccupancyRatio(station: Pick<StationSnapshot, 'bikesAvailable' | 'capacity'>): number {
  if (!Number.isFinite(station.capacity) || station.capacity <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, station.bikesAvailable / station.capacity));
}

function isDataStale(lastUpdatedAt: string | null, nowIso?: string): boolean {
  if (!lastUpdatedAt) {
    return false;
  }

  const lastUpdatedMs = new Date(lastUpdatedAt).getTime();
  const nowMs = nowIso !== undefined ? new Date(nowIso).getTime() : Date.now();

  if (!Number.isFinite(lastUpdatedMs) || !Number.isFinite(nowMs)) {
    return false;
  }

  return (nowMs - lastUpdatedMs) / 60000 > NETWORK_HEALTH_THRESHOLDS.staleDataMinutes;
}

export function buildNetworkHealth(input: {
  stations: StationSnapshot[];
  pipelineHealthy: boolean;
  lastUpdatedAt: string | null;
  nowIso?: string;
}): NetworkHealth {
  const totalStations = input.stations.length;
  const criticalStationsCount = input.stations.filter(hasNoAvailability).length;

  if (totalStations === 0) {
    return {
      level: 'unknown',
      label: HEALTH_LABELS.unknown,
      description: 'Todavía no hay estaciones con datos para evaluar la red.',
      unavailableShare: 0,
      criticalStationsCount: 0,
      totalStations: 0,
    };
  }

  const unavailableShare = criticalStationsCount / totalStations;
  const isPipelineDown = !input.pipelineHealthy;
  const isStale = isDataStale(input.lastUpdatedAt, input.nowIso);
  const reasons: string[] = [];

  if (isPipelineDown) {
    reasons.push('la recogida de datos no está funcionando');
  }
  if (isStale) {
    reasons.push(`la última actualización fue hace más de ${NETWORK_HEALTH_THRESHOLDS.staleDataMinutes} minutos`);
  }

  let level: NetworkHealthLevel;
  if (isPipelineDown || isStale || unavailableShare >= NETWORK_HEALTH_THRESHOLDS.redUnavailableShare) {
    level = 'red';
  } else if (unavailableShare >= NETWORK_HEALTH_THRESHOLDS.greenUnavailableShare) {
    level = 'yellow';
  } else {
    level = 'green';
  }

  const unavailableSummary = `${formatInteger(criticalStationsCount)} de ${formatInteger(totalStations)} estaciones sin bicis o sin huecos libres (${formatPercent(unavailableShare)})`;
  const description = reasons.length > 0 ? `${unavailableSummary}; ${reasons.join(' y ')}` : unavailableSummary;

  return {
    level,
    label: HEALTH_LABELS[level],
    description,
    unavailableShare,
    criticalStationsCount,
    totalStations,
  };
}
