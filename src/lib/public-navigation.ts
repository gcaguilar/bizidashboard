import { appRoutes } from '@/lib/routes';

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

export type PublicNavItem = {
  id: string;
  label: string;
  href: string;
  ctaId: string;
};

export const PUBLIC_MAIN_NAV_ITEMS: PublicNavItem[] = [
  { id: 'home', label: 'Inicio', href: appRoutes.home(), ctaId: 'home' },
  { id: 'map', label: 'Explora ahora', href: appRoutes.dashboard(), ctaId: 'map' },
  { id: 'stations', label: 'Estaciones', href: appRoutes.statsEstaciones(), ctaId: 'stations' },
  { id: 'reports', label: 'Informes', href: appRoutes.reports(), ctaId: 'reports' },
  { id: 'explore', label: 'Explorar', href: appRoutes.exploreHub(), ctaId: 'explore' },
  { id: 'status', label: 'Estado', href: appRoutes.status(), ctaId: 'status' },
];

export const PUBLIC_MORE_NAV_ITEMS: PublicNavItem[] = [
  { id: 'stats', label: 'Estadísticas', href: appRoutes.statsHub(), ctaId: 'stats' },
  { id: 'redistribucion', label: 'Redistribución', href: appRoutes.statsRedistribucion(), ctaId: 'redistribucion' },
  { id: 'compare', label: 'Comparar', href: appRoutes.compare(), ctaId: 'compare' },
  { id: 'biciradar', label: 'Bici Radar', href: appRoutes.biciradar(), ctaId: 'biciradar' },
  { id: 'barrios', label: 'Barrios', href: appRoutes.statsBarrios(), ctaId: 'barrios' },
  { id: 'horarios', label: 'Horarios', href: appRoutes.statsHorarios(), ctaId: 'horarios' },
  { id: 'viajes', label: 'Viajes', href: appRoutes.statsViajes(), ctaId: 'viajes' },
  { id: 'api', label: 'API', href: appRoutes.developers(), ctaId: 'api' },
  { id: 'methodology', label: 'Metodología', href: appRoutes.methodology(), ctaId: 'methodology' },
  { id: 'about', label: 'Sobre', href: appRoutes.about(), ctaId: 'about' },
];

export const FOOTER_NAV_GROUPS: PublicNavItem[][] = [
  [PUBLIC_MAIN_NAV_ITEMS[1], PUBLIC_MAIN_NAV_ITEMS[2], PUBLIC_MAIN_NAV_ITEMS[3], PUBLIC_MAIN_NAV_ITEMS[4]],
  [PUBLIC_MORE_NAV_ITEMS[1], PUBLIC_MORE_NAV_ITEMS[2], PUBLIC_MAIN_NAV_ITEMS[5], PUBLIC_MORE_NAV_ITEMS[3]],
  [PUBLIC_MORE_NAV_ITEMS[7], PUBLIC_MORE_NAV_ITEMS[8], PUBLIC_MORE_NAV_ITEMS[9]],
];

export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  ...PUBLIC_MAIN_NAV_ITEMS,
  ...PUBLIC_MORE_NAV_ITEMS,
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
      title: 'Operación y lectura rápida',
      description:
        'Herramientas para abrir el sistema en vivo, detectar fricción y moverse entre mapas y alertas sin perder contexto.',
      items: [
        {
          id: 'stations',
          title: 'Estaciones',
          eyebrow: 'Directorio vivo',
          description:
            'Busca estaciones, entra al detalle operativo y abre predicciones, mapas y comparativas.',
          href: appRoutes.dashboardStations(),
          destinationLabel: 'Mapa avanzado > Operaciones',
        },
        {
          id: 'alerts',
          title: 'Alertas',
          eyebrow: 'Incidencias y fricción',
          description:
            'Consulta alertas activas, severidad y el historial operativo para priorizar intervenciones.',
          href: appRoutes.dashboardAlerts(),
          destinationLabel: 'Mapa avanzado > Alertas',
        },
        {
          id: 'maps',
          title: 'Mapas',
          eyebrow: 'Vista cartográfica',
          description:
            'Abre el mapa principal con filtros, geolocalización, densidad y contexto de disponibilidad.',
          href: appRoutes.dashboard(),
          destinationLabel: 'Mapa avanzado',
        },
        {
          id: 'system-kpis',
          title: 'KPIs sistema',
          eyebrow: 'Salud y cobertura',
          description:
            'Mide cobertura, lag, volumen y estado general del sistema desde una página pública.',
          href: appRoutes.status(),
          destinationLabel: 'Página pública',
        },
        {
          id: 'redistribucion',
          title: 'Redistribución',
          eyebrow: 'Logística y equilibrio',
          description:
            'Diagnóstico de redistribución con clasificación de estaciones, predicciones y transferencias origen-destino sugeridas.',
          href: appRoutes.statsRedistribucion(),
          destinationLabel: 'Página pública',
        },
      ],
    },
    {
      id: 'analysis',
      title: 'Análisis y descubrimiento',
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
          destinationLabel: 'Mapa avanzado > Flujo',
        },
        {
          id: 'rankings',
          title: 'Rankings',
          eyebrow: 'Priorización',
          description:
            'Revisa estaciones con mayor uso, fricción o menor disponibilidad para decidir antes.',
          href: appRoutes.dashboardView('operations'),
          destinationLabel: 'Mapa avanzado > Operaciones',
        },
        {
          id: 'heatmap',
          title: 'Heatmap',
          eyebrow: 'Lectura horaria',
          description:
            'Usa la capa de análisis para localizar horas punta, ocupación y comportamiento por franja.',
          href: appRoutes.dashboardView('research'),
          destinationLabel: 'Mapa avanzado > Análisis',
        },
        {
          id: 'compare',
          title: 'Comparador',
          eyebrow: 'Benchmarking',
          description:
            'Compara estaciones y contextos con estabilidad, uso relativo y señales recientes.',
          href: appRoutes.compare(),
          destinationLabel: 'Página pública',
        },
        {
          id: 'patterns',
          title: 'Patrones',
          eyebrow: 'Comportamiento intradía',
          description:
            'Explora tendencias horarias, volatilidad y regularidad para una estación o el sistema.',
          href: appRoutes.dashboardView('research'),
          destinationLabel: 'Mapa avanzado > Análisis',
        },
        {
          id: 'mobility',
          title: 'Movilidad',
          eyebrow: 'Origen y destino',
          description:
            'Sigue señales de salidas, llegadas y demanda agregada para lectura de movilidad urbana.',
          href: appRoutes.dashboardFlow(),
          destinationLabel: 'Página dedicada',
        },
        {
          id: 'districts',
          title: 'Barrios',
          eyebrow: 'Contexto territorial',
          description:
            'Abre comparativas territoriales y páginas públicas para lectura por barrio y distrito.',
          href: appRoutes.districtLanding(),
          destinationLabel: 'Página pública',
        },
      ],
    },
    {
      id: 'archive',
      title: 'Histórico y series',
      description:
        'Accesos para auditar cobertura, leer la evolución temporal y enlazar informes mensuales persistentes.',
      items: [
        {
          id: 'history',
          title: 'Histórico',
          eyebrow: 'Auditoría del dataset',
          description:
            'Consulta histórico agregado, exportaciones y trazabilidad de los datos compartidos.',
          href: appRoutes.dashboardView('data'),
          destinationLabel: 'Mapa avanzado > Datos',
        },
        {
          id: 'time-series',
          title: 'Series temporales',
          eyebrow: 'Archivo por períodos',
          description:
            'Entra al mes más reciente o al archivo completo para seguir demanda, ocupación y balance.',
          href: latestMonthHref,
          destinationLabel: options?.latestMonth ? `Informe ${options.latestMonth}` : 'Archivo mensual',
        },
      ],
    },
  ];
}
