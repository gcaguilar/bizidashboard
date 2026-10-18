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
