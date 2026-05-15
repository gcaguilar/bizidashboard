import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { f as getSiteUrl, l as getCityName, r as appRoutes, s as SITE_NAME } from "./routes-CFkMZBCM.js";
import { n as createRootBreadcrumbs, t as buildBreadcrumbStructuredData } from "./breadcrumbs-tXG_cMah.js";
import { r as isValidMonthKey } from "./months-CotCm8RF.js";
import { n as FAQ_ITEMS } from "./help-center-content-YBMHH1Sc.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/metodologia.ts?tss-serverfn-split
var FAQ_IDS = [
	"fuente-datos",
	"actualizacion",
	"demanda-no-viajes-reales",
	"prediccion-que-es"
];
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
function getMethodologyFaqItems() {
	return FAQ_IDS.flatMap((id) => FAQ_ITEMS.filter((item) => item.id === id));
}
var getMethodologyPageData_createServerFn_handler = createServerRpc({
	id: "c0c5da713c439bcbb02ef22c145b5ad04b5547afe2bc5c7f7abdfb47c772240c",
	name: "getMethodologyPageData",
	filename: "src/server-functions/metodologia.ts"
}, (opts) => getMethodologyPageData.__executeServer(opts));
var getMethodologyPageData = createServerFn({ method: "GET" }).handler(getMethodologyPageData_createServerFn_handler, async () => {
	const [api, fallbacks, sharedData] = await Promise.all([
		import("./api-Yqzm2GiC.js"),
		import("./shared-data-fallbacks-M_Upqoba.js"),
		import("./shared-data-TTqMJUU8.js")
	]);
	const { fetchAvailableDataMonths, fetchHistoryMetadata, fetchSharedDatasetSnapshot, fetchStatus } = api;
	const { buildFallbackAvailableMonths, buildFallbackDatasetSnapshot, buildFallbackStatus } = fallbacks;
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const [historyMeta, dataset, status, monthsResponse] = await Promise.all([
		fetchHistoryMetadata().catch(() => buildFallbackHistoryMetadata(nowIso, sharedData.getSharedDataSource())),
		fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
		fetchStatus().catch(() => buildFallbackStatus(nowIso)),
		fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso))
	]);
	const months = monthsResponse.months.filter(isValidMonthKey);
	const latestMonth = months[0] ?? null;
	const cityName = getCityName();
	const siteUrl = getSiteUrl();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Metodologia",
		href: appRoutes.methodology()
	});
	const faqItems = getMethodologyFaqItems();
	return {
		historyMeta,
		dataset,
		status,
		months,
		latestMonth,
		breadcrumbs,
		faqItems,
		structuredData: {
			"@context": "https://schema.org",
			"@graph": [
				buildBreadcrumbStructuredData(breadcrumbs),
				{
					"@type": "TechArticle",
					headline: `Metodologia y calidad de datos de Bizi ${cityName}`,
					name: `Metodologia y calidad de datos de Bizi ${cityName}`,
					description: "Guia publica para interpretar la fuente, la cobertura, la frecuencia y las metricas de las paginas publicas de DatosBizi.",
					url: `${siteUrl}${appRoutes.methodology()}`,
					inLanguage: "es",
					dateModified: dataset.coverage.generatedAt ?? historyMeta.generatedAt ?? nowIso,
					author: {
						"@type": "Organization",
						name: SITE_NAME,
						url: siteUrl
					},
					publisher: {
						"@type": "Organization",
						name: SITE_NAME,
						url: siteUrl
					}
				},
				{
					"@type": "Dataset",
					name: `Dataset Bizi ${cityName}`,
					description: "Cobertura historica, snapshot actual y criterios de interpretacion del dataset usado por estaciones, barrios, informes y API.",
					url: `${siteUrl}${appRoutes.methodology()}`,
					inLanguage: "es",
					isAccessibleForFree: true,
					dateModified: dataset.coverage.generatedAt,
					distribution: [{
						"@type": "DataDownload",
						name: "OpenAPI JSON",
						encodingFormat: "application/json",
						contentUrl: `${siteUrl}${appRoutes.api.openApi()}`
					}, {
						"@type": "DataDownload",
						name: "Historico CSV",
						encodingFormat: "text/csv",
						contentUrl: `${siteUrl}${appRoutes.api.historyCsv()}`
					}]
				},
				{
					"@type": "FAQPage",
					mainEntity: faqItems.map((item) => ({
						"@type": "Question",
						name: item.question,
						acceptedAnswer: {
							"@type": "Answer",
							text: item.answer
						}
					}))
				}
			]
		}
	};
});
//#endregion
export { getMethodologyPageData_createServerFn_handler };

//# sourceMappingURL=metodologia-0W6V_lq7.js.map