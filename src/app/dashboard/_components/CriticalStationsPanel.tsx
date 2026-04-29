import Link from 'next/link';
import type { StationSnapshot } from '@/lib/api';
import { formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';

type CriticalStationsPanelProps = {
  stations: StationSnapshot[];
  density?: 'normal' | 'compact';
};

function occupancyRatio(station: StationSnapshot): number {
  if (!Number.isFinite(station.capacity) || station.capacity <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, station.bikesAvailable / station.capacity));
}

function scoreCriticality(station: StationSnapshot): number {
  const occupancy = occupancyRatio(station);
  const occupancyDistance = Math.abs(occupancy - 0.5);
  const emptyBonus = station.bikesAvailable <= 0 ? 1000 : 0;
  const fullBonus = station.anchorsFree <= 0 ? 900 : 0;
  return emptyBonus + fullBonus + occupancyDistance * 100;
}

export function CriticalStationsPanel({ stations, density = 'normal' }: CriticalStationsPanelProps) {
  const criticalStations = stations
    .filter((station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0 || occupancyRatio(station) < 0.1 || occupancyRatio(station) > 0.9)
    .sort((left, right) => scoreCriticality(right) - scoreCriticality(left))
    .slice(0, 10);

  const compact = density === 'compact';

  return (
    <section className={`ui-section-card h-full ${compact ? 'border-[var(--primary)]/25 bg-[var(--primary)]/6' : ''}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Operaciones</p>
          <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">Top estaciones criticas</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Prioriza estaciones vacias, llenas o con ocupacion extrema para actuar antes de que aumente la friccion.</p>
        </div>
        <Link href={appRoutes.dashboardHelp('alertas-activas')} className="text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline">
          Entender criterio
        </Link>
      </div>

      {criticalStations.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">No hay estaciones criticas destacadas ahora mismo.</p>
      ) : (
        <div className={`mt-4 ${compact ? 'space-y-1.5' : 'space-y-2'}`}>
          {criticalStations.map((station) => {
            const occupancy = occupancyRatio(station);
            const stateLabel = station.bikesAvailable <= 0 ? 'Vacia' : station.anchorsFree <= 0 ? 'Llena' : occupancy < 0.1 ? 'Muy baja' : 'Muy alta';

            return (
              <Link
                key={station.id}
                href={appRoutes.dashboardStation(station.id)}
                className={`flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 ${compact ? 'py-2.5' : 'py-3'} transition hover:border-[var(--primary)]/40 hover:bg-[var(--card)]`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{station.name}</p>
                  <p className="text-[11px] text-[var(--muted)]">#{station.id} · {stateLabel}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-[var(--foreground)]">{formatPercent(occupancy)}</p>
                  <p className="text-[var(--muted)]">{station.bikesAvailable} bicis · {station.anchorsFree} huecos</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
