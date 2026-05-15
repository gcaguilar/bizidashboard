import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { t as fetchSeoLandingData } from "./seo-landing-B2aSZAh2.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/barrios-bizi-zaragoza.tsx
var $$splitComponentImporter = () => import("./barrios-bizi-zaragoza-C5tom_SO.js");
var Route = createFileRoute("/barrios-bizi-zaragoza")({
	loader: () => fetchSeoLandingData({ data: { slug: "barrios-bizi-zaragoza" } }),
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Barrios de Bizi Zaragoza - DatosBizi";
		const description = "Analiza los barrios del sistema Bizi Zaragoza. Comparativas por distrito, estaciones por barrio y patrones de movilidad urbana.";
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
					content: `${siteUrl}/barrios-bizi-zaragoza`
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
				href: `${siteUrl}/barrios-bizi-zaragoza`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=barrios-bizi-zaragoza-DrmqW1sH.js.map