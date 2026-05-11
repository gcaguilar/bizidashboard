import { r as AlertType } from "./types-DMKIRG7H.js";
//#region src/lib/format.ts
function formatInteger(value) {
	return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value);
}
function formatRelativeMinutes(minutes) {
	if (minutes === null || minutes === void 0 || Number.isNaN(minutes)) return "sin datos";
	const safeMinutes = Math.max(0, Math.round(minutes));
	if (safeMinutes < 1) return "hace menos de 1 min";
	if (safeMinutes < 60) return `hace ${safeMinutes} min`;
	const hours = Math.round(safeMinutes / 60);
	return hours === 1 ? "hace 1 h" : `hace ${hours} h`;
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
//#endregion
export { formatRelativeMinutes as i, formatInteger as n, formatPercent as r, formatAlertType as t };
