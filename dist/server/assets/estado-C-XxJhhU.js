import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { n as buildSystemIncidents, t as buildSystemCapabilities } from "./system-status-BnLkTU-r.js";
import { r as isValidMonthKey } from "./months-CotCm8RF.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/estado.ts?tss-serverfn-split
var getSystemStatusPageData_createServerFn_handler = createServerRpc({
	id: "147ad74b602921a748fa48795bb7b08c723411824c9d26fde2ee6a409f1e721d",
	name: "getSystemStatusPageData",
	filename: "src/server-functions/estado.ts"
}, (opts) => getSystemStatusPageData.__executeServer(opts));
var getSystemStatusPageData = createServerFn({ method: "GET" }).handler(getSystemStatusPageData_createServerFn_handler, async () => {
	const [api, fallbacks] = await Promise.all([import("./api-Yqzm2GiC.js"), import("./shared-data-fallbacks-M_Upqoba.js")]);
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const [status, stations, dataset, availableMonths] = await Promise.all([
		api.fetchStatus().catch(() => fallbacks.buildFallbackStatus(nowIso)),
		api.fetchStations().catch(() => fallbacks.buildFallbackStations(nowIso)),
		api.fetchSharedDatasetSnapshot().catch(() => fallbacks.buildFallbackDatasetSnapshot(nowIso)),
		api.fetchAvailableDataMonths().catch(() => fallbacks.buildFallbackAvailableMonths(nowIso))
	]);
	const months = availableMonths.months.filter(isValidMonthKey);
	const latestMonth = months[0] ?? null;
	const incidents = buildSystemIncidents(status, dataset);
	return {
		status,
		stations,
		dataset,
		availableMonths,
		months,
		latestMonth,
		incidents,
		capabilities: buildSystemCapabilities(status, dataset, stations),
		activeIncidentCount: incidents.filter((incident) => incident.severity !== "healthy").length,
		activeStationsCount: Math.max(stations.stations.length, status.quality.volume.recentStationCount)
	};
});
//#endregion
export { getSystemStatusPageData_createServerFn_handler };

//# sourceMappingURL=estado-C-XxJhhU.js.map