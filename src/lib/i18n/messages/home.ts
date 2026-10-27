import { defineArea } from './define';

/**
 * Home page shell (`src/app/index.tsx`): SEO, hero, quick links and FAQ.
 * `{city}` is the configured city name (`getCityName()`).
 * Child sections (status hero, live section, explore section...) are not
 * translated yet and keep their Spanish copy.
 */
export const homeMessages = defineArea({
  es: {
    'home.seo.title': 'Bizi {city} en tiempo real: estaciones y bicis | DatosBizi',
    'home.seo.description':
      'Consulta en tiempo real las estaciones de Bizi {city}: bicis y huecos disponibles, histórico, barrios, informes y API pública. Datos cada 2 minutos.',
    'home.hero.eyebrow': 'Datos públicos de Bizi {city}',
    'home.hero.title': 'Entiende cómo está Bizi {city} ahora',
    'home.hero.subtitle':
      'Consulta bicis y huecos disponibles, detecta estaciones con problemas y descubre cómo cambia la red con el tiempo.',
    'home.hero.networkStatus': 'Ver estado de la red',
    'home.hero.monthlyReports': 'Ver informes mensuales',
    'home.faq.title': 'Preguntas frecuentes',
    'home.faq.nearest.question': '¿Cómo saber si hay bicis disponibles en mi estación más cercana?',
    'home.faq.nearest.answer':
      'Abre BiciRadar y consulta las estaciones cercanas: verás al momento cuántas bicis y huecos libres tiene cada una. Este observatorio sirve para entender el estado general y la evolución de toda la red.',
    'home.faq.mostBikes.question': '¿Qué estaciones tienen más bicis ahora mismo?',
    'home.faq.mostBikes.answer':
      'En las estadísticas de estaciones, filtra por "Con bicis" para ver las que tienen disponibilidad, ordenadas de mayor a menor.',
    'home.faq.updates.question': '¿Cada cuánto se actualizan los datos?',
    'home.faq.updates.answer':
      'Los datos se actualizan cada pocos minutos desde el sistema oficial de Bizi {city}. En Estado de los datos puedes comprobar la hora de la última actualización.',
  },
  en: {
    'home.seo.title': 'Bizi {city} live: stations and bikes | DatosBizi',
    'home.seo.description':
      'Check the Bizi {city} stations in real time: available bikes and free docks, history, districts, reports and a public API. Data every 2 minutes.',
    'home.hero.eyebrow': 'Public Bizi {city} data',
    'home.hero.title': 'Understand how Bizi {city} is doing right now',
    'home.hero.subtitle':
      'Check available bikes and free docks, spot stations with problems and see how the network changes over time.',
    'home.hero.networkStatus': 'See network status',
    'home.hero.monthlyReports': 'See monthly reports',
    'home.faq.title': 'Frequently asked questions',
    'home.faq.nearest.question': 'How can I tell if my nearest station has bikes?',
    'home.faq.nearest.answer':
      'Open BiciRadar and check the nearby stations: you will instantly see how many bikes and free docks each one has. This observatory helps you understand the overall state and evolution of the whole network.',
    'home.faq.mostBikes.question': 'Which stations have the most bikes right now?',
    'home.faq.mostBikes.answer':
      'In the station statistics, filter by "With bikes" to see the ones that have availability, sorted from most to fewest.',
    'home.faq.updates.question': 'How often is the data updated?',
    'home.faq.updates.answer':
      'The data is updated every few minutes from the official Bizi {city} system. Under Data status you can check the time of the last update.',
  },
});
