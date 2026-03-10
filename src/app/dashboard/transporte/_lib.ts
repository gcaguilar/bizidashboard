import type { TransitMode } from '@/analytics/queries/transit-read';
import {
  fetchTransitAlerts,
  fetchTransitRankings,
  fetchTransitStatus,
  fetchTransitStops,
} from '@/lib/transit-api';

export async function getTransitDashboardData(mode: TransitMode) {
  const [initialStops, initialAlerts, initialRankings, initialStatus] = await Promise.all([
    fetchTransitStops(mode),
    fetchTransitAlerts(mode, 20),
    fetchTransitRankings(mode, 50),
    fetchTransitStatus(mode),
  ]);

  return {
    initialStops,
    initialAlerts,
    initialRankings,
    initialStatus,
  };
}
