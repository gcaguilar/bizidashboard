import { z } from 'zod';
import { DASHBOARD_VIEW_MODES } from '@/lib/dashboard-modes';
import { PERIODS } from '@/app/dashboard/_components/mobility-insights-model';

export const DASHBOARD_TIME_WINDOWS = ['24h', '7d', '30d', '365d'] as const;
export const DASHBOARD_RANKING_TABS = ['turnover', 'availability'] as const;
export const DASHBOARD_BOOLEAN_FILTER_VALUES = ['1', 'true'] as const;

export const dashboardSearchSchema = z.object({
  mode: z.enum(DASHBOARD_VIEW_MODES).optional(),
  stationId: z.string().trim().min(1).optional(),
  q: z.string().trim().max(120).optional(),
  timeWindow: z.enum(DASHBOARD_TIME_WINDOWS).optional(),
  onlyWithBikes: z.enum(DASHBOARD_BOOLEAN_FILTER_VALUES).optional(),
  onlyWithAnchors: z.enum(DASHBOARD_BOOLEAN_FILTER_VALUES).optional(),
  mapLat: z.coerce.number().min(-90).max(90).optional(),
  mapLng: z.coerce.number().min(-180).max(180).optional(),
  mapZoom: z.coerce.number().min(3).max(19).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  period: z.enum(PERIODS.map((period) => period.key) as [string, ...string[]]).optional(),
  rankingTab: z.enum(DASHBOARD_RANKING_TABS).optional(),
  rankingSearch: z.string().trim().max(120).optional(),
  rankingShowAll: z.enum(['1']).optional(),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;
