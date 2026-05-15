import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { f as getSiteUrl, r as appRoutes, s as SITE_NAME } from "./routes-CFkMZBCM.js";
import { n as createRootBreadcrumbs, t as buildBreadcrumbStructuredData } from "./breadcrumbs-tXG_cMah.js";
import { a as resolveActiveMonth, i as normalizeMonthSearchParam } from "./months-CotCm8RF.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
import { z } from "zod";
//#region src/server-functions/dashboard-flujo.ts?tss-serverfn-split
var FlowSearchParamsSchema = z.object({ month: z.union([z.string(), z.array(z.string())]).optional() }).default({});
var getDashboardFlowPageData_createServerFn_handler = createServerRpc({
	id: "04762fe687ea0dcaa2d458e8cb5d494d0477a23b4c4d628af70688f6f14bc622",
	name: "getDashboardFlowPageData",
	filename: "src/server-functions/dashboard-flujo.ts"
}, (opts) => getDashboardFlowPageData.__executeServer(opts));
var getDashboardFlowPageData = createServerFn({ method: "GET" }).inputValidator(FlowSearchParamsSchema).handler(getDashboardFlowPageData_createServerFn_handler, async ({ data: searchParams }) => {
	const { fetchAvailableDataMonths, fetchStations } = await import("./api-Yqzm2GiC.js");
	const siteUrl = getSiteUrl();
	const [stations, availableMonths] = await Promise.all([fetchStations().catch(() => ({
		stations: [],
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	})), fetchAvailableDataMonths().catch(() => ({
		months: [],
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	}))]);
	const activeMonth = resolveActiveMonth(availableMonths.months, normalizeMonthSearchParam(searchParams?.month));
	const selectedStationId = stations.stations[0]?.id ?? "";
	const breadcrumbs = createRootBreadcrumbs({
		label: "Dashboard",
		href: appRoutes.dashboard()
	}, {
		label: "Flujo",
		href: appRoutes.dashboardFlow()
	});
	return {
		stations,
		availableMonths,
		activeMonth,
		selectedStationId,
		breadcrumbs,
		structuredData: {
			"@context": "https://schema.org",
			"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
				"@type": "Dataset",
				name: "Corredores y flujo por barrios de Bizi Zaragoza",
				description: "Datos agregados de movilidad, demanda, impacto del transporte publico y flujos entre barrios para el analisis urbano.",
				url: `${siteUrl}${appRoutes.dashboardFlow()}`,
				creator: {
					"@type": "Organization",
					name: SITE_NAME,
					url: siteUrl
				},
				distribution: [{
					"@type": "DataDownload",
					encodingFormat: "application/json",
					contentUrl: `${siteUrl}${appRoutes.api.mobility()}`
				}, {
					"@type": "DataDownload",
					encodingFormat: "application/json",
					contentUrl: `${siteUrl}${appRoutes.api.history()}`
				}]
			}]
		}
	};
});
//#endregion
export { getDashboardFlowPageData_createServerFn_handler };

//# sourceMappingURL=dashboard-flujo-DacjQVPB.js.map