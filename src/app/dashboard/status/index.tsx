import { createFileRoute } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';
import { formatStatusDateTime, formatStatusNumber, getCoverageLabel, getHealthLabel } from '@/lib/system-status';
import { PageShell } from '@/components/layout/page-shell';
import { getSystemStatusPageData } from '@/server-functions/estado';

export const Route = createFileRoute('/dashboard/status/')({
  head: () => {
    const title = 'Estado del sistema - Dashboard Bizi'
    const description = 'Estado de los datos de DatosBizi: ultima muestra, cobertura, incidencias y servicios afectados.'
    return {
      meta: [
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
  loader: () => getSystemStatusPageData(),
  component: DashboardStatusPage,
});

export default function DashboardStatusPage() {
  const { status, dataset, activeStationsCount, activeIncidentCount } = Route.useLoaderData();

  return (
    <PageShell>
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Estado del dashboard</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">Estado de los datos de DatosBizi</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">Resumen directo para saber si el dashboard esta usando datos recientes, completos y sin incidencias activas.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="ui-inline-action" href={appRoutes.status()}>Abrir estado completo</a>
          <a className="ui-inline-action" href={appRoutes.dashboard()}>Volver al dashboard</a>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        <article className="ui-section-card"><p className="stat-label">Salud</p><p className="stat-value">{getHealthLabel(status.pipeline.healthStatus)}</p></article>
        <article className="ui-section-card"><p className="stat-label">Ultima muestra</p><p className="text-sm font-semibold text-[var(--foreground)]">{formatStatusDateTime(dataset.lastUpdated.lastSampleAt)}</p></article>
        <article className="ui-section-card"><p className="stat-label">Cobertura</p><p className="text-sm font-semibold text-[var(--foreground)]">{getCoverageLabel(dataset)}</p></article>
        <article className="ui-section-card"><p className="stat-label">Estaciones activas</p><p className="stat-value">{formatStatusNumber(activeStationsCount)}</p></article>
      </section>
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Incidencias activas</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{activeIncidentCount > 0 ? `${activeIncidentCount} incidencias requieren revision.` : 'No hay incidencias activas.'}</p>
      </section>
    </PageShell>
  );
}
