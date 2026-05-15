import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { t as fetchSeoLandingData } from "./seo-landing-B2aSZAh2.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/informes-mensuales-bizi-zaragoza.tsx
var $$splitComponentImporter = () => import("./informes-mensuales-bizi-zaragoza-Cz2hKUah.js");
var Route = createFileRoute("/informes-mensuales-bizi-zaragoza")({
	loader: () => fetchSeoLandingData({ data: { slug: "informes-mensuales-bizi-zaragoza" } }),
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Informes mensuales de Bizi Zaragoza - DatosBizi";
		const description = "Archivo de informes mensuales del sistema Bizi Zaragoza. Análisis detallado de demanda, estaciones y movilidad.";
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
					content: `${siteUrl}/informes-mensuales-bizi-zaragoza`
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
				href: `${siteUrl}/informes-mensuales-bizi-zaragoza`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=informes-mensuales-bizi-zaragoza-6EsSiRvQ.js.map