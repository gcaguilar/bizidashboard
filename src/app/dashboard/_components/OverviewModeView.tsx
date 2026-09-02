import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import type { AlertsResponse, StationSnapshot, StatusResponse } from '@/lib/api-types';
import type { Coordinates } from '@/lib/geo';
import type { DashboardMapViewState } from '@/lib/map-view-state';
import { productTerms } from '@/lib/product-copy';
import { appRoutes } from '@/lib/routes';
import { AlertsTopList } from './AlertsTopList';
import { BalanceIndexCard } from './BalanceIndexCard';
import { DailyInsightsCard } from './DailyInsightsCard';
import { MapPanel } from './MapPanel';
import { SystemHealthCard } from './SystemHealthCard';
import { NetworkBriefing } from './NetworkBriefing';
import { buildNetworkBriefing } from '@/lib/network-briefing';
import { NetworkBriefingViewTracker } from './NetworkBriefingViewTracker';

type StationTrend = 'up' | 'down' | 'flat';

type OverviewModeViewProps = {
  status: StatusResponse;
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
  coverageDays: number;
  topFrictionStationName: string | null;
  alerts: AlertsResponse;
};

export function OverviewModeView({
  status,
  totalStations,
  stations: _stations,
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
  coverageDays,
  topFrictionStationName,
  alerts,
}: OverviewModeViewProps) {
  const statusLabel =
    status.pipeline.healthStatus === 'healthy'
      ? 'saludable'
      : status.pipeline.healthStatus === 'degraded'
        ? 'degradado'
        : status.pipeline.healthStatus === 'down'
          ? 'caido'
          : 'desconocido';
  const networkLabel = systemMetrics.criticalStations.length === 0
    ? 'sin estaciones críticas en la muestra'
    : 'tensionado';
  const briefing = buildNetworkBriefing({
    stations: _stations,
    activeAlertsCount: systemMetrics.activeAlerts.length,
    coverageDays,
    lastUpdatedAt: status.quality.freshness.lastUpdated,
    pipelineHealthy: status.pipeline.healthStatus === 'healthy',
  });

  return (
    <>
      <NetworkBriefingViewTracker />
      <NetworkBriefing
        briefing={briefing}
        state={status.dataState === 'error' ? 'error' : status.dataState === 'partial' || status.dataState === 'no_coverage' ? 'incomplete' : 'ready'}
      />
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

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{productTerms.dataStatus.label}</p>
            <h2 className="text-base font-bold text-[var(--foreground)]">Diagnóstico rápido fuera del panel principal</h2>
            <p className="text-sm text-[var(--muted)]">
              Datos y pipeline: <span className="font-semibold text-[var(--foreground)]">{statusLabel}</span> · última referencia {updatedText}
            </p>
            <p className="text-sm text-[var(--muted)]">
              {productTerms.networkBalance.label}: <span className="font-semibold text-[var(--foreground)]">{networkLabel}</span>. Los datos pueden estar sanos aunque haya estaciones desequilibradas.
            </p>
          </div>

          <Button asChild variant="cta" size="sm">
            <TrackedLink href={appRoutes.status()}>Ver estado de los datos</TrackedLink>
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-stretch">
        <div className="min-w-0 lg:col-span-3">
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
            <TrackedLink href={appRoutes.dashboardAlerts()}>Ver alertas y señales</TrackedLink>
          </Button>
        </article>

        <article className="ui-section-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Analisis</h3>
          <p className="text-sm text-[var(--muted)]">
            Corredores populares, matriz O-D y rutas con mayor volumen entre barrios.
          </p>
          <Button asChild variant="cta" size="sm" className="mt-auto">
            <TrackedLink href={appRoutes.dashboardFlow()}>Ver análisis de flujos</TrackedLink>
          </Button>
        </article>
      </section>
    </>
  );
}
