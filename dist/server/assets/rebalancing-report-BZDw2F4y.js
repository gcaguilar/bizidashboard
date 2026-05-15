import { i as DayType } from "./types-DbADi-Xa.js";
import { n as buildStationDistrictMap } from "./districts-DMcc_jOx.js";
import { n as haversineDistanceMeters } from "./geo-C-pZxQbr.js";
import { d as raw, f as sql, r as withCache, s as prisma } from "./cache-CQ9JHJ0b.js";
import { c as getStationPatternsBulk, f as getLocalBucket, u as getStationsWithLatestStatus } from "./read-BIJZag-j.js";
import { t as fetchDistrictCollection } from "./districts.server-Qiyl6lhv.js";
import { t as estimateStationPredictions } from "./predictions-Bb_NDCaZ.js";
//#region src/analytics/queries/rebalancing.ts
function buildRangeFilter(column, days) {
	const safeDays = Math.max(1, Math.min(90, Math.floor(days)));
	return sql`${raw(`"${column}"`)} >= NOW() - INTERVAL '1 day' * ${safeDays}`;
}
async function getStationGlobalMetrics(days = 15) {
	const filter = buildRangeFilter("bucketStart", days);
	const rows = await prisma.$queryRaw`
    WITH with_lag AS (
      SELECT
        "stationId",
        "bucketStart",
        "bikesAvg" - LAG("bikesAvg") OVER (
          PARTITION BY "stationId"
          ORDER BY "bucketStart"
        ) AS delta
      FROM "HourlyStationStat"
      WHERE ${filter}
    ),
    imbalance AS (
      SELECT
        "stationId",
        SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) - SUM(CASE WHEN delta < 0 THEN ABS(delta) ELSE 0 END) AS "netImbalance"
      FROM with_lag
      WHERE delta IS NOT NULL
      GROUP BY "stationId"
    )
    SELECT
      h."stationId",
      COALESCE(AVG(h."occupancyAvg"), 0) AS "occupancyAvg",
      COALESCE(COUNT(h."stationId") FILTER (WHERE h."bikesMin" <= 0)::float / NULLIF(COUNT(h."stationId"), 0), 0) AS "pctTimeEmpty",
      COALESCE(COUNT(h."stationId") FILTER (WHERE h."anchorsMin" <= 0)::float / NULLIF(COUNT(h."stationId"), 0), 0) AS "pctTimeFull",
      COALESCE(SUM((h."bikesMax" - h."bikesMin") + (h."anchorsMax" - h."anchorsMin")), 0) AS "rotation",
      COALESCE(SUM((h."bikesMax" - h."bikesMin") + (h."anchorsMax" - h."anchorsMin")) / NULLIF(AVG(h."bikesAvg"), 0), 0) AS "rotationPerBike",
      COALESCE(COUNT(h."stationId") FILTER (WHERE h."bikesMax" = h."bikesMin")::float / NULLIF(COUNT(h."stationId"), 0), 0) AS "persistenceProxy",
      COALESCE(STDDEV_POP(h."occupancyAvg"), 0) AS "variability",
      COALESCE(MAX(i."netImbalance"), 0) AS "netImbalance"
    FROM "HourlyStationStat" h
    LEFT JOIN imbalance i ON h."stationId" = i."stationId"
    WHERE ${filter}
    GROUP BY h."stationId"
  `;
	const map = {};
	for (const row of rows) map[row.stationId] = {
		occupancyAvg: Number(row.occupancyAvg),
		pctTimeEmpty: Number(row.pctTimeEmpty),
		pctTimeFull: Number(row.pctTimeFull),
		rotation: Number(row.rotation),
		rotationPerBike: Number(row.rotationPerBike),
		persistenceProxy: Number(row.persistenceProxy),
		criticalEpisodeAvgMinutes: 0,
		netImbalance: Number(row.netImbalance),
		variability: Number(row.variability),
		unsatisfiedDemandProxy: 0
	};
	return map;
}
async function getStationTimeBandMetrics(days = 15) {
	const filter = buildRangeFilter("bucketStart", days);
	const rows = await prisma.$queryRaw`
    SELECT
      "stationId",
      EXTRACT(HOUR FROM "bucketStart")::int AS "hourValue",
      EXTRACT(DOW FROM "bucketStart")::int AS "dayOfWeek",
      COALESCE(AVG("occupancyAvg"), 0) AS "occupancyAvg",
      COALESCE(COUNT("stationId") FILTER (WHERE "bikesMin" <= 0)::float / NULLIF(COUNT("stationId"), 0), 0) AS "pctTimeEmpty",
      COALESCE(COUNT("stationId") FILTER (WHERE "anchorsMin" <= 0)::float / NULLIF(COUNT("stationId"), 0), 0) AS "pctTimeFull",
      COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "rotation",
      COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) / NULLIF(AVG("bikesAvg"), 0), 0) AS "rotationPerBike",
      COALESCE(COUNT("stationId") FILTER (WHERE "bikesMax" = "bikesMin")::float / NULLIF(COUNT("stationId"), 0), 0) AS "persistenceProxy",
      COALESCE(STDDEV_POP("occupancyAvg"), 0) AS "variability"
    FROM "HourlyStationStat"
    WHERE ${filter}
    GROUP BY "stationId", EXTRACT(HOUR FROM "bucketStart")::int, EXTRACT(DOW FROM "bucketStart")::int
  `;
	const map = {};
	const getBand = (hour) => {
		if (hour >= 7 && hour <= 9) return "morning_peak";
		if (hour >= 10 && hour <= 16) return "valley";
		if (hour >= 17 && hour <= 19) return "evening_peak";
		return "night";
	};
	const getDayCategory = (dow) => dow === 0 || dow === 6 ? "weekend" : "weekday";
	for (const row of rows) {
		const timeBand = getBand(row.hourValue);
		const dayCategory = getDayCategory(row.dayOfWeek);
		if (!map[row.stationId]) map[row.stationId] = [];
		let bandMetric = map[row.stationId].find((b) => b.timeBand === timeBand && b.dayCategory === dayCategory);
		if (!bandMetric) {
			bandMetric = {
				timeBand,
				dayCategory,
				occupancyAvg: 0,
				pctTimeEmpty: 0,
				pctTimeFull: 0,
				rotation: 0,
				rotationPerBike: 0,
				persistenceProxy: 0,
				criticalEpisodeAvgMinutes: 0,
				netImbalance: 0,
				variability: 0,
				unsatisfiedDemandProxy: 0
			};
			map[row.stationId].push(bandMetric);
		}
		bandMetric.occupancyAvg += Number(row.occupancyAvg);
		bandMetric.pctTimeEmpty += Number(row.pctTimeEmpty);
		bandMetric.pctTimeFull += Number(row.pctTimeFull);
		bandMetric.rotation += Number(row.rotation);
		bandMetric.rotationPerBike += Number(row.rotationPerBike);
		bandMetric.persistenceProxy += Number(row.persistenceProxy);
		bandMetric.variability += Number(row.variability);
		bandMetric.unsatisfiedDemandProxy += Number(row.pctTimeEmpty) * Number(row.rotation);
	}
	for (const stationId in map) for (const bandMetric of map[stationId]) {
		const div = (bandMetric.timeBand === "night" ? 10 : bandMetric.timeBand === "valley" ? 7 : 3) * (bandMetric.dayCategory === "weekday" ? 5 : 2);
		bandMetric.occupancyAvg /= div;
		bandMetric.pctTimeEmpty /= div;
		bandMetric.pctTimeFull /= div;
		bandMetric.rotationPerBike /= div;
		bandMetric.persistenceProxy /= div;
		bandMetric.variability /= div;
	}
	return map;
}
async function getCriticalEpisodes(days = 15) {
	const filter = buildRangeFilter("recordedAt", days);
	const rows = await prisma.$queryRaw`
    WITH gaps AS (
      SELECT "stationId", "recordedAt", "bikesAvailable", "anchorsFree",
        CASE WHEN "bikesAvailable" <= 0 THEN 0 ELSE 1 END AS empty_flag,
        CASE WHEN "anchorsFree" <= 0 THEN 0 ELSE 1 END AS full_flag,
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY "stationId", CASE WHEN "bikesAvailable" <= 0 THEN 0 ELSE 1 END ORDER BY "recordedAt") AS empty_grp,
        ROW_NUMBER() OVER (PARTITION BY "stationId" ORDER BY "recordedAt")
        - ROW_NUMBER() OVER (PARTITION BY "stationId", CASE WHEN "anchorsFree" <= 0 THEN 0 ELSE 1 END ORDER BY "recordedAt") AS full_grp
      FROM "StationStatus"
      WHERE ${filter}
    ),
    empty_episodes AS (
      SELECT "stationId", MIN("recordedAt") AS start_time, MAX("recordedAt") AS end_time,
             EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 AS duration_min
      FROM gaps
      WHERE empty_flag = 0
      GROUP BY "stationId", empty_grp
      HAVING EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 > 0
    ),
    full_episodes AS (
      SELECT "stationId", MIN("recordedAt") AS start_time, MAX("recordedAt") AS end_time,
             EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 AS duration_min
      FROM gaps
      WHERE full_flag = 0
      GROUP BY "stationId", full_grp
      HAVING EXTRACT(EPOCH FROM (MAX("recordedAt") - MIN("recordedAt")))/60 > 0
    )
    SELECT
      s.id AS "stationId",
      COALESCE(AVG(e.duration_min), 0) AS "avgEmptyMinutes",
      COALESCE(MAX(e.duration_min), 0) AS "maxEmptyMinutes",
      COALESCE(AVG(f.duration_min), 0) AS "avgFullMinutes",
      COALESCE(MAX(f.duration_min), 0) AS "maxFullMinutes",
      COUNT(DISTINCT e.start_time) + COUNT(DISTINCT f.start_time) AS "episodeCount"
    FROM "Station" s
    LEFT JOIN empty_episodes e ON s.id = e."stationId"
    LEFT JOIN full_episodes f ON s.id = f."stationId"
    GROUP BY s.id
  `;
	const map = {};
	for (const row of rows) map[row.stationId] = {
		stationId: row.stationId,
		avgEmptyEpisodeMinutes: Number(row.avgEmptyMinutes),
		avgFullEpisodeMinutes: Number(row.avgFullMinutes),
		maxEmptyEpisodeMinutes: Number(row.maxEmptyMinutes),
		maxFullEpisodeMinutes: Number(row.maxFullMinutes),
		episodeCount: Number(row.episodeCount)
	};
	return map;
}
async function getStationDistanceMatrix(stations, maxDistanceMeters = 3e3) {
	const matrix = /* @__PURE__ */ new Map();
	for (const origin of stations) {
		const neighbors = [];
		for (const destination of stations) {
			if (origin.id === destination.id) continue;
			const dist = haversineDistanceMeters({
				latitude: origin.lat,
				longitude: origin.lon
			}, {
				latitude: destination.lat,
				longitude: destination.lon
			});
			if (dist <= maxDistanceMeters) {
				const walkingTimeMinutes = dist * 1.3 / 75;
				neighbors.push({
					stationId: destination.id,
					distanceMeters: dist,
					walkingTimeMinutes,
					currentOccupancy: 0,
					historicalRobustness: 0
				});
			}
		}
		neighbors.sort((a, b) => a.distanceMeters - b.distanceMeters);
		matrix.set(origin.id, neighbors);
	}
	return matrix;
}
//#endregion
//#region src/lib/station-typology.ts
function inferStationType(patterns) {
	if (!patterns || patterns.length === 0) return {
		type: "mixed",
		confidence: 0,
		reasons: ["Sin datos de patrones, se asume tipo mixto"]
	};
	const weekdayPatterns = patterns.filter((p) => p.dayType === DayType.WEEKDAY || p.dayType === "WEEKDAY");
	const weekendPatterns = patterns.filter((p) => p.dayType === DayType.WEEKEND || p.dayType === "WEEKEND");
	const avgOcc = (rows, startHr, endHr) => {
		const subset = rows.filter((r) => r.hour >= startHr && r.hour <= endHr);
		if (subset.length === 0) return 0;
		return subset.reduce((acc, curr) => acc + curr.occupancyAvg, 0) / subset.length;
	};
	const morningOcc = avgOcc(weekdayPatterns, 7, 9);
	const eveningOcc = avgOcc(weekdayPatterns, 17, 19);
	const morningDrop = morningOcc - eveningOcc;
	const eveningDrop = eveningOcc - morningOcc;
	const reasons = [];
	let type = "mixed";
	let confidence = .5;
	if (morningDrop > .1) {
		type = "offices";
		confidence = Math.min(.95, .55 + morningDrop * 2);
		reasons.push(`Patron de oficinas: alta ocupacion por la manana y vaciado por la tarde.`);
	} else if (eveningDrop > .1) {
		type = "residential";
		confidence = Math.min(.95, .55 + eveningDrop * 2);
		reasons.push(`Patron residencial: baja ocupacion por la manana y recuperacion por la tarde.`);
	} else {
		reasons.push(`Comportamiento simetrico o mixto (Diferencia manana-tarde menor al 10%).`);
		const weekdayAvg = avgOcc(weekdayPatterns, 0, 23);
		const weekendAvg = avgOcc(weekendPatterns, 0, 23);
		const weekendSample = weekendPatterns.reduce((acc, row) => acc + row.sampleCount, 0);
		const weekdaySample = weekdayPatterns.reduce((acc, row) => acc + row.sampleCount, 0);
		const nightRows = patterns.filter((p) => p.hour >= 21 || p.hour <= 2);
		const totalSample = Math.max(1, patterns.reduce((acc, row) => acc + row.sampleCount, 0));
		if (nightRows.reduce((acc, row) => acc + row.sampleCount, 0) / totalSample >= .35) {
			type = "leisure";
			confidence = Math.max(confidence, .7);
			reasons.push("Franja nocturna dominante en volumen de muestras.");
		} else if (weekendSample > weekdaySample * 1.4 || weekendAvg > weekdayAvg + .15) {
			type = "tourist";
			reasons.push("Mayor demanda relativa en fin de semana frente a laborable.");
			confidence = Math.max(confidence, .72);
		}
	}
	return {
		type,
		confidence: Number(confidence.toFixed(2)),
		reasons
	};
}
//#endregion
//#region src/lib/target-bands.ts
var DEFAULT_TARGET_BANDS = {
	residential: {
		morning_peak: {
			min: .25,
			max: .55
		},
		valley: {
			min: .35,
			max: .65
		},
		evening_peak: {
			min: .4,
			max: .7
		},
		night: {
			min: .5,
			max: .8
		}
	},
	offices: {
		morning_peak: {
			min: .6,
			max: .85
		},
		valley: {
			min: .4,
			max: .7
		},
		evening_peak: {
			min: .25,
			max: .55
		},
		night: {
			min: .2,
			max: .5
		}
	},
	intermodal: {
		morning_peak: {
			min: .4,
			max: .7
		},
		valley: {
			min: .4,
			max: .7
		},
		evening_peak: {
			min: .4,
			max: .7
		},
		night: {
			min: .4,
			max: .7
		}
	},
	tourist: {
		morning_peak: {
			min: .35,
			max: .65
		},
		valley: {
			min: .3,
			max: .6
		},
		evening_peak: {
			min: .35,
			max: .65
		},
		night: {
			min: .25,
			max: .55
		}
	},
	leisure: {
		morning_peak: {
			min: .25,
			max: .55
		},
		valley: {
			min: .3,
			max: .6
		},
		evening_peak: {
			min: .4,
			max: .7
		},
		night: {
			min: .45,
			max: .75
		}
	},
	mixed: {
		morning_peak: {
			min: .35,
			max: .65
		},
		valley: {
			min: .35,
			max: .65
		},
		evening_peak: {
			min: .35,
			max: .65
		},
		night: {
			min: .35,
			max: .65
		}
	}
};
function getTargetBand(type, timeBand) {
	return DEFAULT_TARGET_BANDS[type]?.[timeBand] ?? DEFAULT_TARGET_BANDS.mixed[timeBand];
}
function getCurrentTimeBand(hour) {
	if (hour >= 7 && hour <= 9) return "morning_peak";
	if (hour >= 10 && hour <= 16) return "valley";
	if (hour >= 17 && hour <= 19) return "evening_peak";
	return "night";
}
//#endregion
//#region src/lib/station-classifier.ts
function getPercentile(value, allValues) {
	if (allValues.length === 0) return 0;
	const sorted = [...allValues].sort((a, b) => a - b);
	const index = sorted.findIndex((v) => v >= value);
	return index === -1 ? 1 : index / sorted.length;
}
function classifyStation(capacityOrGlobalMetrics, currentBikesOrTimeBandMetrics, currentAnchorsOrTargetBand, globalMetricsOrRotationPercentile, timeBandMetricsArg, targetBandArg, allGlobalMetricsArg) {
	const legacyCall = typeof capacityOrGlobalMetrics !== "number";
	const capacity = legacyCall ? 0 : capacityOrGlobalMetrics;
	const currentBikes = legacyCall ? 0 : currentBikesOrTimeBandMetrics;
	const currentAnchors = legacyCall ? 0 : currentAnchorsOrTargetBand;
	const globalMetrics = legacyCall ? capacityOrGlobalMetrics : globalMetricsOrRotationPercentile;
	const timeBandMetrics = legacyCall ? currentBikesOrTimeBandMetrics : timeBandMetricsArg ?? [];
	const rotationPercentileLegacy = legacyCall ? Math.max(0, Math.min(1, globalMetricsOrRotationPercentile / 100)) : null;
	const allGlobalMetrics = legacyCall ? {} : allGlobalMetricsArg ?? {};
	const reasons = [];
	if (!legacyCall && currentBikes + currentAnchors !== capacity) {
		reasons.push(`Revisar datos: la suma de bicis (${currentBikes}) y anclajes libres (${currentAnchors}) no coincide con la capacidad (${capacity})`);
		return {
			classification: "data_review",
			reasons
		};
	}
	if (globalMetrics.variability < .02 && globalMetrics.rotation > 10) {
		reasons.push(`Revisar datos: variabilidad anormalmente baja (${(globalMetrics.variability * 100).toFixed(1)}%) a pesar de tener rotacion activa`);
		return {
			classification: "data_review",
			reasons
		};
	}
	const allRotations = Object.values(allGlobalMetrics).map((m) => m.rotationPerBike);
	const rotationPercentile = rotationPercentileLegacy ?? getPercentile(globalMetrics.rotationPerBike, allRotations);
	const peakBands = timeBandMetrics.filter((m) => m.timeBand === "morning_peak" || m.timeBand === "evening_peak");
	const nonPeakBands = timeBandMetrics.filter((m) => m.timeBand === "valley" || m.timeBand === "night");
	if (globalMetrics.occupancyAvg > .7 && rotationPercentile <= .4 && globalMetrics.persistenceProxy > .4) {
		reasons.push(`Sobrestock: ocupacion media alta (${(globalMetrics.occupancyAvg * 100).toFixed(1)}%), rotacion en el percentil ${(rotationPercentile * 100).toFixed(0)}, y el ${(globalMetrics.persistenceProxy * 100).toFixed(1)}% de las horas no hay movimiento`);
		return {
			classification: "overstock",
			reasons
		};
	}
	const anyPeakEmpty = peakBands.some((m) => m.pctTimeEmpty > .1);
	if (globalMetrics.occupancyAvg < .3 && anyPeakEmpty) {
		reasons.push(`Deficit: ocupacion media muy baja (${(globalMetrics.occupancyAvg * 100).toFixed(1)}%) y sufre vaciados frecuentes en hora punta`);
		return {
			classification: "deficit",
			reasons
		};
	}
	const anyPeakFull = peakBands.some((m) => m.pctTimeFull > .2);
	const allNonPeakNotFull = nonPeakBands.every((m) => m.pctTimeFull < .05);
	if (anyPeakFull && allNonPeakNotFull) {
		reasons.push(`Saturacion en punta: se llena mas del 20% del tiempo en hora punta, pero funciona bien el resto del dia`);
		return {
			classification: "peak_saturation",
			reasons
		};
	}
	const anyPeakEmptyHigh = peakBands.some((m) => m.pctTimeEmpty > .2);
	const allNonPeakNotEmpty = nonPeakBands.every((m) => m.pctTimeEmpty < .05);
	if (anyPeakEmptyHigh && allNonPeakNotEmpty) {
		reasons.push(`Vaciado en punta: se vacia mas del 20% del tiempo en hora punta, pero se recupera el resto del dia`);
		return {
			classification: "peak_emptying",
			reasons
		};
	}
	reasons.push(`Equilibrada: la ocupacion se mantiene dentro de los parametros normales sin riesgo cronico detectado`);
	return {
		classification: "balanced",
		reasons
	};
}
//#endregion
//#region src/lib/rebalancing-prediction.ts
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
function assessStationRisk(station, patterns, timeBandMetrics, targetBand, now = /* @__PURE__ */ new Date()) {
	if (station.capacity <= 0) return {
		riskEmptyAt1h: 0,
		riskEmptyAt3h: 0,
		riskFullAt1h: 0,
		riskFullAt3h: 0,
		demandNextHour: 0,
		demandNext3Hours: 0,
		selfCorrectionProbability: 0,
		estimatedRecoveryMinutes: null,
		confidence: 0
	};
	const pred60 = estimateStationPredictions({
		stationId: station.id,
		capacity: station.capacity,
		bikesAvailable: station.bikesAvailable,
		anchorsFree: station.anchorsFree,
		patterns: patterns.map((row) => ({
			...row,
			bikesAvg: 0,
			anchorsAvg: 0
		}))
	}, now).predictions.find((p) => p.horizonMinutes === 60);
	const confidence = pred60?.confidence ?? .5;
	const currentRatio = station.bikesAvailable / station.capacity;
	const future3hBucket = getLocalBucket(new Date(now.getTime() + 180 * 6e4));
	const future3hPattern = patterns.find((p) => p.hour === future3hBucket.hour && (p.dayType === future3hBucket.dayType || p.dayType === String(future3hBucket.dayType)));
	let predictedRatio3h = currentRatio;
	if (future3hPattern) {
		const recencyWeight = .2;
		const currentBucket = getLocalBucket(now);
		const currentPatternRatio = clamp(patterns.find((p) => p.hour === currentBucket.hour && (p.dayType === currentBucket.dayType || p.dayType === String(currentBucket.dayType)))?.occupancyAvg ?? currentRatio, 0, 1);
		const expectedDelta = clamp(future3hPattern.occupancyAvg, 0, 1) - currentPatternRatio;
		predictedRatio3h = clamp(currentRatio * recencyWeight + (currentRatio + expectedDelta) * (1 - recencyWeight), 0, 1);
	}
	const predictedRatio1h = pred60 && pred60.predictedBikesAvailable !== null ? pred60.predictedBikesAvailable / station.capacity : currentRatio;
	const computeEmptyRisk = (ratio) => {
		if (ratio >= targetBand.min) return 0;
		return clamp(1 - ratio / Math.max(.01, targetBand.min), 0, 1) * confidence;
	};
	const computeFullRisk = (ratio) => {
		if (ratio <= targetBand.max) return 0;
		return clamp((ratio - targetBand.max) / (1 - targetBand.max), 0, 1) * confidence;
	};
	const riskEmptyAt1h = computeEmptyRisk(predictedRatio1h);
	const riskFullAt1h = computeFullRisk(predictedRatio1h);
	const riskEmptyAt3h = computeEmptyRisk(predictedRatio3h);
	const riskFullAt3h = computeFullRisk(predictedRatio3h);
	const currentBand = getCurrentTimeBand(now.getHours());
	const currentBandMetrics = timeBandMetrics.find((m) => m.timeBand === currentBand);
	const avgDemandPerHour = currentBandMetrics ? currentBandMetrics.rotation : 0;
	const demandNextHour = avgDemandPerHour;
	const demandNext3Hours = avgDemandPerHour * 3;
	let selfCorrectionProbability = 0;
	let estimatedRecoveryMinutes = null;
	if (currentRatio < targetBand.min || currentRatio > targetBand.max) for (let h = 1; h <= 4; h++) {
		const checkBucket = getLocalBucket(new Date(now.getTime() + h * 60 * 6e4));
		const checkPattern = patterns.find((p) => p.hour === checkBucket.hour);
		if (checkPattern) {
			if (checkPattern.occupancyAvg >= targetBand.min && checkPattern.occupancyAvg <= targetBand.max) {
				estimatedRecoveryMinutes = h * 60;
				selfCorrectionProbability = confidence;
				break;
			}
		}
	}
	return {
		riskEmptyAt1h: Number(riskEmptyAt1h.toFixed(2)),
		riskEmptyAt3h: Number(riskEmptyAt3h.toFixed(2)),
		riskFullAt1h: Number(riskFullAt1h.toFixed(2)),
		riskFullAt3h: Number(riskFullAt3h.toFixed(2)),
		demandNextHour: Number(demandNextHour.toFixed(2)),
		demandNext3Hours: Number(demandNext3Hours.toFixed(2)),
		selfCorrectionProbability: Number(selfCorrectionProbability.toFixed(2)),
		estimatedRecoveryMinutes,
		confidence
	};
}
//#endregion
//#region src/lib/rebalancing-network.ts
function buildNetworkContext(stationIdOrNearbyStations, currentOccupancyOrCurrentBikes, nearbyStationsArg, allGlobalMetricsArg) {
	const nearbyStations = Array.isArray(stationIdOrNearbyStations) ? stationIdOrNearbyStations : nearbyStationsArg ?? [];
	const allGlobalMetrics = Array.isArray(stationIdOrNearbyStations) ? {} : allGlobalMetricsArg ?? {};
	const currentBikesMap = currentOccupancyOrCurrentBikes instanceof Map ? currentOccupancyOrCurrentBikes : null;
	const populatedNeighbors = nearbyStations.map((neighbor) => {
		const neighborMetrics = allGlobalMetrics[neighbor.stationId];
		let historicalRobustness = neighbor.historicalRobustness;
		if (neighborMetrics) historicalRobustness = Math.max(0, 1 - neighborMetrics.pctTimeEmpty - neighborMetrics.pctTimeFull);
		const currentOccupancy = currentBikesMap && currentBikesMap.has(neighbor.stationId) ? (() => {
			const row = currentBikesMap.get(neighbor.stationId);
			const total = row.bikesAvailable + row.anchorsFree;
			return total > 0 ? row.bikesAvailable / total : neighbor.currentOccupancy;
		})() : neighbor.currentOccupancy;
		return {
			...neighbor,
			currentOccupancy,
			historicalRobustness
		};
	});
	const viableNeighbors = populatedNeighbors.filter((n) => n.historicalRobustness > .4 && n.walkingTimeMinutes <= 7 && (!currentBikesMap || n.currentOccupancy > .12 && n.currentOccupancy < .92));
	let urgencyAdjustment = 1;
	if (viableNeighbors.length >= 2) urgencyAdjustment = .5;
	else if (viableNeighbors.length === 1) urgencyAdjustment = .75;
	return {
		nearbyStations: populatedNeighbors,
		clusterCapacity: 0,
		clusterAvailability: 0,
		urgencyAdjustment
	};
}
//#endregion
//#region src/lib/rebalancing-engine.ts
function decideAction(diagnosticOrClassification, occupancyArg, targetBandArg, _timeBandArg, riskArg, networkArg, _capacityArg) {
	const reasons = [];
	const diagnostic = typeof diagnosticOrClassification === "string" ? {
		classification: diagnosticOrClassification,
		risk: riskArg,
		network: networkArg,
		targetBand: targetBandArg,
		currentBikes: occupancyArg ?? 0,
		capacity: 1
	} : diagnosticOrClassification;
	const risk = diagnostic.risk;
	const classification = diagnostic.classification;
	const network = diagnostic.network;
	const targetBand = diagnostic.targetBand;
	const currentRatio = typeof occupancyArg === "number" ? occupancyArg : diagnostic.capacity > 0 ? diagnostic.currentBikes / diagnostic.capacity : 0;
	const calculatePriority = (urgencyWeight, demandWeightBase) => {
		const demandWeight = Math.min(1, demandWeightBase / 20);
		const networkWeight = network.urgencyAdjustment;
		return Number((urgencyWeight * (.5 + .5 * demandWeight) * networkWeight).toFixed(2));
	};
	if (classification === "data_review") {
		reasons.push("Estacion marcada para revision de calidad de datos. No se recomienda accion automatica.");
		return {
			actionGroup: "review",
			urgency: "none",
			reasons,
			priorityScore: 0
		};
	}
	if (risk.selfCorrectionProbability > .7 && risk.estimatedRecoveryMinutes !== null && risk.estimatedRecoveryMinutes < 45) {
		reasons.push(`La estacion se autocorrige en ~${risk.estimatedRecoveryMinutes} min segun el patron historico.`);
		return {
			actionGroup: "stable",
			urgency: "none",
			reasons,
			priorityScore: 0
		};
	}
	if (!(currentRatio < targetBand.min - .15 || currentRatio > targetBand.max + .15) && network.urgencyAdjustment < .6) {
		const alts = network.nearbyStations.filter((n) => n.historicalRobustness > .4).map((n) => n.stationId).join(", ");
		reasons.push(`Estaciones cercanas (${alts}) pueden absorber la demanda actual.`);
		return {
			actionGroup: "stable",
			urgency: "low",
			reasons,
			priorityScore: calculatePriority(.2, risk.demandNextHour)
		};
	}
	if (currentRatio > targetBand.max && (risk.riskFullAt1h > .5 || classification === "overstock" || classification === "peak_saturation")) {
		let urgency = "low";
		let weight = .4;
		if (risk.riskFullAt1h > .8 || currentRatio >= .95) {
			urgency = "high";
			weight = .8;
		} else if (risk.riskFullAt1h > .5 || currentRatio > .8) {
			urgency = "medium";
			weight = .6;
		}
		reasons.push(`Exceso de stock detectado (Ocupacion: ${(currentRatio * 100).toFixed(0)}% > Max: ${(targetBand.max * 100).toFixed(0)}%). Riesgo de saturacion a 1h: ${(risk.riskFullAt1h * 100).toFixed(0)}%.`);
		return {
			actionGroup: "donor",
			urgency,
			reasons,
			priorityScore: calculatePriority(weight, risk.demandNextHour)
		};
	}
	if (currentRatio < targetBand.min && (risk.riskEmptyAt1h > .5 || classification === "deficit" || classification === "peak_emptying")) {
		let urgency = "low";
		let weight = .4;
		if (risk.riskEmptyAt1h > .8 || currentRatio <= .05) {
			urgency = "critical";
			weight = 1;
		} else if (risk.riskEmptyAt1h > .5 || currentRatio < .2) {
			urgency = "high";
			weight = .8;
		}
		reasons.push(`Deficit detectado (Ocupacion: ${(currentRatio * 100).toFixed(0)}% < Min: ${(targetBand.min * 100).toFixed(0)}%). Riesgo de vaciado a 1h: ${(risk.riskEmptyAt1h * 100).toFixed(0)}%.`);
		return {
			actionGroup: "receptor",
			urgency,
			reasons,
			priorityScore: calculatePriority(weight, risk.demandNextHour)
		};
	}
	if (classification === "peak_saturation" && currentRatio >= targetBand.max) {
		reasons.push(`Retirada preventiva antes de hora punta para evitar saturacion.`);
		return {
			actionGroup: "peak_remove",
			urgency: "medium",
			reasons,
			priorityScore: calculatePriority(.6, risk.demandNextHour)
		};
	}
	if (classification === "peak_emptying" && currentRatio <= targetBand.min) {
		reasons.push(`Pre-reposicion antes de hora punta para evitar vaciado.`);
		return {
			actionGroup: "peak_fill",
			urgency: "medium",
			reasons,
			priorityScore: calculatePriority(.6, risk.demandNextHour)
		};
	}
	reasons.push(`Operacion normal dentro de parametros aceptables.`);
	return {
		actionGroup: "stable",
		urgency: "none",
		reasons,
		priorityScore: 0
	};
}
//#endregion
//#region src/lib/rebalancing-matching.ts
var DEFAULT_LOGISTICS_CONFIG = {
	vehicleCapacity: 20,
	maxTransferDistanceMeters: 3e3,
	costPerKm: 2.5,
	minBikesToMove: 2
};
function computeTransfers(diagnostics, stations = [], config = DEFAULT_LOGISTICS_CONFIG) {
	const transfers = [];
	const donors = diagnostics.filter((d) => d.actionGroup === "donor" || d.actionGroup === "peak_remove").sort((a, b) => b.priorityScore - a.priorityScore);
	const receptors = diagnostics.filter((d) => d.actionGroup === "receptor" || d.actionGroup === "peak_fill").sort((a, b) => b.priorityScore - a.priorityScore);
	const availableToDonate = /* @__PURE__ */ new Map();
	for (const d of donors) {
		const surplus = d.currentBikes - Math.round(d.targetBand.max * d.capacity);
		availableToDonate.set(d.stationId, Math.max(0, surplus));
	}
	const needToReceive = /* @__PURE__ */ new Map();
	for (const r of receptors) {
		const deficit = Math.round(r.targetBand.min * r.capacity) - r.currentBikes;
		needToReceive.set(r.stationId, Math.max(0, deficit));
	}
	for (const receptor of receptors) {
		let deficit = needToReceive.get(receptor.stationId) ?? 0;
		if (deficit < config.minBikesToMove) continue;
		const receptorCoords = stations.find((s) => s.id === receptor.stationId) ?? null;
		let bestDonor = null;
		let bestScore = -1;
		let distanceToBest = 0;
		for (const donor of donors) {
			if ((availableToDonate.get(donor.stationId) ?? 0) < config.minBikesToMove) continue;
			const donorCoords = stations.find((s) => s.id === donor.stationId) ?? null;
			const distance = receptorCoords && donorCoords ? haversineDistanceMeters({
				latitude: receptorCoords.lat,
				longitude: receptorCoords.lon
			}, {
				latitude: donorCoords.lat,
				longitude: donorCoords.lon
			}) : donor.network.nearbyStations.find((n) => n.stationId === receptor.stationId)?.distanceMeters ?? Number.POSITIVE_INFINITY;
			if (distance > config.maxTransferDistanceMeters) continue;
			const distanceScore = 1 - distance / config.maxTransferDistanceMeters;
			const districtBonus = donor.districtName === receptor.districtName ? .2 : 0;
			const matchScore = donor.priorityScore * .5 + distanceScore * .4 + districtBonus;
			if (matchScore > bestScore) {
				bestScore = matchScore;
				bestDonor = donor;
				distanceToBest = distance;
			}
		}
		if (bestDonor) {
			const surplus = availableToDonate.get(bestDonor.stationId) ?? 0;
			const bikesToMove = Math.min(surplus, deficit, config.vehicleCapacity);
			availableToDonate.set(bestDonor.stationId, surplus - bikesToMove);
			needToReceive.set(receptor.stationId, deficit - bikesToMove);
			deficit -= bikesToMove;
			const logisticsScore = Math.max(0, 1 - distanceToBest / config.maxTransferDistanceMeters);
			const costScore = Number((distanceToBest / 1e3 * config.costPerKm).toFixed(2));
			const emptiesAvoided = Math.round(receptor.risk.riskEmptyAt1h * bikesToMove);
			const fullsAvoided = Math.round(bestDonor.risk.riskFullAt1h * bikesToMove);
			const usesRecovered = Math.round(emptiesAvoided * (receptor.risk.demandNextHour || 1));
			transfers.push({
				originStationId: bestDonor.stationId,
				originStationName: bestDonor.stationName,
				destinationStationId: receptor.stationId,
				destinationStationName: receptor.stationName,
				bikesToMove,
				timeWindow: {
					start: "Ahora",
					end: "+60 min"
				},
				expectedImpact: {
					emptiesAvoided,
					fullsAvoided,
					usesRecovered,
					costScore
				},
				matchScore: Number(bestScore.toFixed(2)),
				logisticsScore: Number(logisticsScore.toFixed(2)),
				confidence: Number(((bestDonor.risk.confidence + receptor.risk.confidence) / 2).toFixed(2)),
				reasons: [`Distancia optima (${Math.round(distanceToBest)}m)`, `Resuelve deficit critico en ${receptor.stationName} y sobrestock en ${bestDonor.stationName}`]
			});
		}
	}
	return transfers;
}
//#endregion
//#region src/lib/rebalancing-impact.ts
function computeReportImpact(diagnostics, transfers) {
	let sumPctEmpty = 0;
	let sumPctFull = 0;
	let sumCriticalDuration = 0;
	let totalRotation = 0;
	let estimatedLostUses = 0;
	for (const d of diagnostics) {
		sumPctEmpty += d.globalMetrics.pctTimeEmpty;
		sumPctFull += d.globalMetrics.pctTimeFull;
		sumCriticalDuration += d.globalMetrics.criticalEpisodeAvgMinutes;
		totalRotation += d.globalMetrics.rotation;
		estimatedLostUses += d.globalMetrics.unsatisfiedDemandProxy;
	}
	const stationCount = Math.max(1, diagnostics.length);
	const service = {
		pctTimeEmpty: Number((sumPctEmpty / stationCount).toFixed(4)),
		pctTimeFull: Number((sumPctFull / stationCount).toFixed(4)),
		systemPctTimeEmpty: Number((sumPctEmpty / stationCount).toFixed(4)),
		systemPctTimeFull: Number((sumPctFull / stationCount).toFixed(4)),
		avgCriticalEpisodeMinutes: Number((sumCriticalDuration / stationCount).toFixed(1)),
		totalRotation: Math.round(totalRotation),
		estimatedLostUses: Math.round(estimatedLostUses)
	};
	const totalBikesMoved = transfers.reduce((acc, t) => acc + t.bikesToMove, 0);
	const totalCostScore = transfers.reduce((acc, t) => acc + t.expectedImpact.costScore, 0);
	const avgCostPerTransfer = transfers.length > 0 ? totalCostScore / transfers.length : 0;
	const operation = {
		suggestedTransfers: transfers.length,
		totalBikesMoved,
		totalCostScore: Number(totalCostScore.toFixed(2)),
		avgCostPerTransfer: Number(avgCostPerTransfer.toFixed(2))
	};
	const totalEmptiesAvoided = transfers.reduce((acc, t) => acc + t.expectedImpact.emptiesAvoided, 0);
	const totalFullsAvoided = transfers.reduce((acc, t) => acc + t.expectedImpact.fullsAvoided, 0);
	const totalUsesRecovered = transfers.reduce((acc, t) => acc + t.expectedImpact.usesRecovered, 0);
	const totalIncidents = totalEmptiesAvoided + totalFullsAvoided;
	const costPerIncidentAvoided = totalIncidents > 0 ? totalCostScore / totalIncidents : 0;
	const impact = {
		totalEmptiesAvoided,
		totalFullsAvoided,
		totalUsesRecovered,
		costPerIncidentAvoided: Number(costPerIncidentAvoided.toFixed(2)),
		improvementVsBaseline: 0,
		improvementVsBaselinePct: null
	};
	const doNothing = {
		label: "Sin intervención",
		totalMoves: 0,
		emptiesAvoided: 0,
		fullsAvoided: 0,
		totalEmptiesAvoided: 0,
		totalFullsAvoided: 0,
		totalUsesRecovered: 0,
		costPerIncidentAvoided: 0,
		improvementVsBaseline: 0,
		improvementVsBaselinePct: 0
	};
	let simpleEmptiesAvoided = 0;
	let simpleFullsAvoided = 0;
	for (const d of diagnostics) {
		const ratio = d.capacity > 0 ? d.currentBikes / d.capacity : 0;
		if (ratio < .2) simpleEmptiesAvoided += Math.round(d.risk.riskEmptyAt1h * 2);
		if (ratio > .8) simpleFullsAvoided += Math.round(d.risk.riskFullAt1h * 2);
	}
	const simpleCost = (simpleEmptiesAvoided + simpleFullsAvoided) * 1.5;
	const simpleRules = {
		label: "Reglas simples",
		totalMoves: Math.round((simpleEmptiesAvoided + simpleFullsAvoided) / 2),
		emptiesAvoided: simpleEmptiesAvoided,
		fullsAvoided: simpleFullsAvoided,
		totalEmptiesAvoided: simpleEmptiesAvoided,
		totalFullsAvoided: simpleFullsAvoided,
		totalUsesRecovered: Math.round(simpleEmptiesAvoided * 2),
		costPerIncidentAvoided: Number((simpleCost / Math.max(1, simpleEmptiesAvoided + simpleFullsAvoided)).toFixed(2)),
		improvementVsBaseline: 0,
		improvementVsBaselinePct: 0
	};
	const ourIncidents = impact.totalEmptiesAvoided + impact.totalFullsAvoided;
	const simpleIncidents = simpleRules.totalEmptiesAvoided + simpleRules.totalFullsAvoided;
	if (simpleIncidents > 0) impact.improvementVsBaseline = Number(((ourIncidents - simpleIncidents) / simpleIncidents).toFixed(2));
	else if (ourIncidents > 0) impact.improvementVsBaseline = 1;
	impact.improvementVsBaselinePct = Number((impact.improvementVsBaseline * 100).toFixed(1));
	return {
		kpis: {
			service,
			operation,
			impact
		},
		baselineComparison: {
			doNothing,
			simpleRules,
			recommended: {
				label: "Sistema recomendado",
				totalMoves: transfers.length,
				emptiesAvoided: impact.totalEmptiesAvoided,
				fullsAvoided: impact.totalFullsAvoided,
				...impact
			}
		}
	};
}
//#endregion
//#region src/lib/rebalancing-report.ts
async function buildRebalancingReport(options = {}) {
	const days = options.days ?? 15;
	const baseReport = await withCache(`rebalancing-report:days=${days}:base`, 300, async () => {
		const [stations, globalMetricsMap, timeBandMetricsMap, episodesMap, districtsCollection] = await Promise.all([
			getStationsWithLatestStatus(),
			getStationGlobalMetrics(days),
			getStationTimeBandMetrics(days),
			getCriticalEpisodes(days),
			fetchDistrictCollection().catch(() => null)
		]);
		const patternsBulk = await getStationPatternsBulk(stations.map((s) => s.id));
		const patternsByStation = /* @__PURE__ */ new Map();
		for (const p of patternsBulk) {
			if (!patternsByStation.has(p.stationId)) patternsByStation.set(p.stationId, []);
			patternsByStation.get(p.stationId).push(p);
		}
		const stationDistrictMap = districtsCollection ? buildStationDistrictMap(stations.map((s) => ({
			id: s.id,
			lon: s.lon,
			lat: s.lat
		})), districtsCollection) : /* @__PURE__ */ new Map();
		const stationCoords = stations.map((s) => ({
			id: s.id,
			lat: s.lat,
			lon: s.lon
		}));
		const distanceMatrix = await getStationDistanceMatrix(stationCoords, DEFAULT_LOGISTICS_CONFIG.maxTransferDistanceMeters);
		const now = /* @__PURE__ */ new Date();
		const currentTimeBand = getCurrentTimeBand(now.getHours());
		const diagnostics = [];
		for (const station of stations) {
			const globalMetrics = globalMetricsMap[station.id];
			if (!globalMetrics) continue;
			const timeBandMetrics = timeBandMetricsMap[station.id] || [];
			const episodes = episodesMap[station.id];
			if (episodes) globalMetrics.criticalEpisodeAvgMinutes = (episodes.avgEmptyEpisodeMinutes + episodes.avgFullEpisodeMinutes) / 2;
			const patterns = patternsByStation.get(station.id) || [];
			const districtName = stationDistrictMap.get(station.id) ?? null;
			const { type: inferredType } = inferStationType(patterns);
			const targetBand = getTargetBand(inferredType, currentTimeBand);
			const { classification, reasons: classificationReasons } = classifyStation(station.capacity, station.bikesAvailable, station.anchorsFree, globalMetrics, timeBandMetrics, targetBand, globalMetricsMap);
			const risk = assessStationRisk(station, patterns, timeBandMetrics, targetBand, now);
			const rawNeighbors = distanceMatrix.get(station.id) || [];
			const network = buildNetworkContext(station.id, station.capacity > 0 ? station.bikesAvailable / station.capacity : 0, rawNeighbors, globalMetricsMap);
			const { actionGroup, urgency, reasons: actionReasons, priorityScore } = decideAction({
				stationId: station.id,
				capacity: station.capacity,
				currentBikes: station.bikesAvailable,
				risk,
				classification,
				network,
				targetBand,
				currentTimeBand
			});
			diagnostics.push({
				stationId: station.id,
				stationName: station.name,
				districtName,
				capacity: station.capacity,
				currentBikes: station.bikesAvailable,
				currentAnchors: station.anchorsFree,
				currentOccupancy: station.capacity > 0 ? station.bikesAvailable / station.capacity : 0,
				inferredType,
				classification,
				classificationReasons,
				globalMetrics,
				timeBandMetrics,
				targetBand,
				currentTimeBand,
				risk,
				network,
				actionGroup,
				actionReasons,
				urgency,
				priorityScore
			});
		}
		const transfers = computeTransfers(diagnostics, stationCoords, DEFAULT_LOGISTICS_CONFIG);
		const { kpis, baselineComparison } = computeReportImpact(diagnostics, transfers);
		diagnostics.sort((a, b) => b.priorityScore - a.priorityScore);
		const summary = {
			totalStations: diagnostics.length,
			byClassification: {
				overstock: diagnostics.filter((d) => d.classification === "overstock").length,
				deficit: diagnostics.filter((d) => d.classification === "deficit").length,
				peak_saturation: diagnostics.filter((d) => d.classification === "peak_saturation").length,
				peak_emptying: diagnostics.filter((d) => d.classification === "peak_emptying").length,
				balanced: diagnostics.filter((d) => d.classification === "balanced").length,
				data_review: diagnostics.filter((d) => d.classification === "data_review").length
			},
			byAction: {
				donor: diagnostics.filter((d) => d.actionGroup === "donor").length,
				receptor: diagnostics.filter((d) => d.actionGroup === "receptor").length,
				peak_remove: diagnostics.filter((d) => d.actionGroup === "peak_remove").length,
				peak_fill: diagnostics.filter((d) => d.actionGroup === "peak_fill").length,
				stable: diagnostics.filter((d) => d.actionGroup === "stable").length,
				review: diagnostics.filter((d) => d.actionGroup === "review").length
			},
			criticalUrgencyCount: diagnostics.filter((d) => d.urgency === "critical").length,
			highUrgencyCount: diagnostics.filter((d) => d.urgency === "high").length,
			stationsWithTransfer: new Set(transfers.flatMap((t) => [t.originStationId, t.destinationStationId])).size
		};
		return {
			generatedAt: now.toISOString(),
			modelVersion: "historical-baseline-v1-rebalancing",
			analysisWindowDays: days,
			districtFilter: options.district ?? null,
			summary,
			diagnostics,
			transfers,
			kpis,
			baselineComparison
		};
	});
	if (!options.district || options.district === "all") return {
		...baseReport,
		districtFilter: null
	};
	const diagnostics = baseReport.diagnostics.filter((d) => d.districtName === options.district);
	const stationSet = new Set(diagnostics.map((d) => d.stationId));
	const transfers = baseReport.transfers.filter((t) => stationSet.has(t.originStationId) || stationSet.has(t.destinationStationId));
	const summary = {
		totalStations: diagnostics.length,
		byClassification: {
			overstock: diagnostics.filter((d) => d.classification === "overstock").length,
			deficit: diagnostics.filter((d) => d.classification === "deficit").length,
			peak_saturation: diagnostics.filter((d) => d.classification === "peak_saturation").length,
			peak_emptying: diagnostics.filter((d) => d.classification === "peak_emptying").length,
			balanced: diagnostics.filter((d) => d.classification === "balanced").length,
			data_review: diagnostics.filter((d) => d.classification === "data_review").length
		},
		byAction: {
			donor: diagnostics.filter((d) => d.actionGroup === "donor").length,
			receptor: diagnostics.filter((d) => d.actionGroup === "receptor").length,
			peak_remove: diagnostics.filter((d) => d.actionGroup === "peak_remove").length,
			peak_fill: diagnostics.filter((d) => d.actionGroup === "peak_fill").length,
			stable: diagnostics.filter((d) => d.actionGroup === "stable").length,
			review: diagnostics.filter((d) => d.actionGroup === "review").length
		},
		criticalUrgencyCount: diagnostics.filter((d) => d.urgency === "critical").length,
		highUrgencyCount: diagnostics.filter((d) => d.urgency === "high").length,
		stationsWithTransfer: diagnostics.filter((d) => transfers.some((t) => t.originStationId === d.stationId || t.destinationStationId === d.stationId)).length
	};
	return {
		...baseReport,
		districtFilter: options.district,
		diagnostics,
		transfers,
		summary
	};
}
//#endregion
export { buildRebalancingReport as t };

//# sourceMappingURL=rebalancing-report-BZDw2F4y.js.map