import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { c as SITE_TITLE, f as getSiteUrl, r as appRoutes, s as SITE_NAME } from "./routes-CFkMZBCM.js";
import { n as createRootBreadcrumbs, t as buildBreadcrumbStructuredData } from "./breadcrumbs-tXG_cMah.js";
import { t as captureExceptionWithContext } from "./sentry-reporting-6fzVQr1k.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/dashboard.ts?tss-serverfn-split
function toErrorMessage(error) {
	if (error instanceof Error) return error.message;
	return String(error);
}
function isMissingTableError(error) {
	const message = toErrorMessage(error).toLowerCase();
	if (message.includes("no such table") || message.includes("p2021")) return true;
	if (error && typeof error === "object") {
		const maybeError = error;
		if (maybeError.cause && isMissingTableError(maybeError.cause)) return true;
		if (maybeError.meta?.driverAdapterError && isMissingTableError(maybeError.meta.driverAdapterError)) return true;
	}
	return false;
}
var getDashboardPageData_createServerFn_handler = createServerRpc({
	id: "53c3c38829d0db0e8ea4ec1fcd6859ec1dd8fed78f3fc1dfa4371f6bc429e767",
	name: "getDashboardPageData",
	filename: "src/server-functions/dashboard.ts"
}, (opts) => getDashboardPageData.__executeServer(opts));
var getDashboardPageData = createServerFn({ method: "GET" }).handler(getDashboardPageData_createServerFn_handler, async () => {
	const [api, fallbacks] = await Promise.all([import("./api-Yqzm2GiC.js"), import("./shared-data-fallbacks-M_Upqoba.js")]);
	const { fetchAlerts, fetchSharedDatasetSnapshot, fetchRankings, fetchStations, fetchStatus } = api;
	const { buildFallbackDatasetSnapshot, buildFallbackStatus, buildFallbackStations } = fallbacks;
	const siteUrl = getSiteUrl();
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const fallbackStations = buildFallbackStations(nowIso);
	const fallbackStatus = buildFallbackStatus(nowIso);
	const fallbackDataset = buildFallbackDatasetSnapshot(nowIso);
	const fallbackAlerts = {
		limit: 20,
		alerts: [],
		generatedAt: nowIso
	};
	const fallbackTurnover = {
		type: "turnover",
		limit: 50,
		rankings: [],
		districtSpotlight: [],
		generatedAt: nowIso,
		dataState: "no_coverage"
	};
	const fallbackAvailability = {
		type: "availability",
		limit: 50,
		rankings: [],
		districtSpotlight: [],
		generatedAt: nowIso,
		dataState: "no_coverage"
	};
	const loadErrors = [];
	const schemaMissingFlags = [];
	const withFallback = async (label, fetcher, fallback) => {
		try {
			return await fetcher();
		} catch (error) {
			const schemaMissing = isMissingTableError(error);
			captureExceptionWithContext(error, {
				area: "dashboard.ssr",
				operation: "DashboardPage.withFallback",
				tags: {
					panel: label,
					schemaMissing
				},
				extra: { label }
			});
			console.error(`[Dashboard] Error cargando ${label}:`, error);
			loadErrors.push(label);
			if (schemaMissing) schemaMissingFlags.push(true);
			return fallback;
		}
	};
	const [stations, dataset] = await Promise.all([withFallback("estaciones", fetchStations, fallbackStations), withFallback("metadatos compartidos", fetchSharedDatasetSnapshot, fallbackDataset)]);
	const rankingLimit = Math.max(50, Math.min(200, stations.stations.length > 0 ? stations.stations.length : 50));
	const [status, alerts, turnover, availability] = await Promise.all([
		withFallback("estado del sistema", fetchStatus, fallbackStatus),
		withFallback("alertas", () => fetchAlerts(20), fallbackAlerts),
		withFallback("ranking de uso", () => fetchRankings("turnover", rankingLimit), {
			...fallbackTurnover,
			limit: rankingLimit
		}),
		withFallback("ranking de disponibilidad", () => fetchRankings("availability", rankingLimit), {
			...fallbackAvailability,
			limit: rankingLimit
		})
	]);
	const initialData = {
		dataset,
		stations,
		status,
		alerts,
		rankings: {
			turnover,
			availability
		}
	};
	const isSchemaMissing = schemaMissingFlags.length > 0;
	const breadcrumbs = createRootBreadcrumbs({
		label: "Dashboard",
		href: appRoutes.dashboard()
	});
	return {
		breadcrumbs,
		initialData,
		isSchemaMissing,
		loadErrors,
		structuredData: {
			"@context": "https://schema.org",
			"@graph": [
				buildBreadcrumbStructuredData(breadcrumbs),
				{
					"@type": "WebApplication",
					name: `${SITE_TITLE} Dashboard`,
					applicationCategory: "BusinessApplication",
					operatingSystem: "Web",
					url: `${siteUrl}${appRoutes.dashboard()}`,
					description: "Panel principal de Bizi Zaragoza con estado del sistema, mapa en tiempo real, demanda, rankings y flujo urbano.",
					publisher: {
						"@type": "Organization",
						name: SITE_NAME,
						url: siteUrl
					}
				},
				{
					"@type": "Dataset",
					name: "Estado y analitica del sistema Bizi Zaragoza",
					description: "Datos agregados de estaciones, alertas, demanda, ocupacion y salud del sistema para el dashboard principal.",
					url: `${siteUrl}${appRoutes.dashboard()}`,
					distribution: [
						{
							"@type": "DataDownload",
							encodingFormat: "application/json",
							contentUrl: `${siteUrl}${appRoutes.api.stations()}`
						},
						{
							"@type": "DataDownload",
							encodingFormat: "text/csv",
							contentUrl: `${siteUrl}${appRoutes.api.stations()}?format=csv`
						},
						{
							"@type": "DataDownload",
							encodingFormat: "application/json",
							contentUrl: `${siteUrl}${appRoutes.api.status()}`
						}
					]
				}
			]
		}
	};
});
//#endregion
export { getDashboardPageData_createServerFn_handler };

//# sourceMappingURL=dashboard-Cw1rww0E.js.map