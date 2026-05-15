import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
import { z } from "zod";
//#region src/server-functions/seo-details.ts?tss-serverfn-split
var IdInputSchema = z.string().min(1);
var getPublicStationPageData_createServerFn_handler = createServerRpc({
	id: "6834c12f4a52abfd80f4941f691d53b91dc95be5ee5b5244475cd16dcbdd9a0a",
	name: "getPublicStationPageData",
	filename: "src/server-functions/seo-details.ts"
}, (opts) => getPublicStationPageData.__executeServer(opts));
var getPublicStationPageData = createServerFn({ method: "GET" }).inputValidator(IdInputSchema).handler(getPublicStationPageData_createServerFn_handler, async ({ data: stationId }) => {
	const { getStationSeoPageData } = await import("./seo-stations-MWgdsaE8.js");
	return getStationSeoPageData(stationId).catch(() => null);
});
var getPublicDistrictPageData_createServerFn_handler = createServerRpc({
	id: "6231b012c61057b04c6002b137b8ffc952f478a147208c513ed41398b06485bf",
	name: "getPublicDistrictPageData",
	filename: "src/server-functions/seo-details.ts"
}, (opts) => getPublicDistrictPageData.__executeServer(opts));
var getPublicDistrictPageData = createServerFn({ method: "GET" }).inputValidator(IdInputSchema).handler(getPublicDistrictPageData_createServerFn_handler, async ({ data: districtSlug }) => {
	const { getDistrictSeoRowBySlug, getDistrictSeoRows } = await import("./seo-districts-y8l_8wOn.js");
	const [district, districts] = await Promise.all([getDistrictSeoRowBySlug(districtSlug).catch(() => null), getDistrictSeoRows().catch(() => [])]);
	return {
		district,
		districts
	};
});
var getUtilityLandingPageData_createServerFn_handler = createServerRpc({
	id: "208f6947a49512a93c0644ebc4d1a86df8024fe31b051ca92504a1387cb6526f",
	name: "getUtilityLandingPageData",
	filename: "src/server-functions/seo-details.ts"
}, (opts) => getUtilityLandingPageData.__executeServer(opts));
var getUtilityLandingPageData = createServerFn({ method: "GET" }).handler(getUtilityLandingPageData_createServerFn_handler, async () => {
	const { getUtilityLandingData } = await import("./acquisition-landings-BJYkAi36.js");
	return getUtilityLandingData();
});
var getInsightsLandingPageData_createServerFn_handler = createServerRpc({
	id: "4ed98d1c8366c97bab768ea181066c1eb1c65c99dce74deccfd1d31982a3057d",
	name: "getInsightsLandingPageData",
	filename: "src/server-functions/seo-details.ts"
}, (opts) => getInsightsLandingPageData.__executeServer(opts));
var getInsightsLandingPageData = createServerFn({ method: "GET" }).handler(getInsightsLandingPageData_createServerFn_handler, async () => {
	const { getInsightsLandingData } = await import("./acquisition-landings-BJYkAi36.js");
	return getInsightsLandingData();
});
//#endregion
export { getInsightsLandingPageData_createServerFn_handler, getPublicDistrictPageData_createServerFn_handler, getPublicStationPageData_createServerFn_handler, getUtilityLandingPageData_createServerFn_handler };

//# sourceMappingURL=seo-details-yygfxF5S.js.map