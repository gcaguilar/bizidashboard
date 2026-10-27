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
    'product.activity.label': 'Índice de actividad',
    'product.activity.total': 'puntos de actividad',
    'product.activity.perDay': 'puntos de actividad/día',
    'product.activity.perMonth': 'puntos de actividad/mes',
    'product.activity.tooltipLabel': 'Qué es el índice de actividad',
    'product.activity.tooltip':
      'Índice para comparar actividad entre estaciones, zonas o periodos: suma las variaciones de bicis y huecos de cada estación entre el mínimo y el máximo de cada franja. No es un recuento de viajes ni de movimientos reales, y no equivale al número oficial de trayectos.',
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
    'product.activity.label': 'Activity index',
    'product.activity.total': 'activity points',
    'product.activity.perDay': 'activity points/day',
    'product.activity.perMonth': 'activity points/month',
    'product.activity.tooltipLabel': 'What the activity index is',
    'product.activity.tooltip':
      'An index to compare activity between stations, areas or periods: it adds up the bike and dock variations of each station between the minimum and maximum of each time slot. It is not a count of trips or real movements, and it is not the official number of journeys.',
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
