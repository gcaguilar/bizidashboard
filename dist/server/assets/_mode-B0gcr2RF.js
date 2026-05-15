import { r as appRoutes } from "./routes-CFkMZBCM.js";
import { n as DASHBOARD_VIEW_MODES, r as resolveDashboardViewMode } from "./dashboard-modes-DmynMJBV.js";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/app/dashboard/views/$mode.tsx
var $$splitComponentImporter = () => import("./_mode-8y28bbsv.js");
var Route = createFileRoute("/dashboard/views/$mode")({
	server: { handlers: { GET: ({ params }) => {
		const mode = resolveDashboardViewMode(params.mode);
		const location = DASHBOARD_VIEW_MODES.includes(mode) ? `${appRoutes.dashboard()}?mode=${encodeURIComponent(mode)}` : appRoutes.dashboard();
		return new Response(null, {
			status: 302,
			headers: { Location: location }
		});
	} } },
	loader: ({ params }) => {
		const mode = resolveDashboardViewMode(params.mode);
		return { mode: DASHBOARD_VIEW_MODES.includes(mode) ? mode : "overview" };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };

//# sourceMappingURL=_mode-B0gcr2RF.js.map