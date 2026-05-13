import { createServerFn } from '@tanstack/react-start';
import { isValidMonthKey } from '@/lib/months';
import { buildSystemCapabilities, buildSystemIncidents } from '@/lib/system-status';

export const getSystemStatusPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const [api, fallbacks] = await Promise.all([
    import('@/lib/api'),
    import('@/lib/shared-data-fallbacks'),
  ]);
  const nowIso = new Date().toISOString();
  const [status, stations, dataset, availableMonths] = await Promise.all([
    api.fetchStatus().catch(() => fallbacks.buildFallbackStatus(nowIso)),
    api.fetchStations().catch(() => fallbacks.buildFallbackStations(nowIso)),
    api.fetchSharedDatasetSnapshot().catch(() => fallbacks.buildFallbackDatasetSnapshot(nowIso)),
    api.fetchAvailableDataMonths().catch(() => fallbacks.buildFallbackAvailableMonths(nowIso)),
  ]);
  const months = availableMonths.months.filter(isValidMonthKey);
  const latestMonth = months[0] ?? null;
  const incidents = buildSystemIncidents(status, dataset);
  const capabilities = buildSystemCapabilities(status, dataset, stations);
  const activeIncidentCount = incidents.filter((incident) => incident.severity !== 'healthy').length;
  const activeStationsCount = Math.max(
    stations.stations.length,
    status.quality.volume.recentStationCount
  );

  return {
    status,
    stations,
    dataset,
    availableMonths,
    months,
    latestMonth,
    incidents,
    capabilities,
    activeIncidentCount,
    activeStationsCount,
  };
});
