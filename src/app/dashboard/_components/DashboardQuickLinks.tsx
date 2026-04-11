import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';
import { buildPanelOpenEvent } from '@/lib/umami';

type DashboardQuickLinksProps = {
  selectedStationDetailUrl: string;
};

export function DashboardQuickLinks({ selectedStationDetailUrl }: DashboardQuickLinksProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Detalle de estacion</h3>
        <p className="text-sm text-[var(--muted)]">
          Abre la vista completa de la estacion seleccionada para ver prediccion, mapa por barrios y comparativas.
        </p>
        <TrackedLink
          href={selectedStationDetailUrl}
          trackingEvent={buildPanelOpenEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            module: 'station_detail',
            source: 'dashboard_quick_links',
          })}
          className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          Abrir detalle completo
        </TrackedLink>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Flujo por barrios</h3>
        <p className="text-sm text-[var(--muted)]">
          Consulta la matriz O-D, el chord y las rutas de mayor volumen en una pagina dedicada.
        </p>
        <TrackedLink
          href={appRoutes.dashboardFlow()}
          trackingEvent={buildPanelOpenEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            module: 'flow',
            source: 'dashboard_quick_links',
          })}
          className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          Ir a analisis de flujo
        </TrackedLink>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Conclusiones diarias</h3>
        <p className="text-sm text-[var(--muted)]">
          Resumen ejecutivo de movilidad, tendencias semanales y recomendaciones operativas.
        </p>
        <TrackedLink
          href={appRoutes.dashboardConclusions()}
          trackingEvent={buildPanelOpenEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            module: 'conclusions',
            source: 'dashboard_quick_links',
          })}
          className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          Ver conclusiones
        </TrackedLink>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Centro de ayuda</h3>
        <p className="text-sm text-[var(--muted)]">
          Metodologia, criterios de alertas y documentacion en una pagina independiente.
        </p>
        <TrackedLink
          href={appRoutes.dashboardHelp()}
          trackingEvent={buildPanelOpenEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            module: 'help',
            source: 'dashboard_quick_links',
          })}
          className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          Abrir ayuda
        </TrackedLink>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Paginas SEO</h3>
        <p className="text-sm text-[var(--muted)]">
          Rankings indexables, series temporales e informes mensuales enlazados al dashboard.
        </p>
        <TrackedLink
          href={appRoutes.reports()}
          trackingEvent={buildPanelOpenEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            module: 'reports',
            source: 'dashboard_quick_links',
            destination: 'report_archive',
          })}
          className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          Ver informes y rankings
        </TrackedLink>
      </article>
    </section>
  );
}
