import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { t as fetchSeoLandingData } from "./seo-landing-B2aSZAh2.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/ranking-estaciones-bizi.tsx
var $$splitComponentImporter = () => import("./ranking-estaciones-bizi-9MEyNaGX.js");
var Route = createFileRoute("/ranking-estaciones-bizi")({
	loader: () => fetchSeoLandingData({ data: { slug: "ranking-estaciones-bizi" } }),
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Ranking de estaciones Bizi Zaragoza - DatosBizi";
		const description = "Ranking de estaciones del sistema Bizi Zaragoza. Posiciones, cambios y análisis de estaciones más activas.";
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
					content: `${siteUrl}/ranking-estaciones-bizi`
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
				href: `${siteUrl}/ranking-estaciones-bizi`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=ranking-estaciones-bizi-B78zxsvX.js.map