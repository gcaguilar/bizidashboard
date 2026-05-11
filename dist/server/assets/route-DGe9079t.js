import "./shared-data-fallbacks-BSFw5LEs.js";
import { l as toMonthOptions } from "./cache-DMRFuswD.js";
import { r as init_sentry_reporting } from "./sentry-reporting-CvzcSweH.js";
import { r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { n as init_DashboardPageViewTracker } from "./DashboardPageViewTracker-SrI8-Aae.js";
import { h as trackUmamiEvent, p as init_umami, s as buildFilterChangeEvent } from "./TrackedLink-BHId783N.js";
import "./useAbortableAsyncEffect-B-OZ9T1s.js";
import "./MethodologyPanel-C_A0ER07.js";
/* empty css                     */
import { Suspense } from "react";
import { createFileRoute, lazyRouteComponent, redirect, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import "recharts";
import "react-map-gl/maplibre";
//#region src/app/dashboard/_components/Heatmap.tsx
init_umami();
init_DashboardPageViewTracker();
init_routes();
//#endregion
//#region src/app/dashboard/_components/HourlyCharts.tsx
init_routes();
Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
//#endregion
//#region src/app/dashboard/_components/MonthFilter.tsx
init_button();
function MonthFilterContent({ months, activeMonth, className, routeKey = "dashboard_unknown", source = "month_filter" }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const monthOptions = toMonthOptions(months);
	if (monthOptions.length === 0) return null;
	const updateMonth = (nextMonth) => {
		const nextParams = new URLSearchParams(searchParams.toString());
		trackUmamiEvent(buildFilterChangeEvent({
			surface: "dashboard",
			routeKey,
			module: "month_filter",
			source,
			monthPresent: Boolean(nextMonth)
		}));
		if (nextMonth) nextParams.set("month", nextMonth);
		else nextParams.delete("month");
		const nextQuery = nextParams.toString();
		router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
	};
	return /* @__PURE__ */ jsx("div", {
		className,
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 shadow-[var(--shadow-soft)]",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
					children: "Mes"
				}),
				/* @__PURE__ */ jsx(Button, {
					onClick: () => updateMonth(null),
					className: `rounded-full border px-3 py-1 text-xs font-semibold transition ${activeMonth === null ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"}`,
					variant: "ghost",
					size: "sm",
					children: "Acumulado"
				}),
				monthOptions.map((month) => /* @__PURE__ */ jsx(Button, {
					onClick: () => updateMonth(month.key),
					className: `rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${activeMonth === month.key ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"}`,
					variant: "ghost",
					size: "sm",
					children: month.label
				}, month.key))
			]
		})
	});
}
function MonthFilter(props) {
	return /* @__PURE__ */ jsx(Suspense, {
		fallback: /* @__PURE__ */ jsx("div", { className: "h-10 w-full animate-pulse rounded-xl bg-[var(--secondary)]" }),
		children: /* @__PURE__ */ jsx(MonthFilterContent, { ...props })
	});
}
//#endregion
//#region src/app/dashboard/_components/NeighborhoodMiniMap.tsx
init_sentry_reporting();
//#endregion
//#region src/app/dashboard/estaciones/[stationId]/route.tsx
init_routes();
var $$splitComponentImporter = () => import("./route-BEjXYbVj.js");
var Route = createFileRoute("/dashboard/estaciones/stationId")({
	loader: async ({ params }) => {
		const { stationId } = params;
		if (!stationId) throw redirect({ to: appRoutes.dashboardStations() });
		return { stationId };
	},
	head: (opts) => {
		const { stationId } = opts.params;
		return { meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: `Estacion ${stationId} - DatosBizi` }
		] };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { MonthFilter as n, Route as t };
