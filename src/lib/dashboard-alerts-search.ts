import { z } from 'zod';

export const dashboardAlertsSearchSchema = z.object({
  stationId: z.string().trim().min(1).optional(),
  alertType: z.enum(['all', 'LOW_BIKES', 'LOW_ANCHORS']).optional(),
  state: z.enum(['all', 'active', 'resolved']).optional(),
  severity: z.enum(['all', '1', '2']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type DashboardAlertsSearch = z.infer<typeof dashboardAlertsSearchSchema>;

export type DashboardAlertsViewState = {
  stationId: string;
  alertType: 'all' | 'LOW_BIKES' | 'LOW_ANCHORS';
  stateFilter: 'all' | 'active' | 'resolved';
  severityFilter: 'all' | '1' | '2';
  fromDate: string;
  toDate: string;
  page: number;
};

export function parseDashboardAlertsSearch(
  params: URLSearchParams | { get: (name: string) => string | null }
): DashboardAlertsViewState {
  const parsed = dashboardAlertsSearchSchema.safeParse({
    stationId: params.get('stationId') ?? undefined,
    alertType: params.get('alertType') ?? undefined,
    state: params.get('state') ?? undefined,
    severity: params.get('severity') ?? undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    page: params.get('page') ?? undefined,
  });

  if (!parsed.success) {
    return {
      stationId: '',
      alertType: 'all',
      stateFilter: 'all',
      severityFilter: 'all',
      fromDate: '',
      toDate: '',
      page: 0,
    };
  }

  return {
    stationId: parsed.data.stationId ?? '',
    alertType: parsed.data.alertType ?? 'all',
    stateFilter: parsed.data.state ?? 'all',
    severityFilter: parsed.data.severity ?? 'all',
    fromDate: parsed.data.from ?? '',
    toDate: parsed.data.to ?? '',
    page: parsed.data.page ? parsed.data.page - 1 : 0,
  };
}

export function buildDashboardAlertsViewQuery(state: DashboardAlertsViewState): string {
  const params = new URLSearchParams();

  if (state.stationId) {
    params.set('stationId', state.stationId);
  }
  if (state.alertType !== 'all') {
    params.set('alertType', state.alertType);
  }
  if (state.stateFilter !== 'all') {
    params.set('state', state.stateFilter);
  }
  if (state.severityFilter !== 'all') {
    params.set('severity', state.severityFilter);
  }
  if (state.fromDate) {
    params.set('from', state.fromDate);
  }
  if (state.toDate) {
    params.set('to', state.toDate);
  }
  if (state.page > 0) {
    params.set('page', String(state.page + 1));
  }

  return params.toString();
}
