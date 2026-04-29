'use client';

import { Card } from '@/components/ui/card';
import type { DashboardViewMode } from '@/lib/dashboard-modes';
import type { StationSnapshot } from '@/lib/api';
import type { Coordinates } from '@/lib/geo';
import type { DashboardMapViewState } from '@/lib/map-view-state';
import { MapEngine } from './MapEngine';

type StationTrend = 'up' | 'down' | 'flat';

type MapPanelProps = {
  stations: StationSnapshot[];
  totalStations: number;
  viewMode?: DashboardViewMode;
  initialViewState?: DashboardMapViewState;
  frictionByStationId?: Record<string, number>;
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  favoriteStationIds?: string[];
  onToggleFavorite?: (stationId: string) => void;
  trendByStationId?: Record<string, StationTrend>;
  nearestStationId?: string | null;
  nearestDistanceMeters?: number | null;
  userLocation?: Coordinates | null;
  onViewStateCommit?: (state: DashboardMapViewState) => void;
};

const MAP_HEIGHT = 560;
export function MapPanel({
  stations,
  totalStations,
  viewMode = 'overview',
  initialViewState,
  frictionByStationId = {},
  selectedStationId,
  onSelectStation,
  favoriteStationIds = [],
  onToggleFavorite,
  trendByStationId,
  nearestStationId,
  nearestDistanceMeters,
  userLocation,
  onViewStateCommit,
}: MapPanelProps) {
  const isFilteredView = stations.length !== totalStations;
  const criticalCount = stations.filter(
    (station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0
  ).length;
  const headerTitle =
    viewMode === 'operations' ? 'Mapa de accion operativa' : 'Mapa general del sistema';
  const headerHint =
    viewMode === 'operations'
      ? `${criticalCount} estaciones en estado critico ahora mismo.`
      : 'Usa el mapa para localizar estaciones, favoritos y zonas con problemas de disponibilidad.';
  const legendItems =
    viewMode === 'operations'
      ? ['Halo rojo = friccion alta', 'Rojo = tension alta', 'Azul = favorita', 'Toca para actuar']
      : ['Rojo = desequilibrio', 'Verde = estable', 'Azul = favorita', 'Toca para detalle'];

  return (
    <Card
      variant="panel"
      className="relative w-full"
      style={{ height: `${MAP_HEIGHT}px` }}
    >
      <div className="absolute left-4 top-4 z-20 max-w-[75%] rounded-lg border border-[var(--border)] bg-[var(--card)]/90 px-3 py-2 backdrop-blur">
        <p className="text-xs font-semibold text-[var(--foreground)]">
          {headerTitle} · {stations.length}/{totalStations} estaciones
          {isFilteredView ? ' (filtradas)' : ''}
        </p>
        <p className="mt-1 text-[11px] text-[var(--muted)]">{headerHint}</p>
      </div>

      <div className="absolute bottom-4 left-4 z-20 flex max-w-[90%] flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)]/95 px-3 py-2 text-[11px] backdrop-blur">
        {legendItems.map((item) => (
          <span key={item} className="ui-legend-item">{item}</span>
        ))}
      </div>

      <div className="h-full w-full">
        <MapEngine
          stations={stations}
          viewMode={viewMode}
          initialViewState={initialViewState}
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
    </Card>
  );
}
