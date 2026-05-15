import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { f as getSiteUrl } from "./routes-CFkMZBCM.js";
import { t as createSsrRpc } from "./createSsrRpc-BFE1gq-C.js";
import { t as formatMonthLabel } from "./months-CotCm8RF.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
//#region src/server-functions/informes-month.ts
var MonthInputSchema = z.string().optional();
var getReportMonthPageData = createServerFn({ method: "GET" }).inputValidator(MonthInputSchema).handler(createSsrRpc("dc845a127500254115ce8f0ae45918b425dd0b630e2779e5a8cbf39ad25d1536"));
//#endregion
//#region src/app/informes.$month.tsx
var $$splitComponentImporter = () => import("./informes._month-DeSrgQ7I.js");
var Route = createFileRoute("/informes/$month")({
	loader: async ({ params }) => getReportMonthPageData({ data: params.month }),
	head: (opts) => {
		const month = opts.params.month ?? "";
		const title = `Informe ${formatMonthLabel(month)} - DatosBizi`;
		const description = `Informe mensual de movilidad Bizi Zaragoza para ${formatMonthLabel(month)}. Datos de demanda, estaciones y patrones de uso.`;
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
					content: `${getSiteUrl()}/informes/${month}`
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
				href: `${getSiteUrl()}/informes/${month}`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=informes._month-Dwp8Qz03.js.map