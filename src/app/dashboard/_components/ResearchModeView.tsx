import { TrackedLink } from '@/app/_components/TrackedLink';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { StationSnapshot, RankingsResponse } from '@/lib/api-types';
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
import { ANALYTICS_WINDOWS } from '@/analytics/types';
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
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
  dailyDemand: Array<{ day: string; demandScore: number; avgOccupancy: number; sampleCount: number }>;
  systemHourlyProfile: Array<{ hour: number; avgOccupancy: number; avgBikesAvailable: number; sampleCount: number }>;
  hourlySignals: Array<{ stationId: string; hour: number; departures: number; arrivals: number; sampleCount: number }>;
  windowLabel: string;
  requestedDays: number;
  isWindowLoading?: boolean;
  recentSnapshots: RecentStationSnapshot[];
  currentMonth?: string | null;
};

export function ResearchModeView({ currentMonth, ...props }: ResearchModeViewProps) {
  return (
    <>
      <div
        aria-busy={props.isWindowLoading ? true : undefined}
        className="relative grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {props.isWindowLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute -top-3 left-0 right-0 z-10 flex justify-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px] font-semibold text-[var(--muted)] shadow-[var(--shadow-soft)]">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]"
              />
              Recalculando la ventana {props.windowLabel.toLowerCase()}…
            </span>
          </div>
        ) : null}
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

      <div className="space-y-1">
        <p className="text-xs text-[var(--muted)]">
          Ventana de movilidad: <strong className="text-[var(--foreground)]">{props.windowLabel}</strong>. Los
          rankings de fricción y rotación se calculan sobre una ventana fija de {ANALYTICS_WINDOWS.rankingDays} días
          y no cambian con el selector temporal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <RankingsTable rankings={props.rankings} stations={props.stations} density="normal" />
        <StationPicker
          stations={props.filteredStations}
          selectedStationId={props.selectedStationId}
          onSelectStation={props.onSelectStation}
          favoriteStationIds={props.favoriteStationIds}
          trendByStationId={props.trendByStationId}
          nearestStationId={props.nearestStationId}
        />
      </div>

      <Card variant="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--primary)]/8 px-4 py-4">
          <div>
            <h2 className="text-lg font-bold leading-tight text-[var(--foreground)]">Movilidad entre barrios</h2>
            <p className="text-xs text-[var(--muted)]">Flujos estimados a partir de los cambios observados en las estaciones.</p>
          </div>
          <TrackedLink href={appRoutes.dashboardFlow({ month: currentMonth || undefined })}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'border-[var(--primary)] bg-[var(--primary)]/12 px-3 py-2 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white',
            })}
          >
            Ver análisis completo
          </TrackedLink>
        </div>
        <FlowPreviewPanel stations={props.stations} hourlySignals={props.hourlySignals} currentMonth={currentMonth} />
      </Card>
    </>
  );
}
