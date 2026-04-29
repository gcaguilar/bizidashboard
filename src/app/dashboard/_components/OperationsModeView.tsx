import type { AlertsResponse, StationSnapshot } from '@/lib/api';
import type { DashboardMapViewState } from '@/lib/map-view-state';
import type { Coordinates } from '@/lib/geo';
import { AlertsPanel } from './AlertsPanel';
import { BalanceIndexCard } from './BalanceIndexCard';
import { CriticalStationsPanel } from './CriticalStationsPanel';
import { DailyInsightsCard } from './DailyInsightsCard';
import { MapPanel } from './MapPanel';
import { RankingsTable } from './RankingsTable';
import { StationPicker } from './StationPicker';

type StationTrend = 'up' | 'down' | 'flat';

type OperationsModeViewProps = {
  stations: StationSnapshot[];
  filteredStations: StationSnapshot[];
  totalStations: number;
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  favoriteStationIds: string[];
  onToggleFavorite: (stationId: string) => void;
  trendByStationId: Record<string, StationTrend>;
  nearestStationId: string | null;
  nearestDistanceMeters: number | null;
  userLocation: Coordinates | null;
  mapViewState: DashboardMapViewState;
  onViewStateCommit: (state: DashboardMapViewState) => void;
  frictionByStationId: Record<string, number>;
  alerts: AlertsResponse;
  rankings: {
    turnover: import('@/lib/api').RankingsResponse;
    availability: import('@/lib/api').RankingsResponse;
  };
  balanceIndex: number;
  criticalStationsCount: number;
  dailyInsight: string;
  topFrictionStationName: string | null;
  activeAlertsCount: number;
};

export function OperationsModeView(props: OperationsModeViewProps) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <BalanceIndexCard
          balanceIndex={props.balanceIndex}
          criticalStationsCount={props.criticalStationsCount}
          density="compact"
        />
        <DailyInsightsCard
          insight={props.dailyInsight}
          topFrictionStationName={props.topFrictionStationName}
          activeAlertsCount={props.activeAlertsCount}
        />
        <CriticalStationsPanel stations={props.stations} density="compact" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-stretch">
        <div className="min-w-0 lg:col-span-3">
          <MapPanel
            stations={props.filteredStations}
            totalStations={props.totalStations}
            viewMode="operations"
            initialViewState={props.mapViewState}
            frictionByStationId={props.frictionByStationId}
            selectedStationId={props.selectedStationId}
            onSelectStation={props.onSelectStation}
            favoriteStationIds={props.favoriteStationIds}
            onToggleFavorite={props.onToggleFavorite}
            trendByStationId={props.trendByStationId}
            nearestStationId={props.nearestStationId}
            nearestDistanceMeters={props.nearestDistanceMeters}
            userLocation={props.userLocation}
            onViewStateCommit={props.onViewStateCommit}
          />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <AlertsPanel alerts={props.alerts} stations={props.stations} density="compact" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <RankingsTable rankings={props.rankings} stations={props.stations} density="compact" />
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
    </>
  );
}
