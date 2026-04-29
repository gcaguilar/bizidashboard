import Link from 'next/link';
import type { RankingsResponse, StationSnapshot } from '@/lib/api';
import { formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import { Progress } from '@/components/ui/progress';
import { calculateFrictionScore } from './useSystemMetrics';

type StationStabilityCardProps = {
  rankings: RankingsResponse;
  stations: StationSnapshot[];
};

export function StationStabilityCard({ rankings, stations }: StationStabilityCardProps) {
  const stationMap = new Map(stations.map((station) => [station.id, station.name]));
  const leastStable = rankings.rankings
    .map((row) => {
      const frictionRatio = row.totalHours > 0 ? (row.emptyHours + row.fullHours) / row.totalHours : 0;
      const stabilityScore = Math.max(0, 1 - frictionRatio);

      return {
        stationId: row.stationId,
        stationName: stationMap.get(row.stationId) ?? row.stationId,
        stabilityScore,
        frictionRatio,
        problemHours: calculateFrictionScore(row.emptyHours, row.fullHours),
      };
    })
    .sort((left, right) => left.stabilityScore - right.stabilityScore)
    .slice(0, 8);

  return (
    <section className="dashboard-card h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Analisis</p>
          <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">Estabilidad por estacion</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Una estacion es menos estable cuando pasa muchas horas vacia o llena respecto a su ventana observada.</p>
        </div>
        <Link href={appRoutes.dashboardHelp('horas-problema')} className="text-xs font-semibold text-[var(--accent)] underline-offset-2 hover:underline">
          Como leerlo
        </Link>
      </div>

      {leastStable.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">Sin datos suficientes para estimar estabilidad.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {leastStable.map((row) => (
            <Link
              key={row.stationId}
              href={appRoutes.dashboardStation(row.stationId)}
              className="block rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{row.stationName}</p>
                  <p className="text-[11px] text-[var(--muted)]">#{row.stationId} · {row.problemHours}h problema</p>
                </div>
                <p className="text-xs font-bold text-[var(--foreground)]">{formatPercent(row.stabilityScore)}</p>
              </div>
              <Progress
                className="mt-2 bg-black/15"
                value={Math.max(6, row.stabilityScore * 100)}
                indicatorClassName="bg-[var(--accent)]"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
