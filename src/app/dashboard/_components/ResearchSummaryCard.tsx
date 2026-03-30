import Link from 'next/link';
import type { StationSnapshot } from '@/lib/api';
import { appRoutes } from '@/lib/routes';
import type { RecentStationSnapshot } from '@/lib/recent-station-history';

type DailyDemandRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

type SystemHourlyProfileRow = {
  hour: number;
  avgOccupancy: number;
  avgBikesAvailable: number;
  sampleCount: number;
};

type ResearchSummaryCardProps = {
  dailyDemand: DailyDemandRow[];
  systemHourlyProfile: SystemHourlyProfileRow[];
  recentSnapshots: RecentStationSnapshot[];
  stations: StationSnapshot[];
};

export function ResearchSummaryCard({
  dailyDemand,
  systemHourlyProfile,
  recentSnapshots,
  stations,
}: ResearchSummaryCardProps) {
  const topDemandDay = dailyDemand.reduce<DailyDemandRow | null>((best, row) => {
    if (!best || row.demandScore > best.demandScore) {
      return row;
    }
    return best;
  }, null);

  const topHour = systemHourlyProfile.reduce<SystemHourlyProfileRow | null>((best, row) => {
    if (!best || row.avgBikesAvailable > best.avgBikesAvailable) {
      return row;
    }
    return best;
  }, null);

  const recentSnapshotInsight = (() => {
    if (recentSnapshots.length < 2) {
      return null;
    }

    const first = recentSnapshots[0];
    const last = recentSnapshots[recentSnapshots.length - 1];
    const stationMap = new Map(stations.map((station) => [station.id, station.name]));
    let strongestChange: { stationName: string; delta: number } | null = null;

    for (const [stationId, bikesNow] of Object.entries(last.snapshot)) {
      const bikesBefore = first.snapshot[stationId];

      if (!Number.isFinite(bikesBefore)) {
        continue;
      }

      const delta = bikesNow - bikesBefore;

      if (!strongestChange || Math.abs(delta) > Math.abs(strongestChange.delta)) {
        strongestChange = {
          stationName: stationMap.get(stationId) ?? stationId,
          delta,
        };
      }
    }

    return strongestChange;
  })();

  return (
    <section className="dashboard-card h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Analisis</p>
          <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">Lectura temporal rapida</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Resume cuando se concentra mas actividad y en que momento del dia se ve mas bici disponible.</p>
        </div>
        <Link href={appRoutes.dashboardHelp('demanda-no-viajes-reales')} className="text-xs font-semibold text-[var(--accent)] underline-offset-2 hover:underline">
          Entender metrica
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
          <p className="stat-label">Dia mas intenso</p>
          <p className="mt-2 text-lg font-bold text-[var(--foreground)]">{topDemandDay?.day ?? 'Sin datos'}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {topDemandDay ? `${topDemandDay.demandScore.toFixed(1)} puntos de demanda agregada` : 'Todavia no hay historico suficiente.'}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
          <p className="stat-label">Hora con mas bicis</p>
          <p className="mt-2 text-lg font-bold text-[var(--foreground)]">
            {topHour ? `${String(topHour.hour).padStart(2, '0')}:00` : 'Sin datos'}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {topHour ? `${topHour.avgBikesAvailable.toFixed(1)} bicis medias por estacion` : 'Todavia no hay perfil horario suficiente.'}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
        <p className="stat-label">Cambio mas visible en memoria</p>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
          {recentSnapshotInsight
            ? `${recentSnapshotInsight.stationName}: ${recentSnapshotInsight.delta >= 0 ? '+' : ''}${recentSnapshotInsight.delta} bicis frente al primer snapshot guardado.`
            : 'Todavia no hay suficientes snapshots recientes para comparar tendencia inmediata.'}
        </p>
      </div>
    </section>
  );
}
