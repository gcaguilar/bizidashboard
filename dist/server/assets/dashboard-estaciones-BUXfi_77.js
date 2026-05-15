import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/dashboard-estaciones.ts?tss-serverfn-split
var getStationsDirectoryPageData_createServerFn_handler = createServerRpc({
	id: "0a5156d1d525c55699258b3d5703698ee35c110d7c00c290c72631d50b759569",
	name: "getStationsDirectoryPageData",
	filename: "src/server-functions/dashboard-estaciones.ts"
}, (opts) => getStationsDirectoryPageData.__executeServer(opts));
var getStationsDirectoryPageData = createServerFn({ method: "GET" }).handler(getStationsDirectoryPageData_createServerFn_handler, async () => {
	const [{ fetchStations }, { buildFallbackStations }] = await Promise.all([import("./api-Yqzm2GiC.js"), import("./shared-data-fallbacks-M_Upqoba.js")]);
	return { stations: await fetchStations().catch(() => buildFallbackStations((/* @__PURE__ */ new Date()).toISOString())) };
});
var getStationDetailPageData_createServerFn_handler = createServerRpc({
	id: "0be1a2a4f9142947396989b2bd788015e0fd320339b9ffa060d5df909ae7151b",
	name: "getStationDetailPageData",
	filename: "src/server-functions/dashboard-estaciones.ts"
}, (opts) => getStationDetailPageData.__executeServer(opts));
var getStationDetailPageData = createServerFn({ method: "GET" }).inputValidator((stationId) => stationId).handler(getStationDetailPageData_createServerFn_handler, async ({ data: stationId }) => {
	const [{ fetchAlerts, fetchHeatmap, fetchPatterns, fetchRankings, fetchStations }, { buildFallbackStations }] = await Promise.all([import("./api-Yqzm2GiC.js"), import("./shared-data-fallbacks-M_Upqoba.js")]);
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const stations = await fetchStations().catch(() => buildFallbackStations(nowIso));
	const station = stations.stations.find((row) => row.id === stationId) ?? null;
	const [turnover, availability, alerts, patterns, heatmap] = await Promise.all([
		fetchRankings("turnover", 20),
		fetchRankings("availability", 20),
		fetchAlerts(50),
		fetchPatterns(stationId).catch(() => []),
		fetchHeatmap(stationId).catch(() => [])
	]);
	return {
		station,
		stations: stations.stations,
		rankings: {
			turnover,
			availability
		},
		alerts,
		patterns,
		heatmap
	};
});
//#endregion
export { getStationDetailPageData_createServerFn_handler, getStationsDirectoryPageData_createServerFn_handler };

//# sourceMappingURL=dashboard-estaciones-BUXfi_77.js.map