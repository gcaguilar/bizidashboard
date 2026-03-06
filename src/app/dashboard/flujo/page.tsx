import type { Metadata } from 'next';
import { fetchStations } from '@/lib/api';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';
import { DashboardRouteLinks } from '../_components/DashboardRouteLinks';
import { MobilityInsights } from '../_components/MobilityInsights';

const REPO_URL = 'https://github.com/gcaguilar/bizidashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Analisis de flujo',
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/dashboard/flujo',
  },
  openGraph: {
    title: `${SITE_TITLE} - Analisis de flujo`,
    description: SITE_DESCRIPTION,
    url: '/dashboard/flujo',
  },
};

export default async function DashboardFlowPage() {
  const stations = await fetchStations().catch(() => ({
    stations: [],
    generatedAt: new Date().toISOString(),
  }));

  const selectedStationId = stations.stations[0]?.id ?? '';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
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
              routes={['dashboard', 'stations', 'flow', 'conclusions']}
              variant="inline"
              className="hidden items-center gap-5 md:flex"
            />
          </div>
          <div className="flex items-center gap-2">
            <DashboardRouteLinks
              activeRoute="flow"
              routes={['dashboard', 'stations', 'conclusions', 'help']}
              variant="chips"
              className="flex items-center gap-2 md:hidden"
            />
            <DashboardRouteLinks
              activeRoute="flow"
              routes={['help']}
              variant="chips"
              className="hidden items-center gap-2 md:flex"
            />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="Repositorio de la aplicacion"
            >
              Repositorio
            </a>
          </div>
        </div>
      </header>

      <MobilityInsights
        stations={stations.stations}
        selectedStationId={selectedStationId}
        mobilityDays={14}
        demandDays={30}
      />
    </main>
  );
}
