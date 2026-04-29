type DailyInsightsCardProps = {
  insight: string;
  topFrictionStationName: string | null;
  activeAlertsCount: number;
};

export function DailyInsightsCard({ insight, topFrictionStationName, activeAlertsCount }: DailyInsightsCardProps) {
  return (
    <article className="ui-section-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Lectura diaria</p>
      <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">Lectura rapida del dia</h3>
      <p className="mt-3 text-sm text-[var(--foreground)]">{insight}</p>

      <div className="mt-4 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 text-sm">
        <p className="text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">Estacion a vigilar:</span>{' '}
          {topFrictionStationName ?? 'Sin datos suficientes'}
        </p>
        <p className="text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">Alertas activas:</span> {activeAlertsCount}
        </p>
      </div>
    </article>
  );
}
