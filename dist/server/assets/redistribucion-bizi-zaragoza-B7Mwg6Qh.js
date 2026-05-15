import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { t as fetchSeoLandingData } from "./seo-landing-B2aSZAh2.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/redistribucion-bizi-zaragoza.tsx
var $$splitComponentImporter = () => import("./redistribucion-bizi-zaragoza-B_uJBYAQ.js");
var Route = createFileRoute("/redistribucion-bizi-zaragoza")({
	loader: () => fetchSeoLandingData({ data: { slug: "redistribucion-bizi-zaragoza" } }),
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Redistribución de Bizi en Zaragoza - DatosBizi";
		const description = "Analiza la redistribución de bicicletas Bizi Zaragoza. Patrones de reequilibrio y recomendaciones operativas.";
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
					content: `${siteUrl}/redistribucion-bizi-zaragoza`
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
				href: `${siteUrl}/redistribucion-bizi-zaragoza`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=redistribucion-bizi-zaragoza-B7Mwg6Qh.js.map