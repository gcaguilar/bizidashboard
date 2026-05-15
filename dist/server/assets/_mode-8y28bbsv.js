import { r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as Route } from "./_mode-B0gcr2RF.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/dashboard/views/$mode.tsx?tsr-split=component
function DashboardViewRedirectPage() {
	const { mode } = Route.useLoaderData();
	return /* @__PURE__ */ jsxs("main", {
		className: "mx-auto max-w-2xl p-6",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "text-2xl font-black text-[var(--foreground)]",
				children: "Vista del dashboard"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm text-[var(--muted)]",
				children: "Esta ruta redirige a la vista seleccionada del dashboard."
			}),
			/* @__PURE__ */ jsx("a", {
				className: "ui-inline-action mt-4",
				href: `${appRoutes.dashboard()}?mode=${encodeURIComponent(mode)}`,
				children: "Abrir dashboard"
			})
		]
	});
}
//#endregion
export { DashboardViewRedirectPage as component };

//# sourceMappingURL=_mode-8y28bbsv.js.map