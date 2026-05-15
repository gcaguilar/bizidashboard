import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { f as getSiteUrl, r as appRoutes, s as SITE_NAME } from "./routes-CFkMZBCM.js";
import { n as createRootBreadcrumbs, t as buildBreadcrumbStructuredData } from "./breadcrumbs-tXG_cMah.js";
import { a as resolveActiveMonth, i as normalizeMonthSearchParam } from "./months-CotCm8RF.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
import { z } from "zod";
//#region src/server-functions/dashboard-conclusiones.ts?tss-serverfn-split
var ConclusionsSearchParamsSchema = z.object({ month: z.union([z.string(), z.array(z.string())]).optional() }).default({});
function buildFallbackPayload() {
	return {
		dateKey: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		selectedMonth: null,
		sourceFirstDay: null,
		sourceLastDay: null,
		totalHistoricalDays: 0,
		stationsWithData: 0,
		activeStations: 0,
		metrics: {
			demandLast7Days: 0,
			demandPrevious7Days: 0,
			demandDeltaRatio: null,
			occupancyLast7Days: 0,
			occupancyPrevious7Days: 0,
			occupancyDeltaRatio: null
		},
		summary: "Todavia no hay historico suficiente para generar conclusiones de movilidad.",
		highlights: [],
		recommendations: ["Recoge al menos varios dias de datos para habilitar recomendaciones operativas."],
		peakDemandHours: [],
		topDistrictsByDemand: [],
		topStationsByDemand: [],
		leastUsedStations: [],
		weekdayWeekendProfile: {
			weekday: {
				avgDemand: 0,
				avgOccupancy: 0,
				daysCount: 0
			},
			weekend: {
				avgDemand: 0,
				avgOccupancy: 0,
				daysCount: 0
			},
			demandGapRatio: null,
			dominantPeriod: null
		}
	};
}
var getDashboardConclusionsPageData_createServerFn_handler = createServerRpc({
	id: "e14cbb00cd4fa5986b5e4962968e9745a8544f807387b1991c79f6a48ca00c1e",
	name: "getDashboardConclusionsPageData",
	filename: "src/server-functions/dashboard-conclusiones.ts"
}, (opts) => getDashboardConclusionsPageData.__executeServer(opts));
var getDashboardConclusionsPageData = createServerFn({ method: "GET" }).inputValidator(ConclusionsSearchParamsSchema).handler(getDashboardConclusionsPageData_createServerFn_handler, async ({ data: searchParams }) => {
	const [{ fetchAvailableDataMonths }, { getDailyMobilityConclusions }] = await Promise.all([import("./api-Yqzm2GiC.js"), import("./mobility-conclusions-C_5yF5rZ.js")]);
	const siteUrl = getSiteUrl();
	const fallbackPayload = buildFallbackPayload();
	const availableMonths = await fetchAvailableDataMonths().catch(() => ({
		months: [],
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	}));
	const activeMonth = resolveActiveMonth(availableMonths.months, normalizeMonthSearchParam(searchParams?.month));
	const { payload, fromCache } = await getDailyMobilityConclusions(activeMonth).catch(() => ({
		payload: fallbackPayload,
		fromCache: false
	}));
	const breadcrumbs = createRootBreadcrumbs({
		label: "Dashboard",
		href: appRoutes.dashboard()
	}, {
		label: "Conclusiones",
		href: appRoutes.dashboardConclusions()
	});
	return {
		payload,
		fromCache,
		availableMonths,
		activeMonth,
		breadcrumbs,
		structuredData: {
			"@context": "https://schema.org",
			"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
				"@type": "Report",
				name: "Conclusiones de movilidad en Zaragoza",
				description: payload.summary,
				datePublished: payload.generatedAt,
				dateModified: payload.generatedAt,
				inLanguage: "es",
				publisher: {
					"@type": "Organization",
					name: SITE_NAME,
					url: siteUrl
				},
				about: {
					"@type": "Dataset",
					name: "Movilidad urbana de Bizi Zaragoza",
					distribution: [{
						"@type": "DataDownload",
						encodingFormat: "application/json",
						contentUrl: `${siteUrl}${appRoutes.api.history()}`
					}]
				}
			}]
		}
	};
});
//#endregion
export { getDashboardConclusionsPageData_createServerFn_handler };

//# sourceMappingURL=dashboard-conclusiones-CChHVe8h.js.map