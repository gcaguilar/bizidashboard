type DailyDemandRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

type DemandFlowCardProps = {
  dailyDemand: DailyDemandRow[];
  windowLabel: string;
  requestedDays: number;
};

const MAX_VISIBLE_BARS = 12;

function formatDayLabel(day: string): string {
  if (typeof day !== 'string' || day.length < 10) {
    return day;
  }

  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

function formatDemandTick(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  if (value >= 100) {
    return String(Math.round(value));
  }

  return value.toFixed(1);
}

export function DemandFlowCard({
  dailyDemand,
  windowLabel,
  requestedDays,
}: DemandFlowCardProps) {
  const rows = (() => {
    if (dailyDemand.length <= MAX_VISIBLE_BARS) {
      return dailyDemand;
    }

    const sampledRows: DailyDemandRow[] = [];
    let previousIndex = -1;

    for (let i = 0; i < MAX_VISIBLE_BARS; i += 1) {
      const index = Math.round((i * (dailyDemand.length - 1)) / (MAX_VISIBLE_BARS - 1));

      if (index === previousIndex) {
        continue;
      }

      sampledRows.push(dailyDemand[index] as DailyDemandRow);
      previousIndex = index;
    }

    return sampledRows;
  })();

  const maxDemand = Math.max(1, ...rows.map((row) => Number(row.demandScore) || 0));
  const daysWithSamples = dailyDemand.filter((row) => Number(row.sampleCount) > 0).length;
  const yAxisTicks = [
    { value: maxDemand, color: 'var(--accent)' },
    { value: maxDemand / 2, color: 'var(--accent-soft)' },
    { value: 0, color: 'var(--muted)' },
  ];

  return (
    <section className="dashboard-card h-full">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--foreground)]">
          Flujo diario de demanda
        </h3>
        <span className="text-right text-xs text-[var(--muted)]">
          {windowLabel} · {dailyDemand.length}/{requestedDays} dias
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-sm text-[var(--muted)]">
          Sin datos de demanda.
        </div>
      ) : (
        <>
          <div className="flex h-48 gap-2">
            <div className="flex w-10 shrink-0 flex-col justify-between py-1 text-right text-[10px] font-bold">
              {yAxisTicks.map((tick, index) => (
                <span key={`${tick.value}-${index}`} style={{ color: tick.color }}>
                  {formatDemandTick(tick.value)}
                </span>
              ))}
            </div>

            <div className="relative flex flex-1 items-end gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-3 py-3">
                {yAxisTicks.map((_, index) => (
                  <span
                    key={`grid-${index}`}
                    className={index === 0 ? 'block h-px' : 'block h-px border-t'}
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: index === 0 ? 'var(--border)' : 'transparent',
                    }}
                  />
                ))}
              </div>

              {rows.map((row, index) => {
                const score = Number(row.demandScore) || 0;
                const height = Math.max(12, Math.round((score / maxDemand) * 100));
                const alpha = 0.2 + ((index + 1) / rows.length) * 0.8;

                return (
                  <div key={`${row.day}-${index}`} className="group relative z-10 flex h-full w-full items-end">
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
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-[var(--muted)]">
            <span>{formatDayLabel(rows[0]?.day ?? '')}</span>
            <span>{formatDayLabel(rows[Math.floor(rows.length / 2)]?.day ?? '')}</span>
            <span>{formatDayLabel(rows[rows.length - 1]?.day ?? '')}</span>
          </div>
          {daysWithSamples < requestedDays ? (
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              Datos reales en {daysWithSamples}/{requestedDays} dias; el resto se completa como 0 por falta de historico.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
