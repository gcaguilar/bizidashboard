import { f as getSiteUrl, r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as getInsightsLandingPageData } from "./seo-details-BiOnFhDZ.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/estadisticas-bizi-zaragoza.tsx
var $$splitComponentImporter = () => import("./estadisticas-bizi-zaragoza-CXiTYzR1.js");
var Route = createFileRoute("/estadisticas-bizi-zaragoza")({
	loader: () => getInsightsLandingPageData(),
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Estadisticas y ranking de Bizi Zaragoza - DatosBizi";
		const description = "Rankings, barrios activos, informes mensuales y patrones de uso de Bizi Zaragoza.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}${appRoutes.insightsLanding()}`
				},
				{
					name: "robots",
					content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}${appRoutes.insightsLanding()}`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=estadisticas-bizi-zaragoza-CqBFCxVo.js.map