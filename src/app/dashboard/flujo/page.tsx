import type { Metadata } from 'next';
import { fetchAvailableDataMonths, fetchStations } from '@/lib/api';
import { normalizeMonthSearchParam, resolveActiveMonth } from '@/lib/months';
import { buildPageMetadata } from '@/lib/seo';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { DashboardRouteLinks } from '../_components/DashboardRouteLinks';
import { GitHubRepoButton } from '../_components/GitHubRepoButton';
import { MonthFilter } from '../_components/MonthFilter';
import { MobilityInsights } from '../_components/MobilityInsights';
import { ThemeToggleButton } from '../_components/ThemeToggleButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Analisis de flujo',
  description:
    'Analiza corredores de movilidad de Bizi Zaragoza, curva diaria de demanda e impacto horario del transporte publico.',
  path: '/dashboard/flujo',
});

type DashboardFlowPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardFlowPage({ searchParams }: DashboardFlowPageProps) {
  const siteUrl = getSiteUrl();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const [stations, availableMonths] = await Promise.all([
    fetchStations().catch(() => ({
      stations: [],
      generatedAt: new Date().toISOString(),
    })),
    fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: new Date().toISOString() })),
  ]);

  const activeMonth = resolveActiveMonth(
    availableMonths.months,
    normalizeMonthSearchParam(resolvedSearchParams.month)
  );

  const selectedStationId = stations.stations[0]?.id ?? '';
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Dashboard', item: `${siteUrl}/dashboard` },
          { '@type': 'ListItem', position: 3, name: 'Flujo', item: `${siteUrl}/dashboard/flujo` },
        ],
      },
      {
        '@type': 'Dataset',
        name: 'Corredores y flujo por barrios de Bizi Zaragoza',
        description:
          'Datos agregados de movilidad, demanda, impacto del transporte publico y flujos entre barrios para el analisis urbano.',
        url: `${siteUrl}/dashboard/flujo`,
        creator: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${siteUrl}/api/mobility` },
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${siteUrl}/api/history` },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="sticky top-0 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-white">
                B
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">Bizi Zaragoza</h1>
            </div>
            <DashboardRouteLinks
              activeRoute="flow"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="inline"
              className="hidden items-center gap-5 md:flex"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DashboardRouteLinks
              activeRoute="flow"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="chips"
              className="flex flex-wrap items-center gap-2 md:hidden"
            />
            <ThemeToggleButton />
            <GitHubRepoButton />
          </div>
        </div>
      </header>

      <MonthFilter months={availableMonths.months} activeMonth={activeMonth} />

      <MobilityInsights
        stations={stations.stations}
        selectedStationId={selectedStationId}
        mobilityDays={14}
        demandDays={30}
      />
    </main>
  );
}
