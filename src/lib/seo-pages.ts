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
  pageRole: NavigationPageRole;
  primaryCta: NavigationPrimaryCta;
  canonicalPath?: string;
  isLegacyAlias?: boolean;
};

export const EXPLORE_PAGE_NAV_CONFIG = {
  pageRole: 'HUB' as const,
  primaryCta: {
    href: appRoutes.dashboardView('research'),
    label: 'Abrir analisis del dashboard',
    destination: 'dashboard_research',
  },
};

export const UTILITY_LANDING_NAV_CONFIG = {
  pageRole: 'ENTRY_SEO' as const,
  primaryCta: {
    href: appRoutes.dashboardView('overview'),
    label: 'Abrir dashboard en vista resumen',
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
  'redistribucion-bizi-zaragoza',
] as const satisfies readonly SeoPageSlug[];

export const SEO_PAGE_CONFIGS: Record<SeoPageSlug, SeoPageConfig> = {
  'estaciones-mas-usadas-zaragoza': {
    slug: 'estaciones-mas-usadas-zaragoza',
    title: 'Estaciones Bizi mas usadas en Zaragoza',
    metadataTitle: 'Estaciones Bizi mas usadas en Zaragoza | Ranking y analisis',
    description:
      'Consulta que estaciones Bizi concentran mas actividad en Zaragoza, que puntos lideran el ranking reciente y como cambiar la demanda entre estaciones.',
    keywords: ['estaciones bizi mas usadas', 'ranking bizi zaragoza', 'estaciones con mas uso', 'bizi zaragoza hoy'],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Ranking de demanda reciente',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardStations(),
      label: 'Ver directorio y detalle de estaciones',
      destination: 'dashboard_stations',
    },
  },
  'barrios-bizi-zaragoza': {
    slug: 'barrios-bizi-zaragoza',
    title: 'Barrios de Zaragoza con mas uso de Bizi',
    metadataTitle: 'Barrios de Zaragoza con mas uso de Bizi | Estaciones y actividad',
    description:
      'Explora que barrios de Zaragoza concentran mas uso de Bizi, cuantas estaciones activas tienen y que zonas merecen seguimiento por actividad o disponibilidad.',
    keywords: ['barrios bizi zaragoza', 'bizi por barrios zaragoza', 'distritos con mas uso bizi', 'estaciones bizi por barrio'],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Comparativa por barrios',
    pageRole: 'HUB',
    primaryCta: {
      href: appRoutes.dashboardFlow(),
      label: 'Abrir flujo operativo por barrios',
      destination: 'dashboard_flow',
    },
  },
  'uso-bizi-por-hora': {
    slug: 'uso-bizi-por-hora',
    title: 'Uso de Bizi por hora en Zaragoza',
    metadataTitle: 'Horas punta de Bizi Zaragoza | Patrones de uso y analisis',
    description:
      'Analiza las horas punta de Bizi Zaragoza, la ocupacion media por franja y cuando se concentran los picos de uso o de disponibilidad.',
    keywords: ['uso bizi por hora', 'horas pico bizi zaragoza', 'bizi zaragoza hora punta', 'movilidad bizi horaria'],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Patrones horarios',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardView('research'),
      label: 'Abrir analisis horario en el dashboard',
      destination: 'dashboard_research',
    },
  },
  'ranking-estaciones-bizi': {
    slug: 'ranking-estaciones-bizi',
    title: 'Ranking de estaciones Bizi Zaragoza',
    metadataTitle: 'Estaciones Bizi mas usadas en Zaragoza | Uso y disponibilidad',
    description:
      'Ranking operativo de estaciones Bizi Zaragoza por actividad, riesgo de vaciado o saturacion y acceso rapido a los puntos que exigen atencion.',
    keywords: ['ranking estaciones bizi', 'clasificacion estaciones bizi zaragoza', 'estaciones bizi disponibilidad', 'ranking bizi'],
    cadenceLabel: 'Actualizacion semanal',
    heroKicker: 'Clasificacion operativa',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardStations(),
      label: 'Abrir ranking y directorio de estaciones',
      destination: 'dashboard_stations',
    },
  },
  'viajes-por-dia-zaragoza': {
    slug: 'viajes-por-dia-zaragoza',
    title: 'Viajes Bizi por dia en Zaragoza',
    metadataTitle: 'Viajes diarios estimados de Bizi Zaragoza | Tendencia y analisis',
    description:
      'Sigue la tendencia diaria estimada de Bizi Zaragoza, compara demanda reciente y detecta cambios de intensidad en el uso del sistema.',
    keywords: ['viajes bizi por dia', 'bizi zaragoza viajes diarios', 'demanda bizi diaria', 'estadisticas bizi zaragoza'],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Serie diaria',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardConclusions(),
      label: 'Ver resumen diario y tendencia reciente',
      destination: 'dashboard_conclusions',
    },
  },
  'viajes-por-mes-zaragoza': {
    slug: 'viajes-por-mes-zaragoza',
    title: 'Viajes Bizi por mes en Zaragoza',
    metadataTitle: 'Viajes mensuales estimados de Bizi Zaragoza | Serie historica',
    description:
      'Consulta la evolucion mensual estimada de Bizi Zaragoza, compara cada mes con el anterior y enlaza con el archivo historico de informes.',
    keywords: ['viajes bizi por mes', 'bizi zaragoza mensual', 'informe mensual bizi', 'estadisticas mensuales bizi'],
    cadenceLabel: 'Actualizacion mensual',
    heroKicker: 'Serie mensual',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.reports(),
      label: 'Abrir informes mensuales publicados',
      destination: 'report_archive',
    },
  },
  'uso-bizi-por-estacion': {
    slug: 'uso-bizi-por-estacion',
    title: 'Uso de Bizi por estacion en Zaragoza',
    metadataTitle: 'Uso de Bizi por estacion en Zaragoza | Comparativa de estaciones',
    description:
      'Compara estaciones Bizi de Zaragoza por demanda media, detecta puntos con menor actividad y encuentra rapidamente los detalles operativos mas relevantes.',
    keywords: ['uso bizi por estacion', 'comparativa estaciones bizi', 'estaciones bizi zaragoza demanda', 'detalle estacion bizi'],
    cadenceLabel: 'Actualizacion semanal',
    heroKicker: 'Comparativa entre estaciones',
    pageRole: 'HUB',
    primaryCta: {
      href: appRoutes.dashboardStations(),
      label: 'Explorar el directorio completo de estaciones',
      destination: 'dashboard_stations',
    },
  },
  'estaciones-con-mas-bicis': {
    slug: 'estaciones-con-mas-bicis',
    title: 'Estaciones Bizi con mas bicis disponibles',
    metadataTitle: 'Donde hay mas bicis Bizi en Zaragoza ahora | Disponibilidad actual',
    description:
      'Encuentra las estaciones Bizi con mas bicicletas disponibles en Zaragoza en el snapshot actual y compara su disponibilidad con la media del sistema.',
    keywords: ['estaciones con mas bicis', 'bizi zaragoza disponibilidad actual', 'donde hay bicis bizi', 'bicis disponibles zaragoza'],
    cadenceLabel: 'Actualizacion horaria',
    heroKicker: 'Disponibilidad actual',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardStations(),
      label: 'Abrir estaciones con disponibilidad actual',
      destination: 'dashboard_stations',
    },
  },
  'informes-mensuales-bizi-zaragoza': {
    slug: 'informes-mensuales-bizi-zaragoza',
    title: 'Informes mensuales de Bizi Zaragoza',
    metadataTitle: 'Informes mensuales de Bizi Zaragoza | Archivo historico',
    description:
      'Alias legacy del archivo mensual de Bizi Zaragoza. La version canonica concentra el historico, los informes indexables y la navegacion editorial por mes.',
    keywords: ['informes mensuales bizi', 'archivo bizi zaragoza', 'reporte mensual bizi', 'estadisticas bizi mensuales'],
    cadenceLabel: 'Actualizacion mensual',
    heroKicker: 'Archivo de informes',
    pageRole: 'HUB',
    primaryCta: {
      href: appRoutes.reports(),
      label: 'Abrir archivo mensual completo',
      destination: 'report_archive',
    },
    canonicalPath: appRoutes.reports(),
    isLegacyAlias: true,
  },
  'redistribucion-bizi-zaragoza': {
    slug: 'redistribucion-bizi-zaragoza',
    title: 'Redistribucion de bicis Bizi Zaragoza',
    metadataTitle: 'Redistribucion de bicis Bizi Zaragoza | Equilibrio y metodologia',
    description:
      'Entiende como se redistribuyen las bicis de Bizi Zaragoza, que estaciones se desequilibran antes y que reglas usa el sistema para priorizar intervenciones.',
    keywords: [
      'redistribucion bizi zaragoza',
      'rebalanceo bici publica zaragoza',
      'como funciona redistribucion bizi',
      'estaciones vacias llenas bizi',
      'logistica bizi zaragoza',
    ],
    cadenceLabel: 'Actualizacion diaria',
    heroKicker: 'Diagnostico de equilibrio',
    pageRole: 'ENTRY_SEO',
    primaryCta: {
      href: appRoutes.dashboardRedistribucion(),
      label: 'Abrir panel operativo de redistribucion',
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
