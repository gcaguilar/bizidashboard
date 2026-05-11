import { i as DayType } from "./types-DMKIRG7H.js";
import { a as getMonthBounds, d as prisma, o as isValidMonthKey } from "./cache-DMRFuswD.js";
import { t as logger } from "./logger-C1tbYDM5.js";
import { Prisma } from "@prisma/client";
//#region src/lib/timezone.ts
var TIMEZONE = "Europe/Madrid";
new Intl.DateTimeFormat("en-GB", {
	timeZone: TIMEZONE,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hourCycle: "h23"
});
new Intl.DateTimeFormat("en-GB", {
	timeZone: TIMEZONE,
	timeZoneName: "shortOffset",
	hour: "2-digit",
	minute: "2-digit"
});
//#endregion
//#region src/analytics/time-buckets.ts
var bucketFormatter = new Intl.DateTimeFormat("en-GB", {
	timeZone: TIMEZONE,
	weekday: "short",
	hour: "2-digit",
	hourCycle: "h23"
});
var weekdayMap = {
	Sun: 0,
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6
};
var isValidDate = (date) => !Number.isNaN(date.getTime());
var getPart = (parts, type) => parts.find((part) => part.type === type)?.value ?? "";
function getLocalHour(date) {
	if (!isValidDate(date)) return NaN;
	const hourValue = getPart(bucketFormatter.formatToParts(date), "hour");
	return Number.parseInt(hourValue, 10);
}
function getLocalDayOfWeek(date) {
	if (!isValidDate(date)) return NaN;
	return weekdayMap[getPart(bucketFormatter.formatToParts(date), "weekday")] ?? NaN;
}
function getLocalDayType(date) {
	const dayOfWeek = getLocalDayOfWeek(date);
	if (Number.isNaN(dayOfWeek)) return DayType.WEEKDAY;
	if (dayOfWeek === 0 || dayOfWeek === 6) return DayType.WEEKEND;
	return DayType.WEEKDAY;
}
function getLocalBucket(date) {
	return {
		hour: getLocalHour(date),
		dayOfWeek: getLocalDayOfWeek(date),
		dayType: getLocalDayType(date)
	};
}
//#endregion
//#region src/analytics/queries/read.ts
var ALLOWED_RANGE_COLUMNS = [
	"bucketStart",
	"bucketDate",
	"recordedAt"
];
function buildRangeFilter(column, days, monthKey) {
	if (!ALLOWED_RANGE_COLUMNS.includes(column)) throw new Error(`Invalid column name: ${column}`);
	if (monthKey && isValidMonthKey(monthKey)) {
		const { start, endExclusive } = getMonthBounds(monthKey);
		return Prisma.sql`${Prisma.raw(`"${column}"`)} >= ${start}::timestamp AND ${Prisma.raw(`"${column}"`)} < ${endExclusive}::timestamp`;
	}
	const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
	return Prisma.sql`${Prisma.raw(`"${column}"`)} >= NOW() - INTERVAL '1 day' * ${safeDays}`;
}
function buildDemandSeriesQuery(days, monthKey) {
	if (monthKey && isValidMonthKey(monthKey)) {
		const { start, endExclusive } = getMonthBounds(monthKey);
		return Prisma.sql`
      WITH date_series AS (
        SELECT TO_CHAR(day, 'YYYY-MM-DD') AS day
        FROM generate_series(${start}::timestamp, (${endExclusive}::timestamp - INTERVAL '1 day'), '1 day'::interval) AS day
      ),
      daily AS (
        SELECT
          TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
          SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
          AVG("occupancyAvg") AS "avgOccupancy",
          SUM("sampleCount") AS "sampleCount"
        FROM "HourlyStationStat"
        WHERE "bucketStart" >= ${start}::timestamp
          AND "bucketStart" < ${endExclusive}::timestamp
        GROUP BY 1
      )
      SELECT
        date_series.day AS day,
        COALESCE(daily."demandScore", 0) AS "demandScore",
        COALESCE(daily."avgOccupancy", 0) AS "avgOccupancy",
        COALESCE(daily."sampleCount", 0) AS "sampleCount"
      FROM date_series
      LEFT JOIN daily ON daily.day = date_series.day
      ORDER BY date_series.day ASC;
    `;
	}
	const startOffsetDays = Math.max(0, Math.max(1, Math.min(365, Math.floor(days))) - 1);
	return Prisma.sql`
    WITH date_series AS (
      SELECT TO_CHAR(day, 'YYYY-MM-DD') AS day
      FROM generate_series(
        (CURRENT_DATE - INTERVAL '1 day' * ${startOffsetDays})::timestamp,
        (CURRENT_DATE)::timestamp,
        '1 day'::interval
      ) AS day
    ),
    daily AS (
      SELECT
        TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
        SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
        AVG("occupancyAvg") AS "avgOccupancy",
        SUM("sampleCount") AS "sampleCount"
      FROM "HourlyStationStat"
      WHERE "bucketStart" >= CURRENT_DATE::timestamp - INTERVAL '1 day' * ${startOffsetDays}
      GROUP BY 1
    )
    SELECT
      date_series.day AS day,
      COALESCE(daily."demandScore", 0) AS "demandScore",
      COALESCE(daily."avgOccupancy", 0) AS "avgOccupancy",
      COALESCE(daily."sampleCount", 0) AS "sampleCount"
    FROM date_series
    LEFT JOIN daily ON daily.day = date_series.day
    ORDER BY date_series.day ASC;
  `;
}
async function getAvailableDataMonths() {
	const monthKeys = /* @__PURE__ */ new Set();
	const [hourlyRows, dailyRows, snapshotRows] = await Promise.all([
		prisma.$queryRaw`
      SELECT DISTINCT TO_CHAR("bucketStart", 'YYYY-MM') AS "monthKey"
      FROM "HourlyStationStat"
      WHERE "bucketStart" IS NOT NULL
      ORDER BY "monthKey" DESC;
    `.catch((error) => {
			logger.warn("analytics.read.monthly_keys_hourly_failed", { error });
			return [];
		}),
		prisma.$queryRaw`
      SELECT DISTINCT TO_CHAR("bucketDate", 'YYYY-MM') AS "monthKey"
      FROM "DailyStationStat"
      WHERE "bucketDate" IS NOT NULL
      ORDER BY "monthKey" DESC;
    `.catch((error) => {
			logger.warn("analytics.read.monthly_keys_daily_failed", { error });
			return [];
		}),
		prisma.$queryRaw`
      SELECT DISTINCT TO_CHAR("recordedAt", 'YYYY-MM') AS "monthKey"
      FROM "StationStatus"
      WHERE "recordedAt" IS NOT NULL
      ORDER BY "monthKey" DESC;
    `.catch((error) => {
			logger.warn("analytics.read.monthly_keys_status_failed", { error });
			return [];
		})
	]);
	for (const row of [
		...hourlyRows,
		...dailyRows,
		...snapshotRows
	]) if (isValidMonthKey(row.monthKey)) monthKeys.add(row.monthKey);
	return Array.from(monthKeys).sort((left, right) => right.localeCompare(left));
}
function toSerializableNumber(value) {
	if (typeof value === "number") return value;
	if (typeof value === "bigint") return Number(value);
	if (typeof value === "string") return Number(value);
	if (value && typeof value === "object" && "toString" in value && typeof value.toString === "function") return Number(value.toString());
	return 0;
}
async function getStationRankings(type, limit = 20) {
	if (type === "availability") return prisma.$queryRaw`
      SELECT id, "stationId", "turnoverScore", "emptyHours", "fullHours", "totalHours", "windowStart", "windowEnd"
      FROM "StationRanking"
      WHERE "windowEnd" = (SELECT MAX("windowEnd") FROM "StationRanking")
      ORDER BY ("emptyHours" + "fullHours") DESC
      LIMIT ${limit};
    `;
	return prisma.$queryRaw`
    SELECT id, "stationId", "turnoverScore", "emptyHours", "fullHours", "totalHours", "windowStart", "windowEnd"
    FROM "StationRanking"
    WHERE "windowEnd" = (SELECT MAX("windowEnd") FROM "StationRanking")
    ORDER BY "turnoverScore" DESC
    LIMIT ${limit};
  `;
}
async function getStationPatternsBulk(stationIds) {
	if (stationIds.length === 0) return [];
	const unique = [...new Set(stationIds)];
	return (await prisma.stationPattern.findMany({
		where: { stationId: { in: unique } },
		select: {
			stationId: true,
			dayType: true,
			hour: true,
			occupancyAvg: true,
			sampleCount: true
		}
	})).map((r) => ({
		stationId: r.stationId,
		dayType: String(r.dayType),
		hour: r.hour,
		occupancyAvg: r.occupancyAvg,
		sampleCount: r.sampleCount
	}));
}
async function getStationsWithLatestStatus() {
	return (await prisma.$queryRaw`
    WITH latest AS (
      SELECT "stationId", MAX("recordedAt") AS "recordedAt"
      FROM "StationStatus"
      GROUP BY "stationId"
    )
    SELECT "Station".id, "Station".name, "Station".lat, "Station".lon, "Station".capacity,
      "StationStatus"."bikesAvailable", "StationStatus"."anchorsFree", "StationStatus"."recordedAt"
    FROM "Station"
    INNER JOIN latest ON latest."stationId" = "Station".id
    INNER JOIN "StationStatus"
      ON "StationStatus"."stationId" = latest."stationId"
      AND "StationStatus"."recordedAt" = latest."recordedAt"
    WHERE "Station"."isActive" = true
    ORDER BY "Station".name ASC;
  `).map((row) => ({
		...row,
		recordedAt: row.recordedAt instanceof Date ? row.recordedAt.toISOString() : row.recordedAt
	}));
}
async function getActiveAlerts(limit = 50) {
	return prisma.$queryRaw`
    SELECT id, "stationId", "alertType", severity, "metricValue", "windowHours", "generatedAt", "isActive"
    FROM "StationAlert"
    WHERE "isActive" = true
    ORDER BY "generatedAt" DESC
    LIMIT ${limit};
  `;
}
async function getDailyDemandCurve(days = 30, monthKey) {
	const query = buildDemandSeriesQuery(days, monthKey);
	return (await prisma.$queryRaw(query)).map((row) => ({
		...row,
		demandScore: toSerializableNumber(row.demandScore),
		avgOccupancy: toSerializableNumber(row.avgOccupancy),
		sampleCount: toSerializableNumber(row.sampleCount)
	}));
}
async function getMonthlyDemandCurve(limitMonths = 12) {
	const safeLimit = Math.max(1, Math.min(240, Math.floor(limitMonths)));
	const fromDaily = await prisma.$queryRaw`
    WITH monthly AS (
      SELECT
        TO_CHAR("bucketDate", 'YYYY-MM') AS "monthKey",
        COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "demandScore",
        COALESCE(AVG("occupancyAvg"), 0) AS "avgOccupancy",
        COUNT(DISTINCT "stationId") AS "activeStations",
        COALESCE(SUM("sampleCount"), 0) AS "sampleCount"
      FROM "DailyStationStat"
      WHERE "bucketDate" IS NOT NULL
      GROUP BY TO_CHAR("bucketDate", 'YYYY-MM')
      ORDER BY "monthKey" DESC
      LIMIT ${safeLimit}
    )
    SELECT "monthKey", "demandScore", "avgOccupancy", "activeStations", "sampleCount"
    FROM monthly
    ORDER BY "monthKey" ASC;
  `.catch((error) => {
		logger.warn("analytics.read.monthly_demand_daily_failed", { error });
		return [];
	});
	if (fromDaily.length > 0) return fromDaily.map((row) => ({
		...row,
		demandScore: toSerializableNumber(row.demandScore),
		avgOccupancy: toSerializableNumber(row.avgOccupancy),
		activeStations: toSerializableNumber(row.activeStations),
		sampleCount: toSerializableNumber(row.sampleCount)
	}));
	return (await prisma.$queryRaw`
    WITH monthly AS (
      SELECT
        TO_CHAR("bucketStart", 'YYYY-MM') AS "monthKey",
        COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "demandScore",
        COALESCE(AVG("occupancyAvg"), 0) AS "avgOccupancy",
        COUNT(DISTINCT "stationId") AS "activeStations",
        COALESCE(SUM("sampleCount"), 0) AS "sampleCount"
      FROM "HourlyStationStat"
      WHERE "bucketStart" IS NOT NULL
      GROUP BY TO_CHAR("bucketStart", 'YYYY-MM')
      ORDER BY "monthKey" DESC
      LIMIT ${safeLimit}
    )
    SELECT "monthKey", "demandScore", "avgOccupancy", "activeStations", "sampleCount"
    FROM monthly
    ORDER BY "monthKey" ASC;
  `.catch((error) => {
		logger.warn("analytics.read.monthly_demand_hourly_failed", { error });
		return [];
	})).map((row) => ({
		...row,
		demandScore: toSerializableNumber(row.demandScore),
		avgOccupancy: toSerializableNumber(row.avgOccupancy),
		activeStations: toSerializableNumber(row.activeStations),
		sampleCount: toSerializableNumber(row.sampleCount)
	}));
}
async function getSystemHourlyProfile(days = 14, monthKey) {
	const rangeFilter = buildRangeFilter("bucketStart", days, monthKey);
	return (await prisma.$queryRaw`
    SELECT
      EXTRACT(HOUR FROM "bucketStart")::int AS hour,
      AVG("occupancyAvg") AS "avgOccupancy",
      AVG("bikesAvg") AS "avgBikesAvailable",
      SUM("sampleCount") AS "sampleCount"
    FROM "HourlyStationStat"
    WHERE ${rangeFilter}
    GROUP BY EXTRACT(HOUR FROM "bucketStart")::int
    ORDER BY hour ASC;
  `).map((row) => ({
		...row,
		hour: toSerializableNumber(row.hour),
		avgOccupancy: toSerializableNumber(row.avgOccupancy),
		avgBikesAvailable: toSerializableNumber(row.avgBikesAvailable),
		sampleCount: toSerializableNumber(row.sampleCount)
	}));
}
//#endregion
export { getStationPatternsBulk as a, getSystemHourlyProfile as c, getMonthlyDemandCurve as i, getLocalBucket as l, getAvailableDataMonths as n, getStationRankings as o, getDailyDemandCurve as r, getStationsWithLatestStatus as s, getActiveAlerts as t, TIMEZONE as u };
