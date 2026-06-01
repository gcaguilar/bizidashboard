'use client';

import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import type { AlertsResponse, StationSnapshot } from '@/lib/api-types';
import type { Coordinates } from '@/lib/geo';
import type { DashboardMapViewState } from '@/lib/map-view-state';
import { appRoutes } from '@/lib/routes';
import { AlertsTopList, QuickViewErrorBoundary } from './AlertsTopList';
import { BalanceIndexCard } from './BalanceIndexCard';
import { DailyInsightsCard } from './DailyInsightsCard';
import { MapPanel } from './MapPanel';
import { SystemHealthCard } from './SystemHealthCard';

type StationTrend = 'up' | 'down' | 'flat';

type QuickOverviewViewProps = {
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
  alerts: AlertsResponse;
};

export function QuickOverviewView({
  filteredStations,
  totalStations,
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
  alerts,
}: QuickOverviewViewProps) {
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-stretch">
        <div className="min-w-0 lg:col-span-3">
          <QuickViewErrorBoundary
            fallback={
              <div className="flex h-[560px] items-center justify-center rounded-xl bg-[var(--secondary)] text-sm text-[var(--muted)]">
                No se pudo cargar el mapa rapido.
              </div>
            }
          >
            <MapPanel
              stations={filteredStations}
              totalStations={totalStations}
              viewMode="overview"
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
          </QuickViewErrorBoundary>
        </div>
        <div className="min-w-0 lg:col-span-1">
          <AlertsTopList alerts={alerts} limit={5} />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="ui-section-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Operaciones</h3>
          <p className="text-sm text-[var(--muted)]">
            Revisa alertas activas, prioriza redistribucion y resuelve friccion en estaciones criticas.
          </p>
          <Button asChild variant="cta" size="sm" className="mt-auto">
            <TrackedLink href={appRoutes.dashboardAlerts()}>Operaciones</TrackedLink>
          </Button>
        </article>

        <article className="ui-section-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Analisis</h3>
          <p className="text-sm text-[var(--muted)]">
            Corredores populares, matriz O-D y rutas con mayor volumen entre barrios.
          </p>
          <Button asChild variant="cta" size="sm" className="mt-auto">
            <TrackedLink href={appRoutes.dashboardFlow()}>Analisis</TrackedLink>
          </Button>
        </article>
      </section>
    </>
  );
}
