import type { Metadata } from 'next';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { getUtilityLandingData } from '@/lib/acquisition-landings';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { buildSocialImagePath } from '@/lib/social-images';
import { buildItemListStructuredData } from '@/lib/structured-data';
import { getSiteUrl } from '@/lib/site';
import { formatPercent } from '@/lib/format';

const FAQ_ITEMS = [
  {
    question: '¿Dónde ver qué estación tiene bicis ahora mismo?',
    answer:
      'En esta landing tienes accesos al mapa en vivo y a fichas públicas de estación con disponibilidad actual, ocupación y contexto histórico reciente.',
  },
  {
    question: '¿Puedo encontrar una estación cercana antes de abrir el dashboard?',
    answer:
      'Sí. Las estaciones destacadas enlazan a su ficha pública y desde ahí puedes bajar al detalle operativo completo o seguir navegando por barrio.',
  },
  {
    question: '¿Qué hago si busco una lectura rápida y no un análisis completo?',
    answer:
      'Lo más útil es abrir el dashboard en vista resumen o la ficha pública de una estación concreta. Si buscas contexto adicional, usa después el hub de barrios o el archivo mensual.',
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const landingData = await getUtilityLandingData();

  return buildPageMetadata({
    title: 'Mapa y estaciones Bizi Zaragoza en tiempo real',
    description:
      'Encuentra estaciones Bizi Zaragoza, revisa disponibilidad actual y entra al mapa en vivo o a fichas publicas con contexto util antes de abrir el dashboard.',
    path: appRoutes.utilityLanding(),
    keywords: [
      'mapa estaciones bizi zaragoza',
      'estaciones bizi zaragoza tiempo real',
      'disponibilidad bizi zaragoza',
      'encontrar estacion bizi',
    ],
    socialImagePath: buildSocialImagePath({
      kind: 'landing',
      title: 'Mapa y estaciones Bizi Zaragoza en tiempo real',
      subtitle: `Landing de utilidad inmediata con ${landingData.stationRows.length} estaciones publicas y acceso al mapa en vivo`,
      eyebrow: 'Landing de utilidad inmediata',
      badges: ['Mapa en vivo', `${landingData.stationRows.length} estaciones`, 'Tiempo real'],
    }),
    indexability: landingData.indexabilityInput,
  });
}

export default async function UtilityLandingPage() {
  const landingData = await getUtilityLandingData();
  const siteUrl = getSiteUrl();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Mapa y estaciones Bizi Zaragoza',
    href: appRoutes.utilityLanding(),
  });
  const featuredStationEntries = landingData.featuredStations.map((station) => ({
    name: station.station.name,
    url: `${siteUrl}${appRoutes.stationDetail(station.station.id)}`,
  }));
  const relatedRouteEntries = [
    {
      name: 'Barrios de Zaragoza',
      url: `${siteUrl}${appRoutes.districtLanding()}`,
    },
    {
      name: 'Estado del sistema',
      url: `${siteUrl}${appRoutes.status()}`,
    },
    {
      name: 'BiciRadar',
      url: `${siteUrl}${appRoutes.biciradar()}`,
    },
    {
      name: 'Ir a estadisticas',
      url: `${siteUrl}${appRoutes.insightsLanding()}`,
    },
  ];
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'CollectionPage',
        name: 'Mapa y estaciones Bizi Zaragoza en tiempo real',
        description:
          'Landing de utilidad inmediata para encontrar estaciones, revisar disponibilidad y saltar al dashboard en vivo.',
        url: `${siteUrl}${appRoutes.utilityLanding()}`,
        inLanguage: 'es',
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      ...(featuredStationEntries.length > 0
        ? [buildItemListStructuredData('Estaciones destacadas para empezar', featuredStationEntries)]
        : []),
      buildItemListStructuredData('Mas rutas utiles', relatedRouteEntries),
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <PublicPageViewTracker
        pageType="acquisition"
        template="utility_landing"
        pageSlug="mapa-estaciones-bizi-zaragoza"
      />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeHref={appRoutes.seoPage('uso-bizi-por-estacion')} className="mt-1" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Landing de utilidad inmediata
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Mapa y estaciones Bizi Zaragoza en tiempo real
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Esta landing esta pensada para quien quiere resolver algo practico rapido: encontrar una
              estacion, comprobar si hay bicis o anclajes libres y decidir si merece la pena abrir el
              dashboard en vista resumen. Desde aqui puedes saltar al mapa en vivo, a fichas publicas
              de estacion y al hub territorial por barrios.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">{landingData.stationRows.length} estaciones publicas</span>
            <span className="kpi-chip">{landingData.bikesAvailable} bicis visibles</span>
            <span className="kpi-chip">{landingData.districtRows.length} barrios conectados</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <TrackedLink
            href={appRoutes.dashboardView('overview')}
            eventName="ad_landing_primary_click"
            eventData={{ landing: 'utility', destination: 'dashboard_overview' }}
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir dashboard en vista resumen
          </TrackedLink>
          <TrackedLink
            href={appRoutes.seoPage('uso-bizi-por-estacion')}
            eventName="ad_landing_secondary_click"
            eventData={{ landing: 'utility', destination: 'station_hub' }}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Explorar estaciones
          </TrackedLink>
        </div>
      </header>

      <section className="dashboard-card">
        <div className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="stat-label">Paso 1</p>
            <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Localiza la zona</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Usa el mapa o entra por barrio si ya sabes en qué parte de Zaragoza te vas a mover.
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="stat-label">Paso 2</p>
            <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Revisa disponibilidad</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Cada ficha pública muestra bicis, anclajes libres, ocupación y comparación frente a la media.
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="stat-label">Paso 3</p>
            <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Baja al detalle operativo</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Cuando necesites más precisión, salta al dashboard para ver alertas, mapas y patrones completos.
            </p>
          </article>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones destacadas para empezar</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Seleccion calculada con las fichas publicas que hoy tienen mejor señal y contexto.
            </p>
          </div>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {landingData.featuredStations.map((station) => (
            <TrackedLink
              key={station.station.id}
              href={appRoutes.stationDetail(station.station.id)}
              eventName="station_card_click"
              eventData={{ source: 'utility_landing_featured_stations', station_id: station.station.id }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">{station.station.name}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {station.districtName ?? 'Zaragoza'} · {station.station.bikesAvailable} bicis · ocupacion{' '}
                {formatPercent(station.currentOccupancy)}
              </p>
            </TrackedLink>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Preguntas habituales</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {FAQ_ITEMS.map((item) => (
            <article
              key={item.question}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">{item.question}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Mas rutas utiles</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TrackedLink
            href={appRoutes.districtLanding()}
            eventName="related_module_click"
            eventData={{ source: 'utility_landing_related', destination: 'district_hub' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Barrios de Zaragoza</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Entra por zona si tu decision depende mas del barrio que de una estacion concreta.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.status()}
            eventName="related_module_click"
            eventData={{ source: 'utility_landing_related', destination: 'status' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Estado del sistema</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Verifica cobertura y frescura del dato si notas huecos o lecturas parciales.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.biciradar()}
            eventName="app_external_click"
            eventData={{ source: 'utility_landing_related', destination: 'biciradar' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">BiciRadar</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              App movil para seguir disponibilidad y accesos desde el telefono.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.insightsLanding()}
            eventName="ad_landing_secondary_click"
            eventData={{ landing: 'utility', destination: 'insights' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Ir a estadisticas</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Cambia de una necesidad practica a una lectura de ranking, barrios e informes.
            </p>
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
