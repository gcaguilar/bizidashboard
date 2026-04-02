import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { getDistrictSeoRowBySlug, getDistrictSeoRows, getDistrictSlugsFromGeoJson } from '@/lib/seo-districts';
import { buildPageMetadata } from '@/lib/seo';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ districtSlug: string }>;
};

function formatInteger(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

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
      <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
        <header className="hero-card">
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
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Ver comparativa de barrios
            </Link>
          </div>
        </header>
      </main>
    );
  }

  const siteUrl = getSiteUrl();
  const siblingDistricts = districts.filter((row) => row.slug !== district.slug).slice(0, 4);
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
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'Dataset',
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
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
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
            <span className="kpi-chip">{district.stationCount} estaciones</span>
            <span className="kpi-chip">{district.bikesAvailable} bicis disponibles</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={appRoutes.dashboardFlow()}
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir flujo por barrios en el dashboard
          </Link>
          <Link
            href={appRoutes.districtLanding()}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Ver comparativa de barrios
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="dashboard-card">
          <p className="stat-label">Rotacion media</p>
          <p className="stat-value">{formatDecimal(district.avgTurnover)} pts</p>
          <p className="text-xs text-[var(--muted)]">Media reciente de actividad por estacion dentro del barrio.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Riesgo operativo medio</p>
          <p className="stat-value">{formatDecimal(district.avgAvailabilityRisk)}</p>
          <p className="text-xs text-[var(--muted)]">Horas medias de friccion entre vaciado y saturacion por estacion.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Capacidad agregada</p>
          <p className="stat-value">{formatInteger(district.capacity)}</p>
          <p className="text-xs text-[var(--muted)]">Anclajes totales repartidos entre las estaciones del barrio.</p>
        </article>
      </section>

      <section className="dashboard-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones destacadas en {district.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Ordenadas por actividad reciente y enlazadas al detalle operativo existente.</p>
          </div>
        </div>
        <div className="mt-2 space-y-3">
          {district.topStations.map((station, index) => (
            <Link
              key={station.stationId}
              href={appRoutes.dashboardStation(station.stationId)}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">{index + 1}. {station.stationName}</p>
                <p className="text-[11px] text-[var(--muted)]">
                  {station.bikesAvailable} bicis · {station.anchorsFree} anclajes libres · capacidad {station.capacity}
                </p>
              </div>
              <span className="rounded-full bg-[var(--accent)]/12 px-3 py-1 text-xs font-bold text-[var(--accent)]">
                {formatDecimal(station.turnoverScore)} pts
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Barrios relacionados</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {siblingDistricts.map((row) => (
            <Link
              key={row.slug}
              href={appRoutes.districtDetail(row.slug)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">{row.name}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {row.stationCount} estaciones · {formatDecimal(row.avgTurnover)} pts medios
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
