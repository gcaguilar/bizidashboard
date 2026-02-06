import type { HeatmapCell } from '@/lib/api';

type HeatmapProps = {
  stationId: string;
  stationName: string;
  heatmap: HeatmapCell[];
};

function getHeatmapStats(cells: HeatmapCell[]) {
  if (cells.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const totals = cells.reduce(
    (acc, cell) => {
      const value = cell.occupancyAvg;
      acc.min = Math.min(acc.min, value);
      acc.max = Math.max(acc.max, value);
      acc.sum += value;
      return acc;
    },
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, sum: 0 }
  );

  return {
    min: totals.min,
    max: totals.max,
    avg: totals.sum / cells.length,
  };
}

export function Heatmap({ stationId, stationName, heatmap }: HeatmapProps) {
  const stats = getHeatmapStats(heatmap);

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Heatmap de ocupacion
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Estacion {stationName} ({stationId || 'sin seleccion'})
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Celdas cargadas
          </p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {heatmap.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Ocupacion media
          </p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {stats.avg.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Rango
          </p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {stats.min.toFixed(2)} - {stats.max.toFixed(2)}
          </p>
        </div>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Visualizacion completa se integrara en el siguiente plan.
      </p>
    </section>
  );
}
