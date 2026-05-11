import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import { n as buildFallbackDatasetSnapshot } from "./shared-data-fallbacks-BSFw5LEs.js";
import { c as getSystemHourlyProfile, i as getMonthlyDemandCurve, r as getDailyDemandCurve } from "./read-BgY-Mwu8.js";
import { i as formatMonthLabel, o as isValidMonthKey, t as withCache } from "./cache-DMRFuswD.js";
import { r as init_sentry_reporting, t as captureExceptionWithContext } from "./sentry-reporting-CvzcSweH.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { t as TrackedLink } from "./TrackedLink-BHId783N.js";
import * as React from "react";
import { createFileRoute, lazyRouteComponent, redirect } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import "server-only";
import { Accordion } from "@base-ui/react/accordion";
//#region src/components/ui/accordion.tsx
var Accordion$1, AccordionItem, AccordionTrigger, AccordionContent;
var init_accordion = __esmMin((() => {
	init_utils();
	Accordion$1 = Accordion.Root;
	AccordionItem = React.forwardRef(function AccordionItem({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx(Accordion.Item, {
			ref,
			className: (state) => cn("overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]", typeof className === "function" ? className(state) : className),
			...props
		});
	});
	AccordionTrigger = React.forwardRef(function AccordionTrigger({ className, children, ...props }, ref) {
		return /* @__PURE__ */ jsx(Accordion.Header, {
			className: "flex",
			children: /* @__PURE__ */ jsxs(Accordion.Trigger, {
				ref,
				className: (state) => cn("flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none", state.open ? "text-[var(--foreground)]" : "text-[var(--foreground)]", typeof className === "function" ? className(state) : className),
				...props,
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-base font-semibold",
					children
				}), /* @__PURE__ */ jsx("span", {
					className: "text-lg font-bold text-[var(--muted)]",
					"aria-hidden": "true",
					children: "+"
				})]
			})
		});
	});
	AccordionContent = React.forwardRef(function AccordionContent({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx(Accordion.Panel, {
			ref,
			className: (state) => cn("border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-[var(--muted)]", typeof className === "function" ? className(state) : className),
			...props
		});
	});
}));
//#endregion
//#region src/lib/public-navigation.ts
init_accordion();
init_routes();
var PUBLIC_PRIMARY_NAV_ITEMS = [
	{
		id: "home",
		label: "Inicio",
		href: appRoutes.home(),
		section: "primary",
		trackingRole: "home"
	},
	{
		id: "explore",
		label: "Explorar",
		href: appRoutes.explore(),
		section: "primary",
		trackingRole: "hub"
	},
	{
		id: "reports",
		label: "Informes",
		href: appRoutes.reports(),
		section: "primary",
		trackingRole: "hub"
	},
	{
		id: "dashboard",
		label: "Dashboard",
		href: appRoutes.dashboard(),
		section: "primary",
		trackingRole: "dashboard"
	}
];
var PUBLIC_UTILITY_NAV_ITEMS = [
	{
		id: "status",
		label: "Estado",
		href: appRoutes.status(),
		section: "utility",
		trackingRole: "utility"
	},
	{
		id: "api",
		label: "API",
		href: appRoutes.developers(),
		section: "utility",
		trackingRole: "utility"
	},
	{
		id: "help",
		label: "Metodologia",
		href: appRoutes.methodology(),
		section: "utility",
		trackingRole: "utility"
	}
];
var PUBLIC_NAV_ITEMS = [...PUBLIC_PRIMARY_NAV_ITEMS, ...PUBLIC_UTILITY_NAV_ITEMS];
function getPublicNavItem(id) {
	const item = PUBLIC_NAV_ITEMS.find((entry) => entry.id === id);
	if (!item) throw new Error(`Unknown public navigation item: ${id}`);
	return item;
}
function getExploreHubSections(options) {
	const latestMonthHref = options?.latestMonth ? appRoutes.reportMonth(options.latestMonth) : appRoutes.reports();
	return [
		{
			id: "operations",
			title: "Operacion y lectura rapida",
			description: "Herramientas para abrir el sistema en vivo, detectar friccion y moverse entre mapas y alertas sin perder contexto.",
			items: [
				{
					id: "stations",
					title: "Estaciones",
					eyebrow: "Directorio vivo",
					description: "Busca estaciones, entra al detalle operativo y abre predicciones, mapas y comparativas.",
					href: appRoutes.dashboardStations(),
					destinationLabel: "Dashboard > Operaciones"
				},
				{
					id: "alerts",
					title: "Alertas",
					eyebrow: "Incidencias y friccion",
					description: "Consulta alertas activas, severidad y el historial operativo para priorizar intervenciones.",
					href: appRoutes.dashboardAlerts(),
					destinationLabel: "Pagina dedicada"
				},
				{
					id: "maps",
					title: "Mapas",
					eyebrow: "Vista cartografica",
					description: "Abre el mapa principal con filtros, geolocalizacion, densidad y contexto de disponibilidad.",
					href: appRoutes.dashboard(),
					destinationLabel: "Dashboard > Resumen"
				},
				{
					id: "system-kpis",
					title: "KPIs sistema",
					eyebrow: "Salud y cobertura",
					description: "Mide cobertura, lag, volumen y estado general del sistema desde una pagina publica.",
					href: appRoutes.status(),
					destinationLabel: "Pagina publica"
				},
				{
					id: "redistribucion",
					title: "Redistribucion",
					eyebrow: "Logistica y equilibrio",
					description: "Diagnostico de redistribucion con clasificacion de estaciones, predicciones y transferencias origen-destino sugeridas.",
					href: appRoutes.seoPage("redistribucion-bizi-zaragoza"),
					destinationLabel: "Landing publica"
				}
			]
		},
		{
			id: "analysis",
			title: "Analisis y descubrimiento",
			description: "Bloques para leer patrones temporales, comparar zonas y entender movilidad, demanda y comportamiento.",
			items: [
				{
					id: "flow",
					title: "Flujo",
					eyebrow: "Corredores urbanos",
					description: "Analiza movilidad agregada, corredores y balance entre zonas con una vista completa.",
					href: appRoutes.dashboardFlow(),
					destinationLabel: "Pagina dedicada"
				},
				{
					id: "rankings",
					title: "Rankings",
					eyebrow: "Priorizacion",
					description: "Revisa estaciones con mayor uso, friccion o menor disponibilidad para decidir antes.",
					href: appRoutes.dashboardView("operations"),
					destinationLabel: "Dashboard > Operaciones"
				},
				{
					id: "heatmap",
					title: "Heatmap",
					eyebrow: "Lectura horaria",
					description: "Usa la capa de analisis para localizar horas punta, ocupacion y comportamiento por franja.",
					href: appRoutes.dashboardView("research"),
					destinationLabel: "Dashboard > Analisis"
				},
				{
					id: "compare",
					title: "Comparador",
					eyebrow: "Benchmarking",
					description: "Compara estaciones y contextos con estabilidad, uso relativo y señales recientes.",
					href: appRoutes.compare(),
					destinationLabel: "Pagina publica"
				},
				{
					id: "patterns",
					title: "Patrones",
					eyebrow: "Comportamiento intradia",
					description: "Explora tendencias horarias, volatilidad y regularidad para una estacion o el sistema.",
					href: appRoutes.dashboardView("research"),
					destinationLabel: "Dashboard > Analisis"
				},
				{
					id: "mobility",
					title: "Movilidad",
					eyebrow: "Origen y destino",
					description: "Sigue señales de salidas, llegadas y demanda agregada para lectura de movilidad urbana.",
					href: appRoutes.dashboardFlow(),
					destinationLabel: "Pagina dedicada"
				},
				{
					id: "districts",
					title: "Barrios",
					eyebrow: "Contexto territorial",
					description: "Abre comparativas territoriales y paginas publicas para lectura por barrio y distrito.",
					href: appRoutes.districtLanding(),
					destinationLabel: "Landing publica"
				}
			]
		},
		{
			id: "archive",
			title: "Historico y series",
			description: "Accesos para auditar cobertura, leer la evolucion temporal y enlazar informes mensuales persistentes.",
			items: [{
				id: "history",
				title: "Historico",
				eyebrow: "Auditoria del dataset",
				description: "Consulta historico agregado, exportaciones y trazabilidad de los datos compartidos.",
				href: appRoutes.dashboardView("data"),
				destinationLabel: "Dashboard > Datos"
			}, {
				id: "time-series",
				title: "Series temporales",
				eyebrow: "Archivo por periodos",
				description: "Entra al mes mas reciente o al archivo completo para seguir demanda, ocupacion y balance.",
				href: latestMonthHref,
				destinationLabel: options?.latestMonth ? `Informe ${options.latestMonth}` : "Archivo mensual"
			}]
		}
	];
}
//#endregion
//#region src/app/_components/PublicSectionNav.tsx
var MOBILE_PRIMARY_NAV_IDS = [
	"explore",
	"reports",
	"dashboard"
];
var MOBILE_COMPACT_NAV_LIMIT = 3;
function getMobileCompactNav(activeItemId) {
	const activeItem = getPublicNavItem(activeItemId);
	const mobilePrimaryNavItems = MOBILE_PRIMARY_NAV_IDS.map((id) => getPublicNavItem(id));
	if (activeItem.id === "home") return {
		visibleItems: [
			getPublicNavItem("home"),
			getPublicNavItem("explore"),
			getPublicNavItem("reports")
		],
		overflowItems: [getPublicNavItem("dashboard"), ...PUBLIC_UTILITY_NAV_ITEMS],
		isOverflowActive: false
	};
	if (activeItem.section === "utility") {
		const visibleItems = [
			getPublicNavItem("explore"),
			getPublicNavItem("reports"),
			activeItem
		];
		return {
			visibleItems,
			overflowItems: PUBLIC_NAV_ITEMS.filter((item) => !visibleItems.some((visible) => visible.id === item.id)),
			isOverflowActive: false
		};
	}
	return {
		visibleItems: mobilePrimaryNavItems,
		overflowItems: [getPublicNavItem("home"), ...PUBLIC_UTILITY_NAV_ITEMS],
		isOverflowActive: false
	};
}
function renderNavLink(item, isActive, sourceRole) {
	return /* @__PURE__ */ jsx(TrackedLink, {
		href: item.href,
		navigationEvent: {
			source: "public_section_nav",
			destination: item.id,
			module: `public_nav_${item.section}`,
			sourceRole,
			destinationRole: item.trackingRole,
			transitionKind: item.trackingRole === "dashboard" ? "to_dashboard" : "within_public"
		},
		"aria-current": isActive ? "page" : void 0,
		className: `inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isActive ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"}`,
		children: item.label
	}, item.id);
}
function PublicSectionNav({ activeItemId, className }) {
	const activeItem = getPublicNavItem(activeItemId);
	const mobileCompactNav = getMobileCompactNav(activeItemId);
	return /* @__PURE__ */ jsxs("nav", {
		"aria-label": "Secciones globales",
		className,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "hidden items-center justify-between gap-3 md:flex",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-center gap-2",
				children: PUBLIC_PRIMARY_NAV_ITEMS.map((item) => renderNavLink(item, item.id === activeItemId, activeItem.trackingRole))
			}), /* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-center gap-2",
				children: PUBLIC_UTILITY_NAV_ITEMS.map((item) => renderNavLink(item, item.id === activeItemId, activeItem.trackingRole))
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-2 md:hidden",
			children: [mobileCompactNav.visibleItems.slice(0, MOBILE_COMPACT_NAV_LIMIT).map((item) => renderNavLink(item, item.id === activeItemId, activeItem.trackingRole)), /* @__PURE__ */ jsx(Accordion$1, {
				className: "relative",
				children: /* @__PURE__ */ jsxs(AccordionItem, {
					value: "mobile-overflow",
					className: "border-none bg-transparent",
					children: [/* @__PURE__ */ jsx(AccordionTrigger, {
						className: `inline-flex cursor-pointer list-none rounded-full border px-3 py-1.5 text-xs font-semibold transition ${mobileCompactNav.isOverflowActive ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"}`,
						children: "Mas"
					}), /* @__PURE__ */ jsx(AccordionContent, {
						keepMounted: true,
						className: "absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-[200px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-soft)]",
						children: /* @__PURE__ */ jsx("div", {
							className: "flex flex-col gap-2",
							children: mobileCompactNav.overflowItems.map((item) => renderNavLink(item, item.id === activeItemId, activeItem.trackingRole))
						})
					})]
				})
			})]
		})]
	});
}
//#endregion
//#region src/lib/analytics-series.ts
var LIVE_SERIES_TTL_SECONDS = 300;
var MONTHLY_SERIES_TTL_SECONDS = 1800;
function normalizeMonthKey(monthKey) {
	return monthKey && isValidMonthKey(monthKey) ? monthKey : null;
}
function normalizeDays(days) {
	return Math.max(1, Math.min(365, Math.floor(days)));
}
function normalizeMonthLimit(limitMonths) {
	return Math.max(1, Math.min(240, Math.floor(limitMonths)));
}
async function fetchCachedDailyDemandCurve(days = 30, monthKey) {
	const normalizedDays = normalizeDays(days);
	const normalizedMonth = normalizeMonthKey(monthKey);
	return withCache(`analytics:daily-demand:days=${normalizedDays}:month=${normalizedMonth ?? "all"}`, LIVE_SERIES_TTL_SECONDS, () => getDailyDemandCurve(normalizedDays, normalizedMonth ?? void 0));
}
async function fetchCachedMonthlyDemandCurve(limitMonths = 12) {
	const normalizedLimit = normalizeMonthLimit(limitMonths);
	return withCache(`analytics:monthly-demand:limit=${normalizedLimit}`, MONTHLY_SERIES_TTL_SECONDS, () => getMonthlyDemandCurve(normalizedLimit));
}
async function fetchCachedSystemHourlyProfile(days = 14, monthKey) {
	const normalizedDays = normalizeDays(days);
	const normalizedMonth = normalizeMonthKey(monthKey);
	return withCache(`analytics:system-hourly-profile:days=${normalizedDays}:month=${normalizedMonth ?? "all"}`, LIVE_SERIES_TTL_SECONDS, () => getSystemHourlyProfile(normalizedDays, normalizedMonth ?? void 0));
}
//#endregion
//#region src/app/informes/[month]/route.tsx
init_routes();
init_sentry_reporting();
var $$splitComponentImporter = () => import("./route-BokSsOaI.js");
var Route = createFileRoute("/informes/month")({
	loader: async ({ params }) => {
		const month = params.month ?? "";
		if (!month || !isValidMonthKey(month)) throw redirect({ to: appRoutes.reports() });
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		try {
			await fetchCachedMonthlyDemandCurve().catch(() => buildFallbackDatasetSnapshot(nowIso));
			return {
				month,
				dataState: "ok"
			};
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "informes.month",
				operation: "loader"
			});
			return {
				month,
				dataState: "error"
			};
		}
	},
	head: (opts) => ({
		meta: [{ charSet: "utf-8" }, {
			name: "viewport",
			content: "width=device-width, initial-scale=1"
		}],
		title: `Informe ${formatMonthLabel(opts.params.month ?? "")} - DatosBizi`
	}),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { PublicSectionNav as a, Accordion$1 as c, AccordionTrigger as d, init_accordion as f, fetchCachedSystemHourlyProfile as i, AccordionContent as l, fetchCachedDailyDemandCurve as n, PUBLIC_NAV_ITEMS as o, fetchCachedMonthlyDemandCurve as r, getExploreHubSections as s, Route as t, AccordionItem as u };
