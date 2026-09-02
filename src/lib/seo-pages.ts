import { appRoutes } from '@/lib/routes';

export type NavigationPageRole = 'ENTRY_SEO' | 'HUB' | 'DETAIL' | 'DASHBOARD';

export type NavigationPrimaryCta = {
  href: string;
  label: string;
  destination: string;
};

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
  'redistribucion',
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
  pageRole: NavigationPageRole;
  primaryCta: NavigationPrimaryCta;
  canonicalPath?: string;
  isLegacyAlias?: boolean;
};

export const EXPLORE_PAGE_NAV_CONFIG = {
  pageRole: 'HUB' as const,
  primaryCta: {
    href: appRoutes.dashboardView('research'),
    label: 'Abrir análisis del sistema',
    destination: 'dashboard_research',
  },
};

export const UTILITY_LANDING_NAV_CONFIG = {
  pageRole: 'ENTRY_SEO' as const,
  primaryCta: {
    href: appRoutes.dashboardView('overview'),
    label: 'Abrir el resumen de la red',
    destination: 'dashboard_overview',
  },
};

export const PRIMARY_SEO_PAGE_SLUGS = [
  'estaciones-mas-usadas-zaragoza',
  'barrios-bizi-zaragoza',
  'uso-bizi-por-hora',
  'ranking-estaciones-bizi',
  'viajes-por-dia-zaragoza',
  'viajes-por-mes-zaragoza',
  'uso-bizi-por-estacion',
  'estaciones-con-mas-bicis',
  'redistribucion',
] as const satisfies readonly SeoPageSlug[];

export const SEO_PAGE_CONFIGS: Record<SeoPageSlug, SeoPageConfig> = {
  'estaciones-mas-usadas-zaragoza': {
    slug: 'estaciones-mas-usadas-zaragoza',
    title: 'Estaciones Bizi más usadas en Zaragoza',
    metadataTitle: 'Estaciones Bizi más usadas en Zaragoza | Ranking y análisis',
    description:
      'Consulta qué estaciones Bizi concentran más actividad en Zaragoza, cuáles lideran el ranking reciente y cómo cambia la actividad entre estaciones.',
    keywords: ['estaciones bizi mas usadas', 'ranking bizi zaragoza', 'estaciones con mas uso', 'bizi zaragoza hoy'],
    cadenceLabel: 'Actualización diaria',
    heroKicker: 'Estaciones con más actividad reciente',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardStations(),
      label: 'Ver directorio de estaciones',
      destination: 'dashboard_stations',
    },
  },
  'barrios-bizi-zaragoza': {
    slug: 'barrios-bizi-zaragoza',
    title: 'Barrios de Zaragoza con más uso de Bizi',
    metadataTitle: 'Barrios de Zaragoza con más uso de Bizi | Estaciones y actividad',
    description:
      'Explora qué barrios de Zaragoza concentran más uso de Bizi, cuántas estaciones activas tienen y qué zonas conviene seguir.',
    keywords: ['barrios bizi zaragoza', 'bizi por barrios zaragoza', 'distritos con mas uso bizi', 'estaciones bizi por barrio'],
    cadenceLabel: 'Actualización diaria',
    heroKicker: 'Comparativa por barrios',
    pageRole: 'HUB',
    primaryCta: {
      href: appRoutes.dashboardFlow(),
      label: 'Ver flujo por barrios',
      destination: 'dashboard_flow',
    },
  },
  'uso-bizi-por-hora': {
    slug: 'uso-bizi-por-hora',
    title: 'Uso de Bizi por hora en Zaragoza',
    metadataTitle: 'Horas punta de Bizi Zaragoza | Patrones de uso y análisis',
    description:
      'Analiza las horas punta de Bizi Zaragoza, la ocupación media por franja y cuándo se concentra la actividad.',
    keywords: ['uso bizi por hora', 'horas pico bizi zaragoza', 'bizi zaragoza hora punta', 'movilidad bizi horaria'],
    cadenceLabel: 'Actualización diaria',
    heroKicker: 'Patrones horarios',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardView('research'),
      label: 'Ver análisis horario',
      destination: 'dashboard_research',
    },
  },
  'ranking-estaciones-bizi': {
    slug: 'ranking-estaciones-bizi',
    title: 'Ranking de estaciones Bizi Zaragoza',
    metadataTitle: 'Estaciones Bizi más usadas en Zaragoza | Uso y disponibilidad',
    description:
      'Ranking de estaciones Bizi Zaragoza por actividad, disponibilidad y horas con problemas.',
    keywords: ['ranking estaciones bizi', 'clasificacion estaciones bizi zaragoza', 'estaciones bizi disponibilidad', 'ranking bizi'],
    cadenceLabel: 'Actualización semanal',
    heroKicker: 'Comparativa de estaciones',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardStations(),
      label: 'Ver ranking de estaciones',
      destination: 'dashboard_stations',
    },
  },
  'viajes-por-dia-zaragoza': {
    slug: 'viajes-por-dia-zaragoza',
    title: 'Actividad diaria de Bizi Zaragoza',
    metadataTitle: 'Actividad diaria estimada de Bizi Zaragoza | Tendencia y análisis',
    description:
      'Sigue la actividad diaria estimada de Bizi Zaragoza y detecta cambios en el uso de la red. No son viajes oficiales individuales.',
    keywords: ['viajes bizi por dia', 'bizi zaragoza viajes diarios', 'demanda bizi diaria', 'estadisticas bizi zaragoza'],
    cadenceLabel: 'Actualización diaria',
    heroKicker: 'Evolución diaria',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardConclusions(),
      label: 'Ver tendencia diaria',
      destination: 'dashboard_conclusions',
    },
  },
  'viajes-por-mes-zaragoza': {
    slug: 'viajes-por-mes-zaragoza',
    title: 'Actividad mensual de Bizi Zaragoza',
    metadataTitle: 'Actividad mensual estimada de Bizi Zaragoza | Serie histórica',
    description:
      'Consulta la evolución mensual estimada de Bizi Zaragoza y compara cada mes con el anterior. No son viajes oficiales individuales.',
    keywords: ['viajes bizi por mes', 'bizi zaragoza mensual', 'informe mensual bizi', 'estadisticas mensuales bizi'],
    cadenceLabel: 'Actualización mensual',
    heroKicker: 'Serie mensual',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.reports(),
      label: 'Ver informes mensuales',
      destination: 'report_archive',
    },
  },
  'uso-bizi-por-estacion': {
    slug: 'uso-bizi-por-estacion',
    title: 'Uso de Bizi por estación en Zaragoza',
    metadataTitle: 'Uso de Bizi por estación en Zaragoza | Comparativa de estaciones',
    description:
      'Compara estaciones Bizi de Zaragoza por actividad media y disponibilidad para encontrar las diferencias más importantes.',
    keywords: ['uso bizi por estacion', 'comparativa estaciones bizi', 'estaciones bizi zaragoza demanda', 'detalle estacion bizi'],
    cadenceLabel: 'Actualización semanal',
    heroKicker: 'Comparativa entre estaciones',
    pageRole: 'HUB',
    primaryCta: {
      href: appRoutes.dashboardStations(),
      label: 'Explorar estaciones',
      destination: 'dashboard_stations',
    },
  },
  'estaciones-con-mas-bicis': {
    slug: 'estaciones-con-mas-bicis',
    title: 'Estaciones Bizi con más bicis disponibles',
    metadataTitle: 'Dónde hay más bicis Bizi en Zaragoza ahora | Disponibilidad actual',
    description:
      'Encuentra las estaciones Bizi con más bicicletas disponibles en Zaragoza y consulta su estado actual.',
    keywords: ['estaciones con mas bicis', 'bizi zaragoza disponibilidad actual', 'donde hay bicis bizi', 'bicis disponibles zaragoza'],
    cadenceLabel: 'Actualización horaria',
    heroKicker: 'Disponibilidad actual',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardStations(),
      label: 'Ver disponibilidad actual',
      destination: 'dashboard_stations',
    },
  },
  'informes-mensuales-bizi-zaragoza': {
    slug: 'informes-mensuales-bizi-zaragoza',
    title: 'Informes mensuales de Bizi Zaragoza',
    metadataTitle: 'Informes mensuales de Bizi Zaragoza | Archivo histórico',
    description:
      'Archivo mensual de Bizi Zaragoza con histórico, informes indexables y navegación por mes.',
    keywords: ['informes mensuales bizi', 'archivo bizi zaragoza', 'reporte mensual bizi', 'estadisticas bizi mensuales'],
    cadenceLabel: 'Actualización mensual',
    heroKicker: 'Archivo de informes',
    pageRole: 'HUB',
    primaryCta: {
      href: appRoutes.reports(),
      label: 'Ver archivo mensual',
      destination: 'report_archive',
    },
    canonicalPath: appRoutes.reports(),
    isLegacyAlias: true,
  },
  'redistribucion': {
    slug: 'redistribucion',
    title: 'Redistribución de bicis Bizi Zaragoza',
    metadataTitle: 'Redistribución de bicis Bizi Zaragoza | Equilibrio y método',
    description:
      'Entiende qué estaciones se desequilibran antes, dónde faltan bicis o huecos y qué señales conviene revisar.',
    keywords: [
      'redistribucion bizi zaragoza',
      'rebalanceo bici publica zaragoza',
      'como funciona redistribucion bizi',
      'estaciones vacias llenas bizi',
      'logistica bizi zaragoza',
    ],
    cadenceLabel: 'Actualización diaria',
    heroKicker: 'Equilibrio de la red',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardRedistribucion(),
      label: 'Ver redistribución',
      destination: 'dashboard_redistribucion',
    },
  },
};

export function isSeoPageSlug(value: string): value is SeoPageSlug {
  return SEO_PAGE_SLUGS.includes(value as SeoPageSlug);
}

export function getSeoPageConfig(slug: SeoPageSlug): SeoPageConfig {
  return SEO_PAGE_CONFIGS[slug];
}
