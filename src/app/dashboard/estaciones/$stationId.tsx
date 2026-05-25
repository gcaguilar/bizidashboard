import { createFileRoute, redirect } from '@tanstack/react-router';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { StationDetailPanel } from '@/app/dashboard/_components/StationDetailPanel';
import { PageShell } from '@/components/layout/page-shell';
import { getStationDetailPageData } from '@/server-functions/dashboard-estaciones';

export const Route = createFileRoute('/dashboard/estaciones/$stationId')({
  loader: ({ params }) => {
    if (!params.stationId) {
      throw redirect({ to: appRoutes.dashboardStations() });
    }
    return getStationDetailPageData({ data: params.stationId });
  },
  head: (opts) => {
    const { stationId } = opts.params;
    const title = `Estacion ${stationId} - DatosBizi`;
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      title,
    };
  },
  component: StationDetailRoute,
});

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
