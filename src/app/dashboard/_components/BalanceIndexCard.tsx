type BalanceIndexCardProps = {
  balanceIndex: number;
  criticalStationsCount: number;
};

function getBalanceTone(value: number): string {
  if (value >= 0.8) return 'text-emerald-400';
  if (value >= 0.6) return 'text-amber-300';
  return 'text-[var(--accent)]';
}

function getBalanceLabel(value: number): string {
  if (value >= 0.8) return 'Sistema equilibrado';
  if (value >= 0.6) return 'Equilibrio mejorable';
  return 'Desequilibrio alto';
}

export function BalanceIndexCard({ balanceIndex, criticalStationsCount }: BalanceIndexCardProps) {
  const percentage = Math.round(balanceIndex * 100);

  return (
    <article className="dashboard-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Operations</p>
          <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">Balance index</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Mide como de cerca esta cada estacion del 50% de ocupacion. Cuanto mas cerca de 1, mas equilibrado esta el sistema.</p>
        </div>
        <a href="/dashboard/ayuda#balance-index" className="text-xs font-semibold text-[var(--accent)] underline-offset-2 hover:underline">
          Entender formula
        </a>
      </div>

      <div className="mt-5 flex items-end gap-4">
        <p className={`text-5xl font-black ${getBalanceTone(balanceIndex)}`}>{percentage}%</p>
        <div className="pb-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">{getBalanceLabel(balanceIndex)}</p>
          <p className="text-xs text-[var(--muted)]">{criticalStationsCount} estaciones en estado critico ahora mismo.</p>
        </div>
      </div>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-black/15">
        <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500" style={{ width: `${percentage}%` }} />
      </div>
    </article>
  );
}
