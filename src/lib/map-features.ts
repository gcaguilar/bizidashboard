import type { StationSnapshot } from '@/lib/api';

export type StationFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      stationId: string;
      stationName: string;
      markerColor: string;
      frictionScore: number;
      isFavorite: number;
      isSelected: number;
    };
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }>;
};

export function buildStationFeatureCollection(params: {
  stations: StationSnapshot[];
  getMarkerColor: (station: StationSnapshot) => string;
  favoriteStationIds: Set<string>;
  selectedStationId?: string;
  frictionByStationId?: Record<string, number>;
}): StationFeatureCollection {
  const { stations, getMarkerColor, favoriteStationIds, selectedStationId, frictionByStationId = {} } = params;

  return {
    type: 'FeatureCollection',
    features: stations
      .filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lon))
      .map((station) => ({
        type: 'Feature' as const,
        properties: {
          stationId: station.id,
          stationName: station.name,
          markerColor: getMarkerColor(station),
          frictionScore: frictionByStationId[station.id] ?? 0,
          isFavorite: favoriteStationIds.has(station.id) ? 1 : 0,
          isSelected: selectedStationId && selectedStationId === station.id ? 1 : 0,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [station.lon, station.lat] as [number, number],
        },
      })),
  };
}
