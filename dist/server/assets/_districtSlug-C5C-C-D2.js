import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { n as getPublicDistrictPageData } from "./seo-details-BiOnFhDZ.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/barrios/$districtSlug.tsx
var $$splitComponentImporter = () => import("./_districtSlug-6YJAlEz2.js");
var Route = createFileRoute("/barrios/$districtSlug")({
	loader: ({ params }) => getPublicDistrictPageData({ data: params.districtSlug }),
	head: ({ params }) => {
		const slug = params.districtSlug ?? "";
		const title = `Barrio ${slug} - DatosBizi`;
		const description = `Datos y estadísticas del barrio ${slug} en el sistema Bizi Zaragoza. Estaciones, disponibilidad, patrones de uso y comparativas.`;
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
					content: `${getSiteUrl()}/barrios/${slug}`
				}
			],
			link: [{
				rel: "canonical",
				href: `${getSiteUrl()}/barrios/${slug}`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=_districtSlug-C5C-C-D2.js.map