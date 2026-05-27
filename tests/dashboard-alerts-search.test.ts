import { describe, expect, it } from 'vitest';
import {
  buildDashboardAlertsViewQuery,
  parseDashboardAlertsSearch,
} from '@/lib/dashboard-alerts-search';

describe('dashboard alerts search helpers', () => {
  it('parses valid params into normalized view state', () => {
    const parsed = parseDashboardAlertsSearch(
      new URLSearchParams('stationId=101&alertType=LOW_BIKES&state=active&severity=2&from=2026-05-01&to=2026-05-07&page=2')
    );

    expect(parsed).toEqual({
      stationId: '101',
      alertType: 'LOW_BIKES',
      stateFilter: 'active',
      severityFilter: '2',
      fromDate: '2026-05-01',
      toDate: '2026-05-07',
      page: 1,
    });
  });

  it('falls back to safe defaults for invalid params', () => {
    const parsed = parseDashboardAlertsSearch(
      new URLSearchParams('alertType=INVALID&state=nope&severity=9&from=2026-13-40&page=-1')
    );

    expect(parsed).toEqual({
      stationId: '',
      alertType: 'all',
      stateFilter: 'all',
      severityFilter: 'all',
      fromDate: '',
      toDate: '',
      page: 0,
    });
  });

  it('builds compact shareable query from view state', () => {
    const query = buildDashboardAlertsViewQuery({
      stationId: '101',
      alertType: 'LOW_BIKES',
      stateFilter: 'active',
      severityFilter: '2',
      fromDate: '2026-05-01',
      toDate: '2026-05-07',
      page: 1,
    });

    expect(query).toBe('stationId=101&alertType=LOW_BIKES&state=active&severity=2&from=2026-05-01&to=2026-05-07&page=2');
  });
});
