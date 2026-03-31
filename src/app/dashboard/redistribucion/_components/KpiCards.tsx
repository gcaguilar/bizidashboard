'use client';

import type { ReportKPIs, BaselineComparison } from '@/types/rebalancing';

type Props = {
  kpis: ReportKPIs;
  baseline: BaselineComparison;
};

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function fmt(v: number | null, unit = ''): string {
  if (v === null) return '—';
  return `${v.toFixed(1)}${unit}`;
}

export function KpiCards({ kpis, baseline }: Props) {
  return (
    <div className="space-y-4">
      {/* Service KPIs */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">KPIs de servicio</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-black tabular-nums text-red-600 dark:text-red-400">
              {pct(kpis.service.systemPctTimeEmpty)}
            </p>
            <p className="text-xs text-[var(--muted)]">% tiempo vacías (sistema)</p>
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-orange-600 dark:text-orange-400">
              {pct(kpis.service.systemPctTimeFull)}
            </p>
            <p className="text-xs text-[var(--muted)]">% tiempo llenas (sistema)</p>
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-[var(--foreground)]">
              {fmt(kpis.service.avgCriticalEpisodeMinutes, ' min')}
            </p>
            <p className="text-xs text-[var(--muted)]">Episodio crítico promedio</p>
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-sky-600 dark:text-sky-400">
              ~{kpis.service.estimatedLostUses.toFixed(0)}
            </p>
            <p className="text-xs text-[var(--muted)]">Usos perdidos estimados</p>
          </div>
        </div>
      </section>

      {/* Impact KPIs */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Impacto esperado de intervenciones</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-black tabular-nums text-green-600 dark:text-green-400">
              {fmt(kpis.impact.totalEmptiesAvoided, 'h')}
            </p>
            <p className="text-xs text-[var(--muted)]">Horas vacías evitadas</p>
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-green-600 dark:text-green-400">
              {fmt(kpis.impact.totalFullsAvoided, 'h')}
            </p>
            <p className="text-xs text-[var(--muted)]">Horas llenas evitadas</p>
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-sky-600 dark:text-sky-400">
              ~{(kpis.impact.totalUsesRecovered).toFixed(0)}
            </p>
            <p className="text-xs text-[var(--muted)]">Usos recuperados</p>
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-[var(--foreground)]">
              {kpis.impact.improvementVsBaselinePct !== null
                ? `${kpis.impact.improvementVsBaselinePct.toFixed(1)}%`
                : '—'}
            </p>
            <p className="text-xs text-[var(--muted)]">Mejora vs sin intervención</p>
          </div>
        </div>
      </section>

      {/* Baseline comparison */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Comparativa de escenarios</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                <th className="pb-2 pr-4">Escenario</th>
                <th className="pb-2 pr-4">Vaciados evitados</th>
                <th className="pb-2 pr-4">Llenos evitados</th>
                <th className="pb-2 pr-4">Movimientos</th>
                <th className="pb-2">Coste / incidente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[baseline.doNothing, baseline.simpleRules, baseline.recommended].map((s) => (
                <tr key={s.label} className={s.label === 'Sistema recomendado' ? 'font-semibold' : ''}>
                  <td className="py-2 pr-4">{s.label}</td>
                  <td className="py-2 pr-4 tabular-nums">{s.emptiesAvoided.toFixed(1)}</td>
                  <td className="py-2 pr-4 tabular-nums">{s.fullsAvoided.toFixed(1)}</td>
                  <td className="py-2 pr-4 tabular-nums">{s.totalMoves}</td>
                  <td className="py-2 tabular-nums">
                    {s.costPerIncidentAvoided !== null ? s.costPerIncidentAvoided.toFixed(2) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
