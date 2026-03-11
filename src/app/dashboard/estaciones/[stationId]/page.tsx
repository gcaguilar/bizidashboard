import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchAlerts,
  fetchAvailableDataMonths,
  fetchHeatmap,
  fetchPatterns,
  fetchRankings,
  fetchStations,
  type AlertsResponse,
  type RankingsResponse,
  type StationsResponse,
} from '@/lib/api';
import { normalizeMonthSearchParam, resolveActiveMonth } from '@/lib/months';
import { buildPageMetadata } from '@/lib/seo';
import { DashboardRouteLinks } from '../../_components/DashboardRouteLinks';
import { Heatmap } from '../../_components/Heatmap';
import { HourlyCharts } from '../../_components/HourlyCharts';
import { MethodologyPanel } from '../../_components/MethodologyPanel';
import { MonthFilter } from '../../_components/MonthFilter';
import { NeighborhoodMiniMap } from '../../_components/NeighborhoodMiniMap';
import { StationDetailPanel } from '../../_components/StationDetailPanel';
import { ThemeToggleButton } from '../../_components/ThemeToggleButton';

const REPO_URL = 'https://github.com/gcaguilar/bizidashboard';

export const dynamic = 'force-dynamic';

type StationDetailPageProps = {
  params: Promise<{
    stationId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function decodeStationId(encodedStationId: string): string {
  try {
    return decodeURIComponent(encodedStationId);
  } catch {
    return encodedStationId;
  }
}

export async function generateMetadata({ params }: StationDetailPageProps): Promise<Metadata> {
  const { stationId: encodedStationId } = await params;
  const stationId = decodeStationId(encodedStationId);
  const canonicalPath = `/dashboard/estaciones/${encodeURIComponent(stationId)}`;

  return buildPageMetadata({
    title: `Detalle de estacion ${stationId}`,
    description: `Consulta el detalle de la estacion ${stationId} de Bizi Zaragoza con ocupacion por hora, heatmap y comparativas operativas.`,
    path: canonicalPath,
  });
}

export default async function StationDetailPage({ params, searchParams }: StationDetailPageProps) {
  const { stationId: encodedStationId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const stationId = decodeStationId(encodedStationId);
  const nowIso = new Date().toISOString();

  const fallbackStations: StationsResponse = {
    stations: [],
    generatedAt: nowIso,
  };
  const fallbackAlerts: AlertsResponse = {
    limit: 20,
    alerts: [],
    generatedAt: nowIso,
  };
  const fallbackTurnover: RankingsResponse = {
    type: 'turnover',
    limit: 50,
    rankings: [],
    generatedAt: nowIso,
  };
  const fallbackAvailability: RankingsResponse = {
    type: 'availability',
    limit: 50,
    rankings: [],
    generatedAt: nowIso,
  };

  const [stations, availableMonths] = await Promise.all([
    fetchStations().catch(() => fallbackStations),
    fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: nowIso })),
  ]);

  const activeMonth = resolveActiveMonth(
    availableMonths.months,
    normalizeMonthSearchParam(resolvedSearchParams.month)
  );

  if (stations.stations.length === 0) {
    notFound();
  }

  const selectedStation = stations.stations.find((station) => station.id === stationId) ?? null;

  if (!selectedStation) {
    notFound();
  }

  const rankingLimit = Math.max(50, Math.min(200, stations.stations.length));

  const [alerts, turnover, availability, patterns, heatmap] = await Promise.all([
    fetchAlerts(20).catch(() => fallbackAlerts),
    fetchRankings('turnover', rankingLimit).catch(() => ({ ...fallbackTurnover, limit: rankingLimit })),
    fetchRankings('availability', rankingLimit).catch(() => ({
      ...fallbackAvailability,
      limit: rankingLimit,
    })),
    fetchPatterns(selectedStation.id, activeMonth).catch(() => []),
    fetchHeatmap(selectedStation.id, activeMonth).catch(() => []),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <header className="sticky top-0 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-lg font-black text-[var(--accent)]">
              B
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Analitica de estacion</p>
              <h1 className="text-lg font-bold text-[var(--foreground)]">{selectedStation.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DashboardRouteLinks
              activeRoute="stations"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="chips"
              className="hidden items-center gap-2 md:flex"
            />
            <DashboardRouteLinks
              activeRoute="stations"
              routes={['dashboard', 'stations', 'flow', 'help']}
              variant="chips"
              className="flex flex-wrap items-center gap-2 md:hidden"
            />
            <ThemeToggleButton />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="Repositorio de la aplicacion"
            >
              <span className="sm:hidden">Repo</span>
              <span className="hidden sm:inline">Repositorio</span>
            </a>
          </div>
        </div>
      </header>

      <MonthFilter months={availableMonths.months} activeMonth={activeMonth} />

      <StationDetailPanel
        station={selectedStation}
        stations={stations.stations}
        rankings={{ turnover, availability }}
        alerts={alerts}
        patterns={patterns}
        heatmap={heatmap}
        selectedMonth={activeMonth}
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <HourlyCharts
            stationId={selectedStation.id}
            stationName={selectedStation.name}
            patterns={patterns}
          />
        </div>
        <div className="min-w-0 xl:col-span-4">
          <NeighborhoodMiniMap stations={stations.stations} selectedStationId={selectedStation.id} />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <Heatmap
            stationId={selectedStation.id}
            stationName={selectedStation.name}
            heatmap={heatmap}
          />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <MethodologyPanel />
        </div>
      </div>
    </main>
  );
}
