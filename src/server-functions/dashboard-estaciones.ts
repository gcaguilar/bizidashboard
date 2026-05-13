import { createServerFn } from '@tanstack/react-start';

export const getStationsDirectoryPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const [{ fetchStations }, { buildFallbackStations }] = await Promise.all([
    import('@/lib/api'),
    import('@/lib/shared-data-fallbacks'),
  ]);
  const stations = await fetchStations().catch(() =>
    buildFallbackStations(new Date().toISOString())
  );

  return { stations };
});

export const getStationDetailPageData = createServerFn({ method: 'GET' })
  .inputValidator((stationId: string) => stationId)
  .handler(async ({ data: stationId }) => {
    const [{ fetchAlerts, fetchHeatmap, fetchPatterns, fetchRankings, fetchStations }, { buildFallbackStations }] = await Promise.all([
      import('@/lib/api'),
      import('@/lib/shared-data-fallbacks'),
    ]);
    const nowIso = new Date().toISOString();
    const stations = await fetchStations().catch(() => buildFallbackStations(nowIso));
    const station = stations.stations.find((row) => row.id === stationId) ?? null;
    const [turnover, availability, alerts, patterns, heatmap] = await Promise.all([
      fetchRankings('turnover', 20),
      fetchRankings('availability', 20),
      fetchAlerts(50),
      fetchPatterns(stationId).catch(() => []),
      fetchHeatmap(stationId).catch(() => []),
    ]);

    return {
      station,
      stations: stations.stations,
      rankings: { turnover, availability },
      alerts,
      patterns,
      heatmap,
    };
  });
