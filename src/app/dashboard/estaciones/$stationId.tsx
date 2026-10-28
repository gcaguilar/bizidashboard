import { createFileRoute, Link, notFound, redirect } from '@tanstack/react-router';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { buildSeoHead } from '@/lib/seo-head';
import { StationDetailPanel } from '@/app/dashboard/_components/StationDetailPanel';
import { PageShell } from '@/components/layout/page-shell';
import { getStationDetailPageData } from '@/server-functions/dashboard-estaciones';

export const Route = createFileRoute('/dashboard/estaciones/$stationId')({
  loader: async ({ params }) => {
    if (!params.stationId) {
      throw redirect({ to: appRoutes.dashboardStations() });
    }
    const data = await getStationDetailPageData({ data: params.stationId });
    // Sin estación no hay ficha: 404 en vez de un 200 con esqueleto vacío.
    // Esto evita que los crawlers indexen IDs inventados (/dashboard/estaciones/$stationId).
    if (!data.station) {
      throw notFound();
    }
    return data;
  },
  // El dashboard es una herramienta operativa con SSR "data-only": su HTML
  // inicial es un esqueleto. Se mantiene fuera del índice (la ficha pública
  // de la estación vive en /estadisticas/estaciones/:id).
  head: ({ params, loaderData }) => {
    const { stationId } = params;
    const stationName = loaderData?.station?.name ?? stationId;
    const title = `Estación ${stationId} - DatosBizi`;
    return buildSeoHead({
      title,
      description: `Detalle operativo de la estación ${stationName} en el dashboard de DatosBizi.`,
      robots: 'noindex, nofollow',
    });
  },
  notFoundComponent: DashboardStationNotFound,
  component: StationDetailRoute,
});

function DashboardStationNotFound() {
  const { stationId } = Route.useParams();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Estaciones',
    href: appRoutes.dashboardStations(),
  });

  return (
    <PageShell>
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <section className="ui-page-hero mx-auto w-full max-w-[1280px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Estación no encontrada</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)]">
          No existe la estación {stationId}
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          No hay datos para esa estación en la red de Bizi Zaragoza.
        </p>
        <Link to={appRoutes.dashboardStations()} className="ui-primary-button mt-4 inline-flex">
          Volver al directorio de estaciones
        </Link>
      </section>
    </PageShell>
  );
}

function StationDetailRoute() {
  const { station, stations, rankings, alerts, patterns, heatmap } = Route.useLoaderData();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Estaciones',
    href: appRoutes.dashboardStations(),
  });

  return (
    <PageShell>
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <StationDetailPanel
        station={station}
        stations={stations}
        rankings={rankings}
        alerts={alerts}
        patterns={patterns}
        heatmap={heatmap}
      />
    </PageShell>
  );
}
