'use client';

import { Card } from '@/components/ui/card';
import type { DashboardViewMode } from '@/lib/dashboard-modes';
import type { StationSnapshot } from '@/lib/api-types';
import type { Coordinates } from '@/lib/geo';
import { hasNoAvailability } from '@/lib/network-health';
import { ANALYTICAL_MAP_LEGEND } from '@/lib/map-colors';
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
  frictionByStationId,
  selectedStationId,
  onSelectStation,
  favoriteStationIds,
  onToggleFavorite,
  trendByStationId,
  nearestStationId,
  nearestDistanceMeters,
  userLocation,
  onViewStateCommit,
}: MapPanelProps) {
  const isFilteredView = stations.length !== totalStations;
  const criticalCount = stations.filter(hasNoAvailability).length;
  const headerTitle =
    viewMode === 'operations' ? 'Mapa de acción operativa' : 'Mapa general del sistema';
  const headerHint =
    viewMode === 'operations'
      ? `${criticalCount} estaciones en estado crítico ahora mismo.`
      : 'Usa el mapa para localizar estaciones, favoritos y zonas con problemas de disponibilidad.';

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
        {ANALYTICAL_MAP_LEGEND.map((item) => (
          <span key={item.label} className="ui-legend-item" title={item.description}>
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </span>
        ))}
        <span className="ui-legend-item">★ Borde dorado = favorita</span>
        <span className="ui-legend-item">Agrupación con su recuento</span>
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
