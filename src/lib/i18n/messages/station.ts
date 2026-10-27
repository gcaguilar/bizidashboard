import { defineArea } from './define';

/**
 * Station sheet page body and head (`src/app/estadisticas/estaciones/$stationId.tsx`).
 * Children with their own copy (status badge, prediction card, favorite button,
 * share link) are not translated yet and keep Spanish.
 */
export const stationMessages = defineArea({
  es: {
    'station.seo.title': '{name} | Estación Bizi Zaragoza | DatosBizi',
    'station.seo.description':
      'Consulta bicis, huecos, ocupación y patrones de uso de {name}, estación Bizi de Zaragoza.',
    'station.ld.name': '{name} | DatosBizi',
    'station.ld.description':
      'Ficha pública de {name} con disponibilidad actual y patrones de uso.',
    'station.breadcrumb.home': 'Inicio',
    'station.breadcrumb.stats': 'Estadísticas',
    'station.breadcrumb.stations': 'Estaciones',
    'station.error.eyebrow': 'Estación no disponible',
    'station.error.title': 'No se pudo cargar esta estación',
    'station.error.body':
      'Intenta de nuevo en unos minutos o vuelve al listado público de estaciones.',
    'station.error.viewStations': 'Ver estaciones',
    'station.error.viewStatus': 'Ver estado',
    'station.notFound.eyebrow': 'Ficha de estación',
    'station.notFound.title': 'Estación {id}',
    'station.notFound.body':
      'Aún no hay datos suficientes para mostrar esta estación con confianza.',
    'station.notFound.viewAll': 'Ver todas las estaciones',
    'station.occupancy.nearAverage': 'muy cerca de la media de la ciudad',
    'station.occupancy.aboveAverage': 'por encima de la media de Zaragoza',
    'station.occupancy.belowAverage': 'por debajo de la media de Zaragoza',
    'station.dayType.weekday': 'Entre semana',
    'station.dayType.weekend': 'Fin de semana',
    'station.dayType.unknown': 'Día desconocido',
    'station.action.empty': '{name} está vacía ahora. No encontrarás bicis disponibles.',
    'station.action.full': '{name} está llena ahora. No podrás dejar bicicleta.',
    'station.action.good':
      '{name} tiene {bikes} bicis y {anchors} huecos libres. Buena opción ahora.',
    'station.action.default': '{name} tiene {bikes} bicis y {anchors} huecos libres.',
    'station.faq.easyBike.question': '¿Cuándo suele ser más fácil encontrar bici?',
    'station.faq.easyBike.answer':
      '{dayType} sobre {hours}, con una ocupación media del {percent}.',
    'station.faq.easyBike.none':
      'Todavía no hay un patrón histórico suficientemente estable para responderlo con precisión.',
    'station.faq.easyDock.question': '¿Cuándo suele haber más huecos para devolver?',
    'station.faq.easyDock.answer':
      '{dayType} sobre {hours}, cuando la ocupación media baja a {percent}.',
    'station.faq.easyDock.none':
      'La serie disponible todavía no permite marcar una franja clara con más anclajes libres.',
    'station.faq.average.question': '¿Está por encima o por debajo de la media de Zaragoza?',
    'station.faq.average.answer':
      'La ocupación actual está {delta}: {current} frente a {average} en la ciudad.',
    'station.hero.eyebrow': 'Ficha pública de estación',
    'station.hero.intro':
      'Consulta si esta estación tiene bicis o huecos ahora, cómo suele comportarse y qué alternativas tienes cerca.',
    'station.hero.openMap': 'Ver en mapa avanzado',
    'station.hero.viewDistrict': 'Ver barrio',
    'station.share.text': 'Disponibilidad de {name} en Bizi Zaragoza',
    'station.stat.bikes': 'Bicis disponibles',
    'station.stat.anchors': 'Huecos libres',
    'station.stat.capacity': 'Capacidad',
    'station.stat.occupancy': 'Ocupación',
    'station.alert.empty': '⚠️ Esta estación está vacía ahora. No encontrarás bicis disponibles.',
    'station.alert.full': '⚠️ Esta estación está llena ahora. No podrás dejar bicicleta.',
    'station.alert.good': '✅ Buena opción: {bikes} bicis y {anchors} huecos libres.',
    'station.summary.title': 'En resumen',
    'station.summary.body':
      'Su ocupación actual está {delta}. Esta ficha te da una lectura rápida; abre el mapa si quieres ver alertas, rutas y más detalle.',
    'station.slots.title': 'Cuándo suele ser más fácil usarla',
    'station.slots.easyBike': 'Suele ser más fácil encontrar bici',
    'station.slots.easyDock': 'Suele ser más fácil devolverla',
    'station.related.title': 'Alternativas cercanas',
    'station.related.intro': 'Si esta estación no te sirve, estas son opciones cercanas:',
    'station.related.availability': '{bikes} bicis · {anchors} huecos',
  },
  en: {
    'station.seo.title': '{name} | Bizi Zaragoza station | DatosBizi',
    'station.seo.description':
      'Check bikes, free docks, occupancy and usage patterns of {name}, a Bizi station in Zaragoza.',
    'station.ld.name': '{name} | DatosBizi',
    'station.ld.description':
      'Public sheet for {name} with current availability and usage patterns.',
    'station.breadcrumb.home': 'Home',
    'station.breadcrumb.stats': 'Statistics',
    'station.breadcrumb.stations': 'Stations',
    'station.error.eyebrow': 'Station unavailable',
    'station.error.title': 'This station could not be loaded',
    'station.error.body': 'Try again in a few minutes or go back to the public list of stations.',
    'station.error.viewStations': 'View stations',
    'station.error.viewStatus': 'View status',
    'station.notFound.eyebrow': 'Station sheet',
    'station.notFound.title': 'Station {id}',
    'station.notFound.body':
      'There is not enough data yet to show this station with confidence.',
    'station.notFound.viewAll': 'View all stations',
    'station.occupancy.nearAverage': 'very close to the city average',
    'station.occupancy.aboveAverage': 'above the Zaragoza average',
    'station.occupancy.belowAverage': 'below the Zaragoza average',
    'station.dayType.weekday': 'Weekdays',
    'station.dayType.weekend': 'Weekends',
    'station.dayType.unknown': 'Unknown day',
    'station.action.empty': '{name} is empty right now. You will not find any bikes.',
    'station.action.full': '{name} is full right now. You will not be able to return a bike.',
    'station.action.good':
      '{name} has {bikes} bikes and {anchors} free docks. A good option right now.',
    'station.action.default': '{name} has {bikes} bikes and {anchors} free docks.',
    'station.faq.easyBike.question': 'When is it usually easiest to find a bike?',
    'station.faq.easyBike.answer': '{dayType} around {hours}, with an average occupancy of {percent}.',
    'station.faq.easyBike.none':
      'There is not yet a stable enough historical pattern to answer this precisely.',
    'station.faq.easyDock.question': 'When are there usually more free docks to return a bike?',
    'station.faq.easyDock.answer':
      '{dayType} around {hours}, when average occupancy drops to {percent}.',
    'station.faq.easyDock.none':
      'The available series does not yet allow marking a clear window with more free docks.',
    'station.faq.average.question': 'Is it above or below the Zaragoza average?',
    'station.faq.average.answer':
      'Current occupancy is {delta}: {current} compared with {average} across the city.',
    'station.hero.eyebrow': 'Public station sheet',
    'station.hero.intro':
      'Check whether this station has bikes or free docks now, how it usually behaves and what alternatives are nearby.',
    'station.hero.openMap': 'View on the advanced map',
    'station.hero.viewDistrict': 'View district',
    'station.share.text': 'Availability of {name} at Bizi Zaragoza',
    'station.stat.bikes': 'Available bikes',
    'station.stat.anchors': 'Free docks',
    'station.stat.capacity': 'Capacity',
    'station.stat.occupancy': 'Occupancy',
    'station.alert.empty': '⚠️ This station is empty right now. You will not find any bikes.',
    'station.alert.full': '⚠️ This station is full right now. You will not be able to return a bike.',
    'station.alert.good': '✅ Good option: {bikes} bikes and {anchors} free docks.',
    'station.summary.title': 'Summary',
    'station.summary.body':
      'Its current occupancy is {delta}. This sheet gives you a quick read; open the map for alerts, routes and more detail.',
    'station.slots.title': 'When it is usually easiest to use',
    'station.slots.easyBike': 'Usually easier to find a bike',
    'station.slots.easyDock': 'Usually easier to return one',
    'station.related.title': 'Nearby alternatives',
    'station.related.intro': 'If this station does not work for you, here are some nearby options:',
    'station.related.availability': '{bikes} bikes · {anchors} docks',
  },
});
