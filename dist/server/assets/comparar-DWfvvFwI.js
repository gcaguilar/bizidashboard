import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { i as toAbsoluteRouteUrl, l as getCityName, r as appRoutes } from "./routes-CFkMZBCM.js";
import { n as createRootBreadcrumbs, t as buildBreadcrumbStructuredData } from "./breadcrumbs-tXG_cMah.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/comparar.ts?tss-serverfn-split
var getCompareHubLoaderData_createServerFn_handler = createServerRpc({
	id: "4cacafda8f5bee1f11533a32bcce837e053773389524fed5f8533a6fc360b145",
	name: "getCompareHubLoaderData",
	filename: "src/server-functions/comparar.ts"
}, (opts) => getCompareHubLoaderData.__executeServer(opts));
var getCompareHubLoaderData = createServerFn({ method: "GET" }).handler(getCompareHubLoaderData_createServerFn_handler, async () => {
	const { buildFallbackComparisonHubData, getComparisonHubDataWithTimeout } = await import("./comparison-hub-D162UL3l.js");
	const cityName = getCityName();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Comparar",
		href: appRoutes.compare()
	});
	return {
		breadcrumbs,
		comparisonData: await getComparisonHubDataWithTimeout().catch(() => buildFallbackComparisonHubData()),
		structuredData: {
			"@context": "https://schema.org",
			"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
				"@type": "CollectionPage",
				name: `Comparador ${cityName}`,
				description: "Comparativas activas entre estaciones, barrios, periodos y cambios del sistema.",
				url: toAbsoluteRouteUrl(appRoutes.compare())
			}]
		}
	};
});
//#endregion
export { getCompareHubLoaderData_createServerFn_handler };

//# sourceMappingURL=comparar-DWfvvFwI.js.map