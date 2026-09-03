import type { StationSnapshot } from '@/lib/api-types';

/**
 * Product vocabulary shared by the public observatory.
 *
 * Keeping these definitions together prevents a healthy ingestion pipeline from
 * being mistaken for a balanced, readily available bike network.
 */
export const productTerms = {
  dataStatus: {
    label: 'Estado de los datos',
    definition: 'Frescura: cuándo se actualizaron los datos, qué cobertura tienen y si hubo errores al recibirlos.',
  },
  networkBalance: {
    label: 'Equilibrio de la red',
    definition: 'Disponibilidad de bicis y huecos: estaciones vacías o llenas y los problemas que eso puede causar.',
  },
  operationalSignal: {
    label: 'Señal operativa',
    definition: 'Una señal que merece revisión; no es una instrucción para mover bicis.',
  },
  estimate: {
    label: 'Estimación',
    definition: 'Una cifra calculada para comparar; no es el número exacto de viajes reales.',
  },
} as const;

export type NetworkBalanceSummary = {
  criticalStationsCount: number;
  state: 'balanced' | 'tense' | 'unknown';
  label: string;
  explanation: string;
};

export function getNetworkBalanceSummary(stations: StationSnapshot[]): NetworkBalanceSummary {
  if (stations.length === 0) {
    return {
      criticalStationsCount: 0,
      state: 'unknown',
      label: 'sin evidencia suficiente',
      explanation: 'No hay una muestra de estaciones suficiente para valorar la disponibilidad de la red.',
    };
  }

  const criticalStationsCount = stations.filter(
    (station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0
  ).length;

  if (criticalStationsCount > 0) {
    return {
      criticalStationsCount,
      state: 'tense',
      label: 'tensionado',
      explanation: `${criticalStationsCount} estaciones están vacías o llenas en la última muestra.`,
    };
  }

  return {
    criticalStationsCount,
    state: 'balanced',
    label: 'sin estaciones críticas en la muestra',
    explanation: 'La última muestra no incluye estaciones vacías ni llenas.',
  };
}
