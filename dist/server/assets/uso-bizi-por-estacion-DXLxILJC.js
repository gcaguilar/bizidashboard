import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { t as fetchSeoLandingData } from "./seo-landing-B2aSZAh2.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/uso-bizi-por-estacion.tsx
var $$splitComponentImporter = () => import("./uso-bizi-por-estacion-CFIcprwi.js");
var Route = createFileRoute("/uso-bizi-por-estacion")({
	loader: () => fetchSeoLandingData({ data: { slug: "uso-bizi-por-estacion" } }),
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Uso de Bizi por estación en Zaragoza - DatosBizi";
		const description = "Analiza el uso del sistema de bicicletas Bizi por estación. Patrones de uso, ocupación y disponibilidad por estación.";
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
					content: `${siteUrl}/uso-bizi-por-estacion`
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
				href: `${siteUrl}/uso-bizi-por-estacion`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=uso-bizi-por-estacion-DXLxILJC.js.map