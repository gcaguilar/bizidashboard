export const DASHBOARD_VIEW_MODES = ['overview', 'operations', 'research', 'data'] as const;

export type DashboardViewMode = (typeof DASHBOARD_VIEW_MODES)[number];

export function resolveDashboardViewMode(value: string | null | undefined): DashboardViewMode {
  if (value && DASHBOARD_VIEW_MODES.includes(value as DashboardViewMode)) {
    return value as DashboardViewMode;
  }

  return 'overview';
}
