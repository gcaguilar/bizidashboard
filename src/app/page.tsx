import type { Metadata } from 'next';
import { CitySwitcher } from '@/app/_components/CitySwitcher';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { getSeoPageConfig, PRIMARY_SEO_PAGE_SLUGS } from '@/lib/seo-pages';
import { getStationSeoRows } from '@/lib/seo-stations';
import { buildSocialImagePath } from '@/lib/social-images';
import { getCityName, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';

const QUICK_LINKS = [
  {
    href: appRoutes.dashboard(),
    title: 'Dashboard en vivo',
    description: 'Mapa, alertas, flujo y lecturas operativas del sistema actual.',
  },
  {
    href: appRoutes.seoPage('uso-bizi-por-estacion'),
    title: 'Hub de estaciones',
    description: 'Fichas publicas, disponibilidad, patrones y acceso al detalle operativo.',
  },
  {
    href: appRoutes.districtLanding(),
    title: 'Barrios con cobertura',
    description: 'Contexto territorial, estaciones destacadas y comparativa local por barrio.',
  },
  {
    href: appRoutes.reports(),
    title: 'Archivo mensual',
    description: 'Informes indexables por mes con enlaces persistentes y contexto historico.',
  },
  {
    href: appRoutes.status(),
    title: 'Estado del sistema',
    description: 'Frescura de datos, volumen reciente y diagnostico rapido.',
  },
  {
    href: appRoutes.developers(),
    title: 'Developers y API',
    description: 'OpenAPI, ejemplos de consumo, CSV y documentacion reutilizable.',
  },
  {
    href: appRoutes.methodology(),
    title: 'Metodologia y calidad',
    description: 'Fuente GBFS, cobertura, limites de interpretacion y criterios de publicacion SEO.',
  },
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: 'DatosBizi: estaciones Bizi Zaragoza, uso, disponibilidad y analisis',
  description:
    'Consulta estaciones Bizi Zaragoza, disponibilidad actual, patrones de uso, barrios, rankings, informes mensuales y datos abiertos desde una unica capa publica.',
  path: appRoutes.home(),
  keywords: [
    'datosbizi',
    'bizi zaragoza',
    'estaciones bizi zaragoza',
    'disponibilidad bizi',
    'ranking estaciones bizi',
    'informes bizi zaragoza',
  ],
  socialImagePath: buildSocialImagePath({
    kind: 'home',
    title: 'DatosBizi Zaragoza',
    subtitle: 'Estaciones, disponibilidad, rankings e informes mensuales',
    eyebrow: 'Datos publicos y analisis',
    badges: ['Dashboard', 'Informes', 'API'],
  }),
});

function formatPercent(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function Home() {
  const currentCityName = getCityName();
  const featuredStations = (await getStationSeoRows())
    .filter((station) => station.indexability.indexable)
    .slice(0, 4);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-8 overflow-x-clip px-4 py-8 md:px-6 md:py-12">
      <PublicPageViewTracker pageType="home" template="home" pageSlug="home" />

      <header className="hero-card">
        <PublicSectionNav activeItemId="home" />
        <CitySwitcher className="mt-3" compact />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Panel publico y rutas indexables
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
              {SITE_TITLE}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              {SITE_DESCRIPTION} Esta instalacion publica esta enfocada en {currentCityName} y
              enlaza al dashboard, hubs publicos de estaciones y barrios, informes, API y landings SEO
              con rutas estables.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">Ciudad activa {currentCityName}</span>
            <span className="kpi-chip">Navegacion canonica sin prefijo</span>
            <span className="kpi-chip">API y comparador visibles</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <TrackedLink
            href={appRoutes.dashboard()}
            ctaEvent={{
              source: 'home_hero',
              ctaId: 'home_primary',
              destination: 'dashboard_home',
              sourceRole: 'home',
              destinationRole: 'dashboard',
              transitionKind: 'to_dashboard',
            }}
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir dashboard principal
          </TrackedLink>
          <TrackedLink
            href={appRoutes.seoPage('uso-bizi-por-estacion')}
            navigationEvent={{
              source: 'home_hero',
              destination: 'station_hub',
              sourceRole: 'home',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Explorar estaciones publicas
          </TrackedLink>
          <TrackedLink
            href={appRoutes.developers()}
            ctaEvent={{
              source: 'home_hero',
              ctaId: 'api_open',
              destination: 'developers',
              entityType: 'api',
              sourceRole: 'home',
              destinationRole: 'utility',
              transitionKind: 'within_public',
            }}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Abrir Developers
          </TrackedLink>
        </div>

        <PublicSearchForm eventSource="home_hero" />
      </header>

      <section className="dashboard-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Como usar la capa publica
            </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Mejor pocas rutas utiles que muchas paginas vacias
            </h2>
          </div>
          <p>
            DatosBizi combina lectura rapida para usuarios y estructura clara para buscadores.
            La home concentra los accesos fuertes: dashboard para operativa, informes para lectura
            historica, barrios para contexto local y fichas publicas de estacion cuando hay datos
            suficientes para sostener una landing real.
          </p>
          <p>
            Si vienes con una necesidad practica, lo normal es abrir una estacion o el mapa en vivo.
            Si buscas contexto, conviene empezar por rankings, barrios o el archivo mensual. Esa
            separacion ayuda a que el producto principal siga siendo rapido mientras las paginas
            indexables ganan semantica, enlazado interno y mejor CTR.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <TrackedLink
            key={link.href}
            href={link.href}
            navigationEvent={{
              source: 'home_quick_links',
              destination: link.href,
              sourceRole: 'home',
              destinationRole: link.href === appRoutes.dashboard() ? 'dashboard' : 'hub',
              transitionKind: link.href === appRoutes.dashboard() ? 'to_dashboard' : 'within_public',
            }}
            className="dashboard-card transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Acceso rapido
            </p>
            <h2 className="mt-2 text-xl font-black text-[var(--foreground)]">{link.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{link.description}</p>
          </TrackedLink>
        ))}
      </section>

      {featuredStations.length > 0 ? (
        <section className="dashboard-card">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[var(--foreground)]">
                Estaciones publicas destacadas
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Fichas con contexto real, comparacion frente a la ciudad y acceso al detalle operativo.
              </p>
            </div>
            <TrackedLink
              href={appRoutes.seoPage('uso-bizi-por-estacion')}
              navigationEvent={{
                source: 'home_featured_stations',
                destination: 'station_hub',
                sourceRole: 'home',
                destinationRole: 'hub',
                transitionKind: 'within_public',
              }}
              className="text-sm font-bold text-[var(--accent)] transition hover:opacity-80"
            >
              Ver mas estaciones
            </TrackedLink>
          </div>

          <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {featuredStations.map((station) => (
              <TrackedLink
                key={station.station.id}
                href={appRoutes.stationDetail(station.station.id)}
                entitySelectEvent={{
                  source: 'home_featured_stations',
                  entityType: 'station',
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{station.station.name}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {station.districtName ?? currentCityName} · {station.station.bikesAvailable} bicis · ocupacion{' '}
                  {formatPercent(station.currentOccupancy)}
                </p>
              </TrackedLink>
            ))}
          </div>
        </section>
      ) : null}

      <section className="dashboard-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">
              Rutas preparadas para captacion
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Dos entradas distintas segun la intencion: resolver algo rapido o descubrir insights.
            </p>
          </div>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <TrackedLink
            href={appRoutes.utilityLanding()}
            navigationEvent={{
              source: 'home_acquisition_routes',
              destination: 'utility_landing',
              sourceRole: 'home',
              destinationRole: 'entry_seo',
              transitionKind: 'within_public',
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Mapa y estaciones en tiempo real</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Pensada para quien quiere comprobar disponibilidad, encontrar una estacion y decidir rapido.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.insightsLanding()}
            navigationEvent={{
              source: 'home_acquisition_routes',
              destination: 'insights_landing',
              sourceRole: 'home',
              destinationRole: 'entry_seo',
              transitionKind: 'within_public',
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Estadisticas y ranking</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Orientada a curiosidad, comparacion y salto hacia informes, barrios y rankings fuertes.
            </p>
          </TrackedLink>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">
              Rutas SEO disponibles
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cada landing publica resume una capa concreta del sistema y enlaza al dashboard
              correspondiente.
            </p>
          </div>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PRIMARY_SEO_PAGE_SLUGS.map((slug) => {
            const page = getSeoPageConfig(slug);

            return (
              <TrackedLink
                key={slug}
                href={appRoutes.seoPage(slug)}
                navigationEvent={{
                  source: 'home_seo_grid',
                  destination: slug,
                  sourceRole: 'home',
                  destinationRole: page.pageRole === 'HUB' ? 'hub' : 'entry_seo',
                  transitionKind: 'within_public',
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{page.title}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">{page.description}</p>
              </TrackedLink>
            );
          })}
        </div>
      </section>
    </main>
  );
}
