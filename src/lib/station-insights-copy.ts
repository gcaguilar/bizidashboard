import { movementUnits } from '@/lib/product-copy';

/**
 * Copy compartido de los bloques "Frente a tu barrio" y "Mejor hora para ir"
 * de la ficha de estación. Ambos son lecturas estimadas del histórico.
 */
export const STATION_DISTRICT_COMPARISON_COPY = {
  heading: 'Frente a tu barrio',
  subject: 'la comparación con el barrio',
  emptyTitle: 'Sin comparación con el barrio',
  emptyDescription:
    'No hay estaciones suficientes con histórico en este barrio para comparar. Lo mostraremos cuando haya datos.',
  note: 'Medias de las demás estaciones del barrio sobre la ventana de histórico disponible. Es una comparación orientativa.',
  metrics: {
    occupancy: 'Ocupación ahora',
    emptyShare: 'Tiempo sin bicis',
    fullShare: 'Tiempo sin huecos',
    movement: `Movimiento (${movementUnits.total})`,
  },
  verdicts: {
    above: 'Por encima',
    similar: 'Similar',
    below: 'Por debajo',
  },
  peersLabel: (districtName: string, peerCount: number) =>
    `Media de ${peerCount} ${peerCount === 1 ? 'estación' : 'estaciones'} de ${districtName}`,
} as const;
