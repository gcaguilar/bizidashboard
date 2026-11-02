import { notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { inputValidator } from '@/server-functions/input-validator';

// Missing ids reach the handler so the page-data endpoint answers 404 (not a
// 500) when a client calls it without the required parameter.
const StationIdSchema = z.string().trim().max(64).optional();

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
  .validator(inputValidator(StationIdSchema))
  .handler(async ({ data: stationId }) => {
    if (!stationId) {
      throw notFound();
    }
    const [{ fetchAlerts, fetchHeatmap, fetchPatterns, fetchRankings, fetchStations }, { buildFallbackStations }] = await Promise.all([
      import('@/lib/api'),
      import('@/lib/shared-data-fallbacks'),
    ]);
    const nowIso = new Date().toISOString();
    const stations = await fetchStations().catch(() => buildFallbackStations(nowIso));
    const station = stations.stations.find((row) => row.id === stationId) ?? null;

    if (!station) {
      return {
        station: null,
        stations: stations.stations,
        rankings: { turnover: [], availability: [] },
        alerts: [],
        patterns: [],
        heatmap: [],
      };
    }

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
