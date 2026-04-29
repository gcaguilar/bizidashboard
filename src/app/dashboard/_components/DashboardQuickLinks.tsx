import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
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
        <Button asChild variant="cta" size="sm" className="mt-auto">
          <TrackedLink
            href={selectedStationDetailUrl}
            trackingEvent={buildPanelOpenEvent({
              surface: 'dashboard',
              routeKey: 'dashboard_home',
              module: 'station_detail',
              source: 'dashboard_quick_links',
            })}
          >
            Abrir detalle completo
          </TrackedLink>
        </Button>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Flujo por barrios</h3>
        <p className="text-sm text-[var(--muted)]">
          Consulta la matriz O-D, el chord y las rutas de mayor volumen en una pagina dedicada.
        </p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
          <TrackedLink
            href={appRoutes.dashboardFlow()}
            trackingEvent={buildPanelOpenEvent({
              surface: 'dashboard',
              routeKey: 'dashboard_home',
              module: 'flow',
              source: 'dashboard_quick_links',
            })}
          >
            Ir a analisis de flujo
          </TrackedLink>
        </Button>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Conclusiones diarias</h3>
        <p className="text-sm text-[var(--muted)]">
          Resumen ejecutivo de movilidad, tendencias semanales y recomendaciones operativas.
        </p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
          <TrackedLink
            href={appRoutes.dashboardConclusions()}
            trackingEvent={buildPanelOpenEvent({
              surface: 'dashboard',
              routeKey: 'dashboard_home',
              module: 'conclusions',
              source: 'dashboard_quick_links',
            })}
          >
            Ver conclusiones
          </TrackedLink>
        </Button>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Centro de ayuda</h3>
        <p className="text-sm text-[var(--muted)]">
          Metodologia, criterios de alertas y documentacion en una pagina independiente.
        </p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
          <TrackedLink
            href={appRoutes.dashboardHelp()}
            trackingEvent={buildPanelOpenEvent({
              surface: 'dashboard',
              routeKey: 'dashboard_home',
              module: 'help',
              source: 'dashboard_quick_links',
            })}
          >
            Abrir ayuda
          </TrackedLink>
        </Button>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Paginas SEO</h3>
        <p className="text-sm text-[var(--muted)]">
          Rankings indexables, series temporales e informes mensuales enlazados al dashboard.
        </p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
          <TrackedLink
            href={appRoutes.reports()}
            trackingEvent={buildPanelOpenEvent({
              surface: 'dashboard',
              routeKey: 'dashboard_home',
              module: 'reports',
              source: 'dashboard_quick_links',
              destination: 'report_archive',
            })}
          >
            Ver informes y rankings
          </TrackedLink>
        </Button>
      </article>
    </section>
  );
}
