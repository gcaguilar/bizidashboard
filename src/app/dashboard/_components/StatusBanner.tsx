import type { StatusResponse } from '@/lib/api';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/ui/metric-card';
import { formatFreshnessLabel } from '@/lib/freshness';
import type { CoverageSummary } from '@/services/shared-data/types';

function translateHealthStatus(statusLabel: string): string {
  switch (statusLabel) {
    case 'healthy':
      return 'saludable';
    case 'degraded':
      return 'degradado';
    case 'down':
      return 'caido';
    default:
      return statusLabel || 'desconocido';
  }
}

function translateHealthReason(reason: string): string {
  return reason
    .replace('Pipeline has ', 'El pipeline acumula ')
    .replace(' consecutive failures', ' fallos consecutivos')
    .replace('No successful poll in the last 15 minutes', 'No ha habido una recogida correcta en los ultimos 15 minutos')
    .replace('No successful poll in the last hour', 'No ha habido una recogida correcta en la ultima hora')
    .replace('Only ', 'Solo hubo ')
    .replace(' polls in last 24h', ' recogidas en las ultimas 24h')
    .replace('expected ~288', 'esperadas ~288')
    .replace('(last:', '(ultima correcta:');
}

type StatusBannerProps = {
  status: StatusResponse;
  stationsGeneratedAt?: string | null;
  coverage?: CoverageSummary | null;
  lastSampleAt?: string | null;
};

function getHealthVariant(statusLabel: string): 'success' | 'warning' | 'danger' | 'muted' {
  switch (statusLabel) {
    case 'healthy':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'down':
      return 'danger';
    default:
      return 'muted';
  }
}

export function StatusBanner({ status, stationsGeneratedAt, coverage, lastSampleAt }: StatusBannerProps) {
  const lastUpdated = lastSampleAt ?? status.quality.freshness.lastUpdated ?? stationsGeneratedAt ?? null;
  const updatedText = formatFreshnessLabel(lastUpdated);
  const volumeRange = status.quality.volume.expectedRange;
  const coverageGeneratedText = formatFreshnessLabel(coverage?.generatedAt ?? null);

  return (
    <section className="ui-section-card gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Resumen del sistema</p>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Resumen de salud del sistema</h2>
          <p className="text-xs text-[var(--muted)]">
            Actualizacion {updatedText} · cobertura {coverage?.totalDays ?? 0} dias · entorno {status.system.environment}
          </p>
        </div>
        <Badge variant={getHealthVariant(status.pipeline.healthStatus)}>
          {translateHealthStatus(status.pipeline.healthStatus)}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          className="min-w-0"
          label="Ultimo sondeo"
          value={
            <span className="break-words text-sm font-semibold leading-snug text-[var(--foreground)]">
              {status.pipeline.lastSuccessfulPoll
                ? new Date(status.pipeline.lastSuccessfulPoll).toLocaleString('es-ES')
                : 'Sin datos'}
            </span>
          }
        />
        <MetricCard className="min-w-0" label="Sondeos 24h" value={status.pipeline.pollsLast24Hours} />
        <MetricCard
          className="min-w-0"
          label="Estaciones recientes"
          value={status.quality.volume.recentStationCount}
          detail={`Rango esperado ${volumeRange.min}-${volumeRange.max}`}
        />
        <MetricCard className="min-w-0" label="Errores de validacion" value={status.pipeline.validationErrors} />
        <MetricCard className="min-w-0" label="Fallos consecutivos" value={status.pipeline.consecutiveFailures} />
        <MetricCard
          className="min-w-0"
          label="Cobertura dataset"
          value={coverage?.totalDays ?? 0}
          detail={`${coverage?.totalStations ?? 0} estaciones · generado ${coverageGeneratedText}`}
        />
      </div>

      {status.pipeline.healthReason ? (
        <Alert className="text-xs leading-relaxed text-[var(--muted)]">
          Motivo del estado: {translateHealthReason(status.pipeline.healthReason)}
        </Alert>
      ) : null}
    </section>
  );
}
