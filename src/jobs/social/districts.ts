/**
 * Asignacion de estaciones a distritos para los slots sociales.
 *
 * Vive en `src/jobs/social` porque es codigo de servidor: lee el GeoJSON de
 * `public/data` con `districts.server`. Los mapeadores puros reciben el mapa ya
 * construido y no tocan el sistema de ficheros.
 */

import { buildStationDistrictMap } from '@/lib/districts';
import { fetchDistrictCollection } from '@/lib/districts.server';

import { toStationPoints } from './mappers';

type StationPoint = { id: string; lat: number; lon: number };

/**
 * Mapa `stationId -> distrito`. Si el GeoJSON no esta disponible devuelve un
 * mapa vacio: la agregacion ignorara las filas sin distrito en vez de inventar
 * barrios.
 */
export async function loadStationDistrictMap(
  stations: readonly StationPoint[]
): Promise<Map<string, string>> {
  if (stations.length === 0) {
    return new Map();
  }

  const collection = await fetchDistrictCollection();
  if (!collection) {
    return new Map();
  }

  return buildStationDistrictMap(toStationPoints(stations), collection);
}
