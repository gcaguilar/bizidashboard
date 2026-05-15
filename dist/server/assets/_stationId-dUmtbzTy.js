import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { r as getPublicStationPageData } from "./seo-details-BiOnFhDZ.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/estaciones/$stationId.tsx
var $$splitComponentImporter = () => import("./_stationId-CMzCRc2g.js");
var Route = createFileRoute("/estaciones/$stationId")({
	loader: ({ params }) => getPublicStationPageData({ data: params.stationId }),
	head: ({ params }) => {
		const id = params.stationId ?? "";
		const title = `Estación ${id} - DatosBizi`;
		const description = `Datos, patrones y predicciones de la estación ${id} de Bizi Zaragoza. Disponibilidad, ocupación y análisis de uso.`;
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
					content: `${getSiteUrl()}/estaciones/${id}`
				}
			],
			link: [{
				rel: "canonical",
				href: `${getSiteUrl()}/estaciones/${id}`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=_stationId-dUmtbzTy.js.map