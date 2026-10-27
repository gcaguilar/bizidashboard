import type { StationSnapshot } from '@/lib/api-types';

export type StationFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      stationId: string;
      stationName: string;
      markerColor: string;
      /** Glifo que acompaña al color para no depender solo de él. */
      markerGlyph?: string;
      frictionScore: number;
      /** 0 = sano … 3 = sin bicis/huecos; agrega el color de los clústeres. */
      severity: number;
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
  getMarkerSeverity?: (station: StationSnapshot) => number;
  getMarkerGlyph?: (station: StationSnapshot) => string;
  favoriteStationIds: Set<string>;
  selectedStationId?: string;
  frictionByStationId?: Record<string, number>;
}): StationFeatureCollection {
  const {
    stations,
    getMarkerColor,
    getMarkerSeverity = () => 0,
    getMarkerGlyph,
    favoriteStationIds,
    selectedStationId,
    frictionByStationId = {},
  } = params;

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
          ...(getMarkerGlyph ? { markerGlyph: getMarkerGlyph(station) } : {}),
          frictionScore: frictionByStationId[station.id] ?? 0,
          severity: getMarkerSeverity(station),
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
