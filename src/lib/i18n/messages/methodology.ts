import { defineArea } from './define';

/**
 * Methodology page (`src/app/metodologia.tsx`) copy: static text, loader
 * content (FAQ items indexed by `methodology.faq.<id>.*`, breadcrumb, JSON-LD
 * text) and the `system-status.ts` labels shown on the page. The Spanish FAQ
 * entries must stay identical to `FAQ_ITEMS` (tests enforce it).
 */
export const methodologyMessages = defineArea({
  es: {
    'methodology.seo.title': 'Metodología y calidad de datos de Bizi Zaragoza',
    'methodology.seo.description':
      'Descubre de dónde salen los datos de Bizi Zaragoza, cómo se actualizan, qué significan sus métricas y qué límites tienen las estimaciones.',
    'methodology.hero.eyebrow': 'Cómo leer los datos',
    'methodology.hero.title': 'Metodología y calidad de datos de Bizi en {city}',
    'methodology.hero.intro':
      'Te contamos de dónde salen los datos, cuándo se actualizan y qué significan las cifras que ves. También señalamos qué métricas son estimaciones y cómo interpretarlas con cuidado.',
    'methodology.chip.days': '{count} días de cobertura',
    'methodology.chip.stations': '{count} estaciones con histórico',
    'methodology.cta.api': 'Ver API y descargas',
    'methodology.cta.status': 'Ver estado del sistema',
    'methodology.source.label': 'Fuente primaria',
    'methodology.source.note': 'El sistema oficial de Bizi, que consultamos y revisamos periódicamente.',
    'methodology.coverage.label': 'Cobertura visible',
    'methodology.coverage.note':
      'Es la misma base que alimenta informes, listas y fichas de estaciones.',
    'methodology.cadence.label': 'Cadencia observada',
    'methodology.cadence.note': 'Ritmo observado en las recogidas recientes.',
    'methodology.versions.label': 'Versiones activas',
    'methodology.versions.latestReport': 'Último informe publicado: {month}.',
    'methodology.versions.noReport': 'Sin informe mensual publicado.',
    'methodology.origin.eyebrow': 'De dónde salen los datos',
    'methodology.origin.title': 'Del sistema oficial a información útil para ti',
    'methodology.origin.body':
      'Partimos del sistema oficial de Bizi {city}. Recogemos el estado de cada estación, comprobamos que los datos sean coherentes y los agrupamos para mostrar la disponibilidad actual, el histórico, los barrios, los informes mensuales y la API. GBFS es el formato técnico que usa esa fuente oficial.',
    'methodology.current.eyebrow': 'Estado actual',
    'methodology.current.title': 'Lo que hay ahora',
    'methodology.current.body':
      'Bicis disponibles, huecos libres y capacidad muestran el último estado conocido de una estación; no son una media histórica.',
    'methodology.history.eyebrow': 'Histórico resumido',
    'methodology.history.title': 'Lo que suele ocurrir',
    'methodology.history.body':
      'El movimiento, las horas sin bicis o huecos, los horarios y las comparativas por barrio usan muchas muestras, no una única foto puntual.',
    'methodology.activity.eyebrow': 'Actividad y movilidad',
    'methodology.activity.title': 'Medidas para comparar',
    'methodology.activity.body':
      'El índice de actividad sirve para comparar actividad entre estaciones o zonas. No equivale al número oficial de viajes.',
    'methodology.prediction.eyebrow': 'Predicción',
    'methodology.prediction.title': 'Una pista, no una garantía',
    'methodology.prediction.body':
      'Las predicciones combinan patrones anteriores y el estado reciente para avisar de posibles problemas a corto plazo. Comprueba siempre el estado real antes de desplazarte.',
    'methodology.faq.eyebrow': 'FAQs visibles',
    'methodology.faq.title': 'Preguntas que más cambian la interpretación',
    'methodology.breadcrumb.self': 'Metodología',
    'methodology.ld.article.headline': 'Metodología y calidad de datos de Bizi {city}',
    'methodology.ld.article.description':
      'Guía pública para interpretar la fuente, la cobertura, la frecuencia y las métricas de las páginas públicas de DatosBizi.',
    'methodology.ld.dataset.name': 'Dataset Bizi {city}',
    'methodology.ld.dataset.description':
      'Cobertura histórica, snapshot actual y criterios de interpretación del dataset usado por estaciones, barrios, informes y API.',
    'methodology.ld.dataset.csv': 'Historico CSV',
    'methodology.status.healthy': 'Saludable',
    'methodology.status.degraded': 'Degradado',
    'methodology.status.down': 'Caido',
    'methodology.status.unknown': 'Desconocido',
    'methodology.status.noData': 'Sin datos',
    'methodology.status.noRecentData': 'Sin datos recientes',
    'methodology.status.cadence': '~{minutes} min por sondeo',
    'methodology.status.coverage': '{days} días · {from} -> {to}',
    'methodology.status.noDerivedVersion': 'Sin versión derivada',
    'methodology.faq.fuente-datos.question': '¿De dónde salen los datos de estaciones?',
    'methodology.faq.fuente-datos.answer':
      'La fuente principal es el feed GBFS oficial de Bizi Zaragoza: https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json. A partir de ese discovery se consultan station_information y station_status de forma periódica, y luego se validan y agregan para analítica.',
    'methodology.faq.actualizacion.question': '¿Con qué frecuencia se actualiza el dashboard?',
    'methodology.faq.actualizacion.answer':
      'Los datos se refrescan de forma periódica y la API usa caché corta para no saturar consultas. Por eso puede haber unos minutos de diferencia entre una vista y otra.',
    'methodology.faq.demanda-no-viajes-reales.question': '¿La demanda significa número real de viajes?',
    'methodology.faq.demanda-no-viajes-reales.answer':
      'No exactamente. Es un índice para medir la actividad del sistema. Va muy bien para comparar días y zonas, pero no debe leerse como contador oficial de viajes cerrados.',
    'methodology.faq.prediccion-que-es.question': '¿Qué son exactamente las predicciones del dashboard?',
    'methodology.faq.prediccion-que-es.answer':
      'Son valores estimados de disponibilidad futura (por ejemplo +30 y +60 min). Se calculan con patrones del pasado y la situación actual. Sirven para anticipar, no para confirmar lo que va a pasar al 100%.',
  },
  en: {
    'methodology.seo.title': 'Methodology and data quality of Bizi Zaragoza',
    'methodology.seo.description':
      'Find out where the Bizi Zaragoza data comes from, how often it is updated, what its metrics mean and what limits the estimates have.',
    'methodology.hero.eyebrow': 'How to read the data',
    'methodology.hero.title': 'Methodology and data quality of Bizi in {city}',
    'methodology.hero.intro':
      'We explain where the data comes from, when it is updated and what the figures you see mean. We also point out which metrics are estimates and how to interpret them with care.',
    'methodology.chip.days': '{count} days of coverage',
    'methodology.chip.stations': '{count} stations with history',
    'methodology.cta.api': 'View API and downloads',
    'methodology.cta.status': 'View system status',
    'methodology.source.label': 'Primary source',
    'methodology.source.note': 'The official Bizi system, which we query and review regularly.',
    'methodology.coverage.label': 'Visible coverage',
    'methodology.coverage.note':
      'It is the same base that feeds reports, lists and station sheets.',
    'methodology.cadence.label': 'Observed cadence',
    'methodology.cadence.note': 'Pace observed in recent collections.',
    'methodology.versions.label': 'Active versions',
    'methodology.versions.latestReport': 'Latest published report: {month}.',
    'methodology.versions.noReport': 'No monthly report published.',
    'methodology.origin.eyebrow': 'Where the data comes from',
    'methodology.origin.title': 'From the official system to information that is useful to you',
    'methodology.origin.body':
      'We start from the official Bizi {city} system. We collect the state of each station, check that the data is consistent and group it to show current availability, history, districts, monthly reports and the API. GBFS is the technical format used by that official source.',
    'methodology.current.eyebrow': 'Current state',
    'methodology.current.title': 'What is there now',
    'methodology.current.body':
      'Available bikes, free docks and capacity show the last known state of a station; they are not a historical average.',
    'methodology.history.eyebrow': 'History summary',
    'methodology.history.title': 'What usually happens',
    'methodology.history.body':
      'Movement, hours without bikes or docks, time-of-day patterns and district comparisons use many samples, not a single snapshot.',
    'methodology.activity.eyebrow': 'Activity and mobility',
    'methodology.activity.title': 'Measures to compare',
    'methodology.activity.body':
      'The activity index is used to compare activity between stations or areas. It is not the official number of trips.',
    'methodology.prediction.eyebrow': 'Prediction',
    'methodology.prediction.title': 'A hint, not a guarantee',
    'methodology.prediction.body':
      'Predictions combine past patterns and the recent state to warn about possible problems in the short term. Always check the real state before you set out.',
    'methodology.faq.eyebrow': 'Visible FAQs',
    'methodology.faq.title': 'Questions that change the interpretation the most',
    'methodology.breadcrumb.self': 'Methodology',
    'methodology.ld.article.headline': 'Methodology and data quality of Bizi {city}',
    'methodology.ld.article.description':
      'Public guide to interpreting the source, coverage, frequency and metrics of the public DatosBizi pages.',
    'methodology.ld.dataset.name': 'Bizi {city} dataset',
    'methodology.ld.dataset.description':
      'Historical coverage, current snapshot and interpretation criteria of the dataset used by stations, districts, reports and the API.',
    'methodology.ld.dataset.csv': 'History CSV',
    'methodology.status.healthy': 'Healthy',
    'methodology.status.degraded': 'Degraded',
    'methodology.status.down': 'Down',
    'methodology.status.unknown': 'Unknown',
    'methodology.status.noData': 'No data',
    'methodology.status.noRecentData': 'No recent data',
    'methodology.status.cadence': '~{minutes} min per poll',
    'methodology.status.coverage': '{days} days · {from} -> {to}',
    'methodology.status.noDerivedVersion': 'No derived version',
    'methodology.faq.fuente-datos.question': 'Where does the station data come from?',
    'methodology.faq.fuente-datos.answer':
      'The main source is the official GBFS feed of Bizi Zaragoza: https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json. From that discovery file, station_information and station_status are queried periodically, then validated and aggregated for analytics.',
    'methodology.faq.actualizacion.question': 'How often is the dashboard updated?',
    'methodology.faq.actualizacion.answer':
      'Data is refreshed periodically and the API uses a short cache to avoid overloading queries. That is why there can be a few minutes of difference between one view and another.',
    'methodology.faq.demanda-no-viajes-reales.question': 'Does demand mean the real number of trips?',
    'methodology.faq.demanda-no-viajes-reales.answer':
      'Not exactly. It is an index that measures system activity (the activity index). It works well for comparing days and areas, but it should not be read as an official count of completed trips.',
    'methodology.faq.prediccion-que-es.question': 'What exactly are the dashboard predictions?',
    'methodology.faq.prediccion-que-es.answer':
      'They are estimated values of future availability (for example +30 and +60 min). They are calculated from past patterns and the current situation. They help anticipate, not confirm with 100% certainty what will happen.',
  },
});
