import { i as DayType } from "./types-DbADi-Xa.js";
import { f as getLocalBucket, s as getStationPatterns, u as getStationsWithLatestStatus } from "./read-BIJZag-j.js";
//#region src/lib/predictions.ts
var MODEL_VERSION = "historical-baseline-v1";
var PREDICTION_HORIZONS = [30, 60];
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
function normalizeDayType(value) {
	if (value === DayType.WEEKDAY || value === "WEEKDAY") return DayType.WEEKDAY;
	if (value === DayType.WEEKEND || value === "WEEKEND") return DayType.WEEKEND;
	return null;
}
function roundPrediction(value) {
	return Math.round(value);
}
function toEmptyPredictions(stationId) {
	return {
		stationId,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		modelVersion: null,
		predictions: PREDICTION_HORIZONS.map((horizonMinutes) => ({
			horizonMinutes,
			predictedBikesAvailable: null,
			predictedAnchorsFree: null,
			confidence: null
		}))
	};
}
function resolvePattern(rows, dayType, hour) {
	return rows.find((row) => normalizeDayType(row.dayType) === dayType && row.hour === hour) ?? null;
}
function computeConfidence(currentPattern, futurePattern) {
	const sampleCount = (currentPattern?.sampleCount ?? 0) + (futurePattern?.sampleCount ?? 0);
	if (sampleCount <= 0) return null;
	const confidence = .42 + Math.min(sampleCount, 120) / 240;
	return Number(clamp(confidence, .42, .92).toFixed(2));
}
function predictPoint(context, horizonMinutes, now) {
	const currentBucket = getLocalBucket(now);
	const futureBucket = getLocalBucket(new Date(now.getTime() + horizonMinutes * 6e4));
	const currentPattern = resolvePattern(context.patterns, currentBucket.dayType, currentBucket.hour);
	const futurePattern = resolvePattern(context.patterns, futureBucket.dayType, futureBucket.hour);
	if (!futurePattern) return {
		horizonMinutes,
		predictedBikesAvailable: null,
		predictedAnchorsFree: null,
		confidence: null
	};
	const capacity = Math.max(0, context.capacity);
	if (capacity <= 0) return {
		horizonMinutes,
		predictedBikesAvailable: 0,
		predictedAnchorsFree: 0,
		confidence: computeConfidence(currentPattern, futurePattern)
	};
	const currentRatio = clamp(context.bikesAvailable, 0, capacity) / capacity;
	const currentPatternRatio = clamp(currentPattern?.occupancyAvg ?? currentRatio, 0, 1);
	const expectedDelta = clamp(futurePattern.occupancyAvg, 0, 1) - currentPatternRatio;
	const recencyWeight = horizonMinutes === 30 ? .7 : .48;
	const predictedBikes = roundPrediction(clamp(clamp(currentRatio * recencyWeight + (currentRatio + expectedDelta) * (1 - recencyWeight), 0, 1) * capacity, 0, capacity));
	return {
		horizonMinutes,
		predictedBikesAvailable: predictedBikes,
		predictedAnchorsFree: roundPrediction(clamp(capacity - predictedBikes, 0, capacity)),
		confidence: computeConfidence(currentPattern, futurePattern)
	};
}
function estimateStationPredictions(context, now = /* @__PURE__ */ new Date()) {
	if (context.patterns.length === 0) return toEmptyPredictions(context.stationId);
	return {
		stationId: context.stationId,
		generatedAt: now.toISOString(),
		modelVersion: MODEL_VERSION,
		predictions: PREDICTION_HORIZONS.map((horizonMinutes) => predictPoint(context, horizonMinutes, now))
	};
}
async function getStationPredictions(stationId, now = /* @__PURE__ */ new Date()) {
	const [stations, patterns] = await Promise.all([getStationsWithLatestStatus(), getStationPatterns(stationId)]);
	const station = stations.find((entry) => entry.id === stationId);
	if (!station) return null;
	return estimateStationPredictions({
		stationId,
		capacity: station.capacity,
		bikesAvailable: station.bikesAvailable,
		anchorsFree: station.anchorsFree,
		patterns
	}, now);
}
function getEmptyStationPredictions(stationId) {
	return toEmptyPredictions(stationId);
}
//#endregion
export { getEmptyStationPredictions as n, getStationPredictions as r, estimateStationPredictions as t };

//# sourceMappingURL=predictions-Bb_NDCaZ.js.map