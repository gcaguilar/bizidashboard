import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { i as toAbsoluteRouteUrl, l as getCityName, r as appRoutes } from "./routes-CFkMZBCM.js";
import { i as getExploreHubSections } from "./public-navigation-7kjot5UZ.js";
import { n as createRootBreadcrumbs, t as buildBreadcrumbStructuredData } from "./breadcrumbs-tXG_cMah.js";
import { r as isValidMonthKey } from "./months-CotCm8RF.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/explorar.ts?tss-serverfn-split
var getExploreLoaderData_createServerFn_handler = createServerRpc({
	id: "a7f5d18063e64432c5fea2a43925ceb4a9474306145734251001c00553c9a4f0",
	name: "getExploreLoaderData",
	filename: "src/server-functions/explorar.ts"
}, (opts) => getExploreLoaderData.__executeServer(opts));
var getExploreLoaderData = createServerFn({ method: "GET" }).handler(getExploreLoaderData_createServerFn_handler, async () => {
	const [{ fetchAvailableDataMonths }, { buildFallbackAvailableMonths }] = await Promise.all([import("./api-Yqzm2GiC.js"), import("./shared-data-fallbacks-M_Upqoba.js")]);
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const cityName = getCityName();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Explorar",
		href: appRoutes.explore()
	});
	const latestMonth = (await fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso))).months.filter(isValidMonthKey)[0] ?? null;
	const sections = getExploreHubSections({ latestMonth });
	const totalTools = sections.reduce((count, section) => count + section.items.length, 0);
	const itemList = sections.flatMap((section) => section.items);
	return {
		searchQuery: "",
		searchResults: null,
		latestMonth,
		sections,
		totalTools,
		breadcrumbs,
		structuredData: {
			"@context": "https://schema.org",
			"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
				"@type": "CollectionPage",
				name: `Hub Explorar ${cityName}`,
				description: "Indice publico de herramientas de analisis, comparativa, mapas, historico y movilidad.",
				url: toAbsoluteRouteUrl(appRoutes.explore()),
				hasPart: itemList.map((item, index) => ({
					"@type": "ListItem",
					position: index + 1,
					name: item.title,
					url: toAbsoluteRouteUrl(item.href)
				}))
			}]
		}
	};
});
//#endregion
export { getExploreLoaderData_createServerFn_handler };

//# sourceMappingURL=explorar-DlZwuVLo.js.map