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
    description: 'Estado general y senales clave',
    introEyebrow: 'Resumen ejecutivo',
    introTitle: 'Lo importante de un vistazo',
    introDescription:
      'Para entender rapidamente como esta el sistema, si hay equilibrio y que senales merecen atencion hoy.',
    introTone: 'from-rose-500/12 via-transparent to-transparent border-rose-500/25',
  },
  operations: {
    label: 'Operaciones',
    shortLabel: 'Operaciones',
    description: 'Alertas, friccion y prioridades',
    introEyebrow: 'Modo operaciones',
    introTitle: 'Priorizar antes de que el problema crezca',
    introDescription:
      'Pensado para detectar estaciones criticas, revisar alertas y decidir donde actuar primero.',
    introTone: 'from-amber-500/14 via-transparent to-transparent border-amber-500/25',
  },
  research: {
    label: 'Analisis',
    shortLabel: 'Analisis',
    description: 'Patrones, demanda y movimiento',
    introEyebrow: 'Modo analisis',
    introTitle: 'Entender patrones y comportamiento',
    introDescription:
      'Para leer tendencias, estabilidad y movimiento entre zonas con el contexto necesario.',
    introTone: 'from-sky-500/14 via-transparent to-transparent border-sky-500/25',
  },
  data: {
    label: 'Datos',
    shortLabel: 'Datos',
    description: 'Metodologia, historico y descargas',
    introEyebrow: 'Modo datos',
    introTitle: 'Datos claros para auditar y reutilizar',
    introDescription:
      'Reune metodologia, historicos y salidas de datos para comprobar, citar o reutilizar la informacion.',
    introTone: 'from-emerald-500/14 via-transparent to-transparent border-emerald-500/25',
  },
};

export function resolveDashboardViewMode(value: string | null | undefined): DashboardViewMode {
  if (value && DASHBOARD_VIEW_MODES.includes(value as DashboardViewMode)) {
    return value as DashboardViewMode;
  }

  return 'overview';
}
