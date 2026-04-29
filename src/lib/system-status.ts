import { openApiDocument } from '@/lib/openapi-document';
import { appRoutes } from '@/lib/routes';
import type { SharedDatasetSnapshot, StationsResponse, StatusResponse } from './api';

export type SystemCapability = {
  id:
    | 'predictions'
    | 'rankings'
    | 'history'
    | 'api'
    | 'scrapers'
    | 'ingestion';
  label: string;
  href: string;
  state: 'healthy' | 'degraded' | 'down';
  description: string;
};

export type SystemIncident = {
  id: string;
  severity: 'healthy' | 'degraded' | 'down';
  title: string;
  description: string;
};

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatStatusDateTime(value: string | null | undefined): string {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleString('es-ES') : 'Sin datos';
}

export function formatStatusNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value);
}

export function getHealthLabel(status: StatusResponse['pipeline']['healthStatus']): string {
  switch (status) {
    case 'healthy':
      return 'Saludable';
    case 'degraded':
      return 'Degradado';
    case 'down':
      return 'Caido';
    default:
      return 'Desconocido';
  }
}

export function getHealthToneClasses(
  status: 'healthy' | 'degraded' | 'down'
): string {
  switch (status) {
    case 'healthy':
      return 'border-emerald-500/40 bg-emerald-500/12 text-emerald-200';
    case 'degraded':
      return 'border-amber-500/40 bg-amber-500/12 text-amber-200';
    case 'down':
      return 'border-rose-500/40 bg-rose-500/12 text-rose-200';
    default:
      return 'border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]';
  }
}

export function getObservedCadenceLabel(status: StatusResponse): string {
  if (status.pipeline.pollsLast24Hours <= 0) {
    return 'Sin datos recientes';
  }

  const minutes = Math.max(1, Math.round((24 * 60) / status.pipeline.pollsLast24Hours));
  return `~${minutes} min por sondeo`;
}

export function getPipelineLagMinutes(status: StatusResponse): number | null {
  const lastPoll = toDate(status.pipeline.lastSuccessfulPoll);
  if (!lastPoll) {
    return null;
  }

  return Math.max(0, Math.round((Date.now() - lastPoll.getTime()) / 60_000));
}

export function getPipelineLagLabel(status: StatusResponse): string {
  const lagMinutes = getPipelineLagMinutes(status);

  if (lagMinutes === null) {
    return 'Sin referencia';
  }

  if (lagMinutes < 1) {
    return '<1 min';
  }

  return `${lagMinutes} min`;
}

export function getCoverageLabel(dataset: SharedDatasetSnapshot): string {
  const firstRecordedAt = formatStatusDateTime(dataset.coverage.firstRecordedAt);
  const lastRecordedAt = formatStatusDateTime(dataset.coverage.lastRecordedAt);

  return `${dataset.coverage.totalDays} dias · ${firstRecordedAt} -> ${lastRecordedAt}`;
}

export function getDatasetVersionLabel(dataset: SharedDatasetSnapshot): string {
  const versionSeed =
    dataset.lastUpdated.lastSampleAt ??
    dataset.coverage.lastRecordedAt ??
    dataset.coverage.generatedAt;

  const parsed = toDate(versionSeed);

  if (!parsed) {
    return 'Sin version derivada';
  }

  const datePart = parsed.toISOString().slice(0, 10).replace(/-/g, '');
  return `cov-${datePart}-${dataset.coverage.totalSamples}`;
}

export function getApiVersionLabel(): string {
  return openApiDocument.info.version;
}

export function buildSystemIncidents(
  status: StatusResponse,
  dataset: SharedDatasetSnapshot
): SystemIncident[] {
  const incidents: SystemIncident[] = [];

  if (status.pipeline.healthReason) {
    incidents.push({
      id: 'pipeline-health',
      severity: status.pipeline.healthStatus,
      title: `Pipeline ${getHealthLabel(status.pipeline.healthStatus).toLowerCase()}`,
      description: status.pipeline.healthReason,
    });
  }

  if (!status.quality.freshness.isFresh) {
    incidents.push({
      id: 'freshness',
      severity: status.pipeline.healthStatus === 'down' ? 'down' : 'degraded',
      title: 'Datos sin frescura operativa',
      description: `La ultima muestra confirmada es ${formatStatusDateTime(
        status.quality.freshness.lastUpdated
      )}.`,
    });
  }

  if (status.pipeline.validationErrors > 0) {
    incidents.push({
      id: 'validation-errors',
      severity: status.pipeline.validationErrors > 10 ? 'down' : 'degraded',
      title: 'Errores de validacion acumulados',
      description: `${formatStatusNumber(status.pipeline.validationErrors)} incidencias de validacion registradas.`,
    });
  }

  if (dataset.coverage.totalDays === 0 || dataset.stats.totalSamples === 0) {
    incidents.push({
      id: 'coverage',
      severity: 'down',
      title: 'Sin cobertura historica suficiente',
      description: 'No hay historial agregado suficiente para alimentar rankings, predicciones o series temporales.',
    });
  }

  if (incidents.length === 0) {
    incidents.push({
      id: 'no-incidents',
      severity: 'healthy',
      title: 'Sin incidentes activos',
      description: 'La ingesta, la cobertura y la API responden dentro de los umbrales esperados.',
    });
  }

  return incidents;
}

export function buildSystemCapabilities(
  status: StatusResponse,
  dataset: SharedDatasetSnapshot,
  stations: StationsResponse
): SystemCapability[] {
  const hasHistory = dataset.coverage.totalDays > 0 && dataset.stats.totalSamples > 0;
  const hasLiveStations = stations.stations.length > 0 || status.quality.volume.recentStationCount > 0;
  const predictionsState =
    hasHistory && status.quality.freshness.lastUpdated
      ? status.pipeline.healthStatus === 'down'
        ? 'degraded'
        : 'healthy'
      : 'down';
  const rankingsState =
    hasHistory && dataset.stats.totalStations > 0
      ? status.pipeline.healthStatus === 'down'
        ? 'degraded'
        : 'healthy'
      : 'down';
  const historyState = hasHistory ? 'healthy' : 'down';
  const apiState = status.pipeline.healthStatus;
  const scrapersState = status.pipeline.pollsLast24Hours > 0 ? status.pipeline.healthStatus : 'down';
  const ingestionState = status.quality.freshness.isFresh
    ? status.pipeline.healthStatus === 'down'
      ? 'degraded'
      : 'healthy'
    : status.pipeline.healthStatus === 'healthy'
      ? 'degraded'
      : 'down';

  return [
    {
      id: 'predictions',
      label: 'Estado predicciones',
      href: appRoutes.dashboardView('data'),
      state: predictionsState,
      description: hasHistory
        ? 'La capa predictiva puede combinar historico y snapshot actual.'
        : 'Falta historico suficiente para sostener predicciones fiables.',
    },
    {
      id: 'rankings',
      label: 'Estado rankings',
      href: appRoutes.dashboardView('operations'),
      state: rankingsState,
      description: hasHistory
        ? 'Hay cobertura agregada para priorizacion por uso y disponibilidad.'
        : 'Los rankings necesitan historico agregado para ser consistentes.',
    },
    {
      id: 'history',
      label: 'Estado historico',
      href: appRoutes.dashboardView('data'),
      state: historyState,
      description: hasHistory
        ? `${formatStatusNumber(dataset.stats.totalSamples)} muestras agregadas disponibles.`
        : 'No hay muestras agregadas suficientes para auditoria o series temporales.',
    },
    {
      id: 'api',
      label: 'Estado API',
      href: appRoutes.developers(),
      state: apiState,
      description: hasLiveStations
        ? `La API publica sirve snapshots con version ${getApiVersionLabel()}.`
        : 'La API no tiene snapshot operativo reciente que publicar.',
    },
    {
      id: 'scrapers',
      label: 'Estado scrapers',
      href: appRoutes.api.status(),
      state: scrapersState,
      description:
        status.pipeline.pollsLast24Hours > 0
          ? `${formatStatusNumber(status.pipeline.pollsLast24Hours)} recogidas registradas en 24 horas.`
          : 'No hay recogidas recientes registradas.',
    },
    {
      id: 'ingestion',
      label: 'Estado ingestion',
      href: appRoutes.status(),
      state: ingestionState,
      description: status.quality.freshness.isFresh
        ? `Ultima muestra util ${formatStatusDateTime(status.quality.freshness.lastUpdated)}.`
        : 'La ingesta va retrasada respecto al umbral de frescura esperado.',
    },
  ];
}
