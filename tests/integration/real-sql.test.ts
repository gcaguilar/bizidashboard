import { beforeAll, describe, expect, it } from 'vitest';

/**
 * SQL real contra Postgres. Los tests unitarios simulan Prisma y no detectan
 * errores que solo da la base (p. ej. 42803 al repetir un parametro en
 * GROUP BY). Opt-in: solo corre con `PG_INTEGRATION_URL`.
 *
 * ATENCION: vacia las tablas analiticas. Usa una base desechable con las
 * migraciones aplicadas en el schema de la ciudad, por ejemplo:
 *
 *   docker compose -f docker-compose.dev.yml up -d   # o PGlite con pglite-socket
 *   DATABASE_URL="$URL&schema=zaragoza" bunx prisma migrate deploy
 *   PG_INTEGRATION_URL="$URL&schema=zaragoza" bunx vitest run tests/integration
 */
const integrationUrl = process.env.PG_INTEGRATION_URL;
if (integrationUrl) {
  process.env.DATABASE_URL = integrationUrl;
  delete process.env.REDIS_URL;
}

const HOUR = 60 * 60 * 1000;
const STATIONS = ['A', 'B', 'C'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any;

function hourFloor(ms: number): Date {
  return new Date(Math.floor(ms / HOUR) * HOUR);
}

beforeAll(async () => {
  if (!integrationUrl) return;
  ({ prisma } = await import('@/lib/db'));
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Station", "StationStatus", "HourlyStationStat", "DailyStationStat", "StationPattern", "StationHeatmapCell", "StationAlert", "StationCriticalEpisode", "AnalyticsWatermark", "DailySystemStat", "CollectionRun", "SecurityEvent" CASCADE'
  );
  await prisma.station.createMany({
    data: STATIONS.map((id, index) => ({ id, name: `Station ${id}`, lat: 41.65 + index * 0.01, lon: -0.88, capacity: 20 })),
  });

  // 15 dias de rollup horario: bicis = (dia % 5) + estacion, para que la media
  // de la ventana difiera del ultimo dia escrito.
  const now = Date.now();
  const hourly = [];
  for (let h = 15 * 24; h >= 1; h -= 1) {
    const bucketStart = hourFloor(now - h * HOUR);
    const day = Math.floor(h / 24);
    for (const [index, stationId] of STATIONS.entries()) {
      const bikes = stationId === 'A' ? 1 : (day % 5) + index;
      hourly.push({
        stationId, bucketStart, bikesMin: bikes, bikesMax: bikes + 1, bikesAvg: bikes + 0.5,
        anchorsMin: 20 - bikes - 1, anchorsMax: 20 - bikes, anchorsAvg: 19.5 - bikes,
        occupancyAvg: (bikes + 0.5) / 20, sampleCount: 6 + (day % 3),
      });
    }
  }
  await prisma.hourlyStationStat.createMany({ data: hourly });
}, 60_000);

async function seedSnapshots(fromMs: number, toMs: number) {
  const rows = [];
  for (let t = fromMs; t < toMs; t += 10 * 60 * 1000) {
    const slot = Math.floor(t / (10 * 60 * 1000));
    rows.push(
      // A alterna rachas vacias de 3 muestras; B esta siempre vacia; C llena 2 de cada 7.
      { stationId: 'A', recordedAt: new Date(t), bikesAvailable: slot % 6 < 3 ? 0 : 5, anchorsFree: 10 },
      { stationId: 'B', recordedAt: new Date(t), bikesAvailable: 0, anchorsFree: 20 },
      { stationId: 'C', recordedAt: new Date(t), bikesAvailable: 7, anchorsFree: slot % 7 < 2 ? 0 : 3 },
    );
  }
  await prisma.stationStatus.createMany({ data: rows, skipDuplicates: true });
}

describe.skipIf(!integrationUrl)('real SQL against Postgres', () => {
  it('heatmap and pattern rollups store window averages and skip unchanged rows', async () => {
    const { runHeatmapRollup } = await import('@/analytics/queries/heatmap');
    const { runPatternRollup } = await import('@/analytics/queries/patterns');
    const cutoff = hourFloor(Date.now());

    const heat = await runHeatmapRollup(cutoff);
    const pattern = await runPatternRollup(cutoff);
    expect(heat.upsertedCount).toBe(3 * 7 * 24);
    expect(pattern.upsertedCount).toBe(3 * 2 * 24);

    // Media ponderada esperada de la estacion C a una hora local, calculada en SQL directo.
    const [expected] = await prisma.$queryRawUnsafe(`
      SELECT EXTRACT(DOW FROM (("bucketStart" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Madrid'))::int AS dow,
             EXTRACT(HOUR FROM (("bucketStart" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Madrid'))::int AS hour,
             SUM("bikesAvg" * "sampleCount") / SUM("sampleCount") AS avg
      FROM "HourlyStationStat"
      WHERE "stationId" = 'C' AND "bucketStart" > $1 AND "bucketStart" <= $2
      GROUP BY 1, 2 ORDER BY 1, 2 LIMIT 1`, new Date(cutoff.getTime() - 14 * 24 * HOUR), cutoff);
    const cell = await prisma.stationHeatmapCell.findUnique({
      where: { stationId_dayOfWeek_hour: { stationId: 'C', dayOfWeek: expected.dow, hour: expected.hour } },
    });
    expect(cell.bikesAvg).toBeCloseTo(Number(expected.avg), 9);

    // Re-run with the same data and a later cutoff: only cells whose hour left
    // the window change.
    const later = new Date(cutoff.getTime() + HOUR);
    const heat2 = await runHeatmapRollup(later);
    const pattern2 = await runPatternRollup(later);
    expect(heat2.upsertedCount).toBeLessThan(10);
    expect(pattern2.upsertedCount).toBeLessThan(10);
  });

  it('alert rollup leaves only the latest window active', async () => {
    const { runAlertRollup } = await import('@/analytics/queries/alerts');
    const { getActiveAlerts } = await import('@/analytics/queries/read');
    const first = hourFloor(Date.now() - 2 * HOUR);
    await runAlertRollup(first);
    await runAlertRollup(new Date(first.getTime() + HOUR));

    const active = await getActiveAlerts(50);
    const stations = active.map((alert) => `${alert.stationId}:${alert.alertType}`);
    expect(new Set(stations).size).toBe(stations.length);
    expect(active.every((alert) => alert.generatedAt === new Date(first.getTime() + HOUR).toISOString())).toBe(true);
  });

  it('incremental episode refresh matches a full recompute', async () => {
    const { refreshMonthlyCriticalEpisodes, getMonthlyEpisodeRows } = await import('@/analytics/queries/monthly-report');
    const now = Date.now();
    const monthKey = new Date(now).toISOString().slice(0, 7);
    await seedSnapshots(now - 3 * 24 * HOUR, now - 2 * HOUR);

    const full = await refreshMonthlyCriticalEpisodes(monthKey);
    expect(full.mode).toBe('full');
    // El refresco anterior ocurrio cuando terminaba la primera tanda de datos.
    const { setWatermark } = await import('@/analytics/watermarks');
    await setWatermark(`critical-episodes:${monthKey}`, new Date(now - 2 * HOUR));

    await seedSnapshots(now - 2 * HOUR, now);
    const incremental = await refreshMonthlyCriticalEpisodes(monthKey);
    expect(incremental.mode).toBe('incremental');

    const key = (row: { stationId: string; kind: string; startedAt: Date; endedAt: Date }) =>
      `${row.stationId}|${row.kind}|${new Date(row.startedAt).toISOString()}|${new Date(row.endedAt).toISOString()}`;
    const stored = (await prisma.stationCriticalEpisode.findMany({ where: { monthKey } })).map(key).sort();
    const recomputed = (await getMonthlyEpisodeRows(monthKey)).map(key).sort();
    expect(stored.length).toBeGreaterThan(10);
    expect(stored).toEqual(recomputed);
  });

  it('runs the local-hour, rebalancing, baseline and maintenance queries', async () => {
    const read = await import('@/analytics/queries/read');
    const rebalancing = await import('@/analytics/queries/rebalancing');
    const { fetchComparableNetworkBaseline } = await import('@/lib/network-briefing-baseline');
    const { syncDailySystemStats } = await import('@/analytics/queries/daily-system');
    const { getRecentSnapshotSummaries } = await import('@/services/data-storage');
    const { runRetentionCleanup } = await import('@/analytics/retention');

    expect((await read.getSystemHourlyProfile(14)).length).toBe(24);
    expect((await read.getStationHourlyProfiles(30)).length).toBeGreaterThan(0);
    expect((await read.getHourlyMobilitySignals(14)).length).toBeGreaterThan(0);
    expect(Object.keys(await rebalancing.getStationTimeBandMetrics(15))).toHaveLength(3);
    expect(Object.keys(await rebalancing.getStationGlobalMetrics(15))).toHaveLength(3);

    const persisted = await rebalancing.getCriticalEpisodes(15);
    expect(persisted.B?.episodeCount).toBeGreaterThan(0);

    expect(await read.getAvailableDataMonths()).toContain(new Date().toISOString().slice(0, 7));
    expect((await getRecentSnapshotSummaries({ limit: 2, minStationCount: 3 })).length).toBe(2);

    const baseline = await fetchComparableNetworkBaseline(new Date(), 3);
    expect(baseline).toMatchObject({ criticalStationsCount: 0, label: 'la misma franja de la semana anterior' });

    await expect(syncDailySystemStats(new Date())).resolves.toMatchObject({ seeded: true });
    await expect(runRetentionCleanup()).resolves.toMatchObject({ collectionRunsDeleted: 0, securityEventsDeleted: 0 });
  });

  it('builds the higher-level payloads end to end', async () => {
    const { getDailyMobilityConclusions } = await import('@/lib/mobility-conclusions');
    const { getMobilityData } = await import('@/lib/mobility-read-model');
    const { buildRebalancingReport } = await import('@/lib/rebalancing-report');
    const { getCoverageSummary } = await import('@/services/shared-data');

    const conclusions = await getDailyMobilityConclusions();
    expect(conclusions.payload).toBeDefined();
    const mobility = await getMobilityData({ mobilityDays: 14, demandDays: 30 });
    expect(mobility.hourlySignals.length).toBeGreaterThan(0);
    expect(mobility.systemHourlyProfile.length).toBe(24);
    const report = await buildRebalancingReport({ days: 15 });
    expect(report.diagnostics).toHaveLength(3);
    const coverage = await getCoverageSummary();
    expect(coverage.totalStations).toBe(3);
  }, 60_000);
});
