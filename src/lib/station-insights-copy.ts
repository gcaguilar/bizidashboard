import { activityIndexUnits } from '@/lib/product-copy';

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
    movement: `Índice de actividad (${activityIndexUnits.total})`,
  },
  verdicts: {
    above: 'Por encima',
    similar: 'Similar',
    below: 'Por debajo',
  },
  peersLabel: (districtName: string, peerCount: number) =>
    `Media de ${peerCount} ${peerCount === 1 ? 'estación' : 'estaciones'} de ${districtName}`,
} as const;

export const STATION_BEST_TIME_COPY = {
  heading: 'Mejor hora para ir',
  subject: 'las mejores horas para ir',
  emptyTitle: 'Aún no hay horas recomendables',
  emptyDescription:
    'El histórico por hora de esta estación todavía no es suficiente para sugerir franjas. Lo mostraremos cuando haya más datos.',
  note: 'Estimación a partir de medias históricas por hora; el día concreto puede ser distinto. Comprueba el estado actual antes de salir.',
  noBikesLabel: 'Suele estar sin bicis',
  noAnchorsLabel: 'Suele estar sin huecos',
  betterLabel: 'Suele haber bicis y huecos',
  noIssues: 'Sin franjas problemáticas en el histórico',
  noBetter: 'Sin franjas claramente mejores en el histórico',
} as const;
