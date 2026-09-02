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
    definition: 'Frescura, cobertura, ingestión y errores de los datos publicados.',
  },
  networkBalance: {
    label: 'Equilibrio de la red',
    definition: 'Disponibilidad de bicis y anclajes: estaciones vacías o llenas, tensión y fricción.',
  },
  operationalSignal: {
    label: 'Señal operativa',
    definition: 'Prioridad observada que merece revisión; no es una instrucción logística.',
  },
  estimate: {
    label: 'Estimación',
    definition: 'Métrica derivada que no representa viajes reales exactos.',
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
