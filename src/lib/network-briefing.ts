import type { StationSnapshot } from '@/lib/api-types';
import { formatFreshnessLabel } from '@/lib/freshness';
import { buildNetworkHealth, hasNoAvailability } from '@/lib/network-health';
import type { NetworkHealth, NetworkHealthLevel } from '@/lib/network-health';

export type NetworkBriefingInput = {
  stations: StationSnapshot[];
  activeAlertsCount: number;
  coverageDays: number;
  lastUpdatedAt: string | null;
  pipelineHealthy: boolean;
  baseline?: NetworkBriefingBaseline | null;
};

export type NetworkBriefingBaseline = {
  criticalStationsCount: number;
  activeAlertsCount: number | null;
  label: string;
};

export type NetworkBriefing = {
  state: 'balanced' | 'tense' | 'strained' | 'insufficient';
  health: NetworkHealth;
  current: string;
  comparison: string;
  focus: string;
  alerts: string;
  dataQuality: string;
  warning: string | null;
};

const BRIEFING_STATE_BY_HEALTH_LEVEL: Record<NetworkHealthLevel, NetworkBriefing['state']> = {
  green: 'balanced',
  yellow: 'tense',
  red: 'strained',
  unknown: 'insufficient',
};

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function buildNetworkBriefing(input: NetworkBriefingInput): NetworkBriefing {
  const health = buildNetworkHealth({
    stations: input.stations,
    pipelineHealthy: input.pipelineHealthy,
    lastUpdatedAt: input.lastUpdatedAt,
  });
  const criticalStations = input.stations.filter(hasNoAvailability);
  const focusStation = criticalStations[0] ?? null;
  const hasEnoughEvidence = input.stations.length > 0 && Boolean(input.lastUpdatedAt) && input.coverageDays > 0;

  if (!hasEnoughEvidence) {
    return {
      state: 'insufficient',
      health,
      current: 'Ahora mismo no hay datos suficientes para resumir la red.',
      comparison: 'Todavía no se puede comparar con otro momento.',
      focus: 'No se puede destacar ninguna estación con los datos disponibles.',
      alerts: 'No se puede resumir el estado de las alertas con los datos disponibles.',
      dataQuality: `Cobertura disponible: ${Math.max(0, input.coverageDays)} ${pluralize(Math.max(0, input.coverageDays), 'día', 'días')}.`,
      warning: 'Faltan datos para ofrecer un resumen fiable.',
    };
  }

  const criticalCount = health.criticalStationsCount;
  const current = criticalCount > 0
    ? `Ahora mismo, ${criticalCount} ${pluralize(criticalCount, 'estación no tiene', 'estaciones no tienen')} bicis o huecos libres.`
    : 'Ahora mismo todas las estaciones tienen bicis y huecos libres.';
  const criticalDifference = input.baseline
    ? criticalCount - input.baseline.criticalStationsCount
    : null;
  const comparison = input.baseline && criticalDifference !== null
    ? criticalDifference === 0
      ? `Hay el mismo número que en ${input.baseline.label}.`
      : `Hay ${Math.abs(criticalDifference)} ${pluralize(Math.abs(criticalDifference), 'estación', 'estaciones')} ${criticalDifference > 0 ? 'más' : 'menos'} que en ${input.baseline.label}.`
    : 'Aún no hay otro momento comparable para saber si la situación ha cambiado.';
  const focus = focusStation
    ? `La estación que más conviene revisar ahora es ${focusStation.name}.`
    : 'No hay ninguna estación que requiera atención especial ahora.';
  const alerts = input.baseline?.activeAlertsCount != null
    ? `Hay ${input.activeAlertsCount} ${pluralize(input.activeAlertsCount, 'alerta activa', 'alertas activas')}. Se puede comparar con ${input.baseline.label}.`
    : `Hay ${input.activeAlertsCount} ${pluralize(input.activeAlertsCount, 'alerta activa', 'alertas activas')}. Aún no se puede comparar su evolución.`;
  const freshness = input.lastUpdatedAt ? formatFreshnessLabel(input.lastUpdatedAt) : 'sin fecha';

  return {
    state: BRIEFING_STATE_BY_HEALTH_LEVEL[health.level],
    health,
    current,
    comparison,
    focus,
    alerts,
    dataQuality: `Datos ${input.pipelineHealthy ? 'actualizándose con normalidad' : 'con una incidencia en la actualización'}; última actualización ${freshness}; cobertura de ${input.coverageDays} ${pluralize(input.coverageDays, 'día', 'días')}.`,
    warning: null,
  };
}
