import { defineArea } from './define';

/**
 * Sentences built by `lib/network-briefing.ts`, `lib/network-health.ts`,
 * `lib/freshness.ts` and `lib/format.ts`. Plurals use `.one` / `.other` keys.
 */
export const networkMessages = defineArea({
  es: {
    'network.health.label.green': 'Red en estado óptimo',
    'network.health.label.yellow': 'Afectaciones moderadas',
    'network.health.label.red': 'Incidencia generalizada',
    'network.health.label.unknown': 'Sin datos ahora mismo',
    'network.health.unknown.description': 'Todavía no hay estaciones con datos para evaluar la red.',
    'network.health.summary':
      '{critical} de {total} estaciones sin bicis o sin huecos libres ({percent})',
    'network.health.withReasons': '{summary}; {reasons}',
    'network.health.reasons.join': ' y ',
    'network.health.reason.pipeline': 'la recogida de datos no está funcionando',
    'network.health.reason.stale': 'la última actualización fue hace más de {minutes} minutos',

    'network.baseline.sameSlot': 'la misma franja de la semana anterior',
    'network.unit.day.one': 'día',
    'network.unit.day.other': 'días',

    'network.briefing.insufficient.current': 'Ahora mismo no hay datos suficientes para resumir la red.',
    'network.briefing.insufficient.comparison': 'Todavía no se puede comparar con otro momento.',
    'network.briefing.insufficient.focus': 'No se puede destacar ninguna estación con los datos disponibles.',
    'network.briefing.insufficient.alerts':
      'No se puede resumir el estado de las alertas con los datos disponibles.',
    'network.briefing.insufficient.coverage': 'Cobertura disponible: {days} {unit}.',
    'network.briefing.insufficient.warning': 'Faltan datos para ofrecer un resumen fiable.',

    'network.briefing.current.one': 'Ahora mismo, {count} estación no tiene bicis o huecos libres.',
    'network.briefing.current.other': 'Ahora mismo, {count} estaciones no tienen bicis o huecos libres.',
    'network.briefing.current.none': 'Ahora mismo todas las estaciones tienen bicis y huecos libres.',

    'network.briefing.comparison.same': 'Hay el mismo número que en {label}.',
    'network.briefing.comparison.more.one': 'Hay {count} estación más que en {label}.',
    'network.briefing.comparison.more.other': 'Hay {count} estaciones más que en {label}.',
    'network.briefing.comparison.less.one': 'Hay {count} estación menos que en {label}.',
    'network.briefing.comparison.less.other': 'Hay {count} estaciones menos que en {label}.',
    'network.briefing.comparison.none':
      'Aún no hay otro momento comparable para saber si la situación ha cambiado.',

    'network.briefing.focus.some': 'La estación que más conviene revisar ahora es {name}.',
    'network.briefing.focus.none': 'No hay ninguna estación que requiera atención especial ahora.',

    'network.briefing.alerts.compared.one':
      'Hay {count} alerta activa. Se puede comparar con {label}.',
    'network.briefing.alerts.compared.other':
      'Hay {count} alertas activas. Se puede comparar con {label}.',
    'network.briefing.alerts.uncompared.one':
      'Hay {count} alerta activa. Aún no se puede comparar su evolución.',
    'network.briefing.alerts.uncompared.other':
      'Hay {count} alertas activas. Aún no se puede comparar su evolución.',

    'network.briefing.freshness.noDate': 'sin fecha',
    'network.briefing.pipeline.ok': 'actualizándose con normalidad',
    'network.briefing.pipeline.incident': 'con una incidencia en la actualización',
    'network.briefing.dataQuality':
      'Datos {pipeline}; última actualización {freshness}; cobertura de {days} {unit}.',

    'format.noData.lower': 'sin datos',
    'format.noData.capital': 'Sin datos',
    'format.relative.lessThanMinute': 'hace menos de 1 min',
    'format.relative.minutes': 'hace {count} min',
    'format.relative.hour': 'hace 1 h',
    'format.relative.hours': 'hace {count} h',
    'format.freshness.disconnected': 'desconectado',
    'format.alertType.lowBikes': 'Pocas bicis',
    'format.alertType.lowAnchors': 'Pocos anclajes',
    'format.alertType.unknown': 'Alerta desconocida',
    'format.dayType.weekday': 'Entre semana',
    'format.dayType.weekend': 'Fin de semana',
    'format.dayType.unknown': 'Día desconocido',
  },
  en: {
    'network.health.label.green': 'Network in good shape',
    'network.health.label.yellow': 'Moderate disruptions',
    'network.health.label.red': 'Widespread disruption',
    'network.health.label.unknown': 'No data right now',
    'network.health.unknown.description': 'There are no stations with data yet to assess the network.',
    'network.health.summary':
      '{critical} of {total} stations with no bikes or no free docks ({percent})',
    'network.health.withReasons': '{summary}; {reasons}',
    'network.health.reasons.join': ' and ',
    'network.health.reason.pipeline': 'data collection is not working',
    'network.health.reason.stale': 'the last update was more than {minutes} minutes ago',

    'network.baseline.sameSlot': 'the same time slot last week',
    'network.unit.day.one': 'day',
    'network.unit.day.other': 'days',

    'network.briefing.insufficient.current': 'There is not enough data right now to summarise the network.',
    'network.briefing.insufficient.comparison': 'It cannot be compared with another moment yet.',
    'network.briefing.insufficient.focus': 'No station can be highlighted with the available data.',
    'network.briefing.insufficient.alerts': 'The alert status cannot be summarised with the available data.',
    'network.briefing.insufficient.coverage': 'Available coverage: {days} {unit}.',
    'network.briefing.insufficient.warning': 'Data is missing to offer a reliable summary.',

    'network.briefing.current.one': 'Right now, {count} station has no bikes or no free docks.',
    'network.briefing.current.other': 'Right now, {count} stations have no bikes or no free docks.',
    'network.briefing.current.none': 'Right now all stations have bikes and free docks.',

    'network.briefing.comparison.same': 'It is the same number as in {label}.',
    'network.briefing.comparison.more.one': 'There is {count} more station than in {label}.',
    'network.briefing.comparison.more.other': 'There are {count} more stations than in {label}.',
    'network.briefing.comparison.less.one': 'There is {count} fewer station than in {label}.',
    'network.briefing.comparison.less.other': 'There are {count} fewer stations than in {label}.',
    'network.briefing.comparison.none':
      'There is no comparable moment yet to tell whether the situation has changed.',

    'network.briefing.focus.some': 'The station most worth checking right now is {name}.',
    'network.briefing.focus.none': 'No station needs special attention right now.',

    'network.briefing.alerts.compared.one':
      'There is {count} active alert. It can be compared with {label}.',
    'network.briefing.alerts.compared.other':
      'There are {count} active alerts. They can be compared with {label}.',
    'network.briefing.alerts.uncompared.one':
      'There is {count} active alert. Its trend cannot be compared yet.',
    'network.briefing.alerts.uncompared.other':
      'There are {count} active alerts. Their trend cannot be compared yet.',

    'network.briefing.freshness.noDate': 'no date',
    'network.briefing.pipeline.ok': 'updating normally',
    'network.briefing.pipeline.incident': 'with an update incident',
    'network.briefing.dataQuality':
      'Data {pipeline}; last update {freshness}; coverage of {days} {unit}.',

    'format.noData.lower': 'no data',
    'format.noData.capital': 'No data',
    'format.relative.lessThanMinute': 'less than 1 min ago',
    'format.relative.minutes': '{count} min ago',
    'format.relative.hour': '1 h ago',
    'format.relative.hours': '{count} h ago',
    'format.freshness.disconnected': 'disconnected',
    'format.alertType.lowBikes': 'Few bikes',
    'format.alertType.lowAnchors': 'Few docks',
    'format.alertType.unknown': 'Unknown alert',
    'format.dayType.weekday': 'Weekdays',
    'format.dayType.weekend': 'Weekends',
    'format.dayType.unknown': 'Unknown day type',
  },
});
