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

export const PUBLIC_NAV_ITEMS = [
  { id: 'home', label: 'Inicio', href: appRoutes.home() },
  { id: 'estadisticas', label: 'Estadísticas', href: appRoutes.statsHub() },
  { id: 'reports', label: 'Informes', href: appRoutes.reports() },
  { id: 'dashboard', label: 'Mapa avanzado', href: appRoutes.dashboard() },
  { id: 'explore', label: 'Explorar', href: appRoutes.exploreHub() },
  { id: 'status', label: 'Estado', href: appRoutes.status() },
  { id: 'api', label: 'API', href: appRoutes.developers() },
  { id: 'help', label: 'Metodología', href: appRoutes.methodology() },
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
          href: appRoutes.seoPage('redistribucion'),
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
          destinationLabel: 'Pagina dedicada',
        },
        {
          id: 'rankings',
          title: 'Rankings',
          eyebrow: 'Priorizacion',
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
          eyebrow: 'Comportamiento intradia',
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
          eyebrow: 'Archivo por periodos',
          description:
            'Entra al mes más reciente o al archivo completo para seguir demanda, ocupación y balance.',
          href: latestMonthHref,
          destinationLabel: options?.latestMonth ? `Informe ${options.latestMonth}` : 'Archivo mensual',
        },
      ],
    },
  ];
}
