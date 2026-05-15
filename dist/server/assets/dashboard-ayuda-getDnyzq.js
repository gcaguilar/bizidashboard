import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/dashboard-ayuda.ts?tss-serverfn-split
function buildFallbackHistoryMetadata(nowIso, source) {
	return {
		source,
		coverage: {
			firstRecordedAt: null,
			lastRecordedAt: null,
			totalSamples: 0,
			totalStations: 0,
			totalDays: 0,
			generatedAt: nowIso
		},
		generatedAt: nowIso
	};
}
var getDashboardHelpPageData_createServerFn_handler = createServerRpc({
	id: "646e488c0be3026872095ee83795e3920c6dcaf349f46636cc18843a729f3a63",
	name: "getDashboardHelpPageData",
	filename: "src/server-functions/dashboard-ayuda.ts"
}, (opts) => getDashboardHelpPageData.__executeServer(opts));
var getDashboardHelpPageData = createServerFn({ method: "GET" }).handler(getDashboardHelpPageData_createServerFn_handler, async () => {
	const [{ fetchHistoryMetadata }, { getSharedDataSource }] = await Promise.all([import("./api-Yqzm2GiC.js"), import("./shared-data-TTqMJUU8.js")]);
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	return { historyMeta: await fetchHistoryMetadata().catch(() => buildFallbackHistoryMetadata(nowIso, getSharedDataSource())) };
});
//#endregion
export { getDashboardHelpPageData_createServerFn_handler };

//# sourceMappingURL=dashboard-ayuda-getDnyzq.js.map