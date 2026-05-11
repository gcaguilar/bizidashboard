//#region src/analytics/types.ts
var DayType = /* @__PURE__ */ function(DayType) {
	DayType["WEEKDAY"] = "WEEKDAY";
	DayType["WEEKEND"] = "WEEKEND";
	return DayType;
}({});
var AlertType = /* @__PURE__ */ function(AlertType) {
	AlertType["LOW_BIKES"] = "LOW_BIKES";
	AlertType["LOW_ANCHORS"] = "LOW_ANCHORS";
	return AlertType;
}({});
var ALERT_THRESHOLDS = {
	lowBikes: 5,
	lowAnchors: 3
};
var ANALYTICS_WINDOWS = {
	rankingDays: 14,
	alertWindowHours: 3,
	rollupHourlyDelayMinutes: 10,
	rollupDailyDelayMinutes: 90
};
//#endregion
export { DayType as i, ANALYTICS_WINDOWS as n, AlertType as r, ALERT_THRESHOLDS as t };
