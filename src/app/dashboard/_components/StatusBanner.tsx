import type { StatusResponse } from '@/lib/api';

type StatusBannerProps = {
  status: StatusResponse;
};

function formatDate(value: string | null): string {
  if (!value) return 'Sin datos';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-ES');
}

export function StatusBanner({ status }: StatusBannerProps) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 shadow-[var(--shadow)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Estado del sistema
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Ultima actualizacion: {formatDate(status.timestamp)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs text-[var(--muted)] sm:flex sm:items-center sm:gap-6">
        <div>
          <p className="uppercase tracking-[0.18em]">Salud</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {status.pipeline.healthStatus}
          </p>
        </div>
        <div>
          <p className="uppercase tracking-[0.18em]">Ultimo sondeo</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {formatDate(status.pipeline.lastSuccessfulPoll)}
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
