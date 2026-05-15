import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { t as fetchSeoLandingData } from "./seo-landing-B2aSZAh2.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/viajes-por-mes-zaragoza.tsx
var $$splitComponentImporter = () => import("./viajes-por-mes-zaragoza-CgtqdXrS.js");
var Route = createFileRoute("/viajes-por-mes-zaragoza")({
	loader: () => fetchSeoLandingData({ data: { slug: "viajes-por-mes-zaragoza" } }),
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Viajes por mes en Zaragoza - DatosBizi";
		const description = "Analiza los viajes por mes en el sistema Bizi Zaragoza. Tendencia temporal, picos estacionales y comparativas mensuales.";
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
					content: `${siteUrl}/viajes-por-mes-zaragoza`
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
				href: `${siteUrl}/viajes-por-mes-zaragoza`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=viajes-por-mes-zaragoza-B0AasQh_.js.map