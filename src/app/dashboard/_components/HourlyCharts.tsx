import type { StationPatternRow } from '@/lib/api';

type HourlyChartsProps = {
  stationId: string;
  stationName: string;
  patterns: StationPatternRow[];
};

export function HourlyCharts({ stationId, stationName, patterns }: HourlyChartsProps) {
  const countsByDayType = patterns.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.dayType);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const summaryEntries = Object.entries(countsByDayType);

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Patrones por hora
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Estacion {stationName} ({stationId || 'sin seleccion'})
        </p>
      </header>
      <div className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          Resumen inicial
        </p>
        <p className="text-sm text-[var(--foreground)]">
          {patterns.length} filas de patrones cargadas.
        </p>
        {summaryEntries.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">Sin datos por tipo de dia.</p>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
            {summaryEntries.map(([dayType, count]) => (
              <div key={dayType} className="flex items-center justify-between">
                <span>{dayType}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
