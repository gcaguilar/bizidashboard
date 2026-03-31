import { appRoutes } from '@/lib/routes';

export const SEO_PAGE_SLUGS = [
  'estaciones-mas-usadas-zaragoza',
  'barrios-bizi-zaragoza',
  'uso-bizi-por-hora',
  'ranking-estaciones-bizi',
  'viajes-por-dia-zaragoza',
  'viajes-por-mes-zaragoza',
  'uso-bizi-por-estacion',
  'estaciones-con-mas-bicis',
  'informes-mensuales-bizi-zaragoza',
  'redistribucion-bizi-zaragoza',
] as const;

export type SeoPageSlug = (typeof SEO_PAGE_SLUGS)[number];

export type SeoPageConfig = {
  slug: SeoPageSlug;
  title: string;
  metadataTitle: string;
  description: string;
  keywords: string[];
  cadenceLabel: string;
  heroKicker: string;
  dashboardHref: string;
  dashboardLabel: string;
};

export const SEO_PAGE_CONFIGS: Record<SeoPageSlug, SeoPageConfig> = {
  'estaciones-mas-usadas-zaragoza': {
    slug: 'estaciones-mas-usadas-zaragoza',
    title: 'Estaciones Bizi mas usadas en Zaragoza',
    metadataTitle: 'Estaciones Bizi mas usadas en Zaragoza hoy',
    description:
      'Ranking SEO de las estaciones Bizi mas usadas en Zaragoza hoy, con comparativas de demanda, estaciones lideres y acceso directo al dashboard.',
    keywords: ['estaciones bizi mas usadas', 'ranking bizi zaragoza', 'estaciones con mas uso', 'bizi zaragoza hoy'],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Ranking de demanda reciente',
    dashboardHref: appRoutes.dashboardStations(),
    dashboardLabel: 'Ver directorio y detalle de estaciones',
  },
  'barrios-bizi-zaragoza': {
    slug: 'barrios-bizi-zaragoza',
    title: 'Barrios de Zaragoza con mas uso de Bizi',
    metadataTitle: 'Barrios de Zaragoza con mas uso de Bizi y estaciones destacadas',
    description:
      'Comparativa SEO de barrios de Zaragoza con mas uso de Bizi, estaciones destacadas, disponibilidad actual y enlaces al dashboard.',
    keywords: ['barrios bizi zaragoza', 'bizi por barrios zaragoza', 'distritos con mas uso bizi', 'estaciones bizi por barrio'],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Comparativa por barrios',
    dashboardHref: appRoutes.districtLanding(),
    dashboardLabel: 'Abrir comparativa publica por barrios',
  },
  'uso-bizi-por-hora': {
    slug: 'uso-bizi-por-hora',
    title: 'Uso de Bizi por hora en Zaragoza',
    metadataTitle: 'Uso de Bizi por hora en Zaragoza hoy',
    description:
      'Horas pico de Bizi Zaragoza, ocupacion media y ventanas de mayor actividad por hora con comparativas intradia y acceso al dashboard.',
    keywords: ['uso bizi por hora', 'horas pico bizi zaragoza', 'bizi zaragoza hora punta', 'movilidad bizi horaria'],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Patrones horarios',
    dashboardHref: appRoutes.dashboardView('research'),
    dashboardLabel: 'Abrir analisis horario en el dashboard',
  },
  'ranking-estaciones-bizi': {
    slug: 'ranking-estaciones-bizi',
    title: 'Ranking de estaciones Bizi Zaragoza',
    metadataTitle: 'Ranking de estaciones Bizi Zaragoza por uso y disponibilidad',
    description:
      'Clasificacion de estaciones Bizi Zaragoza por actividad, riesgo de vaciado o saturacion y enlaces al detalle operativo de cada estacion.',
    keywords: ['ranking estaciones bizi', 'clasificacion estaciones bizi zaragoza', 'estaciones bizi disponibilidad', 'ranking bizi'],
    cadenceLabel: 'Actualizacion semanal',
    heroKicker: 'Clasificacion operativa',
    dashboardHref: appRoutes.dashboard(),
    dashboardLabel: 'Ir al panel principal y ver el mapa en tiempo real',
  },
  'viajes-por-dia-zaragoza': {
    slug: 'viajes-por-dia-zaragoza',
    title: 'Viajes Bizi por dia en Zaragoza',
    metadataTitle: 'Viajes Bizi por dia en Zaragoza y tendencia semanal',
    description:
      'Serie diaria estimada de viajes Bizi en Zaragoza basada en la demanda agregada del sistema, con comparativa semanal y acceso al dashboard.',
    keywords: ['viajes bizi por dia', 'bizi zaragoza viajes diarios', 'demanda bizi diaria', 'estadisticas bizi zaragoza'],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Serie diaria',
    dashboardHref: appRoutes.dashboardConclusions(),
    dashboardLabel: 'Ver resumen diario y tendencia reciente',
  },
  'viajes-por-mes-zaragoza': {
    slug: 'viajes-por-mes-zaragoza',
    title: 'Viajes Bizi por mes en Zaragoza',
    metadataTitle: 'Viajes Bizi por mes en Zaragoza e informe mensual',
    description:
      'Evolucion mensual estimada de viajes Bizi en Zaragoza con comparativa frente al mes anterior, archivo de informes y enlaces al dashboard.',
    keywords: ['viajes bizi por mes', 'bizi zaragoza mensual', 'informe mensual bizi', 'estadisticas mensuales bizi'],
    cadenceLabel: 'Actualizacion mensual',
    heroKicker: 'Serie mensual',
    dashboardHref: appRoutes.reports(),
    dashboardLabel: 'Abrir informes mensuales publicados',
  },
  'uso-bizi-por-estacion': {
    slug: 'uso-bizi-por-estacion',
    title: 'Uso de Bizi por estacion en Zaragoza',
    metadataTitle: 'Uso de Bizi por estacion en Zaragoza con comparativas',
    description:
      'Comparativa entre estaciones Bizi de Zaragoza por demanda media, menor uso y acceso al detalle operativo de cada estacion.',
    keywords: ['uso bizi por estacion', 'comparativa estaciones bizi', 'estaciones bizi zaragoza demanda', 'detalle estacion bizi'],
    cadenceLabel: 'Actualizacion semanal',
    heroKicker: 'Comparativa entre estaciones',
    dashboardHref: appRoutes.dashboardStations(),
    dashboardLabel: 'Explorar el directorio completo de estaciones',
  },
  'estaciones-con-mas-bicis': {
    slug: 'estaciones-con-mas-bicis',
    title: 'Estaciones Bizi con mas bicis disponibles',
    metadataTitle: 'Estaciones Bizi con mas bicis disponibles en Zaragoza ahora',
    description:
      'Listado actual de estaciones Bizi con mas bicicletas disponibles en Zaragoza ahora mismo y comparativa con la media del sistema.',
    keywords: ['estaciones con mas bicis', 'bizi zaragoza disponibilidad actual', 'donde hay bicis bizi', 'bicis disponibles zaragoza'],
    cadenceLabel: 'Actualizacion horaria',
    heroKicker: 'Disponibilidad actual',
    dashboardHref: appRoutes.dashboardStations(),
    dashboardLabel: 'Abrir estaciones con disponibilidad actual',
  },
  'informes-mensuales-bizi-zaragoza': {
    slug: 'informes-mensuales-bizi-zaragoza',
    title: 'Informes mensuales de Bizi Zaragoza',
    metadataTitle: 'Informes mensuales de Bizi Zaragoza y archivo historico',
    description:
      'Archivo de informes mensuales de Bizi Zaragoza con demanda estimada, ocupacion media, comparativas intermensuales y enlaces al dashboard filtrado por mes.',
    keywords: ['informes mensuales bizi', 'archivo bizi zaragoza', 'reporte mensual bizi', 'estadisticas bizi mensuales'],
    cadenceLabel: 'Actualizacion mensual',
    heroKicker: 'Archivo de informes',
    dashboardHref: appRoutes.reports(),
    dashboardLabel: 'Abrir archivo mensual completo',
  },
  'redistribucion-bizi-zaragoza': {
    slug: 'redistribucion-bizi-zaragoza',
    title: 'Redistribucion de bicis Bizi Zaragoza',
    metadataTitle: 'Como se redistribuyen las bicis Bizi en Zaragoza: metodologia y datos',
    description:
      'Sistema de diagnostico y redistribucion de estaciones Bizi Zaragoza: clasificacion A-F, prediccion de riesgo, transferencias origen-destino y comparativa de escenarios de intervencion.',
    keywords: [
      'redistribucion bizi zaragoza',
      'rebalanceo bici publica zaragoza',
      'como funciona redistribucion bizi',
      'estaciones vacias llenas bizi',
      'logistica bizi zaragoza',
    ],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Diagnostico de equilibrio',
    dashboardHref: appRoutes.dashboardRedistribucion(),
    dashboardLabel: 'Abrir panel operativo de redistribucion',
  },
};

export function isSeoPageSlug(value: string): value is SeoPageSlug {
  return SEO_PAGE_SLUGS.includes(value as SeoPageSlug);
}

export function getSeoPageConfig(slug: SeoPageSlug): SeoPageConfig {
  return SEO_PAGE_CONFIGS[slug];
}
