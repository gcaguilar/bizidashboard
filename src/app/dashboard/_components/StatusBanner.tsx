import type { StatusResponse } from '@/lib/api';
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

function getHealthStyle(statusLabel: string): string {
  switch (statusLabel) {
    case 'healthy':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    case 'degraded':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    case 'down':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-400/30';
  }
}

export function StatusBanner({ status, stationsGeneratedAt, coverage, lastSampleAt }: StatusBannerProps) {
  const lastUpdated = lastSampleAt ?? status.quality.freshness.lastUpdated ?? stationsGeneratedAt ?? null;
  const updatedText = formatFreshnessLabel(lastUpdated);
  const volumeRange = status.quality.volume.expectedRange;
  const coverageGeneratedText = formatFreshnessLabel(coverage?.generatedAt ?? null);

  return (
    <section className="dashboard-card gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Resumen del sistema</p>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Resumen de salud del sistema</h2>
          <p className="text-xs text-[var(--muted)]">
            Actualizacion {updatedText} · cobertura {coverage?.totalDays ?? 0} dias · entorno {status.system.environment}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthStyle(status.pipeline.healthStatus)}`}
        >
          {translateHealthStatus(status.pipeline.healthStatus)}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <article className="stat-card min-w-0">
          <p className="stat-label">Ultimo sondeo</p>
          <p className="break-words text-sm font-semibold leading-snug text-[var(--foreground)]">
            {status.pipeline.lastSuccessfulPoll
              ? new Date(status.pipeline.lastSuccessfulPoll).toLocaleString('es-ES')
              : 'Sin datos'}
          </p>
        </article>
        <article className="stat-card min-w-0">
          <p className="stat-label">Sondeos 24h</p>
          <p className="stat-value">{status.pipeline.pollsLast24Hours}</p>
        </article>
        <article className="stat-card min-w-0">
          <p className="stat-label">Estaciones recientes</p>
          <p className="stat-value">{status.quality.volume.recentStationCount}</p>
          <p className="text-[11px] text-[var(--muted)]">
            Rango esperado {volumeRange.min}-{volumeRange.max}
          </p>
        </article>
        <article className="stat-card min-w-0">
          <p className="stat-label">Errores de validacion</p>
          <p className="stat-value">{status.pipeline.validationErrors}</p>
        </article>
        <article className="stat-card min-w-0">
          <p className="stat-label">Fallos consecutivos</p>
          <p className="stat-value">{status.pipeline.consecutiveFailures}</p>
        </article>
        <article className="stat-card min-w-0">
          <p className="stat-label">Cobertura dataset</p>
          <p className="stat-value">{coverage?.totalDays ?? 0}</p>
          <p className="text-[11px] text-[var(--muted)]">
            {coverage?.totalStations ?? 0} estaciones · generado {coverageGeneratedText}
          </p>
        </article>
      </div>

      {status.pipeline.healthReason ? (
        <p className="break-words rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
          Motivo del estado: {translateHealthReason(status.pipeline.healthReason)}
        </p>
      ) : null}
    </section>
  );
}
