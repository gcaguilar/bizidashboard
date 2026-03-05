import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchStations } from '@/lib/api';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';
import { MethodologyPanel } from '../_components/MethodologyPanel';
import { MobilityInsights } from '../_components/MobilityInsights';
import { NeighborhoodMiniMap } from '../_components/NeighborhoodMiniMap';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Flow analysis',
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/dashboard/flujo',
  },
  openGraph: {
    title: `${SITE_TITLE} - Flow analysis`,
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
      <header className="sticky top-0 z-40 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Flow analysis</p>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Flujo entre barrios y demanda</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="icon-button">
              Dashboard
            </Link>
            <Link href="/dashboard/ayuda" className="icon-button">
              FAQ
            </Link>
          </div>
        </div>
      </header>

      <MobilityInsights
        stations={stations.stations}
        selectedStationId={selectedStationId}
        mobilityDays={14}
        demandDays={30}
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-6">
          <NeighborhoodMiniMap stations={stations.stations} selectedStationId={selectedStationId} />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <MethodologyPanel />
        </div>
      </div>
    </main>
  );
}
