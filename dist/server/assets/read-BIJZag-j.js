import { i as DayType } from "./types-DbADi-Xa.js";
import { t as TIMEZONE } from "./timezone-DIvdn6H4.js";
import { n as getMonthBounds, r as isValidMonthKey } from "./months-CotCm8RF.js";
import { d as raw, f as sql, s as prisma } from "./cache-CQ9JHJ0b.js";
import { t as logger } from "./logger-9X1Y5g6X.js";
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
//#region src/analytics/queries/date-utils.ts
/**
* Shared date utility functions for analytics queries
*/
/**
* Parses a bucket start value from string or Date to Date object.
* Handles ISO format strings and PostgreSQL timestamp strings.
* 
* @param value - The value to parse (Date object or string)
* @returns Parsed Date object
*/
function parseBucketStart(value) {
	if (value instanceof Date) return value;
	if (value.includes("T")) return new Date(value);
	return /* @__PURE__ */ new Date(value.replace(" ", "T") + "Z");
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
		return sql`${raw(`"${column}"`)} >= ${start}::timestamp AND ${raw(`"${column}"`)} < ${endExclusive}::timestamp`;
	}
	const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
	return sql`${raw(`"${column}"`)} >= NOW() - INTERVAL '1 day' * ${safeDays}`;
}
function buildDemandSeriesQuery(days, monthKey) {
	if (monthKey && isValidMonthKey(monthKey)) {
		const { start, endExclusive } = getMonthBounds(monthKey);
		return sql`
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
	return sql`
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
async function getHourlyStatsForMonth(stationId, monthKey) {
	const { start, endExclusive } = getMonthBounds(monthKey);
	return prisma.$queryRaw`
    SELECT "stationId", "bucketStart", "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount"
    FROM "HourlyStationStat"
    WHERE "stationId" = ${stationId}
      AND "bucketStart" >= ${start}::timestamp
      AND "bucketStart" < ${endExclusive}::timestamp
    ORDER BY "bucketStart" ASC;
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
    SELECT s.id, s.name, s.lat, s.lon, s.capacity,
      ss."bikesAvailable", ss."anchorsFree", ss."recordedAt"
    FROM "Station" s
    CROSS JOIN LATERAL (
      SELECT "bikesAvailable", "anchorsFree", "recordedAt"
      FROM "StationStatus"
      WHERE "stationId" = s.id
      ORDER BY "recordedAt" DESC
      LIMIT 1
    ) ss
    WHERE s."isActive" = true
    ORDER BY s.name ASC;
  `).map((row) => ({
		...row,
		recordedAt: row.recordedAt instanceof Date ? row.recordedAt.toISOString() : row.recordedAt
	}));
}
async function getStationPatterns(stationId, monthKey) {
	if (monthKey && isValidMonthKey(monthKey)) {
		const hourlyStats = await getHourlyStatsForMonth(stationId, monthKey);
		const aggregates = /* @__PURE__ */ new Map();
		for (const stat of hourlyStats) {
			const { hour, dayType } = getLocalBucket(parseBucketStart(stat.bucketStart));
			const key = `${dayType}-${hour}`;
			const sampleCount = Number(stat.sampleCount) || 0;
			const current = aggregates.get(key);
			if (current) {
				current.bikesAvg += Number(stat.bikesAvg) * sampleCount;
				current.anchorsAvg += Number(stat.anchorsAvg) * sampleCount;
				current.occupancyAvg += Number(stat.occupancyAvg) * sampleCount;
				current.sampleCount += sampleCount;
			} else aggregates.set(key, {
				stationId,
				dayType,
				hour,
				bikesAvg: Number(stat.bikesAvg) * sampleCount,
				anchorsAvg: Number(stat.anchorsAvg) * sampleCount,
				occupancyAvg: Number(stat.occupancyAvg) * sampleCount,
				sampleCount
			});
		}
		return Array.from(aggregates.values()).map((row) => {
			const divisor = row.sampleCount || 1;
			return {
				...row,
				bikesAvg: row.bikesAvg / divisor,
				anchorsAvg: row.anchorsAvg / divisor,
				occupancyAvg: row.occupancyAvg / divisor
			};
		}).sort((left, right) => left.dayType.localeCompare(right.dayType) || left.hour - right.hour);
	}
	return prisma.$queryRaw`
    SELECT "stationId", "dayType", hour, "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount"
    FROM "StationPattern"
    WHERE "stationId" = ${stationId}
    ORDER BY "dayType" ASC, hour ASC;
  `;
}
async function getHeatmap(stationId, monthKey) {
	if (monthKey && isValidMonthKey(monthKey)) {
		const hourlyStats = await getHourlyStatsForMonth(stationId, monthKey);
		const aggregates = /* @__PURE__ */ new Map();
		for (const stat of hourlyStats) {
			const { hour, dayOfWeek } = getLocalBucket(parseBucketStart(stat.bucketStart));
			const key = `${dayOfWeek}-${hour}`;
			const sampleCount = Number(stat.sampleCount) || 0;
			const current = aggregates.get(key);
			if (current) {
				current.bikesAvg += Number(stat.bikesAvg) * sampleCount;
				current.anchorsAvg += Number(stat.anchorsAvg) * sampleCount;
				current.occupancyAvg += Number(stat.occupancyAvg) * sampleCount;
				current.sampleCount += sampleCount;
			} else aggregates.set(key, {
				stationId,
				dayOfWeek,
				hour,
				bikesAvg: Number(stat.bikesAvg) * sampleCount,
				anchorsAvg: Number(stat.anchorsAvg) * sampleCount,
				occupancyAvg: Number(stat.occupancyAvg) * sampleCount,
				sampleCount
			});
		}
		return Array.from(aggregates.values()).map((row) => {
			const divisor = row.sampleCount || 1;
			return {
				...row,
				bikesAvg: row.bikesAvg / divisor,
				anchorsAvg: row.anchorsAvg / divisor,
				occupancyAvg: row.occupancyAvg / divisor
			};
		}).sort((left, right) => left.dayOfWeek - right.dayOfWeek || left.hour - right.hour);
	}
	return prisma.$queryRaw`
    SELECT "stationId", "dayOfWeek", hour, "bikesAvg", "anchorsAvg", "occupancyAvg", "sampleCount"
    FROM "StationHeatmapCell"
    WHERE "stationId" = ${stationId}
    ORDER BY "dayOfWeek" ASC, hour ASC;
  `;
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
async function getHourlyMobilitySignals(days = 14, monthKey) {
	const rangeFilter = buildRangeFilter("bucketStart", days, monthKey);
	return (await prisma.$queryRaw`
    WITH with_lag AS (
      SELECT
        "stationId",
        "bucketStart",
        "bikesAvg" - LAG("bikesAvg") OVER (
          PARTITION BY "stationId"
          ORDER BY "bucketStart"
        ) AS delta
      FROM "HourlyStationStat"
      WHERE ${rangeFilter}
    ),
    hourly AS (
      SELECT
        "stationId",
        EXTRACT(HOUR FROM "bucketStart")::int AS hour,
        SUM(CASE WHEN delta < 0 THEN ABS(delta) ELSE 0 END) AS departures,
        SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) AS arrivals,
        COUNT(*) AS "sampleCount"
      FROM with_lag
      WHERE delta IS NOT NULL
      GROUP BY "stationId", EXTRACT(HOUR FROM "bucketStart")::int
    )
    SELECT "stationId", hour, departures, arrivals, "sampleCount"
    FROM hourly
    ORDER BY "stationId" ASC, hour ASC;
  `).map((row) => ({
		...row,
		hour: toSerializableNumber(row.hour),
		departures: toSerializableNumber(row.departures),
		arrivals: toSerializableNumber(row.arrivals),
		sampleCount: toSerializableNumber(row.sampleCount)
	}));
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
export { getHourlyMobilitySignals as a, getStationPatternsBulk as c, getSystemHourlyProfile as d, getLocalBucket as f, getHeatmap as i, getStationRankings as l, getAvailableDataMonths as n, getMonthlyDemandCurve as o, getDailyDemandCurve as r, getStationPatterns as s, getActiveAlerts as t, getStationsWithLatestStatus as u };

//# sourceMappingURL=read-BIJZag-j.js.map