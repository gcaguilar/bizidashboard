import { AlertType, DayType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const POLL_INTERVAL_MINUTES = 5;
const POLLS_LAST_24_HOURS = (24 * 60) / POLL_INTERVAL_MINUTES;
const HISTORY_DAYS = 45;
const CREATE_BATCH_SIZE = 1000;

const STATIONS = [
  {
    id: '101',
    name: 'Plaza de Espana',
    lat: 41.6488,
    lon: -0.8891,
    capacity: 24,
    usageBias: 0.62,
  },
  {
    id: '102',
    name: 'Paraninfo',
    lat: 41.6464,
    lon: -0.8872,
    capacity: 20,
    usageBias: 0.48,
  },
  {
    id: '103',
    name: 'Plaza San Francisco',
    lat: 41.6394,
    lon: -0.9003,
    capacity: 18,
    usageBias: 0.56,
  },
] as const;

function assertDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL es obligatorio para seed-qa-db.');
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundToFiveMinutes(date: Date): Date {
  const rounded = new Date(date);
  rounded.setUTCSeconds(0, 0);
  rounded.setUTCMinutes(
    Math.floor(rounded.getUTCMinutes() / POLL_INTERVAL_MINUTES) * POLL_INTERVAL_MINUTES
  );
  return rounded;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60_000);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function buildStatusRows(latestPollAt: Date) {
  const rows: Array<{
    stationId: string;
    bikesAvailable: number;
    anchorsFree: number;
    recordedAt: Date;
  }> = [];

  for (let pollIndex = POLLS_LAST_24_HOURS - 1; pollIndex >= 0; pollIndex -= 1) {
    const recordedAt = addMinutes(
      latestPollAt,
      -(pollIndex * POLL_INTERVAL_MINUTES)
    );

    STATIONS.forEach((station, stationIndex) => {
      const phase = pollIndex + stationIndex * 9;
      const bikesAvailable = clamp(
        Math.round(
          station.capacity * (station.usageBias + Math.sin(phase / 7) * 0.14 + Math.cos(phase / 19) * 0.06)
        ),
        1,
        station.capacity - 1
      );

      rows.push({
        stationId: station.id,
        bikesAvailable,
        anchorsFree: station.capacity - bikesAvailable,
        recordedAt,
      });
    });
  }

  return rows;
}

function buildHourlyRows(latestPollAt: Date) {
  const rows: Array<{
    stationId: string;
    bucketStart: Date;
    bikesMin: number;
    bikesMax: number;
    bikesAvg: number;
    anchorsMin: number;
    anchorsMax: number;
    anchorsAvg: number;
    occupancyAvg: number;
    sampleCount: number;
  }> = [];

  const startDay = startOfUtcDay(addDays(latestPollAt, -(HISTORY_DAYS - 1)));

  for (let dayOffset = 0; dayOffset < HISTORY_DAYS; dayOffset += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      const bucketStart = addMinutes(addDays(startDay, dayOffset), hour * 60);

      STATIONS.forEach((station, stationIndex) => {
        const hourWave = Math.sin((hour / 24) * Math.PI * 2);
        const commuteWave = Math.cos(((hour + 3) / 24) * Math.PI * 2) * 0.08;
        const trend = Math.cos((dayOffset + stationIndex) / 6) * 0.04;
        const occupancyAvg = clamp(
          station.usageBias + hourWave * 0.16 + commuteWave + trend,
          0.16,
          0.88
        );
        const bikesAvg = Number((station.capacity * occupancyAvg).toFixed(2));
        const bikesMin = clamp(Math.floor(bikesAvg - 2), 0, station.capacity);
        const bikesMax = clamp(Math.ceil(bikesAvg + 2), bikesMin, station.capacity);
        const anchorsAvg = Number((station.capacity - bikesAvg).toFixed(2));
        const anchorsMin = clamp(
          Math.floor(station.capacity - bikesMax),
          0,
          station.capacity
        );
        const anchorsMax = clamp(
          Math.ceil(station.capacity - bikesMin),
          anchorsMin,
          station.capacity
        );

        rows.push({
          stationId: station.id,
          bucketStart,
          bikesMin,
          bikesMax,
          bikesAvg,
          anchorsMin,
          anchorsMax,
          anchorsAvg,
          occupancyAvg: Number(occupancyAvg.toFixed(4)),
          sampleCount: 12,
        });
      });
    }
  }

  return rows;
}

function buildDailyRows(latestPollAt: Date) {
  const rows: Array<{
    stationId: string;
    bucketDate: Date;
    bikesMin: number;
    bikesMax: number;
    bikesAvg: number;
    anchorsMin: number;
    anchorsMax: number;
    anchorsAvg: number;
    occupancyAvg: number;
    sampleCount: number;
  }> = [];

  const startDay = startOfUtcDay(addDays(latestPollAt, -(HISTORY_DAYS - 1)));

  for (let dayOffset = 0; dayOffset < HISTORY_DAYS; dayOffset += 1) {
    const bucketDate = addDays(startDay, dayOffset);

    STATIONS.forEach((station, stationIndex) => {
      const trend = Math.cos((dayOffset + stationIndex) / 5) * 0.05;
      const occupancyAvg = clamp(station.usageBias + trend, 0.18, 0.84);
      const bikesAvg = Number((station.capacity * occupancyAvg).toFixed(2));
      const bikesMin = clamp(Math.floor(bikesAvg - 4), 0, station.capacity);
      const bikesMax = clamp(Math.ceil(bikesAvg + 4), bikesMin, station.capacity);
      const anchorsAvg = Number((station.capacity - bikesAvg).toFixed(2));
      const anchorsMin = clamp(
        Math.floor(station.capacity - bikesMax),
        0,
        station.capacity
      );
      const anchorsMax = clamp(
        Math.ceil(station.capacity - bikesMin),
        anchorsMin,
        station.capacity
      );

      rows.push({
        stationId: station.id,
        bucketDate,
        bikesMin,
        bikesMax,
        bikesAvg,
        anchorsMin,
        anchorsMax,
        anchorsAvg,
        occupancyAvg: Number(occupancyAvg.toFixed(4)),
        sampleCount: 24 * 12,
      });
    });
  }

  return rows;
}

function buildRankingRows(latestPollAt: Date) {
  const windowStart = addDays(latestPollAt, -7);
  const windowEnd = latestPollAt;

  return STATIONS.map((station, stationIndex) => ({
    stationId: station.id,
    turnoverScore: Number((12 + stationIndex * 1.7 + station.usageBias * 10).toFixed(2)),
    emptyHours: stationIndex,
    fullHours: stationIndex + 1,
    totalHours: 24 * 7,
    windowStart,
    windowEnd,
  }));
}

function buildPatternRows() {
  const rows: Array<{
    stationId: string;
    dayType: DayType;
    hour: number;
    bikesAvg: number;
    anchorsAvg: number;
    occupancyAvg: number;
    sampleCount: number;
  }> = [];

  STATIONS.forEach((station, stationIndex) => {
    [DayType.WEEKDAY, DayType.WEEKEND].forEach((dayType) => {
      for (let hour = 0; hour < 24; hour += 1) {
        const modifier = dayType === DayType.WEEKEND ? -0.04 : 0.04;
        const occupancyAvg = clamp(
          station.usageBias + Math.sin((hour / 24) * Math.PI * 2) * 0.14 + modifier,
          0.15,
          0.9
        );

        rows.push({
          stationId: station.id,
          dayType,
          hour,
          bikesAvg: Number((station.capacity * occupancyAvg).toFixed(2)),
          anchorsAvg: Number((station.capacity * (1 - occupancyAvg)).toFixed(2)),
          occupancyAvg: Number(occupancyAvg.toFixed(4)),
          sampleCount: dayType === DayType.WEEKEND ? 16 : 32 + stationIndex * 2,
        });
      }
    });
  });

  return rows;
}

function buildHeatmapRows() {
  const rows: Array<{
    stationId: string;
    dayOfWeek: number;
    hour: number;
    bikesAvg: number;
    anchorsAvg: number;
    occupancyAvg: number;
    sampleCount: number;
  }> = [];

  STATIONS.forEach((station) => {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
      for (let hour = 0; hour < 24; hour += 1) {
        const weekendModifier = dayOfWeek === 0 || dayOfWeek === 6 ? -0.05 : 0.03;
        const occupancyAvg = clamp(
          station.usageBias +
            Math.sin((hour / 24) * Math.PI * 2) * 0.12 +
            weekendModifier,
          0.15,
          0.9
        );

        rows.push({
          stationId: station.id,
          dayOfWeek,
          hour,
          bikesAvg: Number((station.capacity * occupancyAvg).toFixed(2)),
          anchorsAvg: Number((station.capacity * (1 - occupancyAvg)).toFixed(2)),
          occupancyAvg: Number(occupancyAvg.toFixed(4)),
          sampleCount: 10 + dayOfWeek,
        });
      }
    }
  });

  return rows;
}

function buildAlertRows(latestPollAt: Date) {
  return [
    {
      stationId: '102',
      alertType: AlertType.LOW_BIKES,
      severity: 2,
      metricValue: 1.5,
      windowHours: 6,
      generatedAt: addMinutes(latestPollAt, -10),
      isActive: true,
    },
    {
      stationId: '103',
      alertType: AlertType.LOW_ANCHORS,
      severity: 1,
      metricValue: 2.5,
      windowHours: 12,
      generatedAt: addMinutes(latestPollAt, -20),
      isActive: true,
    },
  ];
}

async function createInBatches<T>(
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>
): Promise<void> {
  for (let index = 0; index < rows.length; index += CREATE_BATCH_SIZE) {
    const batch = rows.slice(index, index + CREATE_BATCH_SIZE);
    await insert(batch);
  }
}

async function resetDatabase() {
  await prisma.$transaction([
    prisma.stationAlert.deleteMany(),
    prisma.stationHeatmapCell.deleteMany(),
    prisma.stationPattern.deleteMany(),
    prisma.stationRanking.deleteMany(),
    prisma.dailyStationStat.deleteMany(),
    prisma.hourlyStationStat.deleteMany(),
    prisma.stationStatus.deleteMany(),
    prisma.station.deleteMany(),
    prisma.analyticsWatermark.deleteMany(),
    prisma.mobilityBriefingCache.deleteMany(),
  ]);
}

async function main() {
  assertDatabaseUrl();

  const latestPollAt = roundToFiveMinutes(new Date());
  const seededAt = new Date();
  const statusRows = buildStatusRows(latestPollAt);
  const hourlyRows = buildHourlyRows(latestPollAt);
  const dailyRows = buildDailyRows(latestPollAt);
  const rankingRows = buildRankingRows(latestPollAt);
  const patternRows = buildPatternRows();
  const heatmapRows = buildHeatmapRows();
  const alertRows = buildAlertRows(latestPollAt);

  console.log('[seed-qa-db] Resetting QA schema');
  await resetDatabase();

  console.log('[seed-qa-db] Creating stations');
  await prisma.station.createMany({
    data: STATIONS.map((station) => ({
      id: station.id,
      name: station.name,
      lat: station.lat,
      lon: station.lon,
      capacity: station.capacity,
      isActive: true,
      updatedAt: seededAt,
    })),
  });

  console.log('[seed-qa-db] Creating status snapshots');
  await createInBatches(statusRows, (batch) =>
    prisma.stationStatus.createMany({ data: batch })
  );
  console.log('[seed-qa-db] Creating hourly aggregates');
  await createInBatches(hourlyRows, (batch) =>
    prisma.hourlyStationStat.createMany({
      data: batch.map((row) => ({
        ...row,
        updatedAt: seededAt,
      })),
    })
  );
  console.log('[seed-qa-db] Creating daily aggregates');
  await createInBatches(dailyRows, (batch) =>
    prisma.dailyStationStat.createMany({
      data: batch.map((row) => ({
        ...row,
        updatedAt: seededAt,
      })),
    })
  );
  console.log('[seed-qa-db] Creating rankings, patterns, heatmap and alerts');
  await prisma.stationRanking.createMany({
    data: rankingRows.map((row) => ({
      ...row,
      updatedAt: seededAt,
    })),
  });
  await createInBatches(patternRows, (batch) =>
    prisma.stationPattern.createMany({ data: batch })
  );
  await createInBatches(heatmapRows, (batch) =>
    prisma.stationHeatmapCell.createMany({ data: batch })
  );
  await prisma.stationAlert.createMany({ data: alertRows });
  console.log('[seed-qa-db] Creating analytics watermarks');
  await prisma.analyticsWatermark.createMany({
    data: [
      { name: 'hourly', lastAggregatedAt: latestPollAt, updatedAt: seededAt },
      { name: 'daily', lastAggregatedAt: latestPollAt, updatedAt: seededAt },
    ],
  });

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        latestPollAt: latestPollAt.toISOString(),
        counts: {
          stations: STATIONS.length,
          station_status_rows: statusRows.length,
          hourly_rows: hourlyRows.length,
          daily_rows: dailyRows.length,
          ranking_rows: rankingRows.length,
          pattern_rows: patternRows.length,
          heatmap_rows: heatmapRows.length,
          alert_rows: alertRows.length,
        },
      },
      null,
      2
    )
  );
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
