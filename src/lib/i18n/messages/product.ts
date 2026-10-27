import { defineArea } from './define';

/** Strings of `src/lib/product-copy.ts` (product vocabulary). */
export const productMessages = defineArea({
  es: {
    'product.dataStatus.label': 'Estado de los datos',
    'product.dataStatus.definition':
      'Frescura: cuándo se actualizaron los datos, qué cobertura tienen y si hubo errores al recibirlos.',
    'product.networkBalance.label': 'Equilibrio de la red',
    'product.networkBalance.definition':
      'Disponibilidad de bicis y huecos: estaciones vacías o llenas y los problemas que eso puede causar.',
    'product.operationalSignal.label': 'Señal operativa',
    'product.operationalSignal.definition':
      'Una señal que merece revisión; no es una instrucción para mover bicis.',
    'product.estimate.label': 'Estimación',
    'product.estimate.definition':
      'Una cifra calculada para comparar; no es el número exacto de viajes reales.',
    'product.movement.total': 'movimientos aprox.',
    'product.movement.perDay': 'movimientos/día aprox.',
    'product.movement.perMonth': 'movimientos/mes aprox.',
    'product.movement.tooltipLabel': 'Qué es un movimiento aproximado',
    'product.movement.tooltip':
      'Estimación a partir de los cambios netos de bicis en cada estación entre muestras. No son viajes observados ni el número oficial de trayectos; sirve para comparar actividad.',
    'product.balance.unknown.label': 'sin evidencia suficiente',
    'product.balance.unknown.explanation':
      'No hay una muestra de estaciones suficiente para valorar la disponibilidad de la red.',
    'product.balance.tense.label': 'tensionado',
    'product.balance.tense.explanation':
      '{count} estaciones están vacías o llenas en la última muestra.',
    'product.balance.balanced.label': 'sin estaciones críticas en la muestra',
    'product.balance.balanced.explanation':
      'La última muestra no incluye estaciones vacías ni llenas.',
  },
  en: {
    'product.dataStatus.label': 'Data status',
    'product.dataStatus.definition':
      'Freshness: when the data was last updated, how much it covers and whether there were errors receiving it.',
    'product.networkBalance.label': 'Network balance',
    'product.networkBalance.definition':
      'Availability of bikes and free docks: empty or full stations and the problems that can cause.',
    'product.operationalSignal.label': 'Operational signal',
    'product.operationalSignal.definition':
      'A signal worth reviewing; it is not an instruction to move bikes.',
    'product.estimate.label': 'Estimate',
    'product.estimate.definition':
      'A figure calculated for comparison; it is not the exact number of real trips.',
    'product.movement.total': 'approx. movements',
    'product.movement.perDay': 'approx. movements/day',
    'product.movement.perMonth': 'approx. movements/month',
    'product.movement.tooltipLabel': 'What an approximate movement is',
    'product.movement.tooltip':
      'Estimate based on the net bike changes at each station between samples. These are not observed trips nor the official number of journeys; it is meant to compare activity.',
    'product.balance.unknown.label': 'not enough evidence',
    'product.balance.unknown.explanation':
      'There is not a large enough station sample to assess network availability.',
    'product.balance.tense.label': 'strained',
    'product.balance.tense.explanation':
      '{count} stations are empty or full in the latest sample.',
    'product.balance.balanced.label': 'no critical stations in the sample',
    'product.balance.balanced.explanation':
      'The latest sample includes no empty or full stations.',
  },
});
