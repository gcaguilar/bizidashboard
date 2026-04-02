import { appRoutes } from '@/lib/routes';

export type PublicNavItem = {
  id: 'home' | 'dashboard' | 'stations' | 'reports' | 'api' | 'help' | 'status';
  label: string;
  href: string;
};

export type ExploreHubItem = {
  id:
    | 'stations'
    | 'flow'
    | 'rankings'
    | 'heatmap'
    | 'history'
    | 'compare'
    | 'alerts'
    | 'patterns'
    | 'mobility'
    | 'districts'
    | 'time-series'
    | 'maps'
    | 'system-kpis'
    | 'redistribucion';
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  destinationLabel: string;
};

export type ExploreHubSection = {
  id: 'operations' | 'analysis' | 'archive';
  title: string;
  description: string;
  items: ExploreHubItem[];
};

export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { id: 'home', label: 'Inicio', href: appRoutes.home() },
  { id: 'dashboard', label: 'Dashboard', href: appRoutes.dashboard() },
  { id: 'stations', label: 'Estaciones', href: appRoutes.seoPage('uso-bizi-por-estacion') },
  { id: 'reports', label: 'Informes', href: appRoutes.reports() },
  { id: 'api', label: 'API', href: appRoutes.developers() },
  { id: 'help', label: 'Metodologia', href: appRoutes.methodology() },
  { id: 'status', label: 'Estado', href: appRoutes.status() },
];

export function getExploreHubSections(options?: {
  latestMonth?: string | null;
}): ExploreHubSection[] {
  const latestMonthHref = options?.latestMonth
    ? appRoutes.reportMonth(options.latestMonth)
    : appRoutes.reports();

  return [
    {
      id: 'operations',
      title: 'Operacion y lectura rapida',
      description:
        'Herramientas para abrir el sistema en vivo, detectar friccion y moverse entre mapas y alertas sin perder contexto.',
      items: [
        {
          id: 'stations',
          title: 'Estaciones',
          eyebrow: 'Directorio vivo',
          description:
            'Busca estaciones, entra al detalle operativo y abre predicciones, mapas y comparativas.',
          href: appRoutes.dashboardStations(),
          destinationLabel: 'Dashboard > Operaciones',
        },
        {
          id: 'alerts',
          title: 'Alertas',
          eyebrow: 'Incidencias y friccion',
          description:
            'Consulta alertas activas, severidad y el historial operativo para priorizar intervenciones.',
          href: appRoutes.dashboardAlerts(),
          destinationLabel: 'Pagina dedicada',
        },
        {
          id: 'maps',
          title: 'Mapas',
          eyebrow: 'Vista cartografica',
          description:
            'Abre el mapa principal con filtros, geolocalizacion, densidad y contexto de disponibilidad.',
          href: appRoutes.dashboard(),
          destinationLabel: 'Dashboard > Resumen',
        },
        {
          id: 'system-kpis',
          title: 'KPIs sistema',
          eyebrow: 'Salud y cobertura',
          description:
            'Mide cobertura, lag, volumen y estado general del sistema desde una pagina publica.',
          href: appRoutes.status(),
          destinationLabel: 'Pagina publica',
        },
        {
          id: 'redistribucion',
          title: 'Redistribucion',
          eyebrow: 'Logistica y equilibrio',
          description:
            'Diagnostico de redistribucion con clasificacion de estaciones, predicciones y transferencias origen-destino sugeridas.',
          href: appRoutes.seoPage('redistribucion-bizi-zaragoza'),
          destinationLabel: 'Landing publica',
        },
      ],
    },
    {
      id: 'analysis',
      title: 'Analisis y descubrimiento',
      description:
        'Bloques para leer patrones temporales, comparar zonas y entender movilidad, demanda y comportamiento.',
      items: [
        {
          id: 'flow',
          title: 'Flujo',
          eyebrow: 'Corredores urbanos',
          description:
            'Analiza movilidad agregada, corredores y balance entre zonas con una vista completa.',
          href: appRoutes.dashboardFlow(),
          destinationLabel: 'Pagina dedicada',
        },
        {
          id: 'rankings',
          title: 'Rankings',
          eyebrow: 'Priorizacion',
          description:
            'Revisa estaciones con mayor uso, friccion o menor disponibilidad para decidir antes.',
          href: appRoutes.dashboardView('operations'),
          destinationLabel: 'Dashboard > Operaciones',
        },
        {
          id: 'heatmap',
          title: 'Heatmap',
          eyebrow: 'Lectura horaria',
          description:
            'Usa la capa de analisis para localizar horas punta, ocupacion y comportamiento por franja.',
          href: appRoutes.dashboardView('research'),
          destinationLabel: 'Dashboard > Analisis',
        },
        {
          id: 'compare',
          title: 'Comparador',
          eyebrow: 'Benchmarking',
          description:
            'Compara estaciones y contextos con estabilidad, uso relativo y señales recientes.',
          href: appRoutes.compare(),
          destinationLabel: 'Pagina publica',
        },
        {
          id: 'patterns',
          title: 'Patrones',
          eyebrow: 'Comportamiento intradia',
          description:
            'Explora tendencias horarias, volatilidad y regularidad para una estacion o el sistema.',
          href: appRoutes.dashboardView('research'),
          destinationLabel: 'Dashboard > Analisis',
        },
        {
          id: 'mobility',
          title: 'Movilidad',
          eyebrow: 'Origen y destino',
          description:
            'Sigue señales de salidas, llegadas y demanda agregada para lectura de movilidad urbana.',
          href: appRoutes.dashboardFlow(),
          destinationLabel: 'Pagina dedicada',
        },
        {
          id: 'districts',
          title: 'Barrios',
          eyebrow: 'Contexto territorial',
          description:
            'Abre comparativas territoriales y paginas publicas para lectura por barrio y distrito.',
          href: appRoutes.districtLanding(),
          destinationLabel: 'Landing publica',
        },
      ],
    },
    {
      id: 'archive',
      title: 'Historico y series',
      description:
        'Accesos para auditar cobertura, leer la evolucion temporal y enlazar informes mensuales persistentes.',
      items: [
        {
          id: 'history',
          title: 'Historico',
          eyebrow: 'Auditoria del dataset',
          description:
            'Consulta historico agregado, exportaciones y trazabilidad de los datos compartidos.',
          href: appRoutes.dashboardView('data'),
          destinationLabel: 'Dashboard > Datos',
        },
        {
          id: 'time-series',
          title: 'Series temporales',
          eyebrow: 'Archivo por periodos',
          description:
            'Entra al mes mas reciente o al archivo completo para seguir demanda, ocupacion y balance.',
          href: latestMonthHref,
          destinationLabel: options?.latestMonth ? `Informe ${options.latestMonth}` : 'Archivo mensual',
        },
      ],
    },
  ];
}
