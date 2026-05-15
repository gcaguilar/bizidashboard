import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/dashboard-alertas.ts?tss-serverfn-split
var getAlertsHistoryPageData_createServerFn_handler = createServerRpc({
	id: "11dcf17e9b708291fd9c9de38dc41400f5fd9c701b169868a9374fcd97ad78f9",
	name: "getAlertsHistoryPageData",
	filename: "src/server-functions/dashboard-alertas.ts"
}, (opts) => getAlertsHistoryPageData.__executeServer(opts));
var getAlertsHistoryPageData = createServerFn({ method: "GET" }).handler(getAlertsHistoryPageData_createServerFn_handler, async () => {
	const { fetchStations } = await import("./api-Yqzm2GiC.js");
	return { stations: await fetchStations().catch(() => ({
		stations: [],
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	})) };
});
//#endregion
export { getAlertsHistoryPageData_createServerFn_handler };

//# sourceMappingURL=dashboard-alertas-BGPBLsBn.js.map