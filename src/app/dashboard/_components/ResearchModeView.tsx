import Link from 'next/link';
import type { StationSnapshot } from '@/lib/api';
import { appRoutes } from '@/lib/routes';
import { DemandFlowCard } from './DemandFlowCard';
import { FlowPreviewPanel } from './FlowPreviewPanel';
import { NeighborhoodLoadCard } from './NeighborhoodLoadCard';
import { RankingsTable } from './RankingsTable';
import { ResearchSummaryCard } from './ResearchSummaryCard';
import { ResearchVolatilityCard } from './ResearchVolatilityCard';
import { StationPicker } from './StationPicker';
import { StationStabilityCard } from './StationStabilityCard';
import { SystemIntradayCard } from './SystemIntradayCard';
import type { RecentStationSnapshot } from '@/lib/recent-station-history';

type StationTrend = 'up' | 'down' | 'flat';

type ResearchModeViewProps = {
  stations: StationSnapshot[];
  filteredStations: StationSnapshot[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  favoriteStationIds: string[];
  onToggleFavorite: (stationId: string) => void;
  trendByStationId: Record<string, StationTrend>;
  nearestStationId: string | null;
  rankings: {
    turnover: import('@/lib/api').RankingsResponse;
    availability: import('@/lib/api').RankingsResponse;
  };
  dailyDemand: Array<{ day: string; demandScore: number; avgOccupancy: number; sampleCount: number }>;
  systemHourlyProfile: Array<{ hour: number; avgOccupancy: number; avgBikesAvailable: number; sampleCount: number }>;
  hourlySignals: Array<{ stationId: string; hour: number; departures: number; arrivals: number; sampleCount: number }>;
  windowLabel: string;
  requestedDays: number;
  recentSnapshots: RecentStationSnapshot[];
};

export function ResearchModeView(props: ResearchModeViewProps) {
  return (
    <>
      <div id="mode-panel-research" role="tabpanel" aria-labelledby="mode-tab-research" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <DemandFlowCard
          dailyDemand={props.dailyDemand}
          windowLabel={props.windowLabel}
          requestedDays={props.requestedDays}
        />
        <SystemIntradayCard rows={props.systemHourlyProfile} windowLabel={props.windowLabel} />
        <NeighborhoodLoadCard stations={props.stations} />
        <StationStabilityCard rankings={props.rankings.availability} stations={props.stations} />
        <ResearchSummaryCard
          dailyDemand={props.dailyDemand}
          systemHourlyProfile={props.systemHourlyProfile}
          recentSnapshots={props.recentSnapshots}
          stations={props.stations}
        />
        <ResearchVolatilityCard rankings={props.rankings.availability} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <RankingsTable rankings={props.rankings} stations={props.stations} density="normal" />
        <StationPicker
          stations={props.filteredStations}
          selectedStationId={props.selectedStationId}
          onSelectStation={props.onSelectStation}
          favoriteStationIds={props.favoriteStationIds}
          onToggleFavorite={props.onToggleFavorite}
          trendByStationId={props.trendByStationId}
          nearestStationId={props.nearestStationId}
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--accent)]/8 px-4 py-4">
          <div>
            <h2 className="text-lg font-bold leading-tight text-[var(--foreground)]">Analisis de flujo y corredores populares</h2>
            <p className="text-xs text-[var(--muted)]">Movimiento entre barrios en tiempo real.</p>
          </div>
          <Link
            href={appRoutes.dashboardFlow()}
            className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/12 px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Vista completa
          </Link>
        </div>
        <FlowPreviewPanel stations={props.stations} hourlySignals={props.hourlySignals} />
      </section>
    </>
  );
}
