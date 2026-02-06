import {
  fetchAlerts,
  fetchHeatmap,
  fetchPatterns,
  fetchRankings,
  fetchStations,
  fetchStatus,
} from '@/lib/api';
import { DashboardClient, type DashboardInitialData } from './_components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stationsPromise = fetchStations();
  const statusPromise = fetchStatus();
  const alertsPromise = fetchAlerts(20);
  const turnoverPromise = fetchRankings('turnover', 10);
  const availabilityPromise = fetchRankings('availability', 10);

  const [stations, status, alerts, turnover, availability] = await Promise.all([
    stationsPromise,
    statusPromise,
    alertsPromise,
    turnoverPromise,
    availabilityPromise,
  ]);

  const defaultStationId = stations.stations[0]?.id ?? '';
  const [patterns, heatmap] = defaultStationId
    ? await Promise.all([
        fetchPatterns(defaultStationId),
        fetchHeatmap(defaultStationId),
      ])
    : [[], []];

  const initialData: DashboardInitialData = {
    stations,
    status,
    alerts,
    rankings: {
      turnover,
      availability,
    },
    patterns,
    heatmap,
  };

  return (
    <main className="min-h-screen px-6 py-8">
      <DashboardClient initialData={initialData} />
    </main>
  );
}
