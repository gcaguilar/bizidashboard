import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { t as fetchSeoLandingData } from "./seo-landing-B2aSZAh2.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/estaciones-con-mas-bicis.tsx
var $$splitComponentImporter = () => import("./estaciones-con-mas-bicis-Dd3URFyQ.js");
var Route = createFileRoute("/estaciones-con-mas-bicis")({
	loader: () => fetchSeoLandingData({ data: { slug: "estaciones-con-mas-bicis" } }),
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Estaciones con más bicis en Zaragoza - DatosBizi";
		const description = "Ranking de estaciones Bizi Zaragoza con más bicicletas disponibles. Descubre dónde encontrar más bicis.";
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
					content: `${siteUrl}/estaciones-con-mas-bicis`
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
				href: `${siteUrl}/estaciones-con-mas-bicis`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=estaciones-con-mas-bicis-gE_V5IAc.js.map