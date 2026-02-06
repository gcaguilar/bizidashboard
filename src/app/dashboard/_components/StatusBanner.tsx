import type { StatusResponse } from '@/lib/api';
import { formatRelativeMinutes } from '@/lib/format';

type StatusBannerProps = {
  status: StatusResponse;
  stationsGeneratedAt?: string | null;
};

type HealthBadge = {
  label: string;
  className: string;
};

function formatUpdatedText(value: string | null | undefined): string {
  if (!value) return 'sin datos';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'sin datos';
  const diffMinutes = (Date.now() - date.getTime()) / 60000;
  return formatRelativeMinutes(diffMinutes);
}

function getHealthBadge(status: string): HealthBadge {
  switch (status) {
    case 'healthy':
      return {
        label: 'Saludable',
        className: 'bg-[#e6f4ea] text-[#1a6e2a] border-[#b7e1c0]',
      };
    case 'degraded':
      return {
        label: 'Degradado',
        className: 'bg-[#fff5d7] text-[#8a5b00] border-[#f2d08f]',
      };
    case 'down':
      return {
        label: 'En fallo',
        className: 'bg-[#fde9e7] text-[#9f2f2f] border-[#f3b6b6]',
      };
    default:
      return {
        label: status || 'Desconocido',
        className: 'bg-[#eef1f4] text-[#55606b] border-[#d5dbe1]',
      };
  }
}

export function StatusBanner({ status, stationsGeneratedAt }: StatusBannerProps) {
  const lastUpdated =
    status.quality.freshness.lastUpdated ?? stationsGeneratedAt ?? null;
  const updatedText = formatUpdatedText(lastUpdated);
  const healthBadge = getHealthBadge(status.pipeline.healthStatus);

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 shadow-[var(--shadow)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Estado del sistema
        </h2>
        <p className="text-xs text-[var(--muted)]">Actualizado {updatedText}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs text-[var(--muted)] sm:flex sm:items-center sm:gap-6">
        <div>
          <p className="uppercase tracking-[0.18em]">Salud</p>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${healthBadge.className}`}
          >
            {healthBadge.label}
          </span>
        </div>
        <div>
          <p className="uppercase tracking-[0.18em]">Ultimo sondeo</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {status.pipeline.lastSuccessfulPoll
              ? new Date(status.pipeline.lastSuccessfulPoll).toLocaleString('es-ES')
              : 'Sin datos'}
          </p>
        </div>
        <div>
          <p className="uppercase tracking-[0.18em]">Datos frescos</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {status.quality.freshness.isFresh ? 'Si' : 'No'}
          </p>
        </div>
        <div>
          <p className="uppercase tracking-[0.18em]">Registros</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {status.pipeline.totalRowsCollected}
          </p>
        </div>
      </div>
    </section>
  );
}
