import { r as isValidMonthKey } from "./months-CotCm8RF.js";
import { r as withCache } from "./cache-CQ9JHJ0b.js";
import { a as getHourlyMobilitySignals, d as getSystemHourlyProfile, o as getMonthlyDemandCurve, r as getDailyDemandCurve } from "./read-BIJZag-j.js";
//#region src/lib/analytics-series.ts
var LIVE_SERIES_TTL_SECONDS = 300;
var MONTHLY_SERIES_TTL_SECONDS = 1800;
function normalizeMonthKey(monthKey) {
	return monthKey && isValidMonthKey(monthKey) ? monthKey : null;
}
function normalizeDays(days) {
	return Math.max(1, Math.min(365, Math.floor(days)));
}
function normalizeMonthLimit(limitMonths) {
	return Math.max(1, Math.min(240, Math.floor(limitMonths)));
}
async function fetchCachedDailyDemandCurve(days = 30, monthKey) {
	const normalizedDays = normalizeDays(days);
	const normalizedMonth = normalizeMonthKey(monthKey);
	return withCache(`analytics:daily-demand:days=${normalizedDays}:month=${normalizedMonth ?? "all"}`, LIVE_SERIES_TTL_SECONDS, () => getDailyDemandCurve(normalizedDays, normalizedMonth ?? void 0));
}
async function fetchCachedMonthlyDemandCurve(limitMonths = 12) {
	const normalizedLimit = normalizeMonthLimit(limitMonths);
	return withCache(`analytics:monthly-demand:limit=${normalizedLimit}`, MONTHLY_SERIES_TTL_SECONDS, () => getMonthlyDemandCurve(normalizedLimit));
}
async function fetchCachedSystemHourlyProfile(days = 14, monthKey) {
	const normalizedDays = normalizeDays(days);
	const normalizedMonth = normalizeMonthKey(monthKey);
	return withCache(`analytics:system-hourly-profile:days=${normalizedDays}:month=${normalizedMonth ?? "all"}`, LIVE_SERIES_TTL_SECONDS, () => getSystemHourlyProfile(normalizedDays, normalizedMonth ?? void 0));
}
async function fetchCachedHourlyMobilitySignals(days = 14, monthKey) {
	const normalizedDays = normalizeDays(days);
	const normalizedMonth = normalizeMonthKey(monthKey);
	return withCache(`analytics:hourly-mobility-signals:days=${normalizedDays}:month=${normalizedMonth ?? "all"}`, LIVE_SERIES_TTL_SECONDS, () => getHourlyMobilitySignals(normalizedDays, normalizedMonth ?? void 0));
}
//#endregion
export { fetchCachedSystemHourlyProfile as i, fetchCachedHourlyMobilitySignals as n, fetchCachedMonthlyDemandCurve as r, fetchCachedDailyDemandCurve as t };

//# sourceMappingURL=analytics-series-CQItUK0n.js.map