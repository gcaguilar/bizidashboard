import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { AlertsResponse, StationSnapshot, StatusResponse } from '@/lib/api';
import type { DashboardViewMode } from '@/lib/dashboard-modes';
import type { Coordinates } from '@/lib/geo';
import type { DashboardMapViewState } from '@/lib/map-view-state';
import { appRoutes } from '@/lib/routes';
import { BalanceIndexCard } from './BalanceIndexCard';
import { DailyInsightsCard } from './DailyInsightsCard';
import { DemandFlowCard } from './DemandFlowCard';
import { FlowPreviewPanel } from './FlowPreviewPanel';
import { MapPanel } from './MapPanel';
import { NeighborhoodLoadCard } from './NeighborhoodLoadCard';
import { SystemHealthCard } from './SystemHealthCard';
import { SystemIntradayCard } from './SystemIntradayCard';

type StationTrend = 'up' | 'down' | 'flat';

type OverviewModeViewProps = {
  status: StatusResponse;
  stationsGeneratedAt: string;
  totalStations: number;
  stations: StationSnapshot[];
  filteredStations: StationSnapshot[];
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
  systemMetrics: {
    totalStations: number;
    bikesAvailable: number;
    anchorsFree: number;
    avgOccupancy: number;
    balanceIndex: number;
    criticalStations: StationSnapshot[];
    activeAlerts: AlertsResponse['alerts'];
    dailyInsight: string;
  };
  updatedText: string;
  topFrictionStationName: string | null;
  mobilityPreview: {
    dailyDemand: Array<{ day: string; demandScore: number; avgOccupancy: number; sampleCount: number }>;
    systemHourlyProfile: Array<{ hour: number; avgOccupancy: number; avgBikesAvailable: number; sampleCount: number }>;
    hourlySignals: Array<{ stationId: string; hour: number; departures: number; arrivals: number; sampleCount: number }>;
  };
  activeWindowLabel: string;
  activeWindowDemandDays: number;
};

export function OverviewModeView({
  status,
  totalStations,
  stations,
  filteredStations,
  selectedStationId,
  onSelectStation,
  favoriteStationIds,
  onToggleFavorite,
  trendByStationId,
  nearestStationId,
  nearestDistanceMeters,
  userLocation,
  mapViewState,
  onViewStateCommit,
  frictionByStationId,
  systemMetrics,
  updatedText,
  topFrictionStationName,
  mobilityPreview,
  activeWindowLabel,
  activeWindowDemandDays,
}: OverviewModeViewProps) {
  const statusLabel =
    status.pipeline.healthStatus === 'healthy'
      ? 'saludable'
      : status.pipeline.healthStatus === 'degraded'
        ? 'degradado'
        : status.pipeline.healthStatus === 'down'
          ? 'caido'
          : 'desconocido';

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <SystemHealthCard
          totalStations={systemMetrics.totalStations}
          bikesAvailable={systemMetrics.bikesAvailable}
          anchorsFree={systemMetrics.anchorsFree}
          avgOccupancy={systemMetrics.avgOccupancy}
          updatedText={updatedText}
        />
        <BalanceIndexCard
          balanceIndex={systemMetrics.balanceIndex}
          criticalStationsCount={systemMetrics.criticalStations.length}
        />
        <DailyInsightsCard
          insight={systemMetrics.dailyInsight}
          topFrictionStationName={topFrictionStationName}
          activeAlertsCount={systemMetrics.activeAlerts.length}
        />
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Estado del sistema</p>
            <h2 className="text-base font-bold text-[var(--foreground)]">Diagnostico rapido fuera del panel principal</h2>
            <p className="text-sm text-[var(--muted)]">
              Estado actual: <span className="font-semibold text-[var(--foreground)]">{statusLabel}</span> · ultima referencia {updatedText}
            </p>
          </div>

          <Button asChild variant="cta" size="sm">
            <Link href={appRoutes.status()}>Abrir pagina de estado</Link>
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-stretch">
        <div className="min-w-0 lg:col-span-3">
          <MapPanel
            stations={filteredStations}
            totalStations={totalStations}
            viewMode={'overview' satisfies DashboardViewMode}
            initialViewState={mapViewState}
            frictionByStationId={frictionByStationId}
            selectedStationId={selectedStationId}
            onSelectStation={onSelectStation}
            favoriteStationIds={favoriteStationIds}
            onToggleFavorite={onToggleFavorite}
            trendByStationId={trendByStationId}
            nearestStationId={nearestStationId}
            nearestDistanceMeters={nearestDistanceMeters}
            userLocation={userLocation}
            onViewStateCommit={onViewStateCommit}
          />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <div className="dashboard-card h-full">
            <p className="text-sm text-[var(--muted)]">Resumen visual rapido disponible en el modo Operaciones y el historial completo en la pagina de alertas.</p>
            <Button asChild variant="cta" size="sm" className="mt-auto">
              <Link href={appRoutes.dashboardAlerts()}>Abrir alertas completas</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <DemandFlowCard
          dailyDemand={mobilityPreview.dailyDemand}
          windowLabel={activeWindowLabel}
          requestedDays={activeWindowDemandDays}
        />
        <SystemIntradayCard rows={mobilityPreview.systemHourlyProfile} windowLabel={activeWindowLabel} />
        <NeighborhoodLoadCard stations={stations} />
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--accent)]/8 px-4 py-4">
          <div>
            <h2 className="text-lg font-bold leading-tight text-[var(--foreground)]">Analisis de flujo y corredores populares</h2>
            <p className="text-xs text-[var(--muted)]">Movimiento entre barrios en tiempo real.</p>
          </div>
          <Button asChild variant="cta" size="sm">
            <Link href={appRoutes.dashboardFlow()}>Vista completa</Link>
          </Button>
        </div>
        <FlowPreviewPanel stations={stations} hourlySignals={mobilityPreview.hourlySignals} />
      </section>
    </>
  );
}
