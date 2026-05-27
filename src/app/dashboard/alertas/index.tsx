import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod';
import { AlertsHistoryClient } from '@/app/dashboard/alertas/_components/AlertsHistoryClient';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { DashboardPageLoading } from '@/app/dashboard/_components/DashboardPageLoading';
import { PageShell } from '@/components/layout/page-shell';
import { appRoutes } from '@/lib/routes';
import { getAlertsHistoryPageData } from '@/server-functions/dashboard-alertas';

export const Route = createFileRoute('/dashboard/alertas/')({
  validateSearch: z.object({
    stationId: z.string().optional(),
    alertType: z.enum(['all', 'LOW_BIKES', 'LOW_ANCHORS']).optional(),
    state: z.enum(['all', 'active', 'resolved']).optional(),
    severity: z.enum(['all', '1', '2']).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.string().optional(),
  }),
  head: () => {
    const title = 'Historial de alertas - Dashboard Bizi'
    const description = 'Consulta alertas activas y resueltas de Bizi Zaragoza para detectar estaciones sin bicis, sin huecos o que necesitan revision.'
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      title,
    }
  },
  loader: () => getAlertsHistoryPageData(),
  pendingComponent: DashboardAlertsPending,
  errorComponent: DashboardAlertsError,
  component: DashboardAlertsHistoryPage,
});

export default function DashboardAlertsHistoryPage() {
  const { stations } = Route.useLoaderData();
  return <AlertsHistoryClient stations={stations.stations} />;
}

function DashboardAlertsPending() {
  return (
    <DashboardPageLoading
      title="Cargando alertas"
      subtitle="Consultando incidencias activas y resueltas"
    />
  );
}

function DashboardAlertsError() {
  return (
    <PageShell>
      <section className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Datos no disponibles</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          No se pudo cargar el historial de alertas
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Intenta recargar en unos minutos o revisa el estado general del sistema.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.status()} className="ui-primary-button">Ver estado</TrackedLink>
          <TrackedLink href={appRoutes.dashboard()} className="ui-inline-action">Volver al dashboard</TrackedLink>
        </div>
      </section>
    </PageShell>
  );
}
