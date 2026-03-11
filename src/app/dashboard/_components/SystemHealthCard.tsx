import { formatPercent } from '@/lib/format';

type SystemHealthCardProps = {
  totalStations: number;
  bikesAvailable: number;
  anchorsFree: number;
  avgOccupancy: number;
  updatedText: string;
};

export function SystemHealthCard({
  totalStations,
  bikesAvailable,
  anchorsFree,
  avgOccupancy,
  updatedText,
}: SystemHealthCardProps) {
  return (
    <article className="dashboard-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Overview</p>
      <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">Salud general del sistema</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">Resumen rapido para entender cuantas estaciones hay, cuantas bicis quedan y como de equilibrada esta la red.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
          <p className="stat-label">Estaciones activas</p>
          <p className="stat-value">{totalStations}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
          <p className="stat-label">Bicis disponibles</p>
          <p className="stat-value">{bikesAvailable}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
          <p className="stat-label">Anclajes libres</p>
          <p className="stat-value">{anchorsFree}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
          <p className="stat-label">Ocupacion media</p>
          <p className="stat-value">{formatPercent(avgOccupancy)}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">Actualizado {updatedText}</p>
    </article>
  );
}
