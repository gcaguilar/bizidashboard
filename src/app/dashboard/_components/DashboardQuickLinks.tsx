import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import { appRoutes } from '@/lib/routes';
import { buildPanelOpenEvent } from '@/lib/umami';

type DashboardQuickLinksProps = {
  selectedStationDetailUrl: string;
  currentMonth?: string | null;
};

export function DashboardQuickLinks({ selectedStationDetailUrl, currentMonth }: DashboardQuickLinksProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <article className="ui-section-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Detalle completo</h3>
        <p className="text-sm text-[var(--muted)]">
          Predicción, mapa por barrios y comparativas.
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

      <article className="ui-section-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Movimientos entre barrios</h3>
        <p className="text-sm text-[var(--muted)]">
          Consulta la matriz O-D, el chord y las rutas de mayor volumen en una pagina dedicada.
        </p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
          <TrackedLink
            href={appRoutes.dashboardFlow({ month: currentMonth || undefined })}
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

      <article className="ui-section-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Resumen del día</h3>
        <p className="text-sm text-[var(--muted)]">
          Resumen ejecutivo de movilidad, tendencias semanales y recomendaciones operativas.
        </p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
          <TrackedLink
            href={appRoutes.dashboardConclusions({ month: currentMonth || undefined })}
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

      <article className="ui-section-card">
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

      <article className="ui-section-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Informes y archivo mensual</h3>
        <p className="text-sm text-[var(--muted)]">
          Consulta informes mensuales, rankings y series temporales.
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
            Ver informes
          </TrackedLink>
        </Button>
      </article>
    </section>
  );
}
