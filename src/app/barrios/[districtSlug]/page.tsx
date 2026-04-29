import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { getDistrictSeoRowBySlug, getDistrictSeoRows, getDistrictSlugsFromGeoJson } from '@/lib/seo-districts';
import { buildPageMetadata } from '@/lib/seo';
import { buildSocialImagePath } from '@/lib/social-images';
import { buildItemListStructuredData } from '@/lib/structured-data';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { average, formatDecimal, formatInteger } from '@/lib/format';
import { PageShell } from '@/components/layout/page-shell';

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ districtSlug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getDistrictSlugsFromGeoJson().catch(() => []);
  return slugs.map((districtSlug) => ({ districtSlug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { districtSlug } = await params;
  const district = await getDistrictSeoRowBySlug(districtSlug).catch(() => null);

  if (!district) {
    return buildPageMetadata({
      title: 'Barrios de Bizi Zaragoza',
      description:
        'Ficha de barrio sin cobertura suficiente para publicar una landing indexable.',
      path: appRoutes.districtDetail(districtSlug),
      indexability: {
        pageType: 'district',
        hasMeaningfulContent: true,
        hasData: false,
        requiresStrongCoverage: true,
      },
    });
  }

  return buildPageMetadata({
    title: `${district.name}: uso de Bizi, estaciones y actividad en Zaragoza`,
    description: `Analiza el uso de Bizi en ${district.name}, descubre sus estaciones mas activas y compara la actividad del barrio con el resto de Zaragoza.`,
    path: appRoutes.districtDetail(district.slug),
    keywords: [
      `bizi ${district.name}`,
      `estaciones bizi ${district.name}`,
      `bicis disponibles ${district.name}`,
      'bizi zaragoza barrios',
    ],
    socialImagePath: buildSocialImagePath({
      kind: 'district',
      title: `${district.name}: estaciones y actividad`,
      subtitle: `${district.stationCount} estaciones · ${district.bikesAvailable} bicis visibles · rotacion media ${formatDecimal(district.avgTurnover)}`,
      eyebrow: 'Ficha SEO por barrio',
      badges: [`${district.stationCount} estaciones`, `${district.bikesAvailable} bicis`],
    }),
    indexability: {
      pageType: 'district',
      hasMeaningfulContent: true,
      hasData: district.stationCount > 0 && district.topStations.length > 0,
      requiresStrongCoverage: true,
      thresholds: [
        {
          label: 'district-stations',
          current: district.stationCount,
          minimum: 2,
        },
        {
          label: 'district-top-stations',
          current: district.topStations.length,
          minimum: 2,
        },
      ],
    },
  });
}

export default async function DistrictSeoPage({ params }: PageProps) {
  const { districtSlug } = await params;
  const [district, districts] = await Promise.all([
    getDistrictSeoRowBySlug(districtSlug).catch(() => null),
    getDistrictSeoRows().catch(() => []),
  ]);

  if (!district && districts.length > 0) {
    notFound();
  }

  if (!district) {
    const displayName = districtSlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return (
      <PageShell>
        <PublicPageViewTracker pageType="district" template="district_detail" pageSlug={districtSlug} />

        <header className="ui-page-hero">
          <SiteBreadcrumbs items={createRootBreadcrumbs(
            { label: 'Barrios Bizi Zaragoza', href: appRoutes.districtLanding() },
            { label: displayName, href: appRoutes.districtDetail(districtSlug) }
          )} />
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ficha SEO por barrio</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Bizi en {displayName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Informacion sobre el uso de Bizi en {displayName}, Zaragoza. Estaciones, disponibilidad de bicicletas y datos operativos del servicio de bicicleta publica.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={appRoutes.districtLanding()}
              className="ui-inline-action"
            >
              Ver comparativa de barrios
            </Link>
          </div>
        </header>
      </PageShell>
    );
  }

  const siteUrl = getSiteUrl();
  const siblingDistricts = districts.filter((row) => row.slug !== district.slug).slice(0, 4);
  const cityAverageTurnover = average(districts.map((row) => row.avgTurnover));
  const cityAverageAvailabilityRisk = average(
    districts.map((row) => row.avgAvailabilityRisk)
  );
  const breadcrumbs = createRootBreadcrumbs(
    {
      label: 'Barrios Bizi Zaragoza',
      href: appRoutes.districtLanding(),
    },
    {
      label: district.name,
      href: appRoutes.districtDetail(district.slug),
    }
  );
  const topStationEntries = district.topStations.map((station) => ({
    name: station.stationName,
    url: `${siteUrl}${appRoutes.stationDetail(station.stationId)}`,
  }));
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'CollectionPage',
        name: `Bizi en ${district.name}`,
        description: `Comparativa de estaciones Bizi en ${district.name} con disponibilidad y actividad reciente.`,
        url: `${siteUrl}${appRoutes.districtDetail(district.slug)}`,
        inLanguage: 'es',
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
      },
      ...(topStationEntries.length > 0
        ? [buildItemListStructuredData(`Estaciones destacadas en ${district.name}`, topStationEntries)]
        : []),
    ],
  };

  return (
    <PageShell>
      <PublicPageViewTracker pageType="district" template="district_detail" pageSlug={district.slug} />

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeItemId="explore" className="mt-1" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ficha SEO por barrio</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Bizi en {district.name}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Vista indexable del barrio con estaciones destacadas, disponibilidad actual y acceso rapido al dashboard y al detalle operativo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{district.stationCount} estaciones</span>
            <span className="ui-chip">{district.bikesAvailable} bicis disponibles</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <TrackedLink
            href={appRoutes.dashboardFlow()}
            navigationEvent={{
              source: 'district_hero',
              destination: 'dashboard_flow',
              sourceRole: 'hub',
              destinationRole: 'dashboard',
              transitionKind: 'to_dashboard',
            }}
            className="inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir flujo por barrios en el dashboard
          </TrackedLink>
          <TrackedLink
            href={appRoutes.districtLanding()}
            navigationEvent={{
              source: 'district_hero',
              destination: 'district_hub',
              sourceRole: 'hub',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="ui-inline-action"
          >
            Ver comparativa de barrios
          </TrackedLink>
        </div>
      </header>

      <section className="ui-section-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Como leer este barrio
            </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Hub intermedio entre estaciones, rankings e informes
            </h2>
          </div>
          <p>
            Esta ficha resume cuantas estaciones activas tiene {district.name}, cuantas bicis y
            plazas concentra ahora mismo y que nivel de rotacion registra frente al resto de
            Zaragoza. Sirve para detectar si el barrio funciona como zona estable, como area muy
            demandada o como punto con mas friccion operativa.
          </p>
          <p>
            En la ventana reciente, {district.name} marca {formatDecimal(district.avgTurnover)} puntos de
            rotacion media frente a {formatDecimal(cityAverageTurnover)} en la ciudad. Su riesgo operativo
            medio es de {formatDecimal(district.avgAvailabilityRisk)} horas, comparado con {formatDecimal(cityAverageAvailabilityRisk)} de promedio.
            Desde aqui tiene sentido bajar al detalle de cada estacion o saltar a rankings e informes.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="ui-section-card">
          <p className="stat-label">Rotacion media</p>
          <p className="stat-value">{formatDecimal(district.avgTurnover)} pts</p>
          <p className="text-xs text-[var(--muted)]">Media reciente de actividad por estacion dentro del barrio.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Riesgo operativo medio</p>
          <p className="stat-value">{formatDecimal(district.avgAvailabilityRisk)}</p>
          <p className="text-xs text-[var(--muted)]">Horas medias de friccion entre vaciado y saturacion por estacion.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Capacidad agregada</p>
          <p className="stat-value">{formatInteger(district.capacity)}</p>
          <p className="text-xs text-[var(--muted)]">Anclajes totales repartidos entre las estaciones del barrio.</p>
        </article>
      </section>

      <section className="ui-section-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones destacadas en {district.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Ordenadas por actividad reciente y enlazadas al detalle operativo existente.</p>
          </div>
        </div>
        <div className="mt-2 space-y-3">
          {district.topStations.map((station, index) => (
            <TrackedLink
              key={station.stationId}
              href={appRoutes.stationDetail(station.stationId)}
              entitySelectEvent={{
                source: 'district_top_stations',
                entityType: 'station',
              }}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">{index + 1}. {station.stationName}</p>
                <p className="text-[11px] text-[var(--muted)]">
                  {station.bikesAvailable} bicis · {station.anchorsFree} anclajes libres · capacidad {station.capacity}
                </p>
              </div>
              <span className="rounded-full bg-[var(--primary)]/12 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                {formatDecimal(station.turnoverScore)} pts
              </span>
            </TrackedLink>
          ))}
        </div>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Barrios y rutas relacionadas</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TrackedLink
            href={appRoutes.reports()}
            ctaEvent={{
              source: 'district_related',
              ctaId: 'report_open',
              destination: 'report_archive',
              entityType: 'report',
              sourceRole: 'hub',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="ui-surface-block ui-surface-block-interactive"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Archivo mensual</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Informes indexables para conectar este barrio con el contexto historico.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.seoPage('ranking-estaciones-bizi')}
            navigationEvent={{
              source: 'district_related',
              destination: 'station_ranking',
              sourceRole: 'hub',
              destinationRole: 'entry_seo',
              transitionKind: 'within_public',
            }}
            className="ui-surface-block ui-surface-block-interactive"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Ranking de estaciones</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Contrasta las estaciones del barrio con las mas activas de Zaragoza.
            </p>
          </TrackedLink>
          {siblingDistricts.map((row) => (
            <TrackedLink
              key={row.slug}
              href={appRoutes.districtDetail(row.slug)}
              navigationEvent={{
                source: 'district_related',
                destination: row.slug,
                sourceRole: 'hub',
                destinationRole: 'hub',
                transitionKind: 'within_public',
              }}
              className="ui-surface-block ui-surface-block-interactive"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">{row.name}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {row.stationCount} estaciones · {formatDecimal(row.avgTurnover)} pts medios
              </p>
            </TrackedLink>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
