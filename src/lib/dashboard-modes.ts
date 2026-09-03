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
    description: 'Estado general y avisos importantes',
    introEyebrow: 'Estado de la red',
    introTitle: 'Lo importante de un vistazo',
    introDescription:
      'Para entender rápidamente cómo está la red, si hay bicis y huecos disponibles y qué estaciones conviene revisar hoy.',
    introTone: 'from-[var(--danger)]/12 via-transparent to-transparent border-[var(--danger)]/25',
  },
  operations: {
    label: 'Operaciones',
    shortLabel: 'Operaciones',
    description: 'Alertas, problemas de disponibilidad y prioridades',
    introEyebrow: 'Modo operaciones',
    introTitle: 'Priorizar antes de que el problema crezca',
    introDescription:
      'Para detectar estaciones con problemas, revisar alertas y decidir dónde conviene actuar primero.',
    introTone: 'from-[var(--warning)]/14 via-transparent to-transparent border-[var(--warning)]/25',
  },
  research: {
    label: 'Análisis',
    shortLabel: 'Análisis',
    description: 'Patrones y movimiento estimado',
    introEyebrow: 'Modo análisis',
    introTitle: 'Entender patrones y comportamiento',
    introDescription:
      'Para descubrir tendencias, estabilidad y movimiento estimado entre zonas con el contexto necesario.',
    introTone: 'from-[var(--primary)]/14 via-transparent to-transparent border-[var(--primary)]/25',
  },
  data: {
    label: 'Datos',
    shortLabel: 'Datos',
    description: 'Metodología, histórico y descargas',
    introEyebrow: 'Modo datos',
    introTitle: 'Datos claros para auditar y reutilizar',
    introDescription:
      'Reúne metodología, histórico y descargas para comprobar, citar o reutilizar la información.',
    introTone: 'from-[var(--success)]/14 via-transparent to-transparent border-[var(--success)]/25',
  },
};

export function resolveDashboardViewMode(value: string | null | undefined): DashboardViewMode {
  if (value && DASHBOARD_VIEW_MODES.includes(value as DashboardViewMode)) {
    return value as DashboardViewMode;
  }

  return 'overview';
}
