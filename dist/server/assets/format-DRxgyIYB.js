import { r as AlertType } from "./types-DbADi-Xa.js";
//#region src/lib/format.ts
function formatInteger(value) {
	return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value);
}
function formatDecimal(value) {
	if (value === null || value === void 0 || Number.isNaN(value)) return "—";
	return new Intl.NumberFormat("es-ES", {
		maximumFractionDigits: 1,
		minimumFractionDigits: value < 10 && value > 0 ? 1 : 0
	}).format(value);
}
function formatAlertType(alertType) {
	switch (alertType) {
		case AlertType.LOW_BIKES: return "Pocas bicis";
		case AlertType.LOW_ANCHORS: return "Pocos anclajes";
		default: return "Alerta desconocida";
	}
}
function formatPercent(value) {
	if (value === null || value === void 0 || !Number.isFinite(value)) return "0%";
	const normalized = Math.abs(value) <= 1 ? value * 100 : value;
	return `${Math.round(Math.min(100, Math.max(0, normalized)))}%`;
}
function formatHourRange(hour) {
	const nextHour = (hour + 1) % 24;
	return `${String(hour).padStart(2, "0")}:00-${String(nextHour).padStart(2, "0")}:00`;
}
function average(values) {
	if (values.length === 0) return 0;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}
//#endregion
export { formatInteger as a, formatHourRange as i, formatAlertType as n, formatPercent as o, formatDecimal as r, average as t };

//# sourceMappingURL=format-DRxgyIYB.js.map