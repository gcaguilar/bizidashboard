type DailyDemandRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

type DemandFlowCardProps = {
  dailyDemand: DailyDemandRow[];
};

function formatDayLabel(day: string): string {
  if (typeof day !== 'string' || day.length < 10) {
    return day;
  }

  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

export function DemandFlowCard({ dailyDemand }: DemandFlowCardProps) {
  const rows = dailyDemand.slice(-12);
  const maxDemand = Math.max(1, ...rows.map((row) => Number(row.demandScore) || 0));

  return (
    <section className="dashboard-card h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--foreground)]">
          Flujo diario de demanda
        </h3>
        <span className="text-xs text-[var(--muted)]">Indice de demanda</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-sm text-[var(--muted)]">
          Sin datos de demanda.
        </div>
      ) : (
        <>
          <div className="flex h-48 items-end gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
            {rows.map((row, index) => {
              const score = Number(row.demandScore) || 0;
              const height = Math.max(12, Math.round((score / maxDemand) * 100));
              const alpha = 0.2 + ((index + 1) / rows.length) * 0.8;

              return (
                <div key={`${row.day}-${index}`} className="group flex h-full w-full items-end">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${height}%`,
                      backgroundColor: `rgba(234, 6, 21, ${alpha.toFixed(2)})`,
                    }}
                    title={`${formatDayLabel(row.day)} · ${score.toFixed(1)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-[var(--muted)]">
            <span>{formatDayLabel(rows[0]?.day ?? '')}</span>
            <span>{formatDayLabel(rows[Math.floor(rows.length / 2)]?.day ?? '')}</span>
            <span>{formatDayLabel(rows[rows.length - 1]?.day ?? '')}</span>
          </div>
        </>
      )}
    </section>
  );
}
