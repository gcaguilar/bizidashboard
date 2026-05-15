import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as createSsrRpc } from "./createSsrRpc-BFE1gq-C.js";
import { createFileRoute, lazyRouteComponent, redirect } from "@tanstack/react-router";
//#region src/server-functions/dashboard-estaciones.ts
var getStationsDirectoryPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("0a5156d1d525c55699258b3d5703698ee35c110d7c00c290c72631d50b759569"));
var getStationDetailPageData = createServerFn({ method: "GET" }).inputValidator((stationId) => stationId).handler(createSsrRpc("0be1a2a4f9142947396989b2bd788015e0fd320339b9ffa060d5df909ae7151b"));
//#endregion
//#region src/app/dashboard/estaciones/$stationId.tsx
var $$splitComponentImporter = () => import("./_stationId-C_GqKE3_.js");
var Route = createFileRoute("/dashboard/estaciones/$stationId")({
	loader: ({ params }) => {
		const { stationId } = params;
		if (!stationId) throw redirect({ to: appRoutes.dashboardStations() });
		return getStationDetailPageData({ data: stationId });
	},
	head: (opts) => {
		const { stationId } = opts.params;
		return {
			meta: [{ charSet: "utf-8" }, {
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			}],
			title: `Estacion ${stationId} - DatosBizi`
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { getStationsDirectoryPageData as n, Route as t };

//# sourceMappingURL=_stationId-CsnBvrKI.js.map