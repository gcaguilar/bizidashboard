//#region src/lib/months.ts
var MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
function isValidMonthKey(value) {
	return typeof value === "string" && MONTH_KEY_PATTERN.test(value);
}
function normalizeMonthSearchParam(value) {
	const candidate = Array.isArray(value) ? value[0] : value;
	return isValidMonthKey(candidate) ? candidate : null;
}
function getMonthBounds(monthKey) {
	const [year, month] = monthKey.split("-").map(Number);
	const start = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1));
	const end = new Date(Date.UTC(year ?? 1970, month ?? 1, 1));
	return {
		start: start.toISOString(),
		endExclusive: end.toISOString()
	};
}
function formatMonthLabel(monthKey) {
	if (!isValidMonthKey(monthKey)) return monthKey;
	const { start } = getMonthBounds(monthKey);
	return new Date(start).toLocaleDateString("es-ES", {
		month: "long",
		year: "numeric",
		timeZone: "UTC"
	});
}
function toMonthOptions(months) {
	return months.filter(isValidMonthKey).map((key) => ({
		key,
		label: formatMonthLabel(key)
	}));
}
function resolveActiveMonth(availableMonths, value) {
	if (!value) return null;
	return availableMonths.includes(value) ? value : null;
}
//#endregion
export { resolveActiveMonth as a, normalizeMonthSearchParam as i, getMonthBounds as n, toMonthOptions as o, isValidMonthKey as r, formatMonthLabel as t };

//# sourceMappingURL=months-CotCm8RF.js.map