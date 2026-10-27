import { activityIndexUnits } from '@/lib/product-copy';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { formatInteger, formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import type { MonthlyReport } from '@/lib/monthly-report';

type ReportRedistributionProps = {
  report: MonthlyReport;
};

/**
 * Proxy mensual de la eficacia de la redistribucion. La base de datos no
 * registra los movimientos de los operarios, asi que senalamos las estaciones
 * con mucha rotacion que siguen acumulando horas sin servicio: son las que la
 * redistribucion (natural u operada) no esta resolviendo.
 */
export function ReportRedistribution({ report }: ReportRedistributionProps) {
  const { redistribution } = report;

  return (
    <section className="ui-section-card">
      <h2 className="text-xl font-black text-[var(--foreground)]">Eficacia de la redistribución</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {formatPercent(redistribution.networkFrictionRate)} de las horas de la red fueron sin bicis o sin huecos,
        con {formatInteger(redistribution.rotation)} {activityIndexUnits.total}.
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{redistribution.note}</p>

      {redistribution.ineffectiveStations.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Ninguna estación con mucha rotación mantuvo horas de fricción destacables este mes.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {redistribution.ineffectiveStations.map((spot, index) => (
            <li
              key={spot.stationId}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[11px] font-bold text-[var(--primary)]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <TrackedLink
                    href={appRoutes.dashboardStation(spot.stationId)}
                    className="block truncate text-sm font-semibold text-[var(--foreground)] hover:underline"
                  >
                    {spot.stationName}
                  </TrackedLink>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                    {spot.district ? `${spot.district} · ` : ''}
                    {formatInteger(spot.rotation)} {activityIndexUnits.total} · {formatPercent(spot.frictionRate)} sin servicio
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold text-[var(--foreground)]">
                {formatInteger(spot.frictionHours)} h
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
