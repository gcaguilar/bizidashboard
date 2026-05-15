import { i as toAbsoluteRouteUrl, r as appRoutes } from "./routes-CFkMZBCM.js";
//#region src/lib/breadcrumbs.ts
function createRootBreadcrumbs(...items) {
	return [{
		label: "Inicio",
		href: appRoutes.home()
	}, ...items];
}
function buildBreadcrumbStructuredData(items) {
	return {
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.label,
			item: toAbsoluteRouteUrl(item.href)
		}))
	};
}
//#endregion
export { createRootBreadcrumbs as n, buildBreadcrumbStructuredData as t };

//# sourceMappingURL=breadcrumbs-tXG_cMah.js.map