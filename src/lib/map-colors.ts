import type { StationSnapshot } from '@/lib/api-types';
import { hasNoAvailability } from '@/lib/network-health';

export type MapColorScale = 'analytical' | 'citizen';

/** Escala del dashboard: estado operativo de cada estación. */
export function getAnalyticalMarkerColor(station: StationSnapshot): string {
  if (station.capacity <= 0) {
    return '#64748b';
  }

  if (station.anchorsFree <= 0) {
    return '#991b1b';
  }

  if (station.bikesAvailable <= 0) {
    return '#7c2d12';
  }

  const ratio = station.bikesAvailable / station.capacity;

  if (ratio > 0.55) {
    return '#0f766e';
  }

  if (ratio > 0.25) {
    return '#b45309';
  }

  return '#b91c1c';
}

/** Escala ciudadana: puedo coger o dejar una bici ahora mismo. */
export function getCitizenMarkerColor(station: StationSnapshot): string {
  if (station.capacity <= 0) {
    return '#64748b';
  }

  if (hasNoAvailability(station)) {
    return '#b91c1c';
  }

  if (station.bikesAvailable < 3 || station.anchorsFree < 3) {
    return '#b45309';
  }

  return '#0f766e';
}

/**
 * Severidad numérica (0 = sano, 3 = sin bicis/huecos) para agregar en los
 * clústeres del mapa. Los clústeres se colorean por la media ponderada de esta
 * severidad, de modo que un grupo con estaciones agotadas no se pinte como uno
 * sano. Ver `buildStationFeatureCollection` y `CLUSTER_LAYER`.
 */
export function getAnalyticalMarkerSeverity(station: StationSnapshot): number {
  if (station.capacity <= 0) {
    return 0;
  }

  if (station.anchorsFree <= 0 || station.bikesAvailable <= 0) {
    return 3;
  }

  const ratio = station.bikesAvailable / station.capacity;

  if (ratio > 0.55) {
    return 0;
  }

  if (ratio > 0.25) {
    return 1;
  }

  return 2;
}

export function getCitizenMarkerSeverity(station: StationSnapshot): number {
  if (station.capacity <= 0) {
    return 0;
  }

  if (hasNoAvailability(station)) {
    return 3;
  }

  if (station.bikesAvailable < 3 || station.anchorsFree < 3) {
    return 1;
  }

  return 0;
}

export const CITIZEN_MAP_LEGEND: ReadonlyArray<{
  color: string;
  label: string;
  description: string;
}> = [
  {
    color: '#0f766e',
    label: 'Equilibrio',
    description: '3 o más bicis y 3 o más huecos',
  },
  {
    color: '#b45309',
    label: 'Poca disponibilidad',
    description: 'menos de 3 bicis o menos de 3 huecos',
  },
  {
    color: '#b91c1c',
    label: 'Agotada',
    description: 'sin bicis o sin huecos',
  },
];

/**
 * Leyenda de la escala analítica del dashboard. Debe coincidir, tono a tono,
 * con `getAnalyticalMarkerColor` y con el degradado de los clústeres
 * (`CLUSTER_LAYER`), que resume la severidad media de las estaciones agrupadas.
 */
export const ANALYTICAL_MAP_LEGEND: ReadonlyArray<{
  color: string;
  label: string;
  description: string;
}> = [
  {
    color: '#0f766e',
    label: 'Buena disponibilidad',
    description: 'más del 55 % de la capacidad ocupada',
  },
  {
    color: '#b45309',
    label: 'Disponibilidad media',
    description: 'entre el 25 % y el 55 %',
  },
  {
    color: '#b91c1c',
    label: 'Poca disponibilidad',
    description: '25 % o menos de ocupación',
  },
  {
    color: '#7c2d12',
    label: 'Sin bicis',
    description: 'no hay bicicletas disponibles',
  },
  {
    color: '#991b1b',
    label: 'Sin huecos',
    description: 'no hay anclajes libres',
  },
  {
    color: '#64748b',
    label: 'Sin datos',
    description: 'estación sin capacidad declarada',
  },
];
