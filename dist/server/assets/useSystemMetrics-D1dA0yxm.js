import { useMemo } from "react";
//#region src/app/dashboard/_components/useSystemMetrics.ts
function occupancyRatio(station) {
	if (!Number.isFinite(station.capacity) || station.capacity <= 0) return 0;
	return Math.max(0, Math.min(1, station.bikesAvailable / station.capacity));
}
function calculateFrictionScore(emptyHours, fullHours) {
	return Math.max(0, emptyHours) + Math.max(0, fullHours);
}
function calculateBalanceIndex(stations) {
	const valid = stations.filter((station) => Number.isFinite(station.capacity) && station.capacity > 0);
	if (valid.length === 0) return 0;
	const deviation = valid.reduce((sum, station) => sum + Math.abs(occupancyRatio(station) - .5), 0);
	return Math.max(0, Math.min(1, 1 - 2 / valid.length * deviation));
}
function useSystemMetrics({ stations, rankings, alerts, status }) {
	return useMemo(() => {
		const totalStations = stations.length;
		const bikesAvailable = stations.reduce((sum, station) => sum + Math.max(0, station.bikesAvailable), 0);
		const anchorsFree = stations.reduce((sum, station) => sum + Math.max(0, station.anchorsFree), 0);
		const avgOccupancy = totalStations > 0 ? stations.reduce((sum, station) => sum + occupancyRatio(station), 0) / totalStations : 0;
		const balanceIndex = calculateBalanceIndex(stations);
		const criticalStations = stations.filter((station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0);
		const frictionRanking = rankings.availability.rankings.slice(0, 10).map((row) => ({
			...row,
			frictionScore: calculateFrictionScore(row.emptyHours, row.fullHours)
		}));
		const topFriction = frictionRanking[0] ?? null;
		return {
			totalStations,
			bikesAvailable,
			anchorsFree,
			avgOccupancy,
			balanceIndex,
			criticalStations,
			activeAlerts: alerts.alerts.filter((alert) => alert.isActive),
			frictionRanking,
			topFriction,
			dailyInsight: (() => {
				if (status.pipeline.healthStatus === "down") return "El sistema necesita atencion: la ultima ingesta o la calidad de datos muestran un problema claro.";
				if (criticalStations.length >= 10) return "Hay muchas estaciones en estado critico. Conviene priorizar redistribucion en las zonas mas saturadas o vacias.";
				if (balanceIndex >= .82) return "El sistema esta bastante equilibrado ahora mismo y la ocupacion media se mueve en una zona saludable.";
				if (avgOccupancy < .3) return "La red muestra una ocupacion media baja. Puede haber tension por falta de bicis en zonas clave.";
				if (avgOccupancy > .7) return "La red muestra una ocupacion media alta. Puede haber riesgo de falta de anclajes en estaciones populares.";
				return "La situacion global es estable, pero conviene vigilar las estaciones con mas horas problema para evitar friccion.";
			})()
		};
	}, [
		alerts.alerts,
		rankings.availability.rankings,
		stations,
		status.pipeline.healthStatus
	]);
}
//#endregion
export { useSystemMetrics as n, calculateFrictionScore as t };
