//#region src/lib/geo.ts
function toRadians(value) {
	return value * Math.PI / 180;
}
function haversineDistanceMeters(from, to) {
	const earthRadiusMeters = 6371e3;
	const deltaLatitude = toRadians(to.latitude - from.latitude);
	const deltaLongitude = toRadians(to.longitude - from.longitude);
	const fromLatitude = toRadians(from.latitude);
	const toLatitude = toRadians(to.latitude);
	const haversineA = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2;
	return earthRadiusMeters * (2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA)));
}
function formatDistanceMeters(value) {
	if (!Number.isFinite(value) || value === null || value === void 0) return "N/D";
	if (value < 1e3) return `${Math.round(value)} m`;
	return `${(value / 1e3).toFixed(1)} km`;
}
//#endregion
export { haversineDistanceMeters as n, formatDistanceMeters as t };
