import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { t as createSsrRpc } from "./createSsrRpc-BFE1gq-C.js";
import { z } from "zod";
//#region src/server-functions/seo-details.ts
var IdInputSchema = z.string().min(1);
var getPublicStationPageData = createServerFn({ method: "GET" }).inputValidator(IdInputSchema).handler(createSsrRpc("6834c12f4a52abfd80f4941f691d53b91dc95be5ee5b5244475cd16dcbdd9a0a"));
var getPublicDistrictPageData = createServerFn({ method: "GET" }).inputValidator(IdInputSchema).handler(createSsrRpc("6231b012c61057b04c6002b137b8ffc952f478a147208c513ed41398b06485bf"));
var getUtilityLandingPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("208f6947a49512a93c0644ebc4d1a86df8024fe31b051ca92504a1387cb6526f"));
var getInsightsLandingPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("4ed98d1c8366c97bab768ea181066c1eb1c65c99dce74deccfd1d31982a3057d"));
//#endregion
export { getUtilityLandingPageData as i, getPublicDistrictPageData as n, getPublicStationPageData as r, getInsightsLandingPageData as t };

//# sourceMappingURL=seo-details-BiOnFhDZ.js.map