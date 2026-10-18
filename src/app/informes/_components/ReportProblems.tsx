import { TrackedLink } from '@/app/_components/TrackedLink';
import { formatInteger, formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import type { MonthlyReport } from '@/lib/monthly-report';

type ReportProblemsProps = {
  report: MonthlyReport;
};

function minutesLabel(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(1)} h`;
}

export function ReportProblems({ report }: ReportProblemsProps) {
  const { worstFriction, worstMorning, longestEpisodes } = report.problemSpots;

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones que más fallan</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Más horas acumuladas sin bicis o sin huecos durante el mes.
        </p>
        {worstFriction.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Sin episodios de fricción destacables este mes.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {worstFriction.map((spot, index) => (
              <li key={spot.stationId} className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--danger)]/15 text-[11px] font-bold text-[var(--danger)]">
                      {index + 1}
                    </span>
                    <TrackedLink
                      href={appRoutes.dashboardStation(spot.stationId)}
                      className="truncate text-sm font-semibold text-[var(--foreground)] hover:underline"
                    >
                      {spot.stationName}
                    </TrackedLink>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[var(--foreground)]">
                    {formatInteger(spot.frictionHours)} h
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {spot.district ? `${spot.district} · ` : ''}
                  {spot.emptyHours} h vacía · {spot.fullHours} h llena · {formatPercent(spot.frictionRate)} del tiempo
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Dónde cuesta más encontrar bici o hueco por la mañana</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Estaciones con más horas sin bicis o sin huecos entre las 07:00 y las 10:00.
        </p>
        {worstMorning.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Sin problemas matinales destacables este mes.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {worstMorning.map((spot, index) => (
              <li key={spot.stationId} className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--warning)]/15 text-[11px] font-bold text-[var(--warning)]">
                      {index + 1}
                    </span>
                    <TrackedLink
                      href={appRoutes.dashboardStation(spot.stationId)}
                      className="truncate text-sm font-semibold text-[var(--foreground)] hover:underline"
                    >
                      {spot.stationName}
                    </TrackedLink>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[var(--foreground)]">
                    {formatPercent(spot.morningFrictionRate)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {spot.district ? `${spot.district} · ` : ''}
                  {formatPercent(spot.morningEmptyRate)} sin bicis · {formatPercent(spot.morningFullRate)} sin
                  huecos · {spot.morningHours} h de mañana
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Rachas más largas sin servicio</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Duración de los periodos continuos más largos sin bicis o sin anclajes.
        </p>
        {longestEpisodes.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Sin rachas críticas registradas este mes.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {longestEpisodes.map((spot, index) => (
              <li key={spot.stationId} className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)]/8 text-[11px] font-bold text-[var(--foreground)]">
                      {index + 1}
                    </span>
                    <TrackedLink
                      href={appRoutes.dashboardStation(spot.stationId)}
                      className="truncate text-sm font-semibold text-[var(--foreground)] hover:underline"
                    >
                      {spot.stationName}
                    </TrackedLink>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[var(--foreground)]">
                    {minutesLabel(Math.max(spot.maxEmptyEpisodeMinutes, spot.maxFullEpisodeMinutes))}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {spot.district ? `${spot.district} · ` : ''}
                  racha más larga sin bicis {minutesLabel(spot.maxEmptyEpisodeMinutes)} · sin huecos {minutesLabel(spot.maxFullEpisodeMinutes)} · {spot.episodeCount} episodios
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
