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
  return getCitizenStatus(station).color;
}

/** Glifo (ASCII, existe en cualquier fuente del mapa) que acompaña al color. */
export function getCitizenMarkerGlyph(station: StationSnapshot): string {
  return getCitizenStatus(station).icon;
}

export function getAnalyticalMarkerGlyph(station: StationSnapshot): string {
  return getAnalyticalLegendEntry(station).icon;
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

export type CitizenStatusLevel = 'balanced' | 'low' | 'depleted';

export type MapLegendEntry = {
  color: string;
  /** Icono corto: el estado nunca debe depender solo del color. */
  icon: string;
  label: string;
  description: string;
};

export type CitizenStatus = MapLegendEntry & { level: CitizenStatusLevel };

/**
 * Fuente única de los tres estados ciudadanos. Mapa, leyendas, comparador y
 * fichas deben leer color, icono y texto de aquí, sin copiar los literales.
 */
export const CITIZEN_MAP_LEGEND: ReadonlyArray<CitizenStatus> = [
  {
    level: 'balanced',
    color: '#0f766e',
    icon: '=',
    label: 'Equilibrio',
    description: '3 o más bicis y 3 o más huecos',
  },
  {
    level: 'low',
    color: '#b45309',
    icon: '!',
    label: 'Poca disponibilidad',
    description: 'menos de 3 bicis o menos de 3 huecos',
  },
  {
    level: 'depleted',
    color: '#b91c1c',
    icon: '×',
    label: 'Agotada',
    description: 'sin bicis o sin huecos',
  },
];

const CITIZEN_NO_DATA: CitizenStatus = {
  level: 'balanced',
  color: '#64748b',
  icon: '?',
  label: 'Sin datos',
  description: 'estación sin capacidad declarada',
};

export function getCitizenStatusByLevel(level: CitizenStatusLevel): CitizenStatus {
  return CITIZEN_MAP_LEGEND.find((entry) => entry.level === level) ?? CITIZEN_MAP_LEGEND[0];
}

export function getCitizenStatus(
  station: Pick<StationSnapshot, 'capacity' | 'bikesAvailable' | 'anchorsFree'>
): CitizenStatus {
  if (station.capacity <= 0) {
    return CITIZEN_NO_DATA;
  }

  if (hasNoAvailability(station)) {
    return getCitizenStatusByLevel('depleted');
  }

  if (station.bikesAvailable < 3 || station.anchorsFree < 3) {
    return getCitizenStatusByLevel('low');
  }

  return getCitizenStatusByLevel('balanced');
}

/**
 * Leyenda de la escala analítica del dashboard. Debe coincidir, tono a tono,
 * con `getAnalyticalMarkerColor` y con el degradado de los clústeres
 * (`CLUSTER_LAYER`), que resume la severidad media de las estaciones agrupadas.
 */
export const ANALYTICAL_MAP_LEGEND: ReadonlyArray<MapLegendEntry> = [
  {
    color: '#0f766e',
    icon: '=',
    label: 'Buena disponibilidad',
    description: 'más del 55 % de la capacidad ocupada',
  },
  {
    color: '#b45309',
    icon: '~',
    label: 'Disponibilidad media',
    description: 'entre el 25 % y el 55 %',
  },
  {
    color: '#b91c1c',
    icon: '!',
    label: 'Disponibilidad baja',
    description: '25 % o menos de ocupación',
  },
  {
    color: '#7c2d12',
    icon: '0',
    label: 'Sin bicis',
    description: 'no hay bicicletas disponibles',
  },
  {
    color: '#991b1b',
    icon: '×',
    label: 'Sin huecos',
    description: 'no hay anclajes libres',
  },
  {
    color: '#64748b',
    icon: '?',
    label: 'Sin datos',
    description: 'estación sin capacidad declarada',
  },
];

/** Entrada de `ANALYTICAL_MAP_LEGEND` que corresponde a la estación (mismos umbrales que el color). */
export function getAnalyticalLegendEntry(station: StationSnapshot): MapLegendEntry {
  const color = getAnalyticalMarkerColor(station);
  return ANALYTICAL_MAP_LEGEND.find((entry) => entry.color === color) ?? ANALYTICAL_MAP_LEGEND[5];
}

/**
 * Etiqueta fina del estado ciudadano: distingue "Sin bicis" de "Sin huecos"
 * dentro de los tres niveles de `CITIZEN_MAP_LEGEND`. Mismos umbrales que
 * `getCitizenStatus`; úsala cuando la UI necesite saber qué falta.
 */
export function getCitizenStatusDetail(station: StationSnapshot): string {
  const status = getCitizenStatus(station);

  if (station.capacity <= 0) {
    return status.label;
  }

  if (status.level === 'depleted') {
    return station.bikesAvailable <= 0 ? 'Sin bicis' : 'Sin huecos';
  }

  if (status.level === 'low') {
    return station.bikesAvailable < 3 ? 'Pocas bicis' : 'Pocos huecos';
  }

  return status.label;
}
