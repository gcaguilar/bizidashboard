import type { StationSnapshot } from '@/lib/api-types';
import { formatFreshnessLabel } from '@/lib/freshness';

export type NetworkBriefingInput = {
  stations: StationSnapshot[];
  activeAlertsCount: number;
  coverageDays: number;
  lastUpdatedAt: string | null;
  pipelineHealthy: boolean;
  baseline?: {
    criticalStationsCount: number;
    activeAlertsCount: number;
    label: string;
  } | null;
};

export type NetworkBriefing = {
  state: 'balanced' | 'tense' | 'insufficient';
  current: string;
  comparison: string;
  focus: string;
  alerts: string;
  dataQuality: string;
  warning: string | null;
};

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function buildNetworkBriefing(input: NetworkBriefingInput): NetworkBriefing {
  const criticalStations = input.stations.filter(
    (station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0
  );
  const focusStation = criticalStations[0] ?? null;
  const hasEnoughEvidence = input.stations.length > 0 && Boolean(input.lastUpdatedAt) && input.coverageDays > 0;

  if (!hasEnoughEvidence) {
    return {
      state: 'insufficient',
      current: 'No hay evidencia suficiente para describir el estado actual de la red.',
      comparison: 'Comparación no disponible: falta una muestra actual o cobertura histórica.',
      focus: 'No se identifica una zona o estación a vigilar sin una muestra suficiente.',
      alerts: 'Las alertas no se interpretan mientras la evidencia sea incompleta.',
      dataQuality: `Cobertura disponible: ${Math.max(0, input.coverageDays)} ${pluralize(Math.max(0, input.coverageDays), 'día', 'días')}.`,
      warning: 'La información disponible no permite extraer una conclusión operativa.',
    };
  }

  const criticalCount = criticalStations.length;
  const current = criticalCount > 0
    ? `La red presenta tensión: ${criticalCount} ${pluralize(criticalCount, 'estación está', 'estaciones están')} en estado crítico.`
    : 'La última muestra no incluye estaciones vacías ni llenas.';
  const criticalDifference = input.baseline
    ? criticalCount - input.baseline.criticalStationsCount
    : null;
  const comparison = input.baseline
    ? criticalDifference === 0
      ? `Frente a ${input.baseline.label}, el número de estaciones críticas no cambia.`
      : `Frente a ${input.baseline.label}, hay ${Math.abs(criticalDifference)} ${pluralize(Math.abs(criticalDifference), 'estación crítica', 'estaciones críticas')} ${criticalDifference > 0 ? 'más' : 'menos'}.`
    : 'No hay una base comparable suficiente para medir el cambio de tensión.';
  const focus = focusStation
    ? `La señal operativa se concentra en ${focusStation.name}.`
    : 'No hay una estación crítica destacada en la última muestra.';
  const alerts = input.baseline
    ? `${input.activeAlertsCount} ${pluralize(input.activeAlertsCount, 'alerta activa', 'alertas activas')}; comparación disponible con ${input.baseline.label}.`
    : `${input.activeAlertsCount} ${pluralize(input.activeAlertsCount, 'alerta activa', 'alertas activas')}; evolución no disponible sin referencia comparable.`;
  const freshness = input.lastUpdatedAt ? formatFreshnessLabel(input.lastUpdatedAt) : 'sin fecha';

  return {
    state: criticalCount > 0 ? 'tense' : 'balanced',
    current,
    comparison,
    focus,
    alerts,
    dataQuality: `Datos ${input.pipelineHealthy ? 'y pipeline disponibles' : 'con incidencia de pipeline'}; actualizados ${freshness}; cobertura de ${input.coverageDays} ${pluralize(input.coverageDays, 'día', 'días')}.`,
    warning: input.baseline ? null : 'La tendencia se omitió porque no hay una franja equivalente disponible.',
  };
}
