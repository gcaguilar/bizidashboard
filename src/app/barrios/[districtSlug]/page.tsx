import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDistrictSeoRowBySlug, getDistrictSeoRows } from '@/lib/seo-districts';
import { buildPageMetadata } from '@/lib/seo';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const dynamicParams = false;
export const revalidate = 3600;

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
  const rows = await getDistrictSeoRows().catch(() => []);
  return rows.map((row) => ({ districtSlug: row.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { districtSlug } = await params;
  const district = await getDistrictSeoRowBySlug(districtSlug).catch(() => null);

  if (!district) {
    return {};
  }

  return buildPageMetadata({
    title: `Bizi en ${district.name}`,
    description: `Uso de Bizi en ${district.name}, con estaciones destacadas, bicicletas disponibles y acceso al dashboard de Zaragoza.`,
    path: `/barrios/${district.slug}`,
    keywords: [
      `bizi ${district.name}`,
      `estaciones bizi ${district.name}`,
      `bicis disponibles ${district.name}`,
      'bizi zaragoza barrios',
    ],
  });
}

export default async function DistrictSeoPage({ params }: PageProps) {
  const { districtSlug } = await params;
  const [district, districts] = await Promise.all([
    getDistrictSeoRowBySlug(districtSlug).catch(() => null),
    getDistrictSeoRows().catch(() => []),
  ]);

  if (!district) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const siblingDistricts = districts.filter((row) => row.slug !== district.slug).slice(0, 4);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Barrios Bizi Zaragoza', item: `${siteUrl}/barrios-bizi-zaragoza` },
          { '@type': 'ListItem', position: 3, name: district.name, item: `${siteUrl}/barrios/${district.slug}` },
        ],
      },
      {
        '@type': 'Dataset',
        name: `Bizi en ${district.name}`,
        description: `Comparativa de estaciones Bizi en ${district.name} con disponibilidad y actividad reciente.`,
        url: `${siteUrl}/barrios/${district.slug}`,
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
            href="/dashboard/flujo"
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir flujo por barrios en el dashboard
          </Link>
          <Link
            href="/barrios-bizi-zaragoza"
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
              href={`/dashboard/estaciones/${encodeURIComponent(station.stationId)}`}
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
              href={`/barrios/${row.slug}`}
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
