import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { f as getSiteUrl, r as appRoutes, s as SITE_NAME } from "./routes-CFkMZBCM.js";
import { n as createRootBreadcrumbs, t as buildBreadcrumbStructuredData } from "./breadcrumbs-tXG_cMah.js";
import { t as buildItemListStructuredData } from "./structured-data-Dle5VHpv.js";
import { t as captureExceptionWithContext } from "./sentry-reporting-6fzVQr1k.js";
import { r as resolveDataState, t as combineDataStates } from "./data-state-UX6jPIR_.js";
import { r as isValidMonthKey, t as formatMonthLabel } from "./months-CotCm8RF.js";
import { n as buildFallbackDatasetSnapshot } from "./shared-data-fallbacks-BAmlHD2N.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/informes.ts?tss-serverfn-split
function resolvePublishedMonths(availableMonths, monthlySeriesKeys) {
	const monthSet = /* @__PURE__ */ new Set();
	for (const month of [...availableMonths, ...monthlySeriesKeys]) if (isValidMonthKey(month)) monthSet.add(month);
	return Array.from(monthSet).sort((left, right) => right.localeCompare(left));
}
function resolveSnapshotMonthFallback(lastSampleAt) {
	if (!lastSampleAt) return [];
	const parsed = new Date(lastSampleAt);
	if (Number.isNaN(parsed.getTime())) return [];
	const monthKey = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
	return isValidMonthKey(monthKey) ? [monthKey] : [];
}
function mergeMonthCandidates(months) {
	const set = /* @__PURE__ */ new Set();
	for (const month of months) if (isValidMonthKey(month)) set.add(month);
	return Array.from(set).sort((left, right) => right.localeCompare(left));
}
var getReportsIndexPageData_createServerFn_handler = createServerRpc({
	id: "083e3742173ffbee241fcf450e7767671296bf68a466a3e51f01b0bc90fd0d5f",
	name: "getReportsIndexPageData",
	filename: "src/server-functions/informes.ts"
}, (opts) => getReportsIndexPageData.__executeServer(opts));
var getReportsIndexPageData = createServerFn({ method: "GET" }).handler(getReportsIndexPageData_createServerFn_handler, async () => {
	const [{ fetchCachedMonthlyDemandCurve }, { fetchAvailableDataMonths, fetchHistoryMetadata, fetchSharedDatasetSnapshot, fetchStatus }] = await Promise.all([import("./analytics-series-C83eMGJo.js"), import("./api-Yqzm2GiC.js")]);
	const siteUrl = getSiteUrl();
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const [monthsResponse, monthlySeries, dataset, historyMeta, status] = await Promise.all([
		fetchAvailableDataMonths().catch((error) => {
			captureExceptionWithContext(error, {
				area: "reports.index",
				operation: "fetchAvailableDataMonths",
				dedupeKey: "reports.index.fetchAvailableDataMonths.failed"
			});
			return {
				months: [],
				generatedAt: (/* @__PURE__ */ new Date()).toISOString()
			};
		}),
		fetchCachedMonthlyDemandCurve(24).catch(() => []),
		fetchSharedDatasetSnapshot().catch((error) => {
			captureExceptionWithContext(error, {
				area: "reports.index",
				operation: "fetchSharedDatasetSnapshot",
				dedupeKey: "reports.index.fetchSharedDatasetSnapshot.failed"
			});
			return buildFallbackDatasetSnapshot(nowIso);
		}),
		fetchHistoryMetadata().catch(() => null),
		fetchStatus().catch(() => null)
	]);
	const discoveredMonths = mergeMonthCandidates(resolvePublishedMonths(monthsResponse.months, monthlySeries.map((row) => row.monthKey)));
	const historyFallbackMonths = mergeMonthCandidates([historyMeta?.coverage.lastRecordedAt, status?.pipeline.lastSuccessfulPoll].filter((value) => Boolean(value)).map((value) => value.slice(0, 7)));
	const months = discoveredMonths.length > 0 ? discoveredMonths : mergeMonthCandidates([...historyFallbackMonths, ...resolveSnapshotMonthFallback(dataset.lastUpdated.lastSampleAt)]);
	const monthMap = Object.fromEntries(monthlySeries.map((row) => [row.monthKey, row]));
	const latestMonth = months[0] ?? null;
	const reportsDataState = combineDataStates([dataset.dataState, resolveDataState({
		hasCoverage: dataset.coverage.totalDays > 0 || months.length > 0,
		hasData: months.length > 0,
		isPartial: months.length > 0 && monthlySeries.length < months.length
	})]);
	const breadcrumbs = createRootBreadcrumbs({
		label: "Informes",
		href: appRoutes.reports()
	});
	const reportListEntries = months.map((month) => ({
		name: `Informe ${formatMonthLabel(month)}`,
		url: `${siteUrl}${appRoutes.reportMonth(month)}`
	}));
	return {
		months,
		monthMap,
		latestMonth,
		reportsDataState,
		breadcrumbs,
		structuredData: {
			"@context": "https://schema.org",
			"@graph": [
				{
					"@type": "CollectionPage",
					name: "Informes Bizi Zaragoza por mes",
					description: "Archivo historico de informes mensuales de Bizi Zaragoza con enlaces persistentes por mes y acceso al dashboard filtrado.",
					url: `${siteUrl}${appRoutes.reports()}`,
					inLanguage: "es"
				},
				buildBreadcrumbStructuredData(breadcrumbs),
				{
					"@type": "Organization",
					name: SITE_NAME,
					url: siteUrl
				},
				...reportListEntries.length > 0 ? [buildItemListStructuredData("Archivo de informes mensuales", reportListEntries)] : []
			]
		}
	};
});
//#endregion
export { getReportsIndexPageData_createServerFn_handler };

//# sourceMappingURL=informes-BPxmp1Mm.js.map