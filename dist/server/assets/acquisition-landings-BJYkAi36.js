import { r as appRoutes } from "./routes-CFkMZBCM.js";
import { r as isValidMonthKey } from "./months-CotCm8RF.js";
import { n as fetchAvailableDataMonths } from "./api-rZCrrrVI.js";
import { r as fetchCachedMonthlyDemandCurve } from "./analytics-series-CQItUK0n.js";
import { t as evaluatePageIndexability } from "./seo-policy-DRv3Xzev.js";
import { r as getDistrictSeoRows } from "./seo-districts-DZRBlyA9.js";
import { n as getStationSeoRows } from "./seo-stations-DPR_2iTQ.js";
import { cache } from "react";
//#region src/lib/acquisition-landings.ts
function buildUtilityLandingIndexabilityInput(stationRows, districtCount) {
	return {
		pageType: "marketing",
		hasMeaningfulContent: true,
		hasData: stationRows.length > 0,
		requiresStrongCoverage: true,
		thresholds: [{
			label: "indexable-stations",
			current: stationRows.length,
			minimum: 5
		}, {
			label: "district-coverage",
			current: districtCount,
			minimum: 1
		}]
	};
}
function buildInsightsLandingIndexabilityInput(stationRows, districtCount, publishedMonths) {
	return {
		pageType: "marketing",
		hasMeaningfulContent: true,
		hasData: stationRows.length > 0 && publishedMonths.length > 0,
		requiresStrongCoverage: true,
		thresholds: [
			{
				label: "indexable-stations",
				current: stationRows.length,
				minimum: 5
			},
			{
				label: "district-coverage",
				current: districtCount,
				minimum: 2
			},
			{
				label: "published-months",
				current: publishedMonths.length,
				minimum: 1
			}
		]
	};
}
var getUtilityLandingData = cache(async () => {
	const [stationRows, districtRows] = await Promise.all([getStationSeoRows().catch(() => []), getDistrictSeoRows().catch(() => [])]);
	const indexableStations = stationRows.filter((row) => row.indexability.indexable);
	const featuredStations = indexableStations.slice(0, 4);
	const bikesAvailable = indexableStations.reduce((sum, row) => sum + row.station.bikesAvailable, 0);
	const indexabilityInput = buildUtilityLandingIndexabilityInput(indexableStations, districtRows.length);
	const path = appRoutes.utilityLanding();
	return {
		kind: "utility",
		path,
		stationRows: indexableStations,
		featuredStations,
		districtRows,
		publishedMonths: [],
		latestMonth: null,
		bikesAvailable,
		indexabilityInput,
		indexability: evaluatePageIndexability({
			path,
			...indexabilityInput
		})
	};
});
var getInsightsLandingData = cache(async () => {
	const [stationRows, districtRows, monthsResponse, monthlySeries] = await Promise.all([
		getStationSeoRows().catch(() => []),
		getDistrictSeoRows().catch(() => []),
		fetchAvailableDataMonths().catch(() => ({
			months: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		})),
		fetchCachedMonthlyDemandCurve(36).catch(() => [])
	]);
	const monthSet = /* @__PURE__ */ new Set();
	for (const month of [...monthsResponse.months, ...monthlySeries.map((row) => row.monthKey)]) if (isValidMonthKey(month)) monthSet.add(month);
	const publishedMonths = Array.from(monthSet).sort((left, right) => right.localeCompare(left));
	const indexableStations = stationRows.filter((row) => row.indexability.indexable);
	const featuredStations = indexableStations.slice(0, 4);
	const bikesAvailable = indexableStations.reduce((sum, row) => sum + row.station.bikesAvailable, 0);
	const indexabilityInput = buildInsightsLandingIndexabilityInput(indexableStations, districtRows.length, publishedMonths);
	const path = appRoutes.insightsLanding();
	return {
		kind: "insights",
		path,
		stationRows: indexableStations,
		featuredStations,
		districtRows,
		publishedMonths,
		latestMonth: publishedMonths[0] ?? null,
		bikesAvailable,
		indexabilityInput,
		indexability: evaluatePageIndexability({
			path,
			...indexabilityInput
		})
	};
});
//#endregion
export { getInsightsLandingData, getUtilityLandingData };

//# sourceMappingURL=acquisition-landings-BJYkAi36.js.map