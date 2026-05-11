import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { n as DASHBOARD_VIEW_MODES, r as resolveDashboardViewMode } from "./dashboard-modes-Ba8TJts7.js";
import { createFileRoute, lazyRouteComponent, redirect } from "@tanstack/react-router";
//#region src/app/dashboard/views/[mode]/route.tsx
init_routes();
var $$splitComponentImporter = () => import("./route-DSLQE9Ix.js");
var Route = createFileRoute("/dashboard/views/mode")({
	loader: async ({ params }) => {
		const { mode } = params;
		if (!mode || !DASHBOARD_VIEW_MODES.includes(resolveDashboardViewMode(mode))) throw redirect({ to: appRoutes.dashboard() });
		return { mode };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
