export const DASHBOARD_VIEW_MODES = ['overview', 'operations', 'research', 'data'] as const;

export type DashboardViewMode = (typeof DASHBOARD_VIEW_MODES)[number];

export const DASHBOARD_MODE_META: Record<
  DashboardViewMode,
  {
    label: string;
    shortLabel: string;
    description: string;
    introEyebrow: string;
    introTitle: string;
    introDescription: string;
    introTone: string;
  }
> = {
  overview: {
    label: 'Resumen',
    shortLabel: 'Resumen',
    description: 'Vision ejecutiva y estado global',
    introEyebrow: 'Resumen ejecutivo',
    introTitle: 'Lo importante de un vistazo',
    introDescription:
      'Pensado para entender rapido el estado general del sistema, su equilibrio y las señales clave del dia.',
    introTone: 'from-rose-500/12 via-transparent to-transparent border-rose-500/25',
  },
  operations: {
    label: 'Operaciones',
    shortLabel: 'Operaciones',
    description: 'Friccion, alertas y accion operativa',
    introEyebrow: 'Modo operaciones',
    introTitle: 'Priorizar y actuar antes',
    introDescription:
      'Enfocado en estaciones criticas, alertas, friccion y decisiones operativas inmediatas.',
    introTone: 'from-amber-500/14 via-transparent to-transparent border-amber-500/25',
  },
  research: {
    label: 'Analisis',
    shortLabel: 'Analisis',
    description: 'Patrones, demanda y flujo urbano',
    introEyebrow: 'Modo analisis',
    introTitle: 'Entender patrones y comportamiento',
    introDescription:
      'Pensado para leer tendencias temporales, estabilidad y flujo entre zonas sin perder contexto.',
    introTone: 'from-sky-500/14 via-transparent to-transparent border-sky-500/25',
  },
  data: {
    label: 'Datos',
    shortLabel: 'Datos',
    description: 'Metodologia, trazabilidad y acceso',
    introEyebrow: 'Modo datos',
    introTitle: 'Transparencia, trazabilidad y exportacion',
    introDescription:
      'Reune metodologia, historicos y salidas de datos para auditar o reutilizar la informacion.',
    introTone: 'from-emerald-500/14 via-transparent to-transparent border-emerald-500/25',
  },
};

export function resolveDashboardViewMode(value: string | null | undefined): DashboardViewMode {
  if (value && DASHBOARD_VIEW_MODES.includes(value as DashboardViewMode)) {
    return value as DashboardViewMode;
  }

  return 'overview';
}
