import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { n as cn } from "./page-shell-DP1spWfk.js";
import { f as resolveRouteKeyFromPathname, p as trackUmamiEvent, t as buildCtaClickEvent } from "./umami-BYNhNb0r.js";
import { t as TrackedLink } from "./TrackedLink-dteSAIPr.js";
import { f as getSiteUrl, t as DASHBOARD_ROUTE_CONFIG } from "./routes-CFkMZBCM.js";
import { t as createSsrRpc } from "./createSsrRpc-BFE1gq-C.js";
import { n as buttonVariants, t as Button } from "./button-Bgvi3bSh.js";
import * as React from "react";
import { memo, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createFileRoute, lazyRouteComponent, useLocation } from "@tanstack/react-router";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { ResponsiveContainer } from "recharts";
function getFeedbackUrl() {
	return process.env.NEXT_PUBLIC_FEEDBACK_URL?.trim() || "https://tally.so/r/ZjRAXz";
}
//#endregion
//#region src/app/_components/FeedbackCta.tsx
function FeedbackCta({ source, ctaId, className, pendingClassName, children, pendingLabel = "Feedback pronto", module, destination = "feedback_form", target = "_blank", type = "button", ...buttonProps }) {
	const pathname = useLocation().pathname;
	const feedbackUrl = getFeedbackUrl();
	if (!feedbackUrl) return /* @__PURE__ */ jsx(Button, {
		...buttonProps,
		type,
		disabled: true,
		"aria-disabled": "true",
		className: pendingClassName ?? className,
		children: pendingLabel
	});
	const routeKey = resolveRouteKeyFromPathname(pathname);
	const surface = pathname?.startsWith("/dashboard") ? "dashboard" : "public";
	return /* @__PURE__ */ jsx("a", {
		href: feedbackUrl,
		target,
		rel: target === "_blank" ? "noopener noreferrer" : void 0,
		onClick: () => trackUmamiEvent(buildCtaClickEvent({
			surface,
			routeKey,
			source,
			ctaId,
			destination,
			module,
			entityType: "help",
			isExternal: true
		})),
		className: buttonVariants({ className }),
		children
	});
}
//#endregion
//#region src/components/ui/progress.tsx
function toProgress(value) {
	if (typeof value !== "number" || Number.isNaN(value)) return 0;
	return Math.max(0, Math.min(100, value));
}
var Progress = React.forwardRef(function Progress({ className, value = 0, indicatorClassName, ...props }, ref) {
	const clamped = toProgress(value);
	return /* @__PURE__ */ jsx("div", {
		ref,
		role: "progressbar",
		"aria-valuenow": Math.round(clamped),
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		className: cn("h-1.5 w-full overflow-hidden rounded-full bg-black/20", className),
		...props,
		children: /* @__PURE__ */ jsx("div", {
			className: cn("h-full rounded-full bg-[var(--primary)] transition-[width]", indicatorClassName),
			style: { width: `${clamped}%` }
		})
	});
});
//#endregion
//#region src/components/layout/page-header-card.tsx
function PageHeaderCard({ className, sticky = true, ...props }) {
	return /* @__PURE__ */ jsx("header", {
		className: cn("rounded-xl border border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur-md", sticky ? "sticky top-0 z-50" : "", className),
		...props
	});
}
//#endregion
//#region src/app/dashboard/_components/DashboardRouteLinks.tsx
var DEFAULT_ROUTES = [
	"dashboard",
	"stations",
	"flow",
	"conclusions",
	"redistribucion",
	"help"
];
function DashboardRouteLinks({ activeRoute, routes = DEFAULT_ROUTES, variant = "inline", className, source }) {
	const navigationSource = source ?? activeRoute ?? "dashboard_navigation";
	return /* @__PURE__ */ jsx("nav", {
		className,
		"aria-label": "Secciones del dashboard",
		children: routes.map((route) => {
			const { href, label } = DASHBOARD_ROUTE_CONFIG[route];
			const isActive = route === activeRoute;
			return /* @__PURE__ */ jsx(TrackedLink, {
				href,
				navigationEvent: {
					source: navigationSource,
					destination: route,
					module: "dashboard_route_links",
					sourceRole: "dashboard",
					destinationRole: "dashboard",
					transitionKind: "within_dashboard"
				},
				className: variant === "chips" ? `ui-icon-button ${isActive ? "border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--primary)]" : ""}` : isActive ? "border-b-2 border-[var(--primary)] pb-1 text-sm font-bold text-[var(--foreground)]" : "pb-1 text-sm font-semibold text-[var(--primary-strong)] transition hover:text-[var(--primary)]",
				"aria-current": isActive ? "page" : void 0,
				children: label
			}, route);
		})
	});
}
//#endregion
//#region src/app/dashboard/_components/GitHubRepoButton.tsx
var REPO_URL = "https://github.com/gcaguilar/bizidashboard";
function GitHubRepoButton({ compactLabel = "Repo" }) {
	return /* @__PURE__ */ jsxs("a", {
		href: REPO_URL,
		target: "_blank",
		rel: "noreferrer",
		className: "ui-icon-button gap-2",
		children: [/* @__PURE__ */ jsx("svg", {
			"aria-hidden": "true",
			viewBox: "0 0 24 24",
			className: "h-4 w-4 fill-current",
			children: /* @__PURE__ */ jsx("path", { d: "M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.51v-1.78c-2.93.64-3.55-1.24-3.55-1.24-.48-1.2-1.16-1.52-1.16-1.52-.95-.64.07-.63.07-.63 1.05.08 1.6 1.08 1.6 1.08.93 1.6 2.44 1.14 3.03.87.09-.68.36-1.14.66-1.41-2.34-.27-4.79-1.17-4.79-5.21 0-1.15.41-2.08 1.08-2.81-.11-.27-.47-1.36.1-2.83 0 0 .88-.28 2.89 1.07a10.05 10.05 0 0 1 5.26 0c2.01-1.35 2.88-1.07 2.88-1.07.58 1.47.22 2.56.11 2.83.67.73 1.08 1.66 1.08 2.81 0 4.05-2.46 4.93-4.81 5.2.37.33.7.97.7 1.96v2.9c0 .29.19.62.73.51A10.5 10.5 0 0 0 12 1.5Z" })
		}), /* @__PURE__ */ jsx("span", { children: compactLabel === "Repo" ? "GitHub" : compactLabel })]
	});
}
//#endregion
//#region src/app/dashboard/_components/ThemeToggleButton.tsx
var THEME_STORAGE_KEY = "bizidashboard-theme";
function getPreferredTheme() {
	const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
	if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(theme) {
	const isDark = theme === "dark";
	const root = document.documentElement;
	root.classList.toggle("dark", isDark);
	root.dataset.theme = isDark ? "dark" : "light";
}
function ThemeToggleButton({ className = "ui-icon-button" }) {
	const [theme, setTheme] = useState(null);
	useEffect(() => {
		const root = document.documentElement;
		const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
		setTheme(stored === "light" || stored === "dark" ? stored : root.classList.contains("dark") ? "dark" : "light");
	}, []);
	if (theme === null) return /* @__PURE__ */ jsxs(Button, {
		type: "button",
		className,
		"aria-label": "Cambiar tema",
		variant: "icon-button",
		disabled: true,
		children: [/* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: "text-sm leading-none",
			children: "​"
		}), /* @__PURE__ */ jsx("span", { children: "​" })]
	});
	const nextThemeLabel = theme === "dark" ? "claro" : "oscuro";
	const buttonLabel = theme === "dark" ? "Claro" : "Oscuro";
	const icon = theme === "dark" ? "☀" : "☾";
	return /* @__PURE__ */ jsxs(Button, {
		type: "button",
		variant: "icon-button",
		className,
		onClick: () => {
			const nextTheme = (theme ?? getPreferredTheme()) === "dark" ? "light" : "dark";
			setTheme(nextTheme);
			applyTheme(nextTheme);
			window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
		},
		"aria-label": `Cambiar tema a ${nextThemeLabel}`,
		title: `Cambiar tema a ${nextThemeLabel}`,
		children: [/* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: "text-sm leading-none",
			children: icon
		}), /* @__PURE__ */ jsx("span", { children: buttonLabel })]
	});
}
//#endregion
//#region src/components/ui/skeleton.tsx
var Skeleton = React.forwardRef(function Skeleton({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("div", {
		ref,
		className: cn("animate-pulse rounded-md bg-[var(--secondary)]", className),
		...props
	});
});
//#endregion
//#region src/components/ui/metric-card.tsx
var MetricCard = React.forwardRef(function MetricCard({ className, label, value, detail, ...props }, ref) {
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: cn("ui-metric-card rounded-xl px-4 py-4", className),
		...props,
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "stat-label",
				children: label
			}),
			/* @__PURE__ */ jsx("p", {
				className: "stat-value",
				children: value
			}),
			detail ? /* @__PURE__ */ jsx("p", {
				className: "text-[11px] text-[var(--muted)]",
				children: detail
			}) : null
		]
	});
});
var MetricGrid = React.forwardRef(function MetricGrid({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("div", {
		ref,
		className: cn("mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className),
		...props
	});
});
//#endregion
//#region src/app/dashboard/_components/ChartWrapper.tsx
function getSnapshot() {
	return true;
}
function getServerSnapshot() {
	return false;
}
function subscribe() {
	return () => {};
}
var ChartWrapper = memo(function ChartWrapper({ children, height = "h-[280px]" }) {
	if (!useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)) return /* @__PURE__ */ jsx("div", { className: height });
	return /* @__PURE__ */ jsx(Fragment$1, { children });
});
//#endregion
//#region src/app/dashboard/_components/MeasuredResponsiveContainer.tsx
function MeasuredResponsiveContainer({ children, className = "h-full min-h-[220px] w-full min-w-0" }) {
	const hostRef = useRef(null);
	const [size, setSize] = useState({
		width: 0,
		height: 0
	});
	useEffect(() => {
		const node = hostRef.current;
		if (!node) return;
		const updateSize = () => {
			const rect = node.getBoundingClientRect();
			setSize({
				width: Math.max(0, Math.floor(rect.width)),
				height: Math.max(0, Math.floor(rect.height))
			});
		};
		updateSize();
		const observer = new ResizeObserver(updateSize);
		observer.observe(node);
		return () => {
			observer.disconnect();
		};
	}, []);
	return /* @__PURE__ */ jsx("div", {
		ref: hostRef,
		className,
		children: size.width > 0 && size.height > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, {
			width: size.width,
			height: size.height,
			children
		}) : null
	});
}
//#endregion
//#region src/server-functions/dashboard.ts
var getDashboardPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("53c3c38829d0db0e8ea4ec1fcd6859ec1dd8fed78f3fc1dfa4371f6bc429e767"));
//#endregion
//#region src/app/dashboard/index.tsx
var $$splitComponentImporter = () => import("./dashboard-BaP8ncl1.js");
var Route = createFileRoute("/dashboard/")({
	loader: () => getDashboardPageData(),
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	head: () => {
		const siteUrl = getSiteUrl();
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: "Dashboard operativo en tiempo real de Bizi Zaragoza con mapa de estaciones, alertas, flujo y lecturas del sistema actual."
				},
				{
					property: "og:title",
					content: "Dashboard Bizi Zaragoza - DatosBizi"
				},
				{
					property: "og:description",
					content: "Dashboard operativo en tiempo real de Bizi Zaragoza con mapa de estaciones, alertas, flujo y lecturas del sistema actual."
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/dashboard`
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
					content: "Dashboard Bizi Zaragoza - DatosBizi"
				},
				{
					name: "twitter:description",
					content: "Dashboard operativo en tiempo real de Bizi Zaragoza con mapa de estaciones, alertas, flujo y lecturas del sistema actual."
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/dashboard`
			}],
			title: "Panel clasico - DatosBizi"
		};
	}
});
//#endregion
export { MetricGrid as a, GitHubRepoButton as c, Progress as d, FeedbackCta as f, MetricCard as i, DashboardRouteLinks as l, MeasuredResponsiveContainer as n, Skeleton as o, ChartWrapper as r, ThemeToggleButton as s, Route as t, PageHeaderCard as u };

//# sourceMappingURL=dashboard-DxMM1V45.js.map