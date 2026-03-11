import type { StatusResponse } from '@/lib/api';
import { formatRelativeMinutes } from '@/lib/format';

type StatusBannerProps = {
  status: StatusResponse;
  stationsGeneratedAt?: string | null;
};

function formatUpdatedText(value: string | null | undefined): string {
  if (!value) {
    return 'sin datos';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'sin datos';
  }

  const diffMinutes = (Date.now() - date.getTime()) / 60000;
  return formatRelativeMinutes(diffMinutes);
}

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

export function StatusBanner({ status, stationsGeneratedAt }: StatusBannerProps) {
  const lastUpdated = status.quality.freshness.lastUpdated ?? stationsGeneratedAt ?? null;
  const updatedText = formatUpdatedText(lastUpdated);
  const volumeRange = status.quality.volume.expectedRange;

  return (
    <section className="dashboard-card gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">System summary</p>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Resumen de salud del sistema</h2>
          <p className="text-xs text-[var(--muted)]">Freshness {updatedText} · entorno {status.system.environment}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthStyle(status.pipeline.healthStatus)}`}
        >
          {status.pipeline.healthStatus || 'desconocido'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="stat-card">
          <p className="stat-label">Ultimo sondeo</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {status.pipeline.lastSuccessfulPoll
              ? new Date(status.pipeline.lastSuccessfulPoll).toLocaleString('es-ES')
              : 'Sin datos'}
          </p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Sondeos 24h</p>
          <p className="stat-value">{status.pipeline.pollsLast24Hours}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Estaciones recientes</p>
          <p className="stat-value">{status.quality.volume.recentStationCount}</p>
          <p className="text-[11px] text-[var(--muted)]">
            Rango esperado {volumeRange.min}-{volumeRange.max}
          </p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Errores de validacion</p>
          <p className="stat-value">{status.pipeline.validationErrors}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Fallos consecutivos</p>
          <p className="stat-value">{status.pipeline.consecutiveFailures}</p>
        </article>
      </div>

      {status.pipeline.healthReason ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--muted)]">
          Motivo del estado: {status.pipeline.healthReason}
        </p>
      ) : null}
    </section>
  );
}
