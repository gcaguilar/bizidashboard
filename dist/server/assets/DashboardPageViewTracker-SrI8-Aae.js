import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import { o as init_site } from "./site-B6Gst4bb.js";
import { r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { n as appRoutes, r as init_routes, t as DASHBOARD_ROUTE_CONFIG } from "./routes-DkqafPzE.js";
import { h as trackUmamiEvent, i as buildDashboardPageViewEvent, m as resolveRouteKeyFromPathname, p as init_umami, t as TrackedLink } from "./TrackedLink-BHId783N.js";
import { useEffect, useRef, useState } from "react";
import "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/lib/seo-policy.ts
init_routes();
appRoutes.beta(), appRoutes.biciradar(), appRoutes.seoPage("informes-mensuales-bizi-zaragoza"), appRoutes.reports();
//#endregion
//#region src/lib/seo.ts
init_routes();
init_site();
//#endregion
//#region src/components/layout/page-header-card.tsx
init_utils();
function PageHeaderCard({ className, sticky = true, ...props }) {
	return /* @__PURE__ */ jsx("header", {
		className: cn("rounded-xl border border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur-md", sticky ? "sticky top-0 z-50" : "", className),
		...props
	});
}
//#endregion
//#region src/app/dashboard/_components/DashboardRouteLinks.tsx
init_routes();
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
init_button();
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
//#region src/app/dashboard/_components/DashboardPageViewTracker.tsx
function DashboardPageViewTracker({ routeKey, pageType, template, mode }) {
	const pathname = usePathname();
	const lastTrackedKey = useRef(null);
	useEffect(() => {
		if (!pathname) return;
		const resolvedRouteKey = routeKey ?? resolveRouteKeyFromPathname(pathname);
		const trackingKey = [
			pathname,
			resolvedRouteKey,
			pageType,
			template,
			mode ?? ""
		].join("|");
		if (lastTrackedKey.current === trackingKey) return;
		lastTrackedKey.current = trackingKey;
		trackUmamiEvent(buildDashboardPageViewEvent({
			routeKey: resolvedRouteKey,
			pageType,
			template,
			mode
		}));
	}, [
		mode,
		pageType,
		pathname,
		routeKey,
		template
	]);
	return null;
}
var init_DashboardPageViewTracker = __esmMin((() => {
	init_umami();
}));
//#endregion
export { DashboardRouteLinks as a, GitHubRepoButton as i, init_DashboardPageViewTracker as n, PageHeaderCard as o, ThemeToggleButton as r, DashboardPageViewTracker as t };
