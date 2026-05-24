import { createFileRoute } from '@tanstack/react-router';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { getSiteUrl } from '@/lib/site';
import { PageShell } from '@/components/layout/page-shell';

export const Route = createFileRoute('/estadisticas/')({
  head: () => {
    const siteUrl = getSiteUrl();
    const title = 'Estadísticas Bizi Zaragoza - DatosBizi';
    const description = 'Explora estadísticas de Bizi Zaragoza: estaciones, barrios, horarios, viajes y más.';
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estadisticas` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      link: [{ rel: 'canonical', href: `${siteUrl}/estadisticas` }],
      title,
    };
  },
  component: EstadisticasHubPage,
});

function EstadisticasHubPage() {
  const breadcrumbs = createRootBreadcrumbs({ label: 'Estadísticas', href: appRoutes.statsHub() });

  return (
    <PageShell>
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Datos públicos de Bizi</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">¿Qué quieres saber de Bizi Zaragoza?</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Elige una entrada según lo que necesitas: encontrar bici, analizar problemas o revisar evolución histórica.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <TrackedLink href={appRoutes.statsMapa()} ctaEvent={{ source: 'stats_hub_hero', ctaId: 'open_map', destination: 'stats_map', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-primary-button">Abrir mapa avanzado</TrackedLink>
          <TrackedLink href={appRoutes.statsEstaciones()} ctaEvent={{ source: 'stats_hub_hero', ctaId: 'browse_stations', destination: 'stats_estaciones', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-inline-action">Buscar estación</TrackedLink>
        </div>
      </header>
      <section className="mb-6 sm:mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-3">Necesito una bici ahora</p>
        <div className="grid gap-4 md:grid-cols-2">
          <TrackedLink href={appRoutes.statsMapa()} ctaEvent={{ source: 'stats_hub_needs_bike', ctaId: 'open_map', destination: 'stats_map', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-surface-block ui-surface-block-interactive block">
            <p className="mt-2 text-base font-black text-[var(--foreground)]">Mapa avanzado</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Abre el panel con mapa, filtros y estaciones cercanas.</p>
          </TrackedLink>
          <TrackedLink href={appRoutes.statsEstaciones()} ctaEvent={{ source: 'stats_hub_needs_bike', ctaId: 'browse_stations', destination: 'stats_estaciones', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-surface-block ui-surface-block-interactive block">
            <p className="mt-2 text-base font-black text-[var(--foreground)]">Estaciones con más bicis</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Filtra por bicis, huecos, favoritas o estaciones casi vacías.</p>
          </TrackedLink>
        </div>
      </section>
      <section className="mb-6 sm:mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-3">Quiero analizar uso y problemas</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TrackedLink href={appRoutes.statsEstaciones()} ctaEvent={{ source: 'stats_hub_analyze', ctaId: 'station_ranking', destination: 'stats_estaciones', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-surface-block ui-surface-block-interactive block">
            <p className="mt-2 text-base font-black text-[var(--foreground)]">Ranking de estaciones</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Detecta estaciones con más actividad o más horas con problemas.</p>
          </TrackedLink>
          <TrackedLink href={appRoutes.statsBarrios()} ctaEvent={{ source: 'stats_hub_analyze', ctaId: 'districts', destination: 'stats_barrios', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-surface-block ui-surface-block-interactive block">
            <p className="mt-2 text-base font-black text-[var(--foreground)]">Barrios de Zaragoza</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Compara actividad y disponibilidad por zona.</p>
          </TrackedLink>
          <TrackedLink href={appRoutes.statsHorarios()} ctaEvent={{ source: 'stats_hub_analyze', ctaId: 'horarios', destination: 'stats_horarios', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-surface-block ui-surface-block-interactive block">
            <p className="mt-2 text-base font-black text-[var(--foreground)]">Horarios y patrones</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Descubre cuándo hay más actividad.</p>
          </TrackedLink>
        </div>
      </section>
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-3">Quiero ver evolución</p>
        <div className="grid gap-4 md:grid-cols-2">
          <TrackedLink href={appRoutes.statsViajes()} ctaEvent={{ source: 'stats_hub_evolution', ctaId: 'viajes', destination: 'stats_viajes', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-surface-block ui-surface-block-interactive block">
            <p className="mt-2 text-base font-black text-[var(--foreground)]">Viajes e informes</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Tendencias diarias, mensuales y archivo de informes.</p>
          </TrackedLink>
          <TrackedLink href={appRoutes.statsRedistribucion()} ctaEvent={{ source: 'stats_hub_evolution', ctaId: 'redistribucion', destination: 'stats_redistribucion', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-surface-block ui-surface-block-interactive block">
            <p className="mt-2 text-base font-black text-[var(--foreground)]">Redistribución</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Estaciones que necesitan que se muevan bicis donde hacen falta.</p>
          </TrackedLink>
        </div>
      </section>
    </PageShell>
  );
}
