import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { i as getUtilityLandingPageData } from "./seo-details-BiOnFhDZ.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/mapa-estaciones-bizi-zaragoza.tsx
var $$splitComponentImporter = () => import("./mapa-estaciones-bizi-zaragoza-wTFFGojo.js");
var Route = createFileRoute("/mapa-estaciones-bizi-zaragoza")({
	loader: () => getUtilityLandingPageData(),
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Mapa y estaciones Bizi Zaragoza en tiempo real - DatosBizi";
		const description = "Encuentra estaciones Bizi Zaragoza, revisa disponibilidad actual y entra al mapa en vivo.";
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
					content: `${siteUrl}/mapa-estaciones-bizi-zaragoza`
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
				href: `${siteUrl}/mapa-estaciones-bizi-zaragoza`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=mapa-estaciones-bizi-zaragoza-NnNO1bIa.js.map