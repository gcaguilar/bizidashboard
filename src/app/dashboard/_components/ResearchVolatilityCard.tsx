import { TrackedLink } from '@/app/_components/TrackedLink';
import type { RankingsResponse } from '@/lib/api-types';
import { formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';

type ResearchVolatilityCardProps = {
  rankings: RankingsResponse;
};

export function ResearchVolatilityCard({ rankings }: ResearchVolatilityCardProps) {
  const rows = rankings.rankings
    .map((row) => {
      const problemRatio = row.totalHours > 0 ? (row.emptyHours + row.fullHours) / row.totalHours : 0;
      const volatility = Math.max(0, Math.min(1, problemRatio));

      return {
        stationId: row.stationId,
        volatility,
      };
    })
    .sort((left, right) => right.volatility - left.volatility);

  const averageVolatility =
    rows.length > 0 ? rows.reduce((sum, row) => sum + row.volatility, 0) / rows.length : 0;

  const topQuartile = rows.slice(0, Math.max(1, Math.floor(rows.length / 4)));
  const topQuartileAverage =
    topQuartile.length > 0 ? topQuartile.reduce((sum, row) => sum + row.volatility, 0) / topQuartile.length : 0;

  return (
    <section className="ui-section-card h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Análisis</p>
          <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">Volatilidad operativa</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Indica cuánto tiempo pasan las estaciones vacías o llenas durante el periodo observado.
          </p>
        </div>
        <TrackedLink href={appRoutes.dashboardHelp('estabilidad-estacion')} className="text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline shrink-0 whitespace-nowrap">
          Cómo leerlo
        </TrackedLink>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4">
          <p className="stat-label">Media global</p>
          <p className="mt-2 text-2xl font-black text-[var(--foreground)]">{formatPercent(averageVolatility)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Porcentaje medio de horas con la estación vacía o llena.</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4">
          <p className="stat-label">25 % más inestable</p>
          <p className="mt-2 text-2xl font-black text-[var(--foreground)]">{formatPercent(topQuartileAverage)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Permite ver si el problema se concentra en pocas estaciones.</p>
        </div>
      </div>
    </section>
  );
}
