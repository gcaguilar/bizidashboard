import { n as __exportAll, r as __toCommonJS, t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { t as createAuthClient } from "./react-CVjCmmui.js";
import { a as cn, i as init_badge, n as init_card, o as init_utils, r as Badge, t as Card } from "./card-BqIrN6Ld.js";
import { a as getSiteUrl, o as init_site, r as getCityName, t as SITE_NAME } from "./site-B6Gst4bb.js";
import { n as init_page_shell, r as CitySwitcher, t as PageShell } from "./page-shell-CC8M_45q.js";
import { _ as SiteBreadcrumbs, a as buildBreadcrumbStructuredData, c as getPipelineStatusSummary, d as readPublicApiKey, f as withApiRequest, g as getSharedDataSource, i as buildFallbackStatus, l as recordSecurityEvent, m as getCoverageSummary, n as buildFallbackDatasetSnapshot, o as createRootBreadcrumbs, p as getPublicApiKey, r as buildFallbackStations, s as getSharedDatasetSnapshot, t as buildFallbackAvailableMonths, u as isApiKeyValid } from "./shared-data-fallbacks-BSFw5LEs.js";
import { n as ANALYTICS_WINDOWS, t as ALERT_THRESHOLDS } from "./types-DMKIRG7H.js";
import { o as getStationRankings, s as getStationsWithLatestStatus, t as getActiveAlerts, u as TIMEZONE } from "./read-BgY-Mwu8.js";
import { a as getMonthBounds, c as resolveActiveMonth, d as prisma, i as formatMonthLabel, l as toMonthOptions, n as getRedisClient, o as isValidMonthKey, s as normalizeMonthSearchParam, t as withCache, u as getCity } from "./cache-DMRFuswD.js";
import { a as updateExecutionContext, n as init_request_context } from "./request-context-C8lr5lzL.js";
import { t as logger } from "./logger-C1tbYDM5.js";
import { n as captureWarningWithContext, r as init_sentry_reporting, t as captureExceptionWithContext } from "./sentry-reporting-CvzcSweH.js";
import { d as resolveStationsDataState, f as resolveStatusDataState, i as combineDataStates, l as resolveMobilityDataState, n as buttonVariants, o as resolveDataState, p as shouldShowDataStateNotice, r as init_button, t as Button, u as resolveRankingsDataState } from "./button-CZXsd1v7.js";
import { a as isDistrictCollection, l as parseJsonWithGuard, n as buildStationDistrictMap, r as fetchDistrictCollection, t as DISTRICTS_GEOJSON_URL } from "./districts-e09LFoic.js";
import { _ as attachPeakFullHours, a as init_tabs, b as enrichRankingRows, c as FeedbackCta, d as fetchHistoryMetadata, f as fetchRankings, g as fetchStatus, h as fetchStations, i as TabsTrigger, m as fetchSharedDatasetSnapshot, n as TabsContent, o as Checkbox, p as fetchRankingsLite, r as TabsList, s as init_checkbox, t as Tabs, u as fetchAvailableDataMonths, v as buildDistrictSpotlight, y as buildPeakFullHoursByStation } from "./tabs-BWlq-PRw.js";
import { i as toAbsoluteRouteUrl, n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { a as DashboardRouteLinks, i as GitHubRepoButton, n as init_DashboardPageViewTracker, o as PageHeaderCard, r as ThemeToggleButton, t as DashboardPageViewTracker } from "./DashboardPageViewTracker-SrI8-Aae.js";
import { t as DataStateNotice } from "./DataStateNotice-BAkqjtQM.js";
import { a as buildEntitySelectEvent, d as buildPublicPageViewEvent, f as buildSearchSubmitEvent, h as trackUmamiEvent, m as resolveRouteKeyFromPathname, n as buildCtaClickEvent, o as buildExportClickEvent, p as init_umami, s as buildFilterChangeEvent, t as TrackedLink, u as buildPanelOpenEvent } from "./TrackedLink-BHId783N.js";
import { n as init_input, t as Input } from "./input-CNtnRSUp.js";
import { t as Progress } from "./progress-DkkST3KE.js";
import { n as init_TrackedAnchor, t as TrackedAnchor } from "./TrackedAnchor-CfqtzgOH.js";
import { i as formatRelativeMinutes, n as formatInteger$1, r as formatPercent$1, t as formatAlertType } from "./format-gBHZi2QJ.js";
import { i as ChartWrapper, n as useAbortableAsyncEffect, r as MeasuredResponsiveContainer, t as fetchJson } from "./useAbortableAsyncEffect-B-OZ9T1s.js";
import { n as init_scroll_area, t as ScrollArea } from "./scroll-area-BqieZcZp.js";
import { t as MetricCard } from "./metric-card-pE1Abaj6.js";
import { n as MonthFilter, t as Route$40 } from "./route-DGe9079t.js";
import { t as Route$41 } from "./route-BgHQb38F.js";
import { a as PublicSectionNav, c as Accordion, d as AccordionTrigger, f as init_accordion, i as fetchCachedSystemHourlyProfile, l as AccordionContent, n as fetchCachedDailyDemandCurve, o as PUBLIC_NAV_ITEMS, r as fetchCachedMonthlyDemandCurve, s as getExploreHubSections, t as Route$42, u as AccordionItem } from "./route-CribxMSv.js";
import * as React from "react";
import { Fragment, Suspense, cache, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { HeadContent, Link, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, redirect, useLocation, useRouter, useSearch } from "@tanstack/react-router";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import "server-only";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Select } from "@base-ui/react/select";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { jwtVerify } from "jose";
import { TextEncoder } from "node:util";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
//#region src/lib/security/api-keys.ts
init_utils();
init_badge();
init_card();
init_site();
init_request_context();
init_sentry_reporting();
init_routes();
init_button();
init_umami();
init_input();
init_DashboardPageViewTracker();
init_page_shell();
init_TrackedAnchor();
init_scroll_area();
init_accordion();
var DEFAULT_RATE_WINDOW_MS = 6e4;
/**
* Hash an API key for storage
*/
function hashApiKey(key) {
	return createHash("sha256").update(key).digest("hex");
}
/**
* Validate an API key and return its info if valid
*/
async function validateApiKey(providedKey) {
	if (!providedKey) return null;
	const keyHash = hashApiKey(providedKey);
	const record = await prisma.apiKey.findUnique({ where: { keyHash } });
	if (!record) return null;
	if (!record.isActive || record.revokedAt) return null;
	prisma.apiKey.update({
		where: { id: record.id },
		data: {
			lastUsedAt: /* @__PURE__ */ new Date(),
			requestCount: { increment: 1 }
		}
	}).catch((error) => {
		logger.warn("api_key.usage_update_failed", { error });
	});
	return {
		id: record.id,
		name: record.name,
		keyPrefix: record.keyPrefix,
		description: record.description,
		ownerEmail: record.ownerEmail,
		isActive: record.isActive,
		lastUsedAt: record.lastUsedAt,
		requestCount: record.requestCount,
		createdAt: record.createdAt,
		customRateLimit: record.customRateLimit,
		customRateWindow: record.customRateWindow
	};
}
/**
* Get rate limits for an API key (custom or defaults)
*/
function getApiKeyRateLimits(apiKeyInfo) {
	if (apiKeyInfo?.customRateLimit && apiKeyInfo?.customRateWindow) return {
		limit: apiKeyInfo.customRateLimit,
		windowMs: apiKeyInfo.customRateWindow
	};
	return {
		limit: 100,
		windowMs: DEFAULT_RATE_WINDOW_MS
	};
}
/**
* Check if API keys feature is configured
* Returns true if we should use multi-key system, false for legacy single-key
*/
function isMultiKeySystemEnabled() {
	return !process.env.PUBLIC_API_KEY?.trim();
}
//#endregion
//#region src/components/Footer.tsx
function Footer() {
	return /* @__PURE__ */ jsx("footer", {
		className: "border-t border-[var(--border)] bg-[var(--background)] py-6",
		children: /* @__PURE__ */ jsx("div", {
			className: "mx-auto max-w-7xl px-4 text-center text-sm text-[var(--muted)]",
			children: /* @__PURE__ */ jsx("p", { children: "DatosBizi - Panel de movilidad para sistemas de bicicletas publicas. Migrado a TanStack Start." })
		})
	});
}
//#endregion
//#region src/integrations/better-auth/header-user.tsx
function BetterAuthHeader() {
	const { data: session, isPending } = createAuthClient().useSession();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);
	const router = useRouter();
	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);
	const handleLogout = async () => {
		const { authClient } = await import("./react--CMMKQ26.js");
		await createAuthClient().signOut();
		router.navigate({ to: "/" });
		setDropdownOpen(false);
	};
	if (isPending) return /* @__PURE__ */ jsx("div", { className: "h-8 w-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse" });
	if (session?.user) return /* @__PURE__ */ jsxs("div", {
		className: "relative",
		ref: dropdownRef,
		children: [/* @__PURE__ */ jsx("button", {
			onClick: () => setDropdownOpen(!dropdownOpen),
			className: "flex items-center gap-2 hover:opacity-80 transition-opacity",
			children: session.user.image ? /* @__PURE__ */ jsx("img", {
				src: session.user.image,
				alt: "",
				className: "h-8 w-8 rounded-full"
			}) : /* @__PURE__ */ jsx("div", {
				className: "h-8 w-8 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center rounded-full",
				children: /* @__PURE__ */ jsx("span", {
					className: "text-xs font-medium text-neutral-600 dark:text-neutral-400",
					children: session.user.name?.charAt(0).toUpperCase() || "U"
				})
			})
		}), dropdownOpen && /* @__PURE__ */ jsxs("div", {
			className: "absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "px-4 py-2 border-b border-neutral-200 dark:border-neutral-700",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-medium text-neutral-900 dark:text-white",
						children: session.user.name
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xs text-neutral-500 dark:text-neutral-400 truncate",
						children: session.user.email
					})]
				}),
				/* @__PURE__ */ jsx(Link, {
					to: "/profile",
					className: "block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
					onClick: () => setDropdownOpen(false),
					children: "Mi perfil"
				}),
				/* @__PURE__ */ jsx("button", {
					onClick: handleLogout,
					className: "w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800",
					children: "Cerrar sesión"
				})
			]
		})]
	});
	return /* @__PURE__ */ jsx(Link, {
		to: "/login",
		className: "h-9 px-4 text-sm font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors inline-flex items-center",
		children: "Sign in"
	});
}
//#endregion
//#region src/components/Header.tsx
function Header() {
	return /* @__PURE__ */ jsx("header", {
		className: "border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-6",
				children: [/* @__PURE__ */ jsx(Link, {
					to: "/",
					className: "text-lg font-bold text-[var(--foreground)]",
					children: "DatosBizi"
				}), /* @__PURE__ */ jsxs("nav", {
					className: "hidden gap-4 text-sm md:flex",
					children: [
						/* @__PURE__ */ jsx(Link, {
							to: "/dashboard",
							className: "text-[var(--muted)] hover:text-[var(--foreground)] transition",
							children: "Dashboard"
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/estado",
							className: "text-[var(--muted)] hover:text-[var(--foreground)] transition",
							children: "Estado"
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/developers",
							className: "text-[var(--muted)] hover:text-[var(--foreground)] transition",
							children: "Developers"
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/informes",
							className: "text-[var(--muted)] hover:text-[var(--foreground)] transition",
							children: "Informes"
						})
					]
				})]
			}), /* @__PURE__ */ jsx(BetterAuthHeader, {})]
		})
	});
}
//#endregion
//#region src/styles.css?url
var styles_default = "/assets/styles-Du8w5fu9.css";
//#endregion
//#region src/app/__root.tsx
var THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;
var Route$39 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "DatosBizi" }
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	shellComponent: RootDocument
});
function RootDocument({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "es",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ jsxs("head", { children: [/* @__PURE__ */ jsx("script", { dangerouslySetInnerHTML: { __html: THEME_INIT_SCRIPT } }), /* @__PURE__ */ jsx(HeadContent, {})] }), /* @__PURE__ */ jsxs("body", {
			className: "font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]",
			children: [
				/* @__PURE__ */ jsx(Header, {}),
				children,
				/* @__PURE__ */ jsx(Footer, {}),
				/* @__PURE__ */ jsx(Scripts, {})
			]
		})]
	});
}
//#endregion
//#region src/app/viajes-por-mes-zaragoza.tsx
var $$splitComponentImporter$18 = () => import("./viajes-por-mes-zaragoza-C78WNr2l.js");
var Route$38 = createFileRoute("/viajes-por-mes-zaragoza")({ component: lazyRouteComponent($$splitComponentImporter$18, "component") });
//#endregion
//#region src/app/viajes-por-dia-zaragoza.tsx
var $$splitComponentImporter$17 = () => import("./viajes-por-dia-zaragoza-CqMwqcw0.js");
var Route$37 = createFileRoute("/viajes-por-dia-zaragoza")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
//#endregion
//#region src/app/uso-bizi-por-hora.tsx
var $$splitComponentImporter$16 = () => import("./uso-bizi-por-hora-CFgJJvfG.js");
var Route$36 = createFileRoute("/uso-bizi-por-hora")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
//#endregion
//#region src/app/uso-bizi-por-estacion.tsx
var $$splitComponentImporter$15 = () => import("./uso-bizi-por-estacion-CPvo-Y68.js");
var Route$35 = createFileRoute("/uso-bizi-por-estacion")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
//#endregion
//#region src/app/register.tsx
var $$splitComponentImporter$14 = () => import("./register-CD812xQv.js");
var Route$34 = createFileRoute("/register")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
//#endregion
//#region src/app/redistribucion-bizi-zaragoza.tsx
var $$splitComponentImporter$13 = () => import("./redistribucion-bizi-zaragoza-Brct2yIH.js");
var Route$33 = createFileRoute("/redistribucion-bizi-zaragoza")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
//#endregion
//#region src/app/ranking-estaciones-bizi.tsx
var $$splitComponentImporter$12 = () => import("./ranking-estaciones-bizi-D82eni9o.js");
var Route$32 = createFileRoute("/ranking-estaciones-bizi")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
//#endregion
//#region src/app/profile.tsx
var $$splitComponentImporter$11 = () => import("./profile-B0DIPg-Q.js");
var Route$31 = createFileRoute("/profile")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
//#endregion
//#region src/app/_components/PublicPageViewTracker.tsx
function PublicPageViewTracker({ routeKey, pageType, template, pageSlug, entityId }) {
	const pathname = useLocation().pathname;
	const lastTrackedKey = useRef(null);
	useEffect(() => {
		if (!pathname) return;
		const resolvedRouteKey = routeKey ?? resolveRouteKeyFromPathname(pathname);
		const trackingKey = [
			pathname,
			resolvedRouteKey,
			pageType,
			template,
			pageSlug ?? "",
			entityId ?? ""
		].join("|");
		if (lastTrackedKey.current === trackingKey) return;
		lastTrackedKey.current = trackingKey;
		trackUmamiEvent(buildPublicPageViewEvent({
			routeKey: resolvedRouteKey,
			pageType,
			template
		}));
	}, [
		entityId,
		pageSlug,
		pageType,
		pathname,
		routeKey,
		template
	]);
	return null;
}
//#endregion
//#region src/app/_components/PublicSearchForm.tsx
init_umami();
function PublicSearchForm({ className, placeholder = "Busca estaciones, barrios, informes o endpoints API", defaultQuery = "", buttonLabel = "Buscar", eventSource = "public_search" }) {
	const pathname = useLocation().pathname;
	return /* @__PURE__ */ jsxs("form", {
		action: appRoutes.explore(),
		method: "get",
		onSubmit: (event) => {
			const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
			trackUmamiEvent(buildSearchSubmitEvent({
				surface: "public",
				routeKey: resolveRouteKeyFromPathname(pathname),
				source: eventSource,
				queryLength: query.length
			}));
		},
		className: `flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3 ${className ?? ""}`.trim(),
		children: [/* @__PURE__ */ jsx("label", {
			htmlFor: "public-search",
			className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
			children: "Buscador global"
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap gap-2",
			children: [/* @__PURE__ */ jsx(Input, {
				id: "public-search",
				name: "q",
				type: "search",
				defaultValue: defaultQuery,
				placeholder,
				className: "min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
			}), /* @__PURE__ */ jsx(Button, {
				type: "submit",
				className: "inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
				children: buttonLabel
			})]
		})]
	});
}
//#endregion
//#region src/app/dashboard/ayuda/_components/help-center-content.ts
init_routes();
var CATEGORY_PRIORITY = [
	"Alertas",
	"Prediccion",
	"Movilidad",
	"Clasificaciones",
	"Datos",
	"Uso",
	"Soporte"
];
var FAQ_PRIORITY_IDS = [
	"alertas-activas",
	"alerta-resuelta-significado",
	"severidad-alertas",
	"proyeccion",
	"prediccion-que-es",
	"confianza-prediccion",
	"prediccion-uso-practico",
	"calculo-rutas",
	"matriz-od",
	"demanda-no-viajes-reales",
	"movilidad-causalidad"
];
var FAQ_ITEMS = [
	{
		id: "alertas-activas",
		category: "Alertas",
		question: "Cuando una estacion entra en alerta?",
		answer: `Miramos las ultimas ${ANALYTICS_WINDOWS.alertWindowHours} horas (no solo el ultimo minuto). Si la media de bicis baja de ${ALERT_THRESHOLDS.lowBikes} o la media de anclajes libres baja de ${ALERT_THRESHOLDS.lowAnchors}, la estacion entra en alerta.`
	},
	{
		id: "severidad-alertas",
		category: "Alertas",
		question: "Que significa una alerta critica?",
		answer: "Tenemos dos niveles: severidad 1 (media) y severidad 2 (critica). Critica significa que la situacion es mas urgente y esa estacion suele ir primero en la cola de redistribucion."
	},
	{
		id: "alerta-persistente",
		category: "Alertas",
		question: "Por que la alerta sigue activa aunque la estacion mejoro?",
		answer: "Porque no usamos solo una foto puntual. Si venia mal durante varias lecturas, puede tardar un poco en salir de alerta. Se limpia cuando la media reciente vuelve a valores normales."
	},
	{
		id: "alerta-resuelta-significado",
		category: "Alertas",
		question: "Que significa que una alerta salga como resuelta?",
		answer: "Significa que ya no supera el umbral en la ventana reciente. Ojo: no siempre implica que la operacion en calle este cerrada; solo indica que el dato actual ya no esta en zona de alerta."
	},
	{
		id: "alerta-vacia-llena",
		category: "Alertas",
		question: "Que diferencia hay entre alerta de vacia y de llena?",
		answer: "Vacia = poca bici para sacar. Llena = pocos anclajes para devolver. En ambos casos hay friccion para la persona usuaria y suele requerir movimiento de flota."
	},
	{
		id: "balance-index",
		category: "Clasificaciones",
		question: "Que es el Balance Index del sistema?",
		answer: "Es una medida de equilibrio global. Compara la ocupacion de cada estacion con el 50%. Si muchas estaciones estan cerca de ese punto, el indice sube. Si muchas estan vacias o llenas, baja."
	},
	{
		id: "rotacion-14d",
		category: "Clasificaciones",
		question: "Que es la metrica de rotacion 14d?",
		answer: "Es un indicador para comparar actividad entre estaciones en los ultimos 14 dias. Cuanto mayor, mas movimiento. Es una puntuacion relativa (ranking), no un numero exacto de viajes."
	},
	{
		id: "horas-problema",
		category: "Clasificaciones",
		question: "Como se calcula horas problema?",
		answer: "Sumamos las horas en las que la estacion estuvo en zona complicada: muy pocas bicis o muy pocos anclajes libres. Cuantas mas horas problema, mas riesgo operativo."
	},
	{
		id: "ranking-no-aparece",
		category: "Clasificaciones",
		question: "Por que una estacion no aparece en el ranking?",
		answer: "Puede no aparecer por falta de datos suficientes en la ventana analitica o porque queda fuera del limite de resultados mostrados."
	},
	{
		id: "ranking-rotacion-vs-criticidad",
		category: "Clasificaciones",
		question: "Que diferencia hay entre rotacion y criticidad?",
		answer: "Rotacion responde a \"donde hay mas movimiento\". Criticidad responde a \"donde hay mas problemas de disponibilidad\". Una estacion puede tener mucha rotacion y poca criticidad, o al reves."
	},
	{
		id: "comparar-estaciones",
		category: "Clasificaciones",
		question: "Como comparo estaciones de distinto tamano?",
		answer: "Para comparar justo, mira primero porcentaje de ocupacion y horas problema. Los valores absolutos (bicis/anclajes) pueden enganar porque una estacion grande siempre mueve mas volumen que una pequena."
	},
	{
		id: "proyeccion",
		category: "Prediccion",
		question: "La proyeccion de +30/+60 min es un modelo IA?",
		answer: "No es una \"bola de cristal\" ni una lectura real futura. Es una estimacion hecha con lo que suele pasar en esa estacion a esa hora y con su estado reciente."
	},
	{
		id: "confianza-prediccion",
		category: "Prediccion",
		question: "Que significa el porcentaje de confianza?",
		answer: "Es una pista de cuanta fe darle a la prediccion. Si hay buen historico reciente, la confianza sube. Si faltan datos o hay mucho ruido, baja. No es garantia, es orientacion."
	},
	{
		id: "prediccion-sin-datos",
		category: "Prediccion",
		question: "Por que a veces no hay prediccion o aparece muy plana?",
		answer: "Suele pasar cuando hay poco historico, datos irregulares o cambios recientes en la estacion. En esos casos se usa una estimacion mas conservadora y por eso la curva se ve \"plana\"."
	},
	{
		id: "prediccion-que-es",
		category: "Prediccion",
		question: "Que son exactamente las predicciones del dashboard?",
		answer: "Son valores estimados de disponibilidad futura (por ejemplo +30 y +60 min). Se calculan con patrones del pasado + situacion actual. Sirven para anticipar, no para confirmar lo que va a pasar al 100%."
	},
	{
		id: "prediccion-uso-practico",
		category: "Prediccion",
		question: "Como usar la prediccion en la operativa diaria?",
		answer: "Usala como alerta temprana: si una estacion apunta a quedarse sin bicis o sin anclajes en +30/+60 min, adelantate con redistribucion. Es mejor para prevenir que para auditar a posteriori."
	},
	{
		id: "matriz-od",
		category: "Movilidad",
		question: "La matriz O-D representa viajes reales?",
		answer: "No son viajes uno a uno. Es una estimacion agregada por distritos para entender hacia donde parece moverse la demanda en cada franja horaria."
	},
	{
		id: "destinos-estimados",
		category: "Movilidad",
		question: "Como se obtienen los destinos estimados?",
		answer: "Primero vemos cuanto \"sale\" de cada distrito. Luego repartimos ese flujo entre distritos destino segun el peso de entradas observadas en ese mismo tramo horario."
	},
	{
		id: "balance-neto",
		category: "Movilidad",
		question: "Que indica un balance neto positivo o negativo?",
		answer: "Positivo: entra mas flujo del que sale. Negativo: sale mas del que entra. Te ayuda a ver que barrios \"reciben\" o \"expulsan\" demanda en cada periodo."
	},
	{
		id: "periodos-flujo",
		category: "Movilidad",
		question: "Como cambian los resultados por franja horaria?",
		answer: "Cada filtro (mañana, mediodia, tarde, noche) recalcula todo para ese tramo. Por eso una ruta puede ser fuerte por la mañana y casi desaparecer por la noche."
	},
	{
		id: "diagrama-chord",
		category: "Movilidad",
		question: "Como leer el diagrama chord?",
		answer: "Cada bloque es un distrito y cada banda une origen-destino. Banda mas gruesa = mas flujo estimado. Sirve para ver \"corredores\" de demanda de un vistazo."
	},
	{
		id: "calculo-rutas",
		category: "Movilidad",
		question: "Como se calculan las rutas estimadas?",
		answer: "Tomamos cambios de disponibilidad por hora en estaciones, los agrupamos por distrito y estimamos que parte del flujo va a cada destino segun su peso relativo. Resultado: rutas probables entre zonas, no rutas GPS exactas."
	},
	{
		id: "demanda-no-viajes-reales",
		category: "Movilidad",
		question: "Demanda significa numero real de viajes?",
		answer: "No exactamente. Es un indice para medir \"actividad\" del sistema. Va muy bien para comparar dias y zonas, pero no debe leerse como contador oficial de viajes cerrados."
	},
	{
		id: "movilidad-causalidad",
		category: "Movilidad",
		question: "Si dos metricas suben a la vez, significa causa directa?",
		answer: "No siempre. El dashboard muestra relaciones utiles para tomar decisiones rapidas, pero correlacion no es prueba de causa. Para causalidad hace falta analisis mas profundo."
	},
	{
		id: "historico-balance-data",
		category: "Datos",
		question: "Que enseña el historico de equilibrio y demanda?",
		answer: "Combina dos lecturas: la demanda agregada y el balance index diario. Asi puedes ver si el sistema mueve mucha actividad pero sigue equilibrado, o si el volumen crece junto con la friccion."
	},
	{
		id: "exportaciones",
		category: "Datos",
		question: "Que datos puedo exportar desde el modo Data?",
		answer: "Puedes descargar el estado actual de estaciones en CSV, el ranking de friccion, el historico agregado con balance, el historico de alertas y el resumen del sistema."
	},
	{
		id: "desconectado-frescura",
		category: "Datos",
		question: "Cuando aparece que el sistema esta desconectado?",
		answer: "Cuando la ultima actualizacion util tiene mas de 10 minutos. Es una forma simple de avisar de que los datos pueden estar atrasados o que la ingesta necesita revisarse."
	},
	{
		id: "actualizacion",
		category: "Datos",
		question: "Con que frecuencia se actualiza el dashboard?",
		answer: "Los datos se refrescan de forma periodica y la API usa cache corta para no saturar consultas. Por eso puede haber unos minutos de diferencia entre una vista y otra."
	},
	{
		id: "ventana-analitica",
		category: "Datos",
		question: "Que ventana usa la analitica principal?",
		answer: `Los rankings usan una ventana de ${ANALYTICS_WINDOWS.rankingDays} dias y las alertas se calculan sobre ${ANALYTICS_WINDOWS.alertWindowHours} horas moviles.`
	},
	{
		id: "fuente-datos",
		category: "Datos",
		question: "De donde salen los datos de estaciones?",
		answer: "La fuente principal es el feed GBFS oficial de Bizi Zaragoza: https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json. A partir de ese discovery se consultan station_information y station_status de forma periodica, y luego se validan y agregan para analitica."
	},
	{
		id: "sin-datos",
		category: "Datos",
		question: "Por que a veces aparece \"sin datos\"?",
		answer: "Las causas mas comunes son: estacion nueva, huecos temporales en la recogida o pocas muestras para calcular con fiabilidad. No siempre es fallo; a veces es falta de base suficiente."
	},
	{
		id: "desfase-horario",
		category: "Datos",
		question: "Por que a veces no coincide la hora exacta con otra app?",
		answer: "Puede haber pequenas diferencias por zona horaria mostrada, cache o momento de refresco. Para validar, revisa siempre la marca de \"ultima actualizacion\" del panel."
	},
	{
		id: "busqueda",
		category: "Uso",
		question: "Como busco una estacion rapidamente?",
		answer: "Puedes buscar por nombre o ID. El buscador ignora mayusculas y acentos para encontrar coincidencias de forma mas flexible."
	},
	{
		id: "enlaces-directos-modo",
		category: "Uso",
		question: "Hay enlaces directos para abrir un modo concreto del dashboard?",
		answer: `Si. Tambien existen rutas directas por modo, como ${appRoutes.dashboardView("operations")} o ${appRoutes.dashboardView("research")}. Redirigen al dashboard con el modo correcto ya seleccionado.`
	},
	{
		id: "mapa-compartible",
		category: "Uso",
		question: "Puedo compartir el mapa tal y como lo estoy viendo?",
		answer: "Si. La URL guarda el modo, los filtros principales y la posicion del mapa. Asi otra persona puede abrir el mismo contexto de trabajo con bastante precision."
	},
	{
		id: "mapa-por-modo",
		category: "Uso",
		question: "Por que cambia el mensaje del mapa segun el modo?",
		answer: "Porque cada modo tiene un objetivo distinto. En overview el mapa ayuda a entender el estado general. En operations resalta mejor donde conviene intervenir primero."
	},
	{
		id: "mapa-friccion-operaciones",
		category: "Uso",
		question: "Que significa el halo rojo en el mapa de operaciones?",
		answer: "Ese halo resalta estaciones con mas friccion acumulada. Cuanto mayor es, mas tiempo ha pasado la estacion en estados operativamente problematicos, como vacia o llena."
	},
	{
		id: "estados-mapa",
		category: "Uso",
		question: "Que significan los colores del mapa?",
		answer: "Verde indica buena disponibilidad, amarillo nivel intermedio y rojo estado critico respecto a la ocupacion de la estacion."
	},
	{
		id: "estaciones-criticas-overview",
		category: "Uso",
		question: "Que significa Top estaciones criticas?",
		answer: "Es una lista priorizada para actuar rapido. Da mas peso a estaciones vacias o llenas, y despues a las que tienen una ocupacion muy extrema aunque todavia no hayan llegado al limite."
	},
	{
		id: "volatilidad-operativa",
		category: "Movilidad",
		question: "Que significa volatilidad operativa?",
		answer: "Es una forma simple de resumir cuanta inestabilidad hay en la red. Si muchas estaciones pasan una parte alta del tiempo vacias o llenas, la volatilidad sube."
	},
	{
		id: "research-snapshots-recientes",
		category: "Movilidad",
		question: "Que significa cambio mas visible en memoria?",
		answer: "Es una comparacion rapida entre el primer y el ultimo snapshot reciente guardado en el navegador. No sustituye al historico agregado, pero ayuda a ver movimientos inmediatos mientras exploras la vista de analisis."
	},
	{
		id: "research-lectura-temporal",
		category: "Movilidad",
		question: "Que aporta la lectura temporal rapida en research?",
		answer: "Resume de forma sencilla que dia tuvo mas demanda y en que hora suele haber mas bici disponible. Es una puerta de entrada antes de ir a graficos mas detallados."
	},
	{
		id: "detalle-estacion",
		category: "Uso",
		question: "Cuando debo ir a la pagina de detalle de estacion?",
		answer: "Cuando necesites analisis profundo: benchmarking, prediccion temporal, curva horaria y comparativas para una estacion concreta."
	},
	{
		id: "estabilidad-estacion",
		category: "Clasificaciones",
		question: "Que significa estabilidad por estacion?",
		answer: "Resume cuanto tiempo pasa una estacion lejos de un comportamiento sano. Si acumula muchas horas vacia o llena, su estabilidad baja. Sirve para detectar puntos delicados en el tiempo."
	},
	{
		id: "predicciones-futuro-endpoint",
		category: "Datos",
		question: "Que significa que el sistema ya este preparado para predicciones?",
		answer: "Significa que ya existe un endpoint operativo de prediccion y una UI preparada para consumirlo. Ahora mismo estima ocupacion a corto plazo con patrones historicos y estado actual, sin necesidad de rehacer el dashboard."
	},
	{
		id: "api-documentacion",
		category: "Soporte",
		question: "Hay endpoints API para integrar estos datos?",
		answer: "Si. El proyecto expone endpoints para estado, estaciones, alertas, rankings, patrones, heatmap, movilidad, historico y predicciones por estacion. El modo Data resume los principales formatos y rutas."
	},
	{
		id: "contacto-soporte",
		category: "Soporte",
		question: "Como reporto una incidencia de datos?",
		answer: "Incluye estacion, hora aproximada, vista donde aparece el problema y una captura. Con ese contexto se acelera la revision tecnica."
	}
];
//#endregion
//#region src/lib/social-images.ts
init_routes();
//#endregion
//#region src/lib/openapi-document.ts
var openApiDocument = {
	openapi: "3.1.0",
	info: {
		title: "Bizi Dashboard API",
		version: "0.5.0",
		description: "API endpoints for station status, rankings, alerts, patterns, heatmaps, mobility, and transit impact."
	},
	components: { securitySchemes: {
		OpsApiKey: {
			type: "apiKey",
			in: "header",
			name: "x-ops-api-key",
			description: "Required for GET/POST /api/collect. x-collect-api-key is accepted temporarily as a compatibility alias."
		},
		PublicApiKey: {
			type: "apiKey",
			in: "header",
			name: "x-public-api-key",
			description: "Required for elevated access to expensive public endpoints and CSV exports."
		},
		OAuthClientCredentials: {
			type: "oauth2",
			description: "OAuth 2.0 client credentials for agents that need bearer tokens instead of x-public-api-key.",
			flows: { clientCredentials: {
				tokenUrl: "/oauth/token",
				scopes: { "public_api.read": "Read protected public API routes and exports." }
			} }
		}
	} },
	paths: {
		"/api/health/live": { get: {
			operationId: "get_health_live",
			summary: "Liveness probe (no dependencies)",
			responses: { 200: { description: "Process is alive" } }
		} },
		"/api/health/ready": { get: {
			operationId: "get_health_ready",
			summary: "Readiness probe (checks database connectivity)",
			responses: {
				200: { description: "Service is ready to serve traffic" },
				503: { description: "Service dependencies are not ready" }
			}
		} },
		"/api/status": { get: {
			operationId: "get_status",
			summary: "Get pipeline observability metrics",
			responses: { 200: { description: "Pipeline and system status payload" } }
		} },
		"/api/stations": { get: {
			operationId: "get_stations",
			summary: "List stations with latest availability snapshot",
			responses: { 200: { description: "Stations payload with generatedAt" } }
		} },
		"/api/rankings": { get: {
			operationId: "get_rankings",
			summary: "Get station rankings by turnover or availability",
			parameters: [{
				name: "type",
				in: "query",
				required: true,
				description: "Ranking type to return",
				schema: {
					type: "string",
					enum: ["turnover", "availability"]
				}
			}, {
				name: "limit",
				in: "query",
				required: false,
				description: "Maximum number of rows",
				schema: {
					type: "integer",
					minimum: 1,
					maximum: 100,
					default: 20
				}
			}],
			responses: { 200: { description: "Rankings payload" } }
		} },
		"/api/alerts": { get: {
			operationId: "get_alerts",
			summary: "List active alerts",
			parameters: [{
				name: "limit",
				in: "query",
				required: false,
				description: "Maximum number of alerts",
				schema: {
					type: "integer",
					minimum: 1,
					maximum: 200,
					default: 50
				}
			}],
			responses: { 200: { description: "Alerts payload" } }
		} },
		"/api/alerts/history": { get: {
			operationId: "get_alerts_history",
			summary: "List alert history with filters, pagination, and CSV export",
			parameters: [
				{
					name: "state",
					in: "query",
					required: false,
					description: "Filter by alert state",
					schema: {
						type: "string",
						enum: [
							"all",
							"active",
							"resolved"
						],
						default: "all"
					}
				},
				{
					name: "stationId",
					in: "query",
					required: false,
					description: "Filter by station identifier",
					schema: { type: "string" }
				},
				{
					name: "alertType",
					in: "query",
					required: false,
					description: "Filter by alert type",
					schema: {
						type: "string",
						enum: [
							"all",
							"LOW_BIKES",
							"LOW_ANCHORS"
						],
						default: "all"
					}
				},
				{
					name: "severity",
					in: "query",
					required: false,
					description: "Filter by severity (1=media, 2=critica)",
					schema: {
						type: "integer",
						minimum: 1,
						maximum: 5
					}
				},
				{
					name: "from",
					in: "query",
					required: false,
					description: "Start datetime (ISO 8601)",
					schema: {
						type: "string",
						format: "date-time"
					}
				},
				{
					name: "to",
					in: "query",
					required: false,
					description: "End datetime (ISO 8601)",
					schema: {
						type: "string",
						format: "date-time"
					}
				},
				{
					name: "limit",
					in: "query",
					required: false,
					description: "Rows per page",
					schema: {
						type: "integer",
						minimum: 1,
						maximum: 2e3,
						default: 200
					}
				},
				{
					name: "offset",
					in: "query",
					required: false,
					description: "Pagination offset",
					schema: {
						type: "integer",
						minimum: 0,
						maximum: 2e4,
						default: 0
					}
				},
				{
					name: "format",
					in: "query",
					required: false,
					description: "Response format",
					schema: {
						type: "string",
						enum: ["json", "csv"],
						default: "json"
					}
				}
			],
			responses: { 200: { description: "Alert history payload or CSV file" } }
		} },
		"/api/patterns": { get: {
			operationId: "get_patterns",
			summary: "Get weekday/weekend hourly patterns for one station",
			parameters: [{
				name: "stationId",
				in: "query",
				required: true,
				description: "Station identifier",
				schema: { type: "string" }
			}],
			responses: { 200: { description: "Pattern rows" } }
		} },
		"/api/heatmap": { get: {
			operationId: "get_heatmap",
			summary: "Get occupancy heatmap cells for one station",
			parameters: [{
				name: "stationId",
				in: "query",
				required: true,
				description: "Station identifier",
				schema: { type: "string" }
			}],
			responses: { 200: { description: "Heatmap rows" } }
		} },
		"/api/mobility": { get: {
			operationId: "get_mobility",
			summary: "Get mobility signals, demand curve, and transit impact",
			parameters: [{
				name: "mobilityDays",
				in: "query",
				required: false,
				description: "Lookback days for hourly mobility signals",
				schema: {
					type: "integer",
					minimum: 1,
					maximum: 365,
					default: 14
				}
			}, {
				name: "demandDays",
				in: "query",
				required: false,
				description: "Lookback days for daily demand curve",
				schema: {
					type: "integer",
					minimum: 1,
					maximum: 365,
					default: 30
				}
			}],
			responses: { 200: { description: "Mobility payload" } }
		} },
		"/api/history": { get: {
			operationId: "get_history",
			summary: "Get full historical demand data since first record",
			responses: { 200: { description: "Historical coverage metadata and daily history" } }
		} },
		"/api/collect": {
			get: {
				operationId: "get_collect",
				summary: "Get collection job state",
				security: [{ OpsApiKey: [] }],
				responses: { 200: { description: "Collector state payload" } }
			},
			post: {
				operationId: "post_collect",
				summary: "Trigger one data collection run",
				security: [{ OpsApiKey: [] }],
				responses: {
					200: { description: "Collection execution payload" },
					401: { description: "Missing or invalid API key" },
					429: { description: "Rate limit exceeded" },
					503: { description: "Collect trigger endpoint misconfigured" }
				}
			}
		},
		"/api/rebalancing-report": { get: {
			operationId: "get_rebalancing_report",
			summary: "Station rebalancing diagnostic report with classification, predictions, and transfer recommendations",
			description: "Returns a full rebalancing report: station diagnostics classified A-F (overstock, deficit, peak_saturation, peak_emptying, balanced, data_review), risk predictions at 1h/3h, network elasticity context, origin-destination transfer recommendations, KPIs, and baseline comparison. Filterable by barrio/district.",
			parameters: [
				{
					name: "district",
					in: "query",
					required: false,
					description: "Filter results by barrio/district name (e.g. \"Centro\", \"Delicias\")",
					schema: { type: "string" }
				},
				{
					name: "days",
					in: "query",
					required: false,
					description: "Analysis window in days (default 15, max 90)",
					schema: {
						type: "integer",
						minimum: 1,
						maximum: 90,
						default: 15
					}
				},
				{
					name: "format",
					in: "query",
					required: false,
					description: "Response format: json (default) or csv",
					schema: {
						type: "string",
						enum: ["json", "csv"]
					}
				}
			],
			responses: {
				200: { description: "Rebalancing report with station diagnostics (classification A-F), transfer recommendations, KPIs, and baseline comparison" },
				400: { description: "Invalid query parameters" },
				500: { description: "Internal server error" }
			}
		} },
		"/api/docs": { get: {
			operationId: "get_api_docs",
			summary: "Get OpenAPI document (compatibility endpoint)",
			responses: { 200: { description: "OpenAPI document" } }
		} },
		"/api/openapi.json": { get: {
			operationId: "get_openapi_json",
			summary: "Get OpenAPI document",
			responses: { 200: { description: "OpenAPI document" } }
		} }
	}
};
//#endregion
//#region src/lib/system-status.ts
init_routes();
function toDate(value) {
	if (!value) return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function formatStatusDateTime(value) {
	const parsed = toDate(value);
	return parsed ? parsed.toLocaleString("es-ES") : "Sin datos";
}
function formatStatusNumber(value) {
	return new Intl.NumberFormat("es-ES").format(value);
}
function getHealthLabel(status) {
	switch (status) {
		case "healthy": return "Saludable";
		case "degraded": return "Degradado";
		case "down": return "Caido";
		default: return "Desconocido";
	}
}
function getHealthToneClasses(status) {
	switch (status) {
		case "healthy": return "border-emerald-500/40 bg-emerald-500/12 text-emerald-200";
		case "degraded": return "border-amber-500/40 bg-amber-500/12 text-amber-200";
		case "down": return "border-rose-500/40 bg-rose-500/12 text-rose-200";
		default: return "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]";
	}
}
function getObservedCadenceLabel(status) {
	if (status.pipeline.pollsLast24Hours <= 0) return "Sin datos recientes";
	return `~${Math.max(1, Math.round(1440 / status.pipeline.pollsLast24Hours))} min por sondeo`;
}
function getPipelineLagMinutes(status) {
	const lastPoll = toDate(status.pipeline.lastSuccessfulPoll);
	if (!lastPoll) return null;
	return Math.max(0, Math.round((Date.now() - lastPoll.getTime()) / 6e4));
}
function getPipelineLagLabel(status) {
	const lagMinutes = getPipelineLagMinutes(status);
	if (lagMinutes === null) return "Sin referencia";
	if (lagMinutes < 1) return "<1 min";
	return `${lagMinutes} min`;
}
function getCoverageLabel(dataset) {
	const firstRecordedAt = formatStatusDateTime(dataset.coverage.firstRecordedAt);
	const lastRecordedAt = formatStatusDateTime(dataset.coverage.lastRecordedAt);
	return `${dataset.coverage.totalDays} dias · ${firstRecordedAt} -> ${lastRecordedAt}`;
}
function getDatasetVersionLabel(dataset) {
	const parsed = toDate(dataset.lastUpdated.lastSampleAt ?? dataset.coverage.lastRecordedAt ?? dataset.coverage.generatedAt);
	if (!parsed) return "Sin version derivada";
	return `cov-${parsed.toISOString().slice(0, 10).replace(/-/g, "")}-${dataset.coverage.totalSamples}`;
}
function getApiVersionLabel() {
	return openApiDocument.info.version;
}
function buildSystemIncidents(status, dataset) {
	const incidents = [];
	if (status.pipeline.healthReason) incidents.push({
		id: "pipeline-health",
		severity: status.pipeline.healthStatus,
		title: `Pipeline ${getHealthLabel(status.pipeline.healthStatus).toLowerCase()}`,
		description: status.pipeline.healthReason
	});
	if (!status.quality.freshness.isFresh) incidents.push({
		id: "freshness",
		severity: status.pipeline.healthStatus === "down" ? "down" : "degraded",
		title: "Datos sin frescura operativa",
		description: `La ultima muestra confirmada es ${formatStatusDateTime(status.quality.freshness.lastUpdated)}.`
	});
	if (status.pipeline.validationErrors > 0) incidents.push({
		id: "validation-errors",
		severity: status.pipeline.validationErrors > 10 ? "down" : "degraded",
		title: "Errores de validacion acumulados",
		description: `${formatStatusNumber(status.pipeline.validationErrors)} incidencias de validacion registradas.`
	});
	if (dataset.coverage.totalDays === 0 || dataset.stats.totalSamples === 0) incidents.push({
		id: "coverage",
		severity: "down",
		title: "Sin cobertura historica suficiente",
		description: "No hay historial agregado suficiente para alimentar rankings, predicciones o series temporales."
	});
	if (incidents.length === 0) incidents.push({
		id: "no-incidents",
		severity: "healthy",
		title: "Sin incidentes activos",
		description: "La ingesta, la cobertura y la API responden dentro de los umbrales esperados."
	});
	return incidents;
}
function buildSystemCapabilities(status, dataset, stations) {
	const hasHistory = dataset.coverage.totalDays > 0 && dataset.stats.totalSamples > 0;
	const hasLiveStations = stations.stations.length > 0 || status.quality.volume.recentStationCount > 0;
	const predictionsState = hasHistory && status.quality.freshness.lastUpdated ? status.pipeline.healthStatus === "down" ? "degraded" : "healthy" : "down";
	const rankingsState = hasHistory && dataset.stats.totalStations > 0 ? status.pipeline.healthStatus === "down" ? "degraded" : "healthy" : "down";
	const historyState = hasHistory ? "healthy" : "down";
	const apiState = status.pipeline.healthStatus;
	const scrapersState = status.pipeline.pollsLast24Hours > 0 ? status.pipeline.healthStatus : "down";
	const ingestionState = status.quality.freshness.isFresh ? status.pipeline.healthStatus === "down" ? "degraded" : "healthy" : status.pipeline.healthStatus === "healthy" ? "degraded" : "down";
	return [
		{
			id: "predictions",
			label: "Estado predicciones",
			href: appRoutes.dashboardView("data"),
			state: predictionsState,
			description: hasHistory ? "La capa predictiva puede combinar historico y snapshot actual." : "Falta historico suficiente para sostener predicciones fiables."
		},
		{
			id: "rankings",
			label: "Estado rankings",
			href: appRoutes.dashboardView("operations"),
			state: rankingsState,
			description: hasHistory ? "Hay cobertura agregada para priorizacion por uso y disponibilidad." : "Los rankings necesitan historico agregado para ser consistentes."
		},
		{
			id: "history",
			label: "Estado historico",
			href: appRoutes.dashboardView("data"),
			state: historyState,
			description: hasHistory ? `${formatStatusNumber(dataset.stats.totalSamples)} muestras agregadas disponibles.` : "No hay muestras agregadas suficientes para auditoria o series temporales."
		},
		{
			id: "api",
			label: "Estado API",
			href: appRoutes.developers(),
			state: apiState,
			description: hasLiveStations ? `La API publica sirve snapshots con version ${getApiVersionLabel()}.` : "La API no tiene snapshot operativo reciente que publicar."
		},
		{
			id: "scrapers",
			label: "Estado scrapers",
			href: appRoutes.api.status(),
			state: scrapersState,
			description: status.pipeline.pollsLast24Hours > 0 ? `${formatStatusNumber(status.pipeline.pollsLast24Hours)} recogidas registradas en 24 horas.` : "No hay recogidas recientes registradas."
		},
		{
			id: "ingestion",
			label: "Estado ingestion",
			href: appRoutes.status(),
			state: ingestionState,
			description: status.quality.freshness.isFresh ? `Ultima muestra util ${formatStatusDateTime(status.quality.freshness.lastUpdated)}.` : "La ingesta va retrasada respecto al umbral de frescura esperado."
		}
	];
}
//#endregion
//#region src/app/metodologia.tsx
init_routes();
var FAQ_IDS = [
	"fuente-datos",
	"actualizacion",
	"demanda-no-viajes-reales",
	"prediccion-que-es"
];
function buildFallbackHistoryMetadata$1(nowIso) {
	return {
		source: getSharedDataSource(),
		coverage: {
			firstRecordedAt: null,
			lastRecordedAt: null,
			totalSamples: 0,
			totalStations: 0,
			totalDays: 0,
			generatedAt: nowIso
		},
		generatedAt: nowIso
	};
}
function getMethodologyFaqItems() {
	return FAQ_IDS.flatMap((id) => FAQ_ITEMS.filter((item) => item.id === id));
}
var Route$30 = createFileRoute("/metodologia")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Entiende de donde salen los datos de Bizi Zaragoza, como se actualizan, que significan las metricas publicas y que limites conviene tener en cuenta al interpretar estaciones, barrios e informes."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Metodologia y calidad de datos de Bizi Zaragoza"
	}),
	loader: async () => {
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const [historyMeta, dataset, status, monthsResponse] = await Promise.all([
			fetchHistoryMetadata().catch(() => buildFallbackHistoryMetadata$1(nowIso)),
			fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
			fetchStatus().catch(() => buildFallbackStatus(nowIso)),
			fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso))
		]);
		const months = monthsResponse.months.filter(isValidMonthKey);
		const latestMonth = months[0] ?? null;
		const cityName = getCityName();
		const siteUrl = getSiteUrl();
		const breadcrumbs = createRootBreadcrumbs({
			label: "Metodologia",
			href: appRoutes.methodology()
		});
		const faqItems = getMethodologyFaqItems();
		return {
			historyMeta,
			dataset,
			status,
			months,
			latestMonth,
			breadcrumbs,
			faqItems,
			structuredData: {
				"@context": "https://schema.org",
				"@graph": [
					buildBreadcrumbStructuredData(breadcrumbs),
					{
						"@type": "TechArticle",
						headline: `Metodologia y calidad de datos de Bizi ${cityName}`,
						name: `Metodologia y calidad de datos de Bizi ${cityName}`,
						description: "Guia publica para interpretar la fuente, la cobertura, la frecuencia y las metricas de las paginas publicas de DatosBizi.",
						url: `${siteUrl}${appRoutes.methodology()}`,
						inLanguage: "es",
						dateModified: dataset.coverage.generatedAt ?? historyMeta.generatedAt ?? nowIso,
						author: {
							"@type": "Organization",
							name: SITE_NAME,
							url: siteUrl
						},
						publisher: {
							"@type": "Organization",
							name: SITE_NAME,
							url: siteUrl
						}
					},
					{
						"@type": "Dataset",
						name: `Dataset Bizi ${cityName}`,
						description: "Cobertura historica, snapshot actual y criterios de interpretacion del dataset usado por estaciones, barrios, informes y API.",
						url: `${siteUrl}${appRoutes.methodology()}`,
						inLanguage: "es",
						isAccessibleForFree: true,
						dateModified: dataset.coverage.generatedAt,
						distribution: [{
							"@type": "DataDownload",
							name: "OpenAPI JSON",
							encodingFormat: "application/json",
							contentUrl: `${siteUrl}${appRoutes.api.openApi()}`
						}, {
							"@type": "DataDownload",
							name: "Historico CSV",
							encodingFormat: "text/csv",
							contentUrl: `${siteUrl}${appRoutes.api.historyCsv()}`
						}]
					},
					{
						"@type": "FAQPage",
						mainEntity: faqItems.map((item) => ({
							"@type": "Question",
							name: item.question,
							acceptedAnswer: {
								"@type": "Answer",
								text: item.answer
							}
						}))
					}
				]
			}
		};
	},
	component: MethodologyPage
});
function MethodologyPage() {
	const { historyMeta, dataset, status, months, latestMonth, breadcrumbs, faqItems, structuredData } = Route$30.useLoaderData();
	const cityName = getCityName();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(PublicPageViewTracker, {
			pageType: "methodology",
			template: "methodology_hub",
			pageSlug: "metodologia"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
				/* @__PURE__ */ jsx(PublicSectionNav, {
					activeItemId: "help",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Guia publica de confianza"
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: ["Metodologia y calidad de datos de Bizi ", cityName]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Esta pagina explica como se construyen las lecturas publicas de DatosBizi: de donde sale el dato base, con que frescura se actualiza, que metricas son estimadas y que limites conviene tener presentes antes de interpretar estaciones, barrios, rankings e informes."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [historyMeta.coverage.totalDays, " dias de cobertura"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [historyMeta.coverage.totalStations, " estaciones con historico"]
							}),
							/* @__PURE__ */ jsx("span", {
								className: `inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`,
								children: getHealthLabel(status.pipeline.healthStatus)
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [
							/* @__PURE__ */ jsx(TrackedAnchor, {
								href: historyMeta.source.gbfsDiscoveryUrl,
								target: "_blank",
								rel: "noopener noreferrer",
								ctaEvent: {
									source: "methodology_hero",
									ctaId: "dataset_source_open",
									destination: "gbfs_discovery",
									isExternal: true,
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
								children: "Ver feed GBFS oficial"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.developers(),
								ctaEvent: {
									source: "methodology_hero",
									ctaId: "api_open",
									destination: "developers",
									entityType: "api",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Abrir API y datos abiertos"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.status(),
								navigationEvent: {
									source: "methodology_hero",
									destination: "status",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver estado del sistema"
							})
						]
					}), /* @__PURE__ */ jsx(PublicSearchForm, { eventSource: "methodology" })]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Fuente primaria"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: historyMeta.source.provider
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Discovery GBFS consultado y validado de forma periodica."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura visible"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: getCoverageLabel(dataset)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Base compartida por informes, rankings y fichas publicas."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cadencia observada"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: getObservedCadenceLabel(status)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Lectura reciente del pipeline y de la frescura del sistema."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Versiones activas"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: [
								getDatasetVersionLabel(dataset),
								" · API v",
								getApiVersionLabel()
							]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: latestMonth ? `Ultimo informe publicado: ${formatMonthLabel(latestMonth)}.` : "Sin informe mensual publicado."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "ui-section-card",
			children: /* @__PURE__ */ jsxs("div", {
				className: "max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Como se construye la capa publica"
					}), /* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black leading-tight text-[var(--foreground)]",
						children: "Del feed oficial a paginas utiles y comparables"
					})] }),
					/* @__PURE__ */ jsxs("p", { children: [
						"El dato base llega desde el feed oficial GBFS de Bizi ",
						cityName,
						". A partir de ese origen se capturan snapshots de estaciones, se validan, se agregan y se reutilizan en varias capas: disponibilidad actual, historico agregado, rankings, hubs territoriales, informes mensuales y endpoints API."
					] }),
					/* @__PURE__ */ jsxs("p", { children: [
						"La ultima muestra util hoy es ",
						formatStatusDateTime(dataset.lastUpdated.lastSampleAt),
						" y el lag visible del pipeline es ",
						getPipelineLagLabel(status),
						". Cuando falta cobertura o la serie es parcial, la policy SEO desindexa las plantillas debiles en lugar de forzar contenido pobre. Ese criterio se aplica igual a estaciones, barrios, informes y landings."
					] })
				]
			})
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Snapshot actual"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Lo que ves ahora mismo"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Bicis disponibles, anclajes libres y capacidad describen el estado reciente de una estacion, no una media historica."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Historico agregado"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Lo que suele pasar"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Rotacion, horas problema, perfiles horarios y comparativas por barrio usan series acumuladas, no una sola foto puntual."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Demanda y movilidad"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Lecturas estimadas"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "La demanda publica es un indice de actividad y la movilidad es una estimacion agregada por zonas; ninguna de las dos equivale a viajes oficiales uno a uno."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Prediccion"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Orientacion, no garantia"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Las predicciones combinan patrones historicos y estado reciente para anticipar tensiones a corto plazo, pero no sustituyen la lectura real final."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "FAQs visibles"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Preguntas que mas cambian la interpretacion"
			})] }), /* @__PURE__ */ jsx("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2",
				children: faqItems.map((item) => /* @__PURE__ */ jsxs("article", {
					className: "ui-surface-block",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: item.question
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-[11px] leading-relaxed text-[var(--muted)]",
						children: item.answer
					})]
				}, item.id))
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Siguiente paso segun tu necesidad"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Rutas relacionadas"
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3",
				children: [
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.developers(),
						ctaEvent: {
							source: "methodology_related",
							ctaId: "api_open",
							destination: "developers",
							entityType: "api",
							sourceRole: "utility",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "API y datos abiertos"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "OpenAPI, CSV, versiones y trazabilidad del mismo dataset explicado aqui."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.status(),
						navigationEvent: {
							source: "methodology_related",
							destination: "status",
							sourceRole: "utility",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Estado y cobertura"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Comprueba frescura, incidencias, lag del pipeline y salud operativa antes de interpretar."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.reports(),
						ctaEvent: {
							source: "methodology_related",
							ctaId: "report_open",
							destination: "report_archive",
							entityType: "report",
							sourceRole: "utility",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Archivo mensual"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Usa el contexto metodologico para leer mejor los informes y sus insights por mes."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.seoPage("uso-bizi-por-estacion"),
						navigationEvent: {
							source: "methodology_related",
							destination: "station_hub",
							sourceRole: "utility",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Fichas de estacion"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Baja al detalle publico de disponibilidad, horas activas y comparacion con la ciudad."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.districtLanding(),
						navigationEvent: {
							source: "methodology_related",
							destination: "district_hub",
							sourceRole: "utility",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Barrios y contexto territorial"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Interpreta comparativas por barrio sabiendo que metricas son snapshot y cuales son agregadas."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.dashboardHelp(),
						navigationEvent: {
							source: "methodology_related",
							destination: "dashboard_help",
							sourceRole: "utility",
							destinationRole: "dashboard",
							transitionKind: "to_dashboard"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Ayuda completa del dashboard"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Si necesitas mas detalle operativo o FAQ extensa, entra en la ayuda interna del producto."
						})]
					})
				]
			})]
		})
	] });
}
//#endregion
//#region src/app/mapa-estaciones-bizi-zaragoza.tsx
var $$splitComponentImporter$10 = () => import("./mapa-estaciones-bizi-zaragoza-AA1_0s06.js");
var Route$29 = createFileRoute("/mapa-estaciones-bizi-zaragoza")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
//#endregion
//#region src/app/login.tsx
var $$splitComponentImporter$9 = () => import("./login-Bo0SgfKi.js");
var Route$28 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
//#endregion
//#region src/app/informes-mensuales-bizi-zaragoza.tsx
var $$splitComponentImporter$8 = () => import("./informes-mensuales-bizi-zaragoza-C8iZVvek.js");
var Route$27 = createFileRoute("/informes-mensuales-bizi-zaragoza")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
//#endregion
//#region src/lib/structured-data.ts
function buildItemListStructuredData(name, entries) {
	return {
		"@type": "ItemList",
		name,
		itemListElement: entries.map((entry, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: entry.name,
			url: entry.url
		}))
	};
}
//#endregion
//#region src/app/informes.tsx
init_routes();
init_site();
init_page_shell();
function resolvePublishedMonths(availableMonths, monthlySeriesKeys) {
	const monthSet = /* @__PURE__ */ new Set();
	for (const month of [...availableMonths, ...monthlySeriesKeys]) if (isValidMonthKey(month)) monthSet.add(month);
	return Array.from(monthSet).sort((left, right) => right.localeCompare(left));
}
function resolveSnapshotMonthFallback(lastSampleAt) {
	if (!lastSampleAt) return [];
	const parsed = new Date(lastSampleAt);
	if (Number.isNaN(parsed.getTime())) return [];
	const monthKey = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
	return isValidMonthKey(monthKey) ? [monthKey] : [];
}
function mergeMonthCandidates(months) {
	const set = /* @__PURE__ */ new Set();
	for (const month of months) if (isValidMonthKey(month)) set.add(month);
	return Array.from(set).sort((left, right) => right.localeCompare(left));
}
var Route$26 = createFileRoute("/informes")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Archivo historico de informes mensuales de Bizi Zaragoza con URLs limpias por mes, comparativas y acceso directo a cada informe indexable."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Informes mensuales de Bizi Zaragoza | Archivo historico"
	}),
	loader: async () => {
		const siteUrl = getSiteUrl();
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const [monthsResponse, monthlySeries, dataset, historyMeta, status] = await Promise.all([
			fetchAvailableDataMonths().catch((error) => {
				captureExceptionWithContext(error, {
					area: "reports.index",
					operation: "fetchAvailableDataMonths",
					dedupeKey: "reports.index.fetchAvailableDataMonths.failed"
				});
				return {
					months: [],
					generatedAt: (/* @__PURE__ */ new Date()).toISOString()
				};
			}),
			fetchCachedMonthlyDemandCurve(24).catch(() => []),
			fetchSharedDatasetSnapshot().catch((error) => {
				captureExceptionWithContext(error, {
					area: "reports.index",
					operation: "fetchSharedDatasetSnapshot",
					dedupeKey: "reports.index.fetchSharedDatasetSnapshot.failed"
				});
				return buildFallbackDatasetSnapshot(nowIso);
			}),
			fetchHistoryMetadata().catch(() => null),
			fetchStatus().catch(() => null)
		]);
		const discoveredMonths = mergeMonthCandidates(resolvePublishedMonths(monthsResponse.months, monthlySeries.map((row) => row.monthKey)));
		const historyFallbackMonths = mergeMonthCandidates([historyMeta?.coverage.lastRecordedAt, status?.pipeline.lastSuccessfulPoll].filter((value) => Boolean(value)).map((value) => value.slice(0, 7)));
		const months = discoveredMonths.length > 0 ? discoveredMonths : mergeMonthCandidates([...historyFallbackMonths, ...resolveSnapshotMonthFallback(dataset.lastUpdated.lastSampleAt)]);
		const monthMap = new Map(monthlySeries.map((row) => [row.monthKey, row]));
		const latestMonth = months[0] ?? null;
		const reportsDataState = combineDataStates([dataset.dataState, resolveDataState({
			hasCoverage: dataset.coverage.totalDays > 0 || months.length > 0,
			hasData: months.length > 0,
			isPartial: months.length > 0 && monthlySeries.length < months.length
		})]);
		const breadcrumbs = createRootBreadcrumbs({
			label: "Informes",
			href: appRoutes.reports()
		});
		const reportListEntries = months.map((month) => ({
			name: `Informe ${formatMonthLabel(month)}`,
			url: `${siteUrl}${appRoutes.reportMonth(month)}`
		}));
		return {
			months,
			monthMap,
			latestMonth,
			reportsDataState,
			breadcrumbs,
			structuredData: {
				"@context": "https://schema.org",
				"@graph": [
					{
						"@type": "CollectionPage",
						name: "Informes Bizi Zaragoza por mes",
						description: "Archivo historico de informes mensuales de Bizi Zaragoza con enlaces persistentes por mes y acceso al dashboard filtrado.",
						url: `${siteUrl}${appRoutes.reports()}`,
						inLanguage: "es"
					},
					buildBreadcrumbStructuredData(breadcrumbs),
					{
						"@type": "Organization",
						name: SITE_NAME,
						url: siteUrl
					},
					...reportListEntries.length > 0 ? [buildItemListStructuredData("Archivo de informes mensuales", reportListEntries)] : []
				]
			}
		};
	},
	component: ReportsIndexPage
});
function ReportsIndexPage() {
	const { months, monthMap, latestMonth, reportsDataState, breadcrumbs, structuredData } = Route$26.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(PublicPageViewTracker, {
			pageType: "report_archive",
			template: "reports_index",
			pageSlug: "informes"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
				/* @__PURE__ */ jsx(PublicSectionNav, {
					activeItemId: "reports",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Archivo mensual indexable"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Informes Bizi Zaragoza por mes"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Archivo SEO con informes mensuales permanentes, comparativas de demanda estimada y acceso directo al dashboard filtrado por mes."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: [months.length, " meses indexables"]
						}), latestMonth ? /* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: ["Ultimo informe ", formatMonthLabel(latestMonth)]
						}) : null]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3",
					children: [latestMonth ? /* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.reportMonth(latestMonth),
						ctaEvent: {
							source: "reports_hero",
							ctaId: "report_open",
							destination: "monthly_report",
							entityType: "report",
							monthPresent: true,
							sourceRole: "hub",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
						children: "Abrir ultimo informe mensual"
					}) : null, /* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.dashboardConclusions(),
						navigationEvent: {
							source: "reports_hero",
							destination: "dashboard_conclusions",
							sourceRole: "hub",
							destinationRole: "dashboard",
							transitionKind: "to_dashboard"
						},
						className: "ui-inline-action",
						children: "Abrir conclusiones del dashboard"
					})]
				})
			]
		}),
		shouldShowDataStateNotice(reportsDataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: reportsDataState,
			subject: "el archivo mensual",
			description: "Los informes mensuales usan la misma cobertura compartida que la API y el dashboard. Si falta cobertura o el dataset es parcial, puede haber meses sin informe o series incompletas.",
			href: appRoutes.status(),
			actionLabel: "Ver estado"
		}) : null,
		/* @__PURE__ */ jsx("section", {
			className: "ui-section-card",
			children: /* @__PURE__ */ jsxs("div", {
				className: "max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Que aporta este archivo"
					}), /* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black leading-tight text-[var(--foreground)]",
						children: "Una capa editorial estable para buscar meses, comparar y enlazar"
					})] }),
					/* @__PURE__ */ jsx("p", { children: "El archivo mensual concentra las URLs persistentes con mejor potencial de indexacion para consultas historicas sobre Bizi Zaragoza. Cada informe resume un periodo concreto, conserva su propio contexto y permite navegar a barrios, estaciones y rankings sin pasar por superficies interactivas o con query strings." }),
					/* @__PURE__ */ jsx("p", { children: "Si vienes desde buscadores, esta pagina es el mejor punto para localizar el ultimo mes publicado o revisar la secuencia historica. Si buscas operativa en tiempo real, desde aqui puedes saltar al dashboard de conclusiones sin perder el enlace editorial." })
				]
			})
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-3",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultimo mes con informe"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: latestMonth ? formatMonthLabel(latestMonth) : "Sin datos"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Enlace persistente para bots, buscadores y navegacion editorial."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Meses publicados"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: months.length
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Archivo historico disponible para indexacion y enlazado interno."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura de serie"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: months.length > 0 ? [...new Set(months.map((m) => m))].length : 0
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Meses con agregados mensuales disponibles en base de datos."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Archivo de informes mensuales"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: "Cada informe tiene su propia URL estable y enlaza al dashboard con el mes ya seleccionado."
				})] }), /* @__PURE__ */ jsx(Link, {
					to: appRoutes.reports(),
					className: "text-sm font-bold text-[var(--primary)] transition hover:opacity-80",
					children: "Ver archivo completo"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-2 space-y-3",
				children: months.map((month) => {
					const row = monthMap.get(month);
					return /* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.reportMonth(month),
						ctaEvent: {
							source: "reports_archive",
							ctaId: "report_open",
							destination: "monthly_report",
							entityType: "report",
							monthPresent: true,
							sourceRole: "hub",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "flex-row items-center justify-between gap-3 px-4 py-3 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: ["Informe ", formatMonthLabel(month)]
							}), /* @__PURE__ */ jsx("p", {
								className: "text-[11px] text-[var(--muted)]",
								children: row ? `${formatInteger$1(row.demandScore)} pts de demanda estimada · ocupacion ${formatPercent$1(row.avgOccupancy)} · ${row.activeStations} estaciones` : "Informe disponible con acceso al dashboard filtrado por mes."
							})] }), /* @__PURE__ */ jsx("span", {
								className: "text-xs font-bold text-[var(--primary)]",
								children: "Abrir informe"
							})]
						})
					}, month);
				})
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Mas rutas para seguir explorando"
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.seoPage("viajes-por-mes-zaragoza"),
						navigationEvent: {
							source: "reports_related",
							destination: "monthly_series",
							sourceRole: "hub",
							destinationRole: "entry_seo",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "Serie mensual"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Evolucion agregada para complementar el archivo editorial por mes."
							})]
						})
					}),
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.districtLanding(),
						navigationEvent: {
							source: "reports_related",
							destination: "district_hub",
							sourceRole: "hub",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "Barrios de Zaragoza"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Descubre que zonas destacan en uso y que estaciones concentran mas actividad."
							})]
						})
					}),
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.seoPage("ranking-estaciones-bizi"),
						navigationEvent: {
							source: "reports_related",
							destination: "station_ranking",
							sourceRole: "hub",
							destinationRole: "entry_seo",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "Ranking de estaciones"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Da el salto del contexto mensual al ranking actual de estaciones."
							})]
						})
					}),
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.developers(),
						ctaEvent: {
							source: "reports_related",
							ctaId: "api_open",
							destination: "developers",
							entityType: "api",
							sourceRole: "hub",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "API y datos abiertos"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Accede a OpenAPI, CSV y trazabilidad del mismo dataset que alimenta los informes."
							})]
						})
					}),
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.methodology(),
						navigationEvent: {
							source: "reports_related",
							destination: "methodology",
							sourceRole: "hub",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "Metodologia y calidad"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Revisa como leer demanda, cobertura y limites antes de interpretar la serie mensual."
							})]
						})
					})
				]
			})]
		})
	] });
}
//#endregion
//#region src/lib/seo-districts.ts
function slugifyDistrictName(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function buildDistrictSeoRows({ stations, districtCollection, turnoverRankings, availabilityRankings }) {
	if (!districtCollection) return [];
	const stationDistrictMap = buildStationDistrictMap(stations, districtCollection);
	const stationTurnoverMap = new Map(turnoverRankings.map((row) => [row.stationId, Number(row.turnoverScore)]));
	const stationAvailabilityMap = new Map(availabilityRankings.map((row) => [row.stationId, Number(row.emptyHours) + Number(row.fullHours)]));
	const groupedDistricts = /* @__PURE__ */ new Map();
	for (const station of stations) {
		const districtName = stationDistrictMap.get(station.id);
		if (!districtName) continue;
		const districtSlug = slugifyDistrictName(districtName);
		const turnoverScore = stationTurnoverMap.get(station.id) ?? 0;
		const availabilityRisk = stationAvailabilityMap.get(station.id) ?? 0;
		const current = groupedDistricts.get(districtSlug) ?? {
			slug: districtSlug,
			name: districtName,
			stationCount: 0,
			bikesAvailable: 0,
			anchorsFree: 0,
			capacity: 0,
			avgTurnover: 0,
			avgAvailabilityRisk: 0,
			topStations: []
		};
		current.stationCount += 1;
		current.bikesAvailable += station.bikesAvailable;
		current.anchorsFree += station.anchorsFree;
		current.capacity += station.capacity;
		current.avgTurnover += turnoverScore;
		current.avgAvailabilityRisk += availabilityRisk;
		current.topStations.push({
			stationId: station.id,
			stationName: station.name,
			bikesAvailable: station.bikesAvailable,
			anchorsFree: station.anchorsFree,
			capacity: station.capacity,
			turnoverScore,
			availabilityRisk
		});
		groupedDistricts.set(districtSlug, current);
	}
	return Array.from(groupedDistricts.values()).map((district) => ({
		...district,
		avgTurnover: district.stationCount > 0 ? Number((district.avgTurnover / district.stationCount).toFixed(1)) : 0,
		avgAvailabilityRisk: district.stationCount > 0 ? Number((district.avgAvailabilityRisk / district.stationCount).toFixed(1)) : 0,
		topStations: district.topStations.sort((left, right) => right.turnoverScore - left.turnoverScore || right.bikesAvailable - left.bikesAvailable).slice(0, 6)
	})).sort((left, right) => right.avgTurnover - left.avgTurnover || right.stationCount - left.stationCount || left.name.localeCompare(right.name, "es"));
}
var getDistrictSeoRows = cache(async () => {
	const stationsResponse = await fetchStations().catch(() => ({
		stations: [],
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	}));
	const stationCount = Math.max(stationsResponse.stations.length, 1);
	const [districtCollection, turnoverResponse, availabilityResponse] = await Promise.all([
		fetchDistrictCollection().catch(() => null),
		fetchRankings("turnover", stationCount).catch(() => ({
			type: "turnover",
			limit: stationCount,
			rankings: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		})),
		fetchRankings("availability", stationCount).catch(() => ({
			type: "availability",
			limit: stationCount,
			rankings: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		}))
	]);
	return buildDistrictSeoRows({
		stations: stationsResponse.stations,
		districtCollection,
		turnoverRankings: turnoverResponse.rankings,
		availabilityRankings: availabilityResponse.rankings
	});
});
cache(async (slug) => {
	return (await getDistrictSeoRows()).find((row) => row.slug === slug) ?? null;
});
cache(async () => {
	if (typeof window !== "undefined") return [];
	const [{ readFile }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
	const geoJsonPath = path.join(process.cwd(), "public", DISTRICTS_GEOJSON_URL.replace(/^\/+/, ""));
	try {
		const payload = parseJsonWithGuard(await readFile(geoJsonPath, "utf8"), isDistrictCollection);
		if (!payload) return [];
		return payload.features.map((feature) => feature.properties?.distrito).filter((name) => typeof name === "string" && name.length > 0).map((name) => slugifyDistrictName(name));
	} catch {
		return [];
	}
});
//#endregion
//#region src/lib/seo-pages.ts
init_routes();
var EXPLORE_PAGE_NAV_CONFIG = {
	pageRole: "HUB",
	primaryCta: {
		href: appRoutes.dashboardView("research"),
		label: "Abrir analisis del dashboard",
		destination: "dashboard_research"
	}
};
appRoutes.dashboardView("overview");
var PRIMARY_SEO_PAGE_SLUGS = [
	"estaciones-mas-usadas-zaragoza",
	"barrios-bizi-zaragoza",
	"uso-bizi-por-hora",
	"ranking-estaciones-bizi",
	"viajes-por-dia-zaragoza",
	"viajes-por-mes-zaragoza",
	"uso-bizi-por-estacion",
	"estaciones-con-mas-bicis",
	"redistribucion-bizi-zaragoza"
];
var SEO_PAGE_CONFIGS = {
	"estaciones-mas-usadas-zaragoza": {
		slug: "estaciones-mas-usadas-zaragoza",
		title: "Estaciones Bizi mas usadas en Zaragoza",
		metadataTitle: "Estaciones Bizi mas usadas en Zaragoza | Ranking y analisis",
		description: "Consulta que estaciones Bizi concentran mas actividad en Zaragoza, que puntos lideran el ranking reciente y como cambiar la demanda entre estaciones.",
		keywords: [
			"estaciones bizi mas usadas",
			"ranking bizi zaragoza",
			"estaciones con mas uso",
			"bizi zaragoza hoy"
		],
		cadenceLabel: "Actualizacion diaria",
		heroKicker: "Ranking de demanda reciente",
		pageRole: "ENTRY_SEO",
		primaryCta: {
			href: appRoutes.dashboardStations(),
			label: "Ver directorio y detalle de estaciones",
			destination: "dashboard_stations"
		}
	},
	"barrios-bizi-zaragoza": {
		slug: "barrios-bizi-zaragoza",
		title: "Barrios de Zaragoza con mas uso de Bizi",
		metadataTitle: "Barrios de Zaragoza con mas uso de Bizi | Estaciones y actividad",
		description: "Explora que barrios de Zaragoza concentran mas uso de Bizi, cuantas estaciones activas tienen y que zonas merecen seguimiento por actividad o disponibilidad.",
		keywords: [
			"barrios bizi zaragoza",
			"bizi por barrios zaragoza",
			"distritos con mas uso bizi",
			"estaciones bizi por barrio"
		],
		cadenceLabel: "Actualizacion diaria",
		heroKicker: "Comparativa por barrios",
		pageRole: "HUB",
		primaryCta: {
			href: appRoutes.dashboardFlow(),
			label: "Abrir flujo operativo por barrios",
			destination: "dashboard_flow"
		}
	},
	"uso-bizi-por-hora": {
		slug: "uso-bizi-por-hora",
		title: "Uso de Bizi por hora en Zaragoza",
		metadataTitle: "Horas punta de Bizi Zaragoza | Patrones de uso y analisis",
		description: "Analiza las horas punta de Bizi Zaragoza, la ocupacion media por franja y cuando se concentran los picos de uso o de disponibilidad.",
		keywords: [
			"uso bizi por hora",
			"horas pico bizi zaragoza",
			"bizi zaragoza hora punta",
			"movilidad bizi horaria"
		],
		cadenceLabel: "Actualizacion diaria",
		heroKicker: "Patrones horarios",
		pageRole: "ENTRY_SEO",
		primaryCta: {
			href: appRoutes.dashboardView("research"),
			label: "Abrir analisis horario en el dashboard",
			destination: "dashboard_research"
		}
	},
	"ranking-estaciones-bizi": {
		slug: "ranking-estaciones-bizi",
		title: "Ranking de estaciones Bizi Zaragoza",
		metadataTitle: "Estaciones Bizi mas usadas en Zaragoza | Uso y disponibilidad",
		description: "Ranking operativo de estaciones Bizi Zaragoza por actividad, riesgo de vaciado o saturacion y acceso rapido a los puntos que exigen atencion.",
		keywords: [
			"ranking estaciones bizi",
			"clasificacion estaciones bizi zaragoza",
			"estaciones bizi disponibilidad",
			"ranking bizi"
		],
		cadenceLabel: "Actualizacion semanal",
		heroKicker: "Clasificacion operativa",
		pageRole: "ENTRY_SEO",
		primaryCta: {
			href: appRoutes.dashboardStations(),
			label: "Abrir ranking y directorio de estaciones",
			destination: "dashboard_stations"
		}
	},
	"viajes-por-dia-zaragoza": {
		slug: "viajes-por-dia-zaragoza",
		title: "Viajes Bizi por dia en Zaragoza",
		metadataTitle: "Viajes diarios estimados de Bizi Zaragoza | Tendencia y analisis",
		description: "Sigue la tendencia diaria estimada de Bizi Zaragoza, compara demanda reciente y detecta cambios de intensidad en el uso del sistema.",
		keywords: [
			"viajes bizi por dia",
			"bizi zaragoza viajes diarios",
			"demanda bizi diaria",
			"estadisticas bizi zaragoza"
		],
		cadenceLabel: "Actualizacion diaria",
		heroKicker: "Serie diaria",
		pageRole: "ENTRY_SEO",
		primaryCta: {
			href: appRoutes.dashboardConclusions(),
			label: "Ver resumen diario y tendencia reciente",
			destination: "dashboard_conclusions"
		}
	},
	"viajes-por-mes-zaragoza": {
		slug: "viajes-por-mes-zaragoza",
		title: "Viajes Bizi por mes en Zaragoza",
		metadataTitle: "Viajes mensuales estimados de Bizi Zaragoza | Serie historica",
		description: "Consulta la evolucion mensual estimada de Bizi Zaragoza, compara cada mes con el anterior y enlaza con el archivo historico de informes.",
		keywords: [
			"viajes bizi por mes",
			"bizi zaragoza mensual",
			"informe mensual bizi",
			"estadisticas mensuales bizi"
		],
		cadenceLabel: "Actualizacion mensual",
		heroKicker: "Serie mensual",
		pageRole: "ENTRY_SEO",
		primaryCta: {
			href: appRoutes.reports(),
			label: "Abrir informes mensuales publicados",
			destination: "report_archive"
		}
	},
	"uso-bizi-por-estacion": {
		slug: "uso-bizi-por-estacion",
		title: "Uso de Bizi por estacion en Zaragoza",
		metadataTitle: "Uso de Bizi por estacion en Zaragoza | Comparativa de estaciones",
		description: "Compara estaciones Bizi de Zaragoza por demanda media, detecta puntos con menor actividad y encuentra rapidamente los detalles operativos mas relevantes.",
		keywords: [
			"uso bizi por estacion",
			"comparativa estaciones bizi",
			"estaciones bizi zaragoza demanda",
			"detalle estacion bizi"
		],
		cadenceLabel: "Actualizacion semanal",
		heroKicker: "Comparativa entre estaciones",
		pageRole: "HUB",
		primaryCta: {
			href: appRoutes.dashboardStations(),
			label: "Explorar el directorio completo de estaciones",
			destination: "dashboard_stations"
		}
	},
	"estaciones-con-mas-bicis": {
		slug: "estaciones-con-mas-bicis",
		title: "Estaciones Bizi con mas bicis disponibles",
		metadataTitle: "Donde hay mas bicis Bizi en Zaragoza ahora | Disponibilidad actual",
		description: "Encuentra las estaciones Bizi con mas bicicletas disponibles en Zaragoza en el snapshot actual y compara su disponibilidad con la media del sistema.",
		keywords: [
			"estaciones con mas bicis",
			"bizi zaragoza disponibilidad actual",
			"donde hay bicis bizi",
			"bicis disponibles zaragoza"
		],
		cadenceLabel: "Actualizacion horaria",
		heroKicker: "Disponibilidad actual",
		pageRole: "ENTRY_SEO",
		primaryCta: {
			href: appRoutes.dashboardStations(),
			label: "Abrir estaciones con disponibilidad actual",
			destination: "dashboard_stations"
		}
	},
	"informes-mensuales-bizi-zaragoza": {
		slug: "informes-mensuales-bizi-zaragoza",
		title: "Informes mensuales de Bizi Zaragoza",
		metadataTitle: "Informes mensuales de Bizi Zaragoza | Archivo historico",
		description: "Alias legacy del archivo mensual de Bizi Zaragoza. La version canonica concentra el historico, los informes indexables y la navegacion editorial por mes.",
		keywords: [
			"informes mensuales bizi",
			"archivo bizi zaragoza",
			"reporte mensual bizi",
			"estadisticas bizi mensuales"
		],
		cadenceLabel: "Actualizacion mensual",
		heroKicker: "Archivo de informes",
		pageRole: "HUB",
		primaryCta: {
			href: appRoutes.reports(),
			label: "Abrir archivo mensual completo",
			destination: "report_archive"
		},
		canonicalPath: appRoutes.reports(),
		isLegacyAlias: true
	},
	"redistribucion-bizi-zaragoza": {
		slug: "redistribucion-bizi-zaragoza",
		title: "Redistribucion de bicis Bizi Zaragoza",
		metadataTitle: "Redistribucion de bicis Bizi Zaragoza | Equilibrio y metodologia",
		description: "Entiende como se redistribuyen las bicis de Bizi Zaragoza, que estaciones se desequilibran antes y que reglas usa el sistema para priorizar intervenciones.",
		keywords: [
			"redistribucion bizi zaragoza",
			"rebalanceo bici publica zaragoza",
			"como funciona redistribucion bizi",
			"estaciones vacias llenas bizi",
			"logistica bizi zaragoza"
		],
		cadenceLabel: "Actualizacion diaria",
		heroKicker: "Diagnostico de equilibrio",
		pageRole: "ENTRY_SEO",
		primaryCta: {
			href: appRoutes.dashboardRedistribucion(),
			label: "Abrir panel operativo de redistribucion",
			destination: "dashboard_redistribucion"
		}
	}
};
function getSeoPageConfig(slug) {
	return SEO_PAGE_CONFIGS[slug];
}
//#endregion
//#region src/lib/global-search.ts
init_routes();
function buildDeveloperEndpointAnchorId(path, method) {
	return `endpoint-${`${method}-${path}`.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "")}`;
}
cache(async () => {
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const [stations, districts, availableMonths] = await Promise.all([
		fetchStations().catch(() => ({
			stations: [],
			generatedAt: nowIso,
			dataState: "no_coverage"
		})),
		getDistrictSeoRows().catch(() => []),
		fetchAvailableDataMonths().catch(() => ({
			months: [],
			generatedAt: nowIso
		}))
	]);
	const pageEntries = [
		...PUBLIC_NAV_ITEMS.map((item) => ({
			id: `page:${item.id}`,
			group: "pages",
			title: item.label,
			description: item.id === "help" ? "Guia publica sobre fuente de datos, frescura, metodologia y limites de interpretacion." : item.id === "explore" ? "Hub publico para descubrir herramientas, mapas, rankings, comparativas y lecturas del sistema." : item.id === "dashboard" ? "Producto operativo en tiempo real con mapa, alertas, flujo y herramientas de analisis." : `Acceso publico a ${item.label.toLowerCase()}.`,
			href: item.href,
			badge: "Pagina publica",
			keywords: item.id === "help" ? [
				item.label,
				item.href,
				"metodologia",
				"calidad datos",
				"gbfs",
				"faq"
			] : item.id === "explore" ? [
				item.label,
				item.href,
				"explorar",
				"herramientas",
				"rankings",
				"comparador"
			] : item.id === "dashboard" ? [
				item.label,
				item.href,
				"mapa",
				"alertas",
				"dashboard",
				"operaciones"
			] : [item.label, item.href]
		})),
		{
			id: "page:biciradar",
			group: "pages",
			title: "Landing Bici Radar",
			description: "Presentacion de la app, ciudades soportadas y enlaces de descarga.",
			href: appRoutes.biciradar(),
			badge: "Landing publica",
			keywords: [
				"biciradar",
				"app",
				"movil",
				"descarga"
			]
		},
		{
			id: "page:utility-landing",
			group: "pages",
			title: "Mapa y estaciones Bizi Zaragoza en tiempo real",
			description: "Landing de utilidad inmediata para revisar disponibilidad y abrir el mapa en vivo.",
			href: appRoutes.utilityLanding(),
			badge: "Landing captacion",
			keywords: [
				"mapa bizi zaragoza",
				"estaciones en tiempo real",
				"disponibilidad bizi"
			]
		},
		{
			id: "page:insights-landing",
			group: "pages",
			title: "Estadisticas y ranking de Bizi Zaragoza",
			description: "Landing de descubrimiento para entrar por informes, rankings y barrios.",
			href: appRoutes.insightsLanding(),
			badge: "Landing captacion",
			keywords: [
				"estadisticas bizi zaragoza",
				"ranking bizi",
				"informes bizi"
			]
		},
		{
			id: "page:compare-stations",
			group: "pages",
			title: "Comparador de estaciones",
			description: "Comparativas manuales estacion vs estacion con URL compartible.",
			href: appRoutes.compare({ dimension: "stations" }),
			badge: "Comparador",
			keywords: [
				"comparar estaciones",
				"station vs station",
				"comparador"
			]
		},
		{
			id: "page:compare-districts",
			group: "pages",
			title: "Comparador de barrios",
			description: "Comparativas manuales barrio vs barrio con el mismo dataset compartido.",
			href: appRoutes.compare({ dimension: "districts" }),
			badge: "Comparador",
			keywords: [
				"comparar barrios",
				"distritos",
				"comparador barrios"
			]
		},
		{
			id: "page:compare-periods",
			group: "pages",
			title: "Comparador de periodos",
			description: "Comparativas entre periodos, meses, anos y horas desde una unica vista.",
			href: appRoutes.compare({ dimension: "periods" }),
			badge: "Comparador",
			keywords: [
				"periodos",
				"mes vs mes",
				"ano vs ano",
				"hora vs hora"
			]
		},
		...PRIMARY_SEO_PAGE_SLUGS.map((slug) => {
			const page = getSeoPageConfig(slug);
			return {
				id: `page:seo:${page.slug}`,
				group: "pages",
				title: page.title,
				description: page.description,
				href: appRoutes.seoPage(page.slug),
				badge: "Landing SEO",
				keywords: [
					page.slug,
					page.metadataTitle,
					...page.keywords
				]
			};
		})
	];
	const stationEntries = stations.stations.map((station) => ({
		id: `station:${station.id}`,
		group: "stations",
		title: station.name,
		description: `Estacion ${station.id} · ${station.bikesAvailable}/${station.capacity} bicis · ${station.anchorsFree} huecos libres.`,
		href: appRoutes.stationDetail(station.id),
		badge: "Estacion",
		keywords: [
			station.id,
			station.name,
			String(station.bikesAvailable),
			String(station.anchorsFree)
		]
	}));
	const districtEntries = districts.map((district) => ({
		id: `district:${district.slug}`,
		group: "districts",
		title: district.name,
		description: `${district.stationCount} estaciones · ${district.bikesAvailable} bicis disponibles · giro medio ${district.avgTurnover}.`,
		href: appRoutes.districtDetail(district.slug),
		badge: "Barrio",
		keywords: [
			district.slug,
			district.name,
			`${district.stationCount} estaciones`,
			`${district.avgTurnover}`
		]
	}));
	const reportEntries = availableMonths.months.filter(isValidMonthKey).map((month) => ({
		id: `report:${month}`,
		group: "reports",
		title: `Informe ${formatMonthLabel(month)}`,
		description: `Informe mensual con demanda, ocupacion, balance y comparativas para ${formatMonthLabel(month)}.`,
		href: appRoutes.reportMonth(month),
		badge: "Informe mensual",
		keywords: [
			month,
			formatMonthLabel(month),
			"informes",
			"archivo"
		]
	}));
	const apiEntries = Object.entries(openApiDocument.paths).flatMap(([path, operations]) => Object.entries(operations).map(([method, operation]) => {
		const operationRecord = operation;
		const anchorId = buildDeveloperEndpointAnchorId(path, method);
		return {
			id: `api:${method}:${path}`,
			group: "api",
			title: `${method.toUpperCase()} ${path}`,
			description: operationRecord.summary ?? "Endpoint publicado en la documentacion OpenAPI.",
			href: `${appRoutes.developers()}#${anchorId}`,
			badge: "Endpoint API",
			keywords: [
				path,
				method.toUpperCase(),
				method,
				...(operationRecord.parameters ?? []).map((parameter) => String(parameter.name ?? ""))
			]
		};
	}));
	return [
		...stationEntries,
		...districtEntries,
		...reportEntries,
		...pageEntries,
		...apiEntries
	];
});
//#endregion
//#region src/app/explorar.tsx
init_routes();
init_site();
init_page_shell();
var Route$25 = createFileRoute("/explorar")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Hub publico para descubrir estaciones, flujo, rankings, heatmap, comparativas, historico, mapas y KPIs del sistema."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Explorar"
	}),
	loader: async () => {
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const cityName = getCityName();
		const searchQuery = "";
		const breadcrumbs = createRootBreadcrumbs({
			label: "Explorar",
			href: appRoutes.explore()
		});
		const [availableMonths, searchResults] = await Promise.all([fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)), Promise.resolve(null)]);
		const latestMonth = availableMonths.months.filter(isValidMonthKey)[0] ?? null;
		const sections = getExploreHubSections({ latestMonth });
		const totalTools = sections.reduce((count, section) => count + section.items.length, 0);
		const itemList = sections.flatMap((section) => section.items);
		return {
			searchQuery,
			searchResults,
			latestMonth,
			sections,
			totalTools,
			breadcrumbs,
			structuredData: {
				"@context": "https://schema.org",
				"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
					"@type": "CollectionPage",
					name: `Hub Explorar ${cityName}`,
					description: "Indice publico de herramientas de analisis, comparativa, mapas, historico y movilidad.",
					url: toAbsoluteRouteUrl(appRoutes.explore()),
					hasPart: itemList.map((item, index) => ({
						"@type": "ListItem",
						position: index + 1,
						name: item.title,
						url: toAbsoluteRouteUrl(item.href)
					}))
				}]
			}
		};
	},
	component: ExploreHubPage
});
function ExploreHubPage() {
	const { searchQuery, searchResults, latestMonth, sections, totalTools, breadcrumbs, structuredData } = Route$25.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
				/* @__PURE__ */ jsx(PublicSectionNav, {
					activeItemId: "explore",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Hub de analisis"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Explorar"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Punto unico para descubrir estaciones, flujo, rankings, heatmap, historico, comparador, barrios, mapas y KPIs del sistema sin navegar por rutas dispersas."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [totalTools, " herramientas enlazadas"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["Ultima muestra ", formatStatusDateTime("")]
							}),
							/* @__PURE__ */ jsx("span", {
								className: "ui-chip",
								children: "0 dias de cobertura"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
								children: "Desconocido"
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsx(TrackedLink, {
							to: EXPLORE_PAGE_NAV_CONFIG.primaryCta.href,
							ctaEvent: {
								source: "explore_hero",
								ctaId: "explore_primary",
								destination: EXPLORE_PAGE_NAV_CONFIG.primaryCta.destination,
								sourceRole: "hub",
								destinationRole: "dashboard",
								transitionKind: "to_dashboard"
							},
							className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: EXPLORE_PAGE_NAV_CONFIG.primaryCta.label
						}), /* @__PURE__ */ jsx(TrackedLink, {
							to: appRoutes.compare(),
							ctaEvent: {
								source: "explore_hero",
								ctaId: "explore_secondary",
								destination: "compare",
								sourceRole: "hub",
								destinationRole: "hub",
								transitionKind: "within_public"
							},
							className: "ui-inline-action",
							children: "Abrir comparador"
						})]
					}), /* @__PURE__ */ jsx(PublicSearchForm, { defaultQuery: searchQuery })]
				})
			]
		}),
		searchResults ? /* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Busqueda federada"
					}),
					/* @__PURE__ */ jsxs("h2", {
						className: "text-xl font-black text-[var(--foreground)]",
						children: [
							"Resultados para \"",
							searchResults.query,
							"\""
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "El buscador cruza estaciones, barrios, informes, paginas publicas y endpoints API."
					})
				] }), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "ui-chip",
						children: [searchResults.totalMatches, " coincidencias"]
					}), /* @__PURE__ */ jsx(Link, {
						to: appRoutes.explore(),
						className: "inline-flex rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]",
						children: "Limpiar busqueda"
					})]
				})]
			}), searchResults.totalMatches === 0 ? /* @__PURE__ */ jsx("div", {
				className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 text-sm text-[var(--muted)]",
				children: "No hemos encontrado coincidencias exactas para esta consulta. Prueba con el nombre de una estacion, un barrio, un mes como \"2026-03\" o un endpoint como \"/api/status\"."
			}) : /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 xl:grid-cols-2",
				children: searchResults.groups.map((group) => /* @__PURE__ */ jsxs("article", {
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: group.title
						}), /* @__PURE__ */ jsx("h3", {
							className: "text-lg font-black text-[var(--foreground)]",
							children: group.results.length
						})] }), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-[var(--muted)]",
							children: group.results.length > 0 ? "Top resultados" : group.emptyLabel
						})]
					}), group.results.length > 0 ? /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-3",
						children: group.results.map((result) => /* @__PURE__ */ jsxs(Link, {
							to: result.href,
							className: "block rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: result.title
								}), /* @__PURE__ */ jsx("span", {
									className: "rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]",
									children: result.badge
								})]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-xs leading-relaxed text-[var(--muted)]",
								children: result.description
							})]
						}, result.id))
					}) : null]
				}, group.id))
			})]
		}) : null,
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Herramientas disponibles"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: totalTools
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Cobertura transversal de operacion, analisis y archivo."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultimo informe"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: latestMonth ? formatMonthLabel(latestMonth) : "Sin datos"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Serie mensual conectada con el archivo indexable."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: "0"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Estaciones con datos historicos."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultima generacion"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: formatStatusDateTime("")
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Snapshot comun para dashboard, informes y API."
						})
					]
				})
			]
		}),
		sections.map((section) => /* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: section.title
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black text-[var(--foreground)]",
						children: section.title
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: section.description
					})
				] })
			}), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: section.items.map((item) => /* @__PURE__ */ jsxs(Link, {
					to: item.href,
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: item.eyebrow
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: item.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-relaxed text-[var(--muted)]",
							children: item.description
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-xs font-bold text-[var(--primary)]",
							children: item.destinationLabel
						})
					]
				}, item.id))
			})]
		}, section.id))
	] });
}
//#endregion
//#region src/components/ui/alert.tsx
var ALERT_VARIANT_CLASSES = {
	default: "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]",
	success: "border-[var(--success)]/40 bg-[var(--success)]/12 text-[var(--foreground)]",
	warning: "border-[var(--warning)]/40 bg-[var(--warning)]/12 text-[var(--foreground)]",
	danger: "border-[var(--danger)]/40 bg-[var(--danger)]/12 text-[var(--foreground)]"
};
var Alert = React.forwardRef(function Alert({ className, variant = "default", ...props }, ref) {
	return /* @__PURE__ */ jsx("div", {
		ref,
		role: "alert",
		className: cn("w-full rounded-xl border px-3 py-2 text-sm", ALERT_VARIANT_CLASSES[variant], className),
		...props
	});
});
React.forwardRef(function AlertTitle({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("p", {
		ref,
		className: cn("font-semibold text-[var(--foreground)]", className),
		...props
	});
});
React.forwardRef(function AlertDescription({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("p", {
		ref,
		className: cn("mt-1 text-xs text-[var(--muted)]", className),
		...props
	});
});
//#endregion
//#region src/lib/freshness.ts
var DISCONNECTED_AFTER_MINUTES = 10;
function formatFreshnessLabel(value) {
	if (!value) return "sin datos";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "sin datos";
	const diffMinutes = (Date.now() - date.getTime()) / 6e4;
	if (diffMinutes > DISCONNECTED_AFTER_MINUTES) return "desconectado";
	return formatRelativeMinutes(diffMinutes);
}
//#endregion
//#region src/app/dashboard/_components/StatusBanner.tsx
function translateHealthStatus(statusLabel) {
	switch (statusLabel) {
		case "healthy": return "saludable";
		case "degraded": return "degradado";
		case "down": return "caido";
		default: return statusLabel || "desconocido";
	}
}
function translateHealthReason(reason) {
	return reason.replace("Pipeline has ", "El pipeline acumula ").replace(" consecutive failures", " fallos consecutivos").replace("No successful poll in the last 15 minutes", "No ha habido una recogida correcta en los ultimos 15 minutos").replace("No successful poll in the last hour", "No ha habido una recogida correcta en la ultima hora").replace("Only ", "Solo hubo ").replace(" polls in last 24h", " recogidas en las ultimas 24h").replace("expected ~288", "esperadas ~288").replace("(last:", "(ultima correcta:");
}
function getHealthVariant(statusLabel) {
	switch (statusLabel) {
		case "healthy": return "success";
		case "degraded": return "warning";
		case "down": return "danger";
		default: return "muted";
	}
}
function StatusBanner({ status, stationsGeneratedAt, coverage, lastSampleAt }) {
	const updatedText = formatFreshnessLabel(lastSampleAt ?? status.quality.freshness.lastUpdated ?? stationsGeneratedAt ?? null);
	const volumeRange = status.quality.volume.expectedRange;
	const coverageGeneratedText = formatFreshnessLabel(coverage?.generatedAt ?? null);
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card gap-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]",
							children: "Resumen del sistema"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold text-[var(--foreground)]",
							children: "Resumen de salud del sistema"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-[var(--muted)]",
							children: [
								"Actualizacion ",
								updatedText,
								" · cobertura ",
								coverage?.totalDays ?? 0,
								" dias · entorno ",
								status.system.environment
							]
						})
					]
				}), /* @__PURE__ */ jsx(Badge, {
					variant: getHealthVariant(status.pipeline.healthStatus),
					children: translateHealthStatus(status.pipeline.healthStatus)
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-6",
				children: [
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Ultimo sondeo",
						value: /* @__PURE__ */ jsx("span", {
							className: "break-words text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: status.pipeline.lastSuccessfulPoll ? new Date(status.pipeline.lastSuccessfulPoll).toLocaleString("es-ES") : "Sin datos"
						})
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Sondeos 24h",
						value: status.pipeline.pollsLast24Hours
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Estaciones recientes",
						value: status.quality.volume.recentStationCount,
						detail: `Rango esperado ${volumeRange.min}-${volumeRange.max}`
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Errores de validacion",
						value: status.pipeline.validationErrors
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Fallos consecutivos",
						value: status.pipeline.consecutiveFailures
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Cobertura dataset",
						value: coverage?.totalDays ?? 0,
						detail: `${coverage?.totalStations ?? 0} estaciones · generado ${coverageGeneratedText}`
					})
				]
			}),
			status.pipeline.healthReason ? /* @__PURE__ */ jsxs(Alert, {
				className: "text-xs leading-relaxed text-[var(--muted)]",
				children: ["Motivo del estado: ", translateHealthReason(status.pipeline.healthReason)]
			}) : null
		]
	});
}
//#endregion
//#region src/app/estado.tsx
init_routes();
init_site();
init_page_shell();
var Route$24 = createFileRoute("/estado")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Revisa la cobertura, la ultima muestra, el lag del pipeline y la salud operativa de los datos de Bizi Zaragoza desde una unica pagina publica."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Cobertura y estado de datos de Bizi Zaragoza"
	}),
	loader: async () => {
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const [status, stations, dataset, availableMonths] = await Promise.all([
			fetchStatus().catch(() => buildFallbackStatus(nowIso)),
			fetchStations().catch(() => buildFallbackStations(nowIso)),
			fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
			fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso))
		]);
		const months = availableMonths.months.filter(isValidMonthKey);
		const latestMonth = months[0] ?? null;
		const incidents = buildSystemIncidents(status, dataset);
		return {
			status,
			stations,
			dataset,
			availableMonths,
			months,
			latestMonth,
			incidents,
			capabilities: buildSystemCapabilities(status, dataset, stations),
			activeIncidentCount: incidents.filter((incident) => incident.severity !== "healthy").length,
			activeStationsCount: Math.max(stations.stations.length, status.quality.volume.recentStationCount)
		};
	},
	component: SystemStatusPage
});
function SystemStatusPage() {
	const { status, stations, dataset, availableMonths, months, latestMonth, incidents, capabilities, activeIncidentCount, activeStationsCount } = Route$24.useLoaderData();
	(/* @__PURE__ */ new Date()).toISOString();
	const cityName = getCityName();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Estado",
		href: appRoutes.status()
	});
	const healthLabel = getHealthLabel(status.pipeline.healthStatus);
	const summaryCards = [
		{
			label: "Ultima muestra",
			value: formatStatusDateTime(dataset.lastUpdated.lastSampleAt),
			hint: "Marca compartida por dashboard, informes y API."
		},
		{
			label: "Frecuencia de actualizacion",
			value: getObservedCadenceLabel(status),
			hint: `Objetivo operativo <= ${Math.round(status.quality.freshness.maxAgeSeconds / 60)} min de frescura.`
		},
		{
			label: "Cobertura historica",
			value: getCoverageLabel(dataset),
			hint: `${formatStatusNumber(dataset.coverage.totalStations)} estaciones con cobertura acumulada.`
		},
		{
			label: "Estaciones activas",
			value: formatStatusNumber(activeStationsCount),
			hint: "Snapshot actual con estaciones vivas o recientemente observadas."
		},
		{
			label: "Numero de muestras",
			value: formatStatusNumber(dataset.stats.totalSamples),
			hint: "Total agregado disponible para historico, comparativas y rankings."
		},
		{
			label: "Lag del pipeline",
			value: getPipelineLagLabel(status),
			hint: "Diferencia aproximada respecto a la ultima recogida valida."
		},
		{
			label: "Version dataset",
			value: getDatasetVersionLabel(dataset),
			hint: "Version derivada de la ultima muestra util y del volumen agregado."
		},
		{
			label: "Version API",
			value: getApiVersionLabel(),
			hint: "Version publicada en la especificacion OpenAPI."
		},
		{
			label: "Generacion informes",
			value: formatStatusDateTime(availableMonths.generatedAt),
			hint: latestMonth ? `Ultimo mes indexable ${formatMonthLabel(latestMonth)}.` : "Sin meses publicados todavia."
		},
		{
			label: "Incidentes activos",
			value: formatStatusNumber(activeIncidentCount),
			hint: activeIncidentCount > 0 ? "Requieren seguimiento operativo." : "Sin incidencias activas detectadas."
		}
	];
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(PublicPageViewTracker, {
			pageType: "status",
			template: "system_status",
			pageSlug: "estado"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify({
				"@context": "https://schema.org",
				"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
					"@type": "Dataset",
					name: `Estado del sistema ${cityName}`,
					description: "Cobertura, salud del pipeline, versiones y superficie operativa de la API publica.",
					url: appRoutes.status()
				}]
			}) }
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
				/* @__PURE__ */ jsx(PublicSectionNav, {
					activeItemId: "status",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Estado operativo y cobertura"
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: ["Estado del sistema ", cityName]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Vista publica para seguir ultima muestra, lag del pipeline, cobertura historica, versiones, incidentes y el estado de API, scrapers, ingestion, rankings y predicciones."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["Ultima muestra ", formatStatusDateTime(dataset.lastUpdated.lastSampleAt)]
							}),
							/* @__PURE__ */ jsx("span", {
								className: `inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`,
								children: healthLabel
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [dataset.coverage.totalDays, " dias de cobertura"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["API ", getApiVersionLabel()]
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.dashboard(),
								navigationEvent: {
									source: "status_hero",
									destination: "dashboard_home",
									sourceRole: "utility",
									destinationRole: "dashboard",
									transitionKind: "to_dashboard"
								},
								className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
								children: "Abrir dashboard en vivo"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.developers(),
								ctaEvent: {
									source: "status_hero",
									ctaId: "api_open",
									destination: "developers",
									entityType: "api",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver API y developers"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.methodology(),
								navigationEvent: {
									source: "status_hero",
									destination: "methodology",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver metodologia"
							})
						]
					}), /* @__PURE__ */ jsx(PublicSearchForm, {})]
				})
			]
		}),
		/* @__PURE__ */ jsx(StatusBanner, {
			status,
			stationsGeneratedAt: stations.generatedAt,
			coverage: dataset.coverage,
			lastSampleAt: dataset.lastUpdated.lastSampleAt
		}),
		/* @__PURE__ */ jsx("section", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-5",
			children: summaryCards.map((card) => /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: card.label
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
						children: card.value
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--muted)]",
						children: card.hint
					})
				]
			}, card.label))
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Incidentes"
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black text-[var(--foreground)]",
						children: "Incidencias y notas operativas"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "Este bloque resume lo que hoy exige seguimiento. Si no hay incidentes, actua como confirmacion de estabilidad."
					})
				] }), /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: incidents.map((incident) => /* @__PURE__ */ jsxs("article", {
						className: `rounded-xl border px-4 py-3 ${getHealthToneClasses(incident.severity)}`,
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold",
							children: incident.title
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-xs leading-relaxed text-current/90",
							children: incident.description
						})]
					}, incident.id))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Fuente y versionado"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Trazabilidad del dataset"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 text-sm text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Proveedor"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: dataset.source.provider
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Discovery GBFS"
							}), /* @__PURE__ */ jsx(Link, {
								to: dataset.source.gbfsDiscoveryUrl,
								className: "break-all text-sm font-semibold text-[var(--primary)] transition hover:opacity-80",
								children: dataset.source.gbfsDiscoveryUrl
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Version dataset"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: getDatasetVersionLabel(dataset)
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Ultimo informe publicado"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: latestMonth ? formatMonthLabel(latestMonth) : "Sin informes"
							})]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Superficie del sistema"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Estado por capa"
				})] }), /* @__PURE__ */ jsx(Link, {
					to: appRoutes.compare(),
					className: "text-sm font-bold text-[var(--primary)] transition hover:opacity-80",
					children: "Abrir comparador"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: capabilities.map((capability) => /* @__PURE__ */ jsxs(Link, {
					to: capability.href,
					className: `rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 ${getHealthToneClasses(capability.state)}`,
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-current/80",
							children: capability.label
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-base font-bold text-current",
							children: getHealthLabel(capability.state)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-relaxed text-current/90",
							children: capability.description
						})
					]
				}, capability.id))
			})]
		})
	] });
}
//#endregion
//#region src/app/estadisticas-bizi-zaragoza.tsx
var $$splitComponentImporter$7 = () => import("./estadisticas-bizi-zaragoza-bMT5_zwa.js");
var Route$23 = createFileRoute("/estadisticas-bizi-zaragoza")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
//#endregion
//#region src/app/estaciones-mas-usadas-zaragoza.tsx
var $$splitComponentImporter$6 = () => import("./estaciones-mas-usadas-zaragoza-CggPD90F.js");
var Route$22 = createFileRoute("/estaciones-mas-usadas-zaragoza")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
//#endregion
//#region src/app/estaciones-con-mas-bicis.tsx
var $$splitComponentImporter$5 = () => import("./estaciones-con-mas-bicis-DqJWCPZQ.js");
var Route$21 = createFileRoute("/estaciones-con-mas-bicis")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
//#endregion
//#region src/app/developers.tsx
init_routes();
init_site();
init_page_shell();
init_card();
var OPENAPI_DESTINATION = "openapi";
function buildOpenApiCtaEvent(source) {
	return {
		source,
		ctaId: "api_open",
		destination: OPENAPI_DESTINATION,
		entityType: "api",
		sourceRole: "utility",
		destinationRole: "utility",
		transitionKind: "within_public"
	};
}
var Route$20 = createFileRoute("/developers")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Documentacion publica de la API y los datos abiertos de Bizi Zaragoza, con OpenAPI, ejemplos de uso, descargas CSV y trazabilidad del dataset."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "API y datos abiertos de Bizi Zaragoza"
	}),
	loader: async () => {
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const siteUrl = getSiteUrl();
		const [dataset, availableMonths, status] = await Promise.all([
			fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
			fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
			fetchStatus().catch(() => buildFallbackStatus(nowIso))
		]);
		const latestMonth = availableMonths.months.filter(isValidMonthKey)[0] ?? null;
		const endpointDocs = getEndpointDocs();
		const datasetVersion = getDatasetVersionLabel(dataset);
		const apiVersion = getApiVersionLabel();
		const codeLicense = process.env.npm_package_license ?? "GPL-3.0-only";
		const developersDataState = combineDataStates([dataset.dataState, status.dataState]);
		const datasetTemporalCoverage = dataset.coverage.firstRecordedAt && dataset.coverage.lastRecordedAt ? `${dataset.coverage.firstRecordedAt}/${dataset.coverage.lastRecordedAt}` : void 0;
		const curlExamples = [
			`curl -s -H "X-Request-Id: docs-example-status" ${siteUrl}${appRoutes.api.status()}`,
			`curl -sG ${siteUrl}${appRoutes.api.rankings({
				type: "turnover",
				limit: 20
			})}`,
			`curl -L -H "x-public-api-key: $PUBLIC_API_KEY" ${siteUrl}${appRoutes.api.historyCsv()}`
		];
		const pythonExample = `import requests\n\nbase_url = "${siteUrl}"\nresponse = requests.get(f"{base_url}${appRoutes.api.status()}", timeout=15)\nresponse.raise_for_status()\npayload = response.json()\nprint(payload["pipeline"]["healthStatus"])`;
		const jsExample = `const response = await fetch("${siteUrl}${appRoutes.api.stations()}");\nif (!response.ok) throw new Error(\`HTTP \${response.status}\`);\nconst payload = await response.json();\nconsole.log(payload.stations.length);`;
		const csvDownloads = [
			{
				label: "Estado actual de estaciones",
				href: appRoutes.api.stations({ format: "csv" }),
				detail: "Snapshot actual en CSV con bicis, anclajes y capacidad. Acceso anonimo."
			},
			{
				label: "Historico agregado",
				href: appRoutes.api.historyCsv(),
				detail: "Serie diaria con demanda, ocupacion, balance y muestras. Requiere `X-Public-Api-Key`."
			},
			{
				label: "Alertas historicas",
				href: appRoutes.api.alertsHistory({
					format: "csv",
					state: "all",
					limit: 500
				}),
				detail: "Incidencias activas y resueltas con exportacion tabular. Requiere `X-Public-Api-Key`."
			},
			{
				label: "Ranking de friccion",
				href: appRoutes.api.rankings({
					type: "availability",
					limit: 200,
					format: "csv"
				}),
				detail: "Horas problema y riesgo de disponibilidad por estacion. Acceso anonimo."
			},
			{
				label: "Resumen del sistema",
				href: appRoutes.api.status({ format: "csv" }),
				detail: "Estado del pipeline, frescura y volumen reciente. Acceso anonimo."
			}
		];
		const accessPolicies = [
			{
				label: "Correlacion",
				title: "Todas las respuestas API devuelven `X-Request-Id`",
				detail: "Si el cliente envia su propio identificador se reutiliza en logs, Sentry, auditoria y ejecuciones operativas."
			},
			{
				label: "Ops",
				title: "`GET/POST /api/collect` requieren `X-Ops-Api-Key`",
				detail: "La cabecera `x-collect-api-key` sigue aceptandose temporalmente como alias de compatibilidad para cron antiguos."
			},
			{
				label: "Elevated public",
				title: "CSV costosos y ventanas amplias requieren `X-Public-Api-Key`",
				detail: "Afecta a historico CSV, alertas historicas CSV, movilidad extendida y rebalancing con ventanas o exportaciones amplias."
			},
			{
				label: "Mobile",
				title: "`Authorization` + `X-Installation-Id` en auth movil",
				detail: "Geo search y geo reverse soportan firma HMAC (`timestamp` + `signature`) y el backend puede volverla obligatoria por feature flag."
			}
		];
		const useCases = [
			"Supervision operativa del sistema y cuadros de mando internos.",
			"Periodismo de datos y storytelling sobre movilidad urbana.",
			"Investigacion sobre demanda, equilibrio y comportamiento horario.",
			"Integraciones con apps moviles, paneles de ciudad o herramientas GIS."
		];
		const changelog = [
			`v${apiVersion}: especificacion OpenAPI publicada y accesible para tooling.`,
			"Version actual: request tracing con `X-Request-Id`, collect protegido por clave operativa y auditoria persistente para auth, rate limits y ejecuciones.",
			`Dataset ${datasetVersion}: cobertura compartida con ${dataset.coverage.totalDays} dias y ${dataset.stats.totalSamples} muestras agregadas.`
		];
		const datasetDownloadEntries = csvDownloads.map((item) => ({
			name: item.label,
			url: `${siteUrl}${item.href}`
		}));
		return {
			siteUrl,
			cityName: getCityName(),
			breadcrumbs: createRootBreadcrumbs({
				label: "Developers",
				href: appRoutes.developers()
			}),
			latestMonth,
			endpointDocs,
			datasetVersion,
			apiVersion,
			codeLicense,
			developersDataState,
			datasetTemporalCoverage,
			curlExamples,
			pythonExample,
			jsExample,
			csvDownloads,
			accessPolicies,
			useCases,
			changelog,
			datasetDownloadEntries,
			dataset
		};
	},
	component: DevelopersPage
});
function getEndpointDocs() {
	return Object.entries(openApiDocument.paths).filter(([path]) => path !== "/api/docs").flatMap(([path, operations]) => Object.entries(operations).map(([method, operation]) => {
		const operationRecord = operation;
		return {
			path,
			method: method.toUpperCase(),
			summary: operationRecord.summary ?? "Operacion disponible",
			params: Array.isArray(operationRecord.parameters) ? operationRecord.parameters.map((param) => String(param.name ?? "")) : []
		};
	})).sort((left, right) => left.path.localeCompare(right.path, "es"));
}
function DevelopersPage() {
	const { siteUrl, cityName, breadcrumbs, latestMonth, endpointDocs, datasetVersion, apiVersion, codeLicense, developersDataState, datasetTemporalCoverage, curlExamples, pythonExample, jsExample, csvDownloads, accessPolicies, useCases, changelog, datasetDownloadEntries, dataset } = Route$20.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(PublicPageViewTracker, {
			pageType: "developers",
			template: "developers_hub",
			pageSlug: "developers"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify({
				"@context": "https://schema.org",
				"@graph": [
					buildBreadcrumbStructuredData(breadcrumbs),
					{
						"@type": "TechArticle",
						name: `Developers y API ${cityName}`,
						description: "Portal de acceso para desarrolladores con documentacion, versiones, ejemplos y descargas.",
						url: `${siteUrl}${appRoutes.developers()}`
					},
					{
						"@type": "Dataset",
						name: `Dataset Bizi ${cityName}`,
						description: "Snapshot actual, historico agregado y descargas CSV del mismo dataset que alimenta dashboard, informes y rankings publicos.",
						url: `${siteUrl}${appRoutes.developers()}`,
						inLanguage: "es",
						isAccessibleForFree: true,
						dateModified: dataset.coverage.generatedAt,
						...datasetTemporalCoverage ? { temporalCoverage: datasetTemporalCoverage } : {},
						publisher: {
							"@type": "Organization",
							name: SITE_NAME,
							url: siteUrl
						},
						distribution: csvDownloads.map((item) => ({
							"@type": "DataDownload",
							name: item.label,
							description: item.detail,
							encodingFormat: "text/csv",
							contentUrl: `${siteUrl}${item.href}`
						}))
					},
					buildItemListStructuredData("Descargas CSV y dataset", datasetDownloadEntries)
				]
			}) }
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
				/* @__PURE__ */ jsx(PublicSectionNav, {
					activeItemId: "api",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "API como producto"
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: ["Developers y API ", cityName]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Superficie visible para consumir el proyecto como producto: documentacion, OpenAPI, ejemplos, endpoints, descargas CSV, versiones de dataset, changelog, licencia y pautas de cita."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["OpenAPI ", openApiDocument.openapi]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["API v", apiVersion]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["Dataset ", datasetVersion]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [endpointDocs.length, " endpoints publicados"]
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.api.openApi(),
								ctaEvent: buildOpenApiCtaEvent("developers_hero"),
								className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
								children: "Descargar OpenAPI JSON"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.llms(),
								navigationEvent: {
									source: "developers_hero",
									destination: "llms",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver llms.txt"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.llmsFull(),
								navigationEvent: {
									source: "developers_hero",
									destination: "llms_full",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver llms-full.txt"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.status(),
								navigationEvent: {
									source: "developers_hero",
									destination: "status",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver estado del sistema"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.methodology(),
								navigationEvent: {
									source: "developers_hero",
									destination: "methodology",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver metodologia"
							})
						]
					}), /* @__PURE__ */ jsx(PublicSearchForm, { eventSource: "developers" })]
				})
			]
		}),
		shouldShowDataStateNotice(developersDataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: developersDataState,
			subject: "la API publica",
			description: "La documentacion sigue visible, pero la disponibilidad real de snapshots, historico y exportaciones depende del mismo estado compartido que consume el dashboard.",
			href: appRoutes.status(),
			actionLabel: "Ver estado API"
		}) : null,
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Version API"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: apiVersion
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Version declarada en la especificacion OpenAPI."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Version dataset"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: datasetVersion
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Derivada de la ultima muestra util y del historico agregado."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura historica"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: dataset.coverage.totalDays
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-[var(--muted)]",
							children: [
								dataset.stats.totalSamples,
								" muestras y ",
								dataset.stats.totalStations,
								" estaciones."
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultima generacion"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: formatStatusDateTime(dataset.coverage.generatedAt)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: latestMonth ? `Ultimo mes publicado ${formatMonthLabel(latestMonth)}.` : "Sin archivo mensual publicado."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Quick start"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Ejemplos de consumo"
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "grid gap-4 xl:grid-cols-3",
				children: [
					/* @__PURE__ */ jsxs(Card, {
						variant: "stat",
						className: "p-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "curl"
						}), /* @__PURE__ */ jsx("pre", {
							className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
							children: /* @__PURE__ */ jsx("code", { children: curlExamples.join("\n\n") })
						})]
					}),
					/* @__PURE__ */ jsxs(Card, {
						variant: "stat",
						className: "p-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Python"
						}), /* @__PURE__ */ jsx("pre", {
							className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
							children: /* @__PURE__ */ jsx("code", { children: pythonExample })
						})]
					}),
					/* @__PURE__ */ jsxs(Card, {
						variant: "stat",
						className: "p-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "JavaScript"
						}), /* @__PURE__ */ jsx("pre", {
							className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
							children: /* @__PURE__ */ jsx("code", { children: jsExample })
						})]
					})
				]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			id: "rebalancing-api",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Logistica y redistribucion"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "API de reequilibrio"
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-2 text-sm text-[var(--muted)]",
					children: [
						"El endpoint ",
						/* @__PURE__ */ jsx("code", { children: "/api/rebalancing-report" }),
						" devuelve recomendaciones origen-destino, clasificacion estructural A-F y metricas de impacto operativo estimadas."
					]
				})
			] }), /* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ jsxs(Card, {
					variant: "stat",
					className: "p-4",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Ejemplo (curl)"
					}), /* @__PURE__ */ jsx("pre", {
						className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
						children: /* @__PURE__ */ jsx("code", { children: `curl -sG ${siteUrl}${appRoutes.api.rebalancingReport({
							district: "Centro",
							days: 15
						})}` })
					})]
				}), /* @__PURE__ */ jsxs(Card, {
					variant: "stat",
					className: "p-4",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Ejemplo (Python)"
					}), /* @__PURE__ */ jsx("pre", {
						className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
						children: /* @__PURE__ */ jsx("code", { children: `import requests

base_url = "${siteUrl}"
params = {"days": 15, "format": "json"}
res = requests.get(f"{base_url}${appRoutes.api.rebalancingReport()}", params=params, timeout=20)
res.raise_for_status()
print(len(res.json()["transfers"]))` })
					})]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Acceso y seguridad"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Contrato operativo actual"
			})] }), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
				children: accessPolicies.map((policy) => /* @__PURE__ */ jsxs(Card, {
					variant: "stat",
					className: "rounded-2xl px-4 py-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: policy.label
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm font-semibold text-[var(--foreground)]",
							children: policy.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-xs text-[var(--muted)]",
							children: policy.detail
						})
					]
				}, policy.label))
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Superficie disponible"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Endpoints publicados"
				})] }), /* @__PURE__ */ jsx(TrackedLink, {
					href: appRoutes.api.openApi(),
					ctaEvent: buildOpenApiCtaEvent("developers_endpoints"),
					className: "text-sm font-bold text-[var(--primary)] transition hover:opacity-80",
					children: "Ver JSON OpenAPI"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: endpointDocs.map((endpoint) => /* @__PURE__ */ jsxs(Card, {
					variant: "stat",
					id: buildDeveloperEndpointAnchorId(endpoint.path, endpoint.method),
					className: "scroll-mt-24 px-4 py-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: endpoint.method
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 font-mono text-sm font-semibold text-[var(--foreground)]",
							children: endpoint.path
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: endpoint.summary
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-xs text-[var(--muted)]",
							children: endpoint.params.length > 0 ? `Params: ${endpoint.params.join(", ")}` : "Sin parametros obligatorios o query destacados."
						})
					]
				}, `${endpoint.method}-${endpoint.path}`))
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Dataset y descargas"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Historico, CSV y versiones"
				})] }), /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: csvDownloads.map((item) => /* @__PURE__ */ jsx(TrackedLink, {
						href: item.href,
						ctaEvent: {
							source: "developers_dataset",
							ctaId: "dataset_download",
							destination: item.href,
							entityType: "api",
							sourceRole: "utility",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "flex-row items-center justify-between gap-3 px-4 py-3 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: item.label
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: item.detail
							})] }), /* @__PURE__ */ jsx("span", {
								className: "text-xs font-bold text-[var(--primary)]",
								children: "Descargar"
							})]
						})
					}, item.label))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Rate limits y politicas"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Consumo responsable"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 text-sm text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "stat-label",
									children: "Lectura publica"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: "Modelo mixto: anonimo para lectura barata, clave para acceso elevado"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: "Las lecturas ligeras siguen abiertas; CSV costosos y ventanas amplias pasan por `X-Public-Api-Key` y rate limit compartido."
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "stat-label",
									children: "Ingesta protegida"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: "GET y POST /api/collect aplican auth operativa + Redis rate limit"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: "Configuracion por defecto: 6 solicitudes por 60 segundos y cabecera `x-ops-api-key`; `x-collect-api-key` queda como alias temporal."
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "stat-label",
									children: "Licencia del codigo"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: codeLicense
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: "La app esta licenciada como software libre; para redistribuir datos derivados revisa tambien los terminos del proveedor GBFS."
								})
							]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Changelog actual"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Versiones y cambios visibles"
				})] }), /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: changelog.map((item) => /* @__PURE__ */ jsx(Card, {
						variant: "stat",
						className: "px-4 py-3 text-sm text-[var(--muted)]",
						children: item
					}, item))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Cita y licencia de datos"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Como citar y reutilizar"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 text-sm text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Cita sugerida"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm leading-relaxed text-[var(--foreground)]",
								children: `BiziDashboard ${cityName}, dataset historico agregado (version ${datasetVersion}), consultado el ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-ES")}. Fuente primaria: ${dataset.source.gbfsDiscoveryUrl}`
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Fuente primaria"
							}), /* @__PURE__ */ jsx(Link, {
								to: dataset.source.gbfsDiscoveryUrl,
								className: "break-all text-sm font-semibold text-[var(--primary)] transition hover:opacity-80",
								children: dataset.source.gbfsDiscoveryUrl
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Ultima generacion compartida"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: formatStatusDateTime(dataset.coverage.generatedAt)
							})]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Casos de uso"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Para que sirve esta API hoy"
			})] }), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
				children: useCases.map((item) => /* @__PURE__ */ jsx(Card, {
					variant: "stat",
					className: "px-4 py-4 text-sm text-[var(--muted)]",
					children: item
				}, item))
			})]
		})
	] });
}
//#endregion
//#region src/app/dashboard.tsx
var $$splitComponentImporter$4 = () => import("./dashboard-mDWomc60.js");
var Route$19 = createFileRoute("/dashboard")({
	component: lazyRouteComponent($$splitComponentImporter$4, "component"),
	head: () => ({ meta: [
		{ charSet: "utf-8" },
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1"
		},
		{ title: "Panel clasico - DatosBizi" }
	] })
});
//#endregion
//#region src/components/ui/select.tsx
function SelectIcon() {
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		className: "text-xs text-[var(--muted)]",
		children: "▾"
	});
}
var Select$1, SelectTrigger, SelectValue, SelectContent, SelectItem;
var init_select = __esmMin((() => {
	init_utils();
	Select$1 = Select.Root;
	SelectTrigger = React.forwardRef(function SelectTrigger({ className, children, ...props }, ref) {
		return /* @__PURE__ */ jsx(Select.Trigger, {
			ref,
			className: (state) => cn("inline-flex min-h-8 items-center justify-between gap-2 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none transition", state.open && "border-[var(--primary)]", typeof className === "function" ? className(state) : className),
			...props,
			children
		});
	});
	SelectValue = React.forwardRef(function SelectValue({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx(Select.Value, {
			ref,
			className: (state) => cn("truncate text-left", typeof className === "function" ? className(state) : className),
			...props
		});
	});
	SelectContent = React.forwardRef(function SelectContent({ className, children, ...props }, ref) {
		return /* @__PURE__ */ jsx(Select.Portal, { children: /* @__PURE__ */ jsx(Select.Positioner, {
			sideOffset: 6,
			children: /* @__PURE__ */ jsx(Select.Popup, {
				ref,
				className: (state) => cn("z-50 min-w-[12rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--shadow-md)] outline-none backdrop-blur-md", typeof className === "function" ? className(state) : className),
				...props,
				children: /* @__PURE__ */ jsx(Select.List, {
					className: "max-h-72 overflow-auto",
					children
				})
			})
		}) });
	});
	SelectItem = React.forwardRef(function SelectItem({ className, children, ...props }, ref) {
		return /* @__PURE__ */ jsxs(Select.Item, {
			ref,
			className: (state) => cn("flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--foreground)] outline-none", state.highlighted && "bg-[var(--primary)]/10 text-[var(--primary)]", state.selected && "font-semibold", typeof className === "function" ? className(state) : className),
			...props,
			children: [/* @__PURE__ */ jsx(Select.ItemText, { children }), /* @__PURE__ */ jsx(Select.ItemIndicator, {
				className: "ml-3 text-xs text-[var(--primary)]",
				children: "✓"
			})]
		});
	});
}));
//#endregion
//#region src/app/comparar/_components/InteractiveComparePanel.tsx
init_button();
init_select();
init_routes();
function formatSignedNumber(value, maximumFractionDigits = 1) {
	return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("es-ES", { maximumFractionDigits }).format(value)}`;
}
function formatPercentDelta(value) {
	return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
}
function resolveOption(dimension, requestedId, fallbackIndex) {
	if (requestedId) {
		const requested = dimension.options.find((option) => option.id === requestedId);
		if (requested) return requested;
	}
	return dimension.options[fallbackIndex] ?? dimension.options[0] ?? null;
}
function resolveDimension(data, requestedId) {
	return data.dimensions.find((dimension) => dimension.id === requestedId) ?? data.dimensions[0] ?? null;
}
function buildInitialSelectionState(data, initialQuery) {
	const initialState = data.dimensions.reduce((accumulator, dimension) => {
		accumulator[dimension.id] = {
			leftId: dimension.defaultLeftId ?? dimension.options[0]?.id ?? "",
			rightId: dimension.defaultRightId ?? dimension.options[1]?.id ?? dimension.options[0]?.id ?? ""
		};
		return accumulator;
	}, {});
	const requestedDimension = resolveDimension(data, initialQuery?.dimensionId);
	if (!requestedDimension) return initialState;
	const requestedLeftId = resolveOption(requestedDimension, initialQuery?.leftId, 0)?.id ?? initialState[requestedDimension.id]?.leftId ?? "";
	const requestedRightId = resolveOption(requestedDimension, initialQuery?.rightId, 1)?.id ?? initialState[requestedDimension.id]?.rightId ?? requestedLeftId;
	return {
		...initialState,
		[requestedDimension.id]: {
			leftId: requestedLeftId,
			rightId: requestedRightId
		}
	};
}
function InteractiveComparePanel({ data, initialQuery }) {
	const router = useRouter();
	const [activeDimensionId, setActiveDimensionId] = useState(() => resolveDimension(data, initialQuery?.dimensionId)?.id ?? data.defaultDimensionId ?? data.dimensions[0]?.id ?? "");
	const [selectionState, setSelectionState] = useState(() => buildInitialSelectionState(data, initialQuery));
	const [copyState, setCopyState] = useState("idle");
	const lastSyncedHref = useRef(null);
	const activeDimension = useMemo(() => data.dimensions.find((dimension) => dimension.id === activeDimensionId) ?? data.dimensions[0] ?? null, [activeDimensionId, data.dimensions]);
	const activeSelection = activeDimension ? selectionState[activeDimension.id] ?? {
		leftId: activeDimension.defaultLeftId ?? "",
		rightId: activeDimension.defaultRightId ?? ""
	} : null;
	const leftOption = activeDimension ? resolveOption(activeDimension, activeSelection?.leftId, 0) : null;
	const rightOption = activeDimension ? resolveOption(activeDimension, activeSelection?.rightId, 1) : null;
	const comparisonSummary = useMemo(() => {
		if (!leftOption || !rightOption || !activeDimension) return null;
		const leftValue = leftOption.primaryValue;
		const rightValue = rightOption.primaryValue;
		if (leftValue === null || rightValue === null) return {
			headline: "La comparativa no tiene una referencia numerica suficiente todavia.",
			detail: "Puedes seguir usando los enlaces directos de cada lado mientras se completa el agregado para esta dimension."
		};
		if (leftValue === rightValue) return {
			headline: `${leftOption.label} y ${rightOption.label} empatan en ${leftOption.primaryLabel.toLowerCase()}.`,
			detail: `Ambos lados muestran ${leftOption.primaryDisplay} en ${activeDimension.label.toLowerCase()}.`
		};
		const leader = leftValue > rightValue ? leftOption : rightOption;
		const trailer = leader.id === leftOption.id ? rightOption : leftOption;
		const leaderValue = leader.primaryValue ?? 0;
		const trailerValue = trailer.primaryValue ?? 0;
		const absoluteDelta = leaderValue - trailerValue;
		const ratioDelta = trailerValue !== 0 ? absoluteDelta / trailerValue : null;
		return {
			headline: `${leader.label} lidera frente a ${trailer.label} en ${leader.primaryLabel.toLowerCase()}.`,
			detail: ratioDelta === null ? `Ventaja absoluta ${formatSignedNumber(absoluteDelta)}.` : `Ventaja absoluta ${formatSignedNumber(absoluteDelta)} y relativa ${formatPercentDelta(ratioDelta)}.`
		};
	}, [
		activeDimension,
		leftOption,
		rightOption
	]);
	const shareHref = useMemo(() => {
		if (!activeDimension || !leftOption || !rightOption) return appRoutes.compare();
		return appRoutes.compare({
			dimension: activeDimension.id,
			left: leftOption.id,
			right: rightOption.id
		});
	}, [
		activeDimension,
		leftOption,
		rightOption
	]);
	function syncCompareSelection(dimension, selection) {
		const nextHref = appRoutes.compare({
			dimension: dimension.id,
			left: selection.leftId,
			right: selection.rightId
		});
		if (lastSyncedHref.current === nextHref) return;
		lastSyncedHref.current = nextHref;
		router.replace(nextHref, { scroll: false });
	}
	useEffect(() => {
		if (copyState === "idle") return;
		const timeoutId = window.setTimeout(() => {
			setCopyState("idle");
		}, 2e3);
		return () => window.clearTimeout(timeoutId);
	}, [copyState]);
	if (!activeDimension || !leftOption || !rightOption) return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Comparador interactivo"
			}),
			/* @__PURE__ */ jsx("h2", {
				className: "mt-2 text-xl font-black text-[var(--foreground)]",
				children: "Elige dos lados y comparalos manualmente"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-sm text-[var(--muted)]",
				children: "El comparador libre ya esta preparado, pero esta instalacion todavia no tiene suficiente cobertura para poblar selectores manuales en esta vista."
			})
		]
	});
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Comparador interactivo"
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black text-[var(--foreground)]",
						children: "Elige dos lados y comparalos manualmente"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "Usa selectores libres para enfrentar estaciones, barrios, meses, anos, horas o periodos concretos con el mismo dataset compartido del producto."
					})
				] }), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "ui-chip",
						children: [data.dimensions.length, " dimensiones comparables"]
					}), /* @__PURE__ */ jsxs("span", {
						className: "ui-chip",
						children: [
							activeDimension.options.length,
							" opciones en ",
							activeDimension.label.toLowerCase()
						]
					})]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap gap-2",
				children: data.dimensions.map((dimension) => {
					const isActive = dimension.id === activeDimension.id;
					const dimensionSelection = selectionState[dimension.id] ?? {
						leftId: dimension.defaultLeftId ?? dimension.options[0]?.id ?? "",
						rightId: dimension.defaultRightId ?? dimension.options[1]?.id ?? dimension.options[0]?.id ?? ""
					};
					return /* @__PURE__ */ jsx(Button, {
						variant: "ghost",
						onClick: () => {
							setActiveDimensionId(dimension.id);
							syncCompareSelection(dimension, dimensionSelection);
						},
						"aria-pressed": isActive,
						className: `h-auto min-h-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isActive ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"}`,
						children: dimension.label
					}, dimension.id);
				})
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
				children: [{
					side: "left",
					label: "Lado A",
					option: leftOption,
					fallbackIndex: 0
				}, {
					side: "right",
					label: "Lado B",
					option: rightOption,
					fallbackIndex: 1
				}].map((side) => /* @__PURE__ */ jsxs("article", {
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: side.label
						}), /* @__PURE__ */ jsxs(Select$1, {
							value: side.option.id,
							onValueChange: (value) => {
								if (!value) return;
								const nextSelection = {
									...selectionState[activeDimension.id] ?? {
										leftId: activeDimension.defaultLeftId ?? "",
										rightId: activeDimension.defaultRightId ?? ""
									},
									[side.side === "left" ? "leftId" : "rightId"]: value
								};
								setSelectionState((current) => ({
									...current,
									[activeDimension.id]: nextSelection
								}));
								syncCompareSelection(activeDimension, nextSelection);
							},
							children: [/* @__PURE__ */ jsxs(SelectTrigger, {
								className: "mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]",
								children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
							}), /* @__PURE__ */ jsx(SelectContent, { children: activeDimension.options.map((option) => /* @__PURE__ */ jsx(SelectItem, {
								value: option.id,
								children: option.label
							}, option.id)) })]
						})] }),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 space-y-2 text-sm",
							children: [
								/* @__PURE__ */ jsxs("p", {
									className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
									children: [
										/* @__PURE__ */ jsxs("span", {
											className: "font-bold",
											children: [side.option.primaryLabel, ":"]
										}),
										" ",
										side.option.primaryDisplay
									]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
									children: [
										/* @__PURE__ */ jsxs("span", {
											className: "font-bold",
											children: [side.option.secondaryLabel, ":"]
										}),
										" ",
										side.option.secondaryDisplay
									]
								}),
								side.option.tertiaryLabel && side.option.tertiaryDisplay ? /* @__PURE__ */ jsxs("p", {
									className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
									children: [
										/* @__PURE__ */ jsxs("span", {
											className: "font-bold",
											children: [side.option.tertiaryLabel, ":"]
										}),
										" ",
										side.option.tertiaryDisplay
									]
								}) : null
							]
						}),
						side.option.note ? /* @__PURE__ */ jsx("p", {
							className: "mt-3 text-xs leading-relaxed text-[var(--muted)]",
							children: side.option.note
						}) : null,
						/* @__PURE__ */ jsxs(Link, {
							href: side.option.href,
							className: "mt-4 inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-bold text-[var(--primary)] transition hover:border-[var(--primary)]/40",
							children: ["Abrir ", side.option.label]
						})
					]
				}, side.side))
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "URL compartible"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs text-[var(--foreground)]",
						children: shareHref
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							onClick: async () => {
								try {
									const absoluteUrl = typeof window === "undefined" ? shareHref : new URL(shareHref, window.location.origin).toString();
									await navigator.clipboard.writeText(absoluteUrl);
									setCopyState("copied");
								} catch {
									setCopyState("error");
								}
							},
							className: "h-auto min-h-0 rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: "Copiar enlace"
						}), /* @__PURE__ */ jsx(Link, {
							href: shareHref,
							className: "inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/40",
							children: "Abrir esta seleccion"
						})]
					}),
					copyState !== "idle" ? /* @__PURE__ */ jsx("p", {
						className: "mt-2 text-xs text-[var(--muted)]",
						children: copyState === "copied" ? "Enlace copiado al portapapeles." : "No se pudo copiar automaticamente el enlace."
					}) : null
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 p-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Lectura comparativa"
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "mt-2 text-lg font-black text-[var(--foreground)]",
						children: comparisonSummary?.headline ?? "Sin comparativa disponible"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-sm text-[var(--muted)]",
						children: comparisonSummary?.detail ?? activeDimension.description
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 text-xs text-[var(--muted)]",
						children: activeDimension.description
					})
				]
			})
		]
	});
}
//#endregion
//#region src/lib/mobility-conclusions.ts
init_sentry_reporting();
var madridDateFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: TIMEZONE,
	year: "numeric",
	month: "2-digit",
	day: "2-digit"
});
var MONTHLY_CONCLUSIONS_CACHE_TTL_SECONDS = 900;
var hasReportedMissingMobilityBriefingCacheTable = false;
function getMadridDateKey(value = /* @__PURE__ */ new Date()) {
	const formatted = madridDateFormatter.format(value);
	if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
	const [month, day, year] = formatted.split("/");
	if (year && month && day) return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
	return value.toISOString().slice(0, 10);
}
function toNumber(value) {
	if (value === null || value === void 0) return 0;
	const num = Number(value);
	return Number.isFinite(num) ? num : 0;
}
function round(value, decimals = 2) {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}
function calculateDelta(current, previous) {
	if (!Number.isFinite(previous) || previous <= 0) return null;
	return (current - previous) / previous;
}
function formatDelta$2(deltaRatio) {
	if (deltaRatio === null || !Number.isFinite(deltaRatio)) return "sin referencia previa";
	return `${deltaRatio >= 0 ? "+" : ""}${Math.round(deltaRatio * 100)}%`;
}
async function getDistrictCollection() {
	try {
		const response = await fetch(DISTRICTS_GEOJSON_URL, { next: { revalidate: 86400 } });
		if (!response.ok) return null;
		const payload = await response.json();
		return isDistrictCollection(payload) ? payload : null;
	} catch {
		return null;
	}
}
function toDateOrNull(value) {
	if (!value) return null;
	const withTime = value.length <= 10 ? `${value}T00:00:00.000Z` : value;
	const parsed = new Date(withTime);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function isFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value);
}
function isOptionalFiniteNumber(value) {
	return value === null || isFiniteNumber(value);
}
function isOptionalString(value) {
	return value === null || typeof value === "string";
}
function getErrorMessages(error) {
	if (!error || typeof error !== "object") return [];
	const typedError = error;
	const messages = [];
	if (typeof typedError.message === "string" && typedError.message.length > 0) messages.push(typedError.message);
	if (typedError.cause && typedError.cause !== error) messages.push(...getErrorMessages(typedError.cause));
	return messages;
}
function isMissingMobilityBriefingCacheTableError(error) {
	return getErrorMessages(error).some((message) => {
		const normalized = message.toLowerCase();
		if (!normalized.includes("mobilitybriefingcache")) return false;
		return normalized.includes("no such table") || normalized.includes("does not exist") || normalized.includes("p2021");
	});
}
function hasCacheShape(payload) {
	if (!payload || typeof payload !== "object") return false;
	const typed = payload;
	if (typeof typed.dateKey !== "string" || typeof typed.generatedAt !== "string" || !isOptionalString(typed.selectedMonth) || typeof typed.summary !== "string" || !isFiniteNumber(typed.totalHistoricalDays) || !isFiniteNumber(typed.stationsWithData) || !isFiniteNumber(typed.activeStations)) return false;
	if (!typed.metrics || typeof typed.metrics !== "object") return false;
	const metrics = typed.metrics;
	if (!isFiniteNumber(metrics.demandLast7Days) || !isFiniteNumber(metrics.demandPrevious7Days) || !isOptionalFiniteNumber(metrics.demandDeltaRatio) || !isFiniteNumber(metrics.occupancyLast7Days) || !isFiniteNumber(metrics.occupancyPrevious7Days) || !isOptionalFiniteNumber(metrics.occupancyDeltaRatio)) return false;
	if (!Array.isArray(typed.highlights) || !Array.isArray(typed.recommendations) || !Array.isArray(typed.topStationsByDemand) || !Array.isArray(typed.leastUsedStations)) return false;
	if (!Array.isArray(typed.peakDemandHours) || !Array.isArray(typed.topDistrictsByDemand) || !typed.weekdayWeekendProfile || typeof typed.weekdayWeekendProfile !== "object") return false;
	return true;
}
function buildConclusionsRange(monthKey) {
	if (monthKey && isValidMonthKey(monthKey)) {
		const { start, endExclusive } = getMonthBounds(monthKey);
		const [year, month] = monthKey.split("-").map(Number);
		const previousStart = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 2, 1)).toISOString();
		return {
			currentDaily: Prisma.sql`"bucketDate" >= ${start}::timestamp AND "bucketDate" < ${endExclusive}::timestamp`,
			previousDaily: Prisma.sql`"bucketDate" >= ${previousStart}::timestamp AND "bucketDate" < ${start}::timestamp`,
			currentHourly: Prisma.sql`"bucketStart" >= ${start}::timestamp AND "bucketStart" < ${endExclusive}::timestamp`,
			topStationsDaily: Prisma.sql`"DailyStationStat"."bucketDate" >= ${start}::timestamp AND "DailyStationStat"."bucketDate" < ${endExclusive}::timestamp`,
			summaryScope: `en ${formatMonthLabel(monthKey)}`,
			comparisonScope: "vs mes previo"
		};
	}
	return {
		currentDaily: Prisma.sql`"bucketDate" >= CURRENT_DATE - INTERVAL '6 days'`,
		previousDaily: Prisma.sql`"bucketDate" >= CURRENT_DATE - INTERVAL '13 days' AND "bucketDate" < CURRENT_DATE - INTERVAL '6 days'`,
		currentHourly: Prisma.sql`"bucketStart" >= CURRENT_DATE - INTERVAL '6 days'`,
		topStationsDaily: Prisma.sql`"DailyStationStat"."bucketDate" >= CURRENT_DATE - INTERVAL '29 days'`,
		summaryScope: "en la ultima semana",
		comparisonScope: "vs semana previa"
	};
}
function getDominantPeriod(weekdayDemand, weekendDemand) {
	if (weekdayDemand <= 0 && weekendDemand <= 0) return null;
	return weekdayDemand >= weekendDemand ? "weekday" : "weekend";
}
async function buildMobilityConclusionsPayload(dateKey, monthKey) {
	const selectedMonth = monthKey && isValidMonthKey(monthKey) ? monthKey : null;
	const range = buildConclusionsRange(selectedMonth ?? void 0);
	const [sharedCoverage, demandLastRows, demandPreviousRows, occupancyLastRows, occupancyPreviousRows, activeStationRows, topStationsRows, leastUsedStationsRows, dayTypeProfileRows, peakHourRows, stationDemandRows, districts] = await Promise.all([
		getCoverageSummary().catch(() => ({
			firstRecordedAt: null,
			lastRecordedAt: null,
			totalSamples: 0,
			totalStations: 0,
			totalDays: 0,
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		})),
		prisma.$queryRaw`
        SELECT COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS value
        FROM "DailyStationStat"
        WHERE ${range.currentDaily};
      `.catch(() => []),
		prisma.$queryRaw`
        SELECT COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS value
        FROM "DailyStationStat"
        WHERE ${range.previousDaily};
      `.catch(() => []),
		prisma.$queryRaw`
        SELECT COALESCE(AVG("occupancyAvg"), 0) AS value
        FROM "DailyStationStat"
        WHERE ${range.currentDaily};
      `.catch(() => []),
		prisma.$queryRaw`
        SELECT COALESCE(AVG("occupancyAvg"), 0) AS value
        FROM "DailyStationStat"
        WHERE ${range.previousDaily};
      `.catch(() => []),
		prisma.station.findMany({
			where: { isActive: true },
			select: {
				id: true,
				lat: true,
				lon: true
			}
		}).catch(() => []),
		prisma.$queryRaw`
        SELECT
          "DailyStationStat"."stationId" AS "stationId",
          "Station".name AS "stationName",
          AVG(("DailyStationStat"."bikesMax" - "DailyStationStat"."bikesMin") + ("DailyStationStat"."anchorsMax" - "DailyStationStat"."anchorsMin")) AS "avgDemand"
        FROM "DailyStationStat"
        INNER JOIN "Station" ON "Station".id = "DailyStationStat"."stationId"
        WHERE ${range.topStationsDaily}
        GROUP BY "DailyStationStat"."stationId", "Station".name
        ORDER BY "avgDemand" DESC
        LIMIT 5;
      `.catch(() => []),
		prisma.$queryRaw`
        SELECT
          "DailyStationStat"."stationId" AS "stationId",
          "Station".name AS "stationName",
          AVG(("DailyStationStat"."bikesMax" - "DailyStationStat"."bikesMin") + ("DailyStationStat"."anchorsMax" - "DailyStationStat"."anchorsMin")) AS "avgDemand"
        FROM "DailyStationStat"
        INNER JOIN "Station" ON "Station".id = "DailyStationStat"."stationId"
        WHERE ${range.topStationsDaily}
        GROUP BY "DailyStationStat"."stationId", "Station".name
        HAVING COUNT(*) > 0
        ORDER BY "avgDemand" ASC, "Station".name ASC
        LIMIT 5;
      `.catch(() => []),
		prisma.$queryRaw`
        WITH daily_totals AS (
          SELECT
            "bucketDate"::date AS "bucketDay",
            SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
            AVG("occupancyAvg") AS "occupancyAvg"
          FROM "DailyStationStat"
          WHERE ${range.currentDaily}
          GROUP BY "bucketDate"::date
        )
        SELECT
          CASE
            WHEN EXTRACT(DOW FROM "bucketDay")::int IN (0, 6) THEN 'weekend'
            ELSE 'weekday'
          END AS "dayType",
          AVG("demandScore") AS "avgDemand",
          AVG("occupancyAvg") AS "avgOccupancy",
          COUNT(*) AS "daysCount"
        FROM daily_totals
        GROUP BY "dayType";
      `.catch(() => []),
		prisma.$queryRaw`
        SELECT
          EXTRACT(HOUR FROM "bucketStart")::int AS hour,
          COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "demandScore"
        FROM "HourlyStationStat"
        WHERE ${range.currentHourly}
        GROUP BY EXTRACT(HOUR FROM "bucketStart")::int
        ORDER BY "demandScore" DESC, hour ASC
        LIMIT 3;
      `.catch(() => []),
		prisma.$queryRaw`
        SELECT
          "stationId",
          COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "demandScore"
        FROM "DailyStationStat"
        WHERE ${range.currentDaily}
        GROUP BY "stationId"
        ORDER BY "demandScore" DESC;
      `.catch(() => []),
		getDistrictCollection()
	]);
	const demandLast7Days = toNumber(demandLastRows[0]?.value);
	const demandPrevious7Days = toNumber(demandPreviousRows[0]?.value);
	const occupancyLast7Days = toNumber(occupancyLastRows[0]?.value);
	const occupancyPrevious7Days = toNumber(occupancyPreviousRows[0]?.value);
	const demandDeltaRatio = calculateDelta(demandLast7Days, demandPrevious7Days);
	const occupancyDeltaRatio = calculateDelta(occupancyLast7Days, occupancyPrevious7Days);
	const topStationsByDemand = topStationsRows.map((row) => ({
		stationId: row.stationId,
		stationName: row.stationName,
		avgDemand: round(toNumber(row.avgDemand), 1)
	}));
	const leastUsedStations = leastUsedStationsRows.map((row) => ({
		stationId: row.stationId,
		stationName: row.stationName,
		avgDemand: round(toNumber(row.avgDemand), 1)
	}));
	const weekdayProfile = dayTypeProfileRows.find((row) => row.dayType === "weekday");
	const weekendProfile = dayTypeProfileRows.find((row) => row.dayType === "weekend");
	const weekdayWeekendProfile = {
		weekday: {
			avgDemand: round(toNumber(weekdayProfile?.avgDemand), 1),
			avgOccupancy: round(toNumber(weekdayProfile?.avgOccupancy), 4),
			daysCount: Math.round(toNumber(weekdayProfile?.daysCount))
		},
		weekend: {
			avgDemand: round(toNumber(weekendProfile?.avgDemand), 1),
			avgOccupancy: round(toNumber(weekendProfile?.avgOccupancy), 4),
			daysCount: Math.round(toNumber(weekendProfile?.daysCount))
		},
		demandGapRatio: calculateDelta(toNumber(weekendProfile?.avgDemand), toNumber(weekdayProfile?.avgDemand)),
		dominantPeriod: getDominantPeriod(toNumber(weekdayProfile?.avgDemand), toNumber(weekendProfile?.avgDemand))
	};
	const peakDemandHours = peakHourRows.map((row) => ({
		hour: Math.max(0, Math.min(23, toNumber(row.hour))),
		demandScore: Math.round(toNumber(row.demandScore))
	})).filter((row) => row.demandScore > 0);
	const topDistrictsByDemand = (() => {
		if (!districts || activeStationRows.length === 0 || stationDemandRows.length === 0) return [];
		const stationDistrictMap = buildStationDistrictMap(activeStationRows, districts);
		const districtTotals = /* @__PURE__ */ new Map();
		for (const row of stationDemandRows) {
			const district = stationDistrictMap.get(row.stationId);
			if (!district) continue;
			districtTotals.set(district, (districtTotals.get(district) ?? 0) + toNumber(row.demandScore));
		}
		return Array.from(districtTotals.entries()).map(([district, demandScore]) => ({
			district,
			demandScore: Math.round(demandScore)
		})).sort((left, right) => right.demandScore - left.demandScore || left.district.localeCompare(right.district, "es")).slice(0, 3);
	})();
	const summary = demandDeltaRatio === null ? `La ciudad acumula ${Math.round(demandLast7Days)} puntos de demanda agregada ${range.summaryScope}, con ocupacion media del ${Math.round(occupancyLast7Days * 100)}% sobre ${sharedCoverage.totalDays} dias historicos disponibles.` : `La demanda ${selectedMonth ? "mensual" : "semanal"} se mueve ${formatDelta$2(demandDeltaRatio)} ${range.comparisonScope} y la ocupacion media se situa en ${Math.round(occupancyLast7Days * 100)}% (${formatDelta$2(occupancyDeltaRatio)}).`;
	const highlights = [
		{
			title: selectedMonth ? "Demanda del mes" : "Demanda semanal",
			detail: `${Math.round(demandLast7Days)} puntos ${selectedMonth ? `en ${formatMonthLabel(selectedMonth)}` : "en 7 dias"} (${formatDelta$2(demandDeltaRatio)} ${range.comparisonScope}).`
		},
		{
			title: selectedMonth ? "Ocupacion media del mes" : "Ocupacion media",
			detail: `${Math.round(occupancyLast7Days * 100)}% ${range.summaryScope} (${formatDelta$2(occupancyDeltaRatio)}).`
		},
		{
			title: "Cobertura historica",
			detail: `${sharedCoverage.totalDays} dias con datos y ${sharedCoverage.totalStations} estaciones activas cubiertas.`
		}
	];
	if (topStationsByDemand[0]) highlights.push({
		title: "Estacion con mayor presion",
		detail: `${topStationsByDemand[0].stationName} lidera el promedio diario de demanda (indice ${topStationsByDemand[0].avgDemand}).`
	});
	if (weekdayWeekendProfile.dominantPeriod) highlights.push({
		title: "Patron semanal",
		detail: weekdayWeekendProfile.dominantPeriod === "weekday" ? `La red rinde mas entre semana, con ${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} puntos medios al dia frente a ${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} en fin de semana.` : `La red rinde mas en fin de semana, con ${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} puntos medios al dia frente a ${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} entre semana.`
	});
	const recommendations = [];
	if (demandDeltaRatio !== null && demandDeltaRatio > .08) recommendations.push(`Refuerza la redistribucion preventiva para absorber el incremento de demanda ${selectedMonth ? "del mes" : "semanal"}.`);
	else if (demandDeltaRatio !== null && demandDeltaRatio < -.08) recommendations.push(`Ajusta el despliegue operativo a una demanda mas contenida ${selectedMonth ? "en el mes seleccionado" : "esta semana"} y prioriza zonas con mayor variabilidad.`);
	else recommendations.push(`Mantener el plan operativo actual con seguimiento diario, ya que la demanda ${selectedMonth ? "del periodo" : "semanal"} evoluciona dentro de un rango estable.`);
	if (occupancyLast7Days < .32) recommendations.push("Hay margen para reforzar disponibilidad de bicicletas en nodos de salida temprana para reducir riesgo de estaciones vacias.");
	else if (occupancyLast7Days > .68) recommendations.push("La ocupacion media alta sugiere reforzar retirada en estaciones de alta recepcion para evitar saturacion de anclajes.");
	else recommendations.push("La ocupacion media se mantiene equilibrada; conviene centrar recursos en estaciones con picos abruptos de demanda.");
	if (topStationsByDemand.length > 0) recommendations.push(`Monitoriza diariamente ${topStationsByDemand[0].stationName} y ${topStationsByDemand[1]?.stationName ?? topStationsByDemand[0].stationName} como puntos de mayor friccion potencial.`);
	if (peakDemandHours[0]) recommendations.push(`Refuerza seguimiento y redistribucion en torno a las ${String(peakDemandHours[0].hour).padStart(2, "0")}:00, la franja con mayor intensidad reciente.`);
	if (weekdayWeekendProfile.dominantPeriod === "weekday") recommendations.push("Dimensiona el operativo principal para dias laborables y reserva ajustes mas ligeros para sabados y domingos.");
	else if (weekdayWeekendProfile.dominantPeriod === "weekend") recommendations.push("Refuerza capacidad y seguimiento en fines de semana, donde la red concentra mayor intensidad media de uso.");
	return {
		dateKey,
		generatedAt: sharedCoverage.generatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
		selectedMonth,
		sourceFirstDay: sharedCoverage.firstRecordedAt,
		sourceLastDay: sharedCoverage.lastRecordedAt,
		totalHistoricalDays: sharedCoverage.totalDays,
		stationsWithData: sharedCoverage.totalStations,
		activeStations: sharedCoverage.totalStations,
		metrics: {
			demandLast7Days: Math.round(demandLast7Days),
			demandPrevious7Days: Math.round(demandPrevious7Days),
			demandDeltaRatio: demandDeltaRatio === null ? null : round(demandDeltaRatio, 4),
			occupancyLast7Days: round(occupancyLast7Days, 4),
			occupancyPrevious7Days: round(occupancyPrevious7Days, 4),
			occupancyDeltaRatio: occupancyDeltaRatio === null ? null : round(occupancyDeltaRatio, 4)
		},
		summary,
		highlights,
		recommendations,
		peakDemandHours,
		topDistrictsByDemand,
		topStationsByDemand,
		leastUsedStations,
		weekdayWeekendProfile
	};
}
function parseCachedPayload(rawPayload) {
	try {
		const parsed = JSON.parse(rawPayload);
		return hasCacheShape(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
function hasSameSourceLastDay(cachedSourceLastDay, sourceLastDay) {
	if (!cachedSourceLastDay && !sourceLastDay) return true;
	if (!cachedSourceLastDay || !sourceLastDay) return false;
	return cachedSourceLastDay.getTime() === sourceLastDay.getTime();
}
async function getCoverageSignature() {
	const [coverage] = await prisma.$queryRaw`
    SELECT
      MIN(TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "firstDay",
      MAX(TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "lastDay",
      COUNT(DISTINCT TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "totalDays",
      COUNT(DISTINCT "stationId") AS "stationsWithData"
    FROM "DailyStationStat";
  `;
	return {
		firstDay: coverage?.firstDay ?? null,
		lastDay: coverage?.lastDay ?? null,
		totalDays: toNumber(coverage?.totalDays)
	};
}
function hasSameCoverageSignature(payload, coverage, sourceLastDay) {
	if (!hasSameSourceLastDay(toDateOrNull(payload.sourceLastDay), sourceLastDay)) return false;
	return payload.sourceFirstDay === coverage.firstDay && payload.sourceLastDay === coverage.lastDay && payload.totalHistoricalDays === coverage.totalDays;
}
async function getDailyMobilityConclusions(monthKey) {
	const dateKey = getMadridDateKey();
	if (monthKey && isValidMonthKey(monthKey)) return {
		payload: await withCache(`mobility:conclusions:month=${monthKey}`, MONTHLY_CONCLUSIONS_CACHE_TTL_SECONDS, async () => buildMobilityConclusionsPayload(dateKey, monthKey)),
		fromCache: false
	};
	let cached = null;
	let cacheTableAvailable = true;
	try {
		cached = await prisma.mobilityBriefingCache.findUnique({
			where: { dateKey },
			select: {
				payload: true,
				sourceLastDay: true
			}
		});
	} catch (error) {
		if (!isMissingMobilityBriefingCacheTableError(error)) throw error;
		cacheTableAvailable = false;
		if (!hasReportedMissingMobilityBriefingCacheTable) {
			captureWarningWithContext("MobilityBriefingCache table is missing; using uncached mobility conclusions.", {
				area: "mobility.conclusions",
				operation: "readMobilityBriefingCache",
				tags: { handled: true },
				dedupeKey: "mobility-conclusions.missing-cache-table"
			});
			hasReportedMissingMobilityBriefingCacheTable = true;
		}
		console.warn("[MobilityConclusions] MobilityBriefingCache table is missing; computing payload without cache.");
	}
	if (cached) {
		const parsed = parseCachedPayload(cached.payload);
		if (parsed) {
			const coverage = await getCoverageSignature().catch((error) => {
				captureWarningWithContext("Mobility conclusions cache validation degraded: coverage signature unavailable.", {
					area: "mobility.conclusions",
					operation: "getDailyMobilityConclusions",
					dedupeKey: "mobility-conclusions.coverage-signature-fallback",
					extra: { reason: String(error) }
				});
				return null;
			});
			if (!coverage) return {
				payload: parsed,
				fromCache: true
			};
			if (hasSameCoverageSignature(parsed, coverage, toDateOrNull(coverage.lastDay))) return {
				payload: parsed,
				fromCache: true
			};
		}
	}
	const payload = await buildMobilityConclusionsPayload(dateKey);
	const sourceLastDay = toDateOrNull(payload.sourceLastDay);
	if (cacheTableAvailable) try {
		await prisma.mobilityBriefingCache.upsert({
			where: { dateKey },
			create: {
				dateKey,
				payload: JSON.stringify(payload),
				sourceLastDay
			},
			update: {
				payload: JSON.stringify(payload),
				sourceLastDay
			}
		});
	} catch (error) {
		if (!isMissingMobilityBriefingCacheTableError(error)) throw error;
		if (!hasReportedMissingMobilityBriefingCacheTable) {
			captureWarningWithContext("MobilityBriefingCache table is missing; skipping cache persistence.", {
				area: "mobility.conclusions",
				operation: "writeMobilityBriefingCache",
				tags: { handled: true },
				dedupeKey: "mobility-conclusions.missing-cache-table"
			});
			hasReportedMissingMobilityBriefingCacheTable = true;
		}
		console.warn("[MobilityConclusions] MobilityBriefingCache table is missing; skipping cache persistence.");
	}
	return {
		payload,
		fromCache: false
	};
}
//#endregion
//#region src/lib/comparison-hub-builders.ts
init_routes();
var integerFormatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
var decimalFormatters = /* @__PURE__ */ new Map();
var percentFormatter = new Intl.NumberFormat("es-ES", {
	style: "percent",
	maximumFractionDigits: 0
});
function buildFallbackComparisonSections() {
	return [
		{
			id: "current",
			title: "Comparativas operativas",
			description: "Lecturas directas para comparar estaciones, barrios, franjas horarias y comportamiento laboral frente al fin de semana.",
			cards: []
		},
		{
			id: "historical",
			title: "Comparativas historicas",
			description: "Cortes temporales para comparar meses, anos, periodos y grandes cambios en la red o en la demanda.",
			cards: []
		},
		{
			id: "changes",
			title: "Cambios detectados",
			description: "Deltas recientes de rankings, demanda y balance para entender si el sistema mejora, empeora o gira de lideres.",
			cards: []
		}
	];
}
function getDecimalFormatter(maximumFractionDigits) {
	const existing = decimalFormatters.get(maximumFractionDigits);
	if (existing) return existing;
	const formatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits });
	decimalFormatters.set(maximumFractionDigits, formatter);
	return formatter;
}
function formatRecordedAtSummary(recordedAt) {
	if (!recordedAt) return "sin fecha";
	const normalized = recordedAt instanceof Date ? recordedAt.toISOString() : recordedAt;
	if (typeof normalized !== "string" || normalized.length === 0) return "sin fecha";
	return normalized.includes("T") ? normalized.slice(0, 16).replace("T", " ") : normalized;
}
function formatInteger(value) {
	return integerFormatter.format(value);
}
function formatDecimal(value, maximumFractionDigits = 1) {
	return getDecimalFormatter(maximumFractionDigits).format(value);
}
function formatPercent(value) {
	if (value === null || value === void 0 || !Number.isFinite(value)) return "Sin datos";
	return percentFormatter.format(value);
}
function formatDelta$1(deltaRatio) {
	if (deltaRatio === null || deltaRatio === void 0 || !Number.isFinite(deltaRatio)) return "Sin referencia comparable";
	return `${deltaRatio >= 0 ? "+" : ""}${Math.round(deltaRatio * 100)}%`;
}
function average(values) {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function buildUnavailableCard(id, title, eyebrow, href, note) {
	return {
		id,
		title,
		eyebrow,
		summary: "Todavia no hay suficiente dato agregado para esta comparativa.",
		metricA: "Sin muestra suficiente",
		metricB: "Sin referencia previa",
		delta: "Pendiente de cobertura",
		href,
		note
	};
}
function toTimestamp(day) {
	return (/* @__PURE__ */ new Date(`${day}T00:00:00.000Z`)).getTime();
}
function buildInteractiveDimension(config) {
	if (config.options.length === 0) return null;
	const fallbackLeftId = config.options[0]?.id ?? null;
	const fallbackRightId = config.options[1]?.id ?? fallbackLeftId;
	return {
		id: config.id,
		label: config.label,
		description: config.description,
		options: config.options,
		defaultLeftId: config.defaultLeftId ?? fallbackLeftId,
		defaultRightId: config.defaultRightId ?? fallbackRightId
	};
}
function deriveComparisonContext(input) {
	const stationMap = new Map(input.stations.map((station) => [station.id, station]));
	const turnoverMap = new Map(input.turnoverRankings.map((row) => [row.stationId, Number(row.turnoverScore)]));
	const availabilityMap = new Map(input.availabilityRankings.map((row) => [row.stationId, Number(row.emptyHours) + Number(row.fullHours)]));
	const yearlyMap = /* @__PURE__ */ new Map();
	for (const row of input.monthlySeries) {
		const year = row.monthKey.slice(0, 4);
		const current = yearlyMap.get(year) ?? {
			year,
			demandScore: 0,
			occupancyValues: [],
			activeStations: []
		};
		current.demandScore += Number(row.demandScore);
		current.occupancyValues.push(Number(row.avgOccupancy));
		current.activeStations.push(Number(row.activeStations));
		yearlyMap.set(year, current);
	}
	const yearlyRows = Array.from(yearlyMap.values()).sort((left, right) => left.year.localeCompare(right.year));
	const sortedRecentDemand = [...input.recentDemand].sort((left, right) => toTimestamp(left.day) - toTimestamp(right.day));
	const sortedHoursByDemand = [...input.hourlyProfile].sort((left, right) => Number(left.avgBikesAvailable) - Number(right.avgBikesAvailable) || Number(left.avgOccupancy) - Number(right.avgOccupancy));
	return {
		...input,
		stationMap,
		turnoverMap,
		availabilityMap,
		topStation: input.turnoverRankings[0] ?? null,
		secondStation: input.turnoverRankings[1] ?? null,
		topDistrict: input.districtRows[0] ?? null,
		bottomDistrict: input.districtRows[input.districtRows.length - 1] ?? null,
		latestMonthlyRow: input.monthlySeries[input.monthlySeries.length - 1] ?? null,
		previousMonthlyRow: input.monthlySeries[input.monthlySeries.length - 2] ?? null,
		latestYear: yearlyRows[yearlyRows.length - 1] ?? null,
		previousYear: yearlyRows[yearlyRows.length - 2] ?? null,
		yearlyRows,
		sortedRecentDemand,
		peakHour: sortedHoursByDemand[0] ?? null,
		quietHour: sortedHoursByDemand[sortedHoursByDemand.length - 1] ?? null,
		weekdayWeekendProfile: input.recentPayload?.weekdayWeekendProfile ?? null
	};
}
function buildCurrentCards(context) {
	const cards = [];
	if (context.topStation && context.secondStation) {
		const topStationMeta = context.stationMap.get(context.topStation.stationId);
		const secondStationMeta = context.stationMap.get(context.secondStation.stationId);
		const demandGap = Number(context.secondStation.turnoverScore) > 0 ? (Number(context.topStation.turnoverScore) - Number(context.secondStation.turnoverScore)) / Number(context.secondStation.turnoverScore) : null;
		cards.push({
			id: "station-vs-station",
			title: "Estacion vs estacion",
			eyebrow: "Comparativa operativa",
			summary: `${topStationMeta?.name ?? context.topStation.stationId} lidera el uso relativo frente a ${secondStationMeta?.name ?? context.secondStation.stationId}.`,
			metricA: `${topStationMeta?.name ?? context.topStation.stationId}: giro ${formatDecimal(Number(context.topStation.turnoverScore))} · ${topStationMeta?.bikesAvailable ?? 0}/${topStationMeta?.capacity ?? 0} bicis`,
			metricB: `${secondStationMeta?.name ?? context.secondStation.stationId}: giro ${formatDecimal(Number(context.secondStation.turnoverScore))} · ${secondStationMeta?.bikesAvailable ?? 0}/${secondStationMeta?.capacity ?? 0} bicis`,
			delta: `Brecha de actividad ${formatDelta$1(demandGap)}`,
			href: appRoutes.dashboardStations(),
			note: `Riesgo de disponibilidad: ${formatDecimal(context.availabilityMap.get(context.topStation.stationId) ?? 0)} vs ${formatDecimal(context.availabilityMap.get(context.secondStation.stationId) ?? 0)} horas problema.`
		});
	} else cards.push(buildUnavailableCard("station-vs-station", "Estacion vs estacion", "Comparativa operativa", appRoutes.dashboardStations()));
	if (context.topDistrict && context.bottomDistrict && context.topDistrict.slug !== context.bottomDistrict.slug) {
		const districtGap = context.bottomDistrict.avgTurnover > 0 ? (context.topDistrict.avgTurnover - context.bottomDistrict.avgTurnover) / context.bottomDistrict.avgTurnover : null;
		cards.push({
			id: "district-vs-district",
			title: "Barrio vs barrio",
			eyebrow: "Lectura territorial",
			summary: `${context.topDistrict.name} concentra la mayor actividad relativa mientras ${context.bottomDistrict.name} se comporta como el extremo mas calmado.`,
			metricA: `${context.topDistrict.name}: ${formatDecimal(context.topDistrict.avgTurnover)} pts · ${context.topDistrict.stationCount} estaciones`,
			metricB: `${context.bottomDistrict.name}: ${formatDecimal(context.bottomDistrict.avgTurnover)} pts · ${context.bottomDistrict.stationCount} estaciones`,
			delta: `Brecha territorial ${formatDelta$1(districtGap)}`,
			href: appRoutes.districtLanding(),
			note: `${context.topDistrict.bikesAvailable} bicis disponibles ahora mismo frente a ${context.bottomDistrict.bikesAvailable}.`
		});
	} else cards.push(buildUnavailableCard("district-vs-district", "Barrio vs barrio", "Lectura territorial", appRoutes.districtLanding()));
	if (context.weekdayWeekendProfile) cards.push({
		id: "weekday-vs-weekend",
		title: "Laboral vs fin de semana",
		eyebrow: "Patron de uso",
		summary: context.weekdayWeekendProfile.dominantPeriod === "weekend" ? "La red rinde mas en fin de semana que entre semana." : "La red rinde mas entre semana que en fin de semana.",
		metricA: `Laboral: ${formatDecimal(context.weekdayWeekendProfile.weekday.avgDemand)} pts/dia · ocupacion ${formatPercent(context.weekdayWeekendProfile.weekday.avgOccupancy)}`,
		metricB: `Fin de semana: ${formatDecimal(context.weekdayWeekendProfile.weekend.avgDemand)} pts/dia · ocupacion ${formatPercent(context.weekdayWeekendProfile.weekend.avgOccupancy)}`,
		delta: `Diferencia relativa ${formatDelta$1(context.weekdayWeekendProfile.demandGapRatio)}`,
		href: context.latestMonth ? appRoutes.reportMonth(context.latestMonth) : appRoutes.dashboardConclusions(),
		note: `${context.weekdayWeekendProfile.weekday.daysCount} dias laborables comparados con ${context.weekdayWeekendProfile.weekend.daysCount} dias de fin de semana.`
	});
	else cards.push(buildUnavailableCard("weekday-vs-weekend", "Laboral vs fin de semana", "Patron de uso", appRoutes.dashboardConclusions()));
	if (context.hourlyProfile.length >= 2) {
		const hourGap = context.peakHour && context.quietHour && Number(context.quietHour.avgBikesAvailable) > 0 ? (Number(context.quietHour.avgBikesAvailable) - Number(context.peakHour.avgBikesAvailable)) / Number(context.quietHour.avgBikesAvailable) : null;
		cards.push({
			id: "hour-vs-hour",
			title: "Hora vs hora",
			eyebrow: "Ritmo intradia",
			summary: `La hora ${context.peakHour?.hour ?? "--"}:00 concentra el mayor movimiento medio del sistema, frente a la franja mas tranquila.`,
			metricA: `${context.peakHour?.hour ?? "--"}:00 · ${formatDecimal(Number(context.peakHour?.avgBikesAvailable ?? 0))} bicis disponibles · ocupacion ${formatPercent(Number(context.peakHour?.avgOccupancy ?? 0))}`,
			metricB: `${context.quietHour?.hour ?? "--"}:00 · ${formatDecimal(Number(context.quietHour?.avgBikesAvailable ?? 0))} bicis disponibles · ocupacion ${formatPercent(Number(context.quietHour?.avgOccupancy ?? 0))}`,
			delta: `Brecha horaria ${formatDelta$1(hourGap)}`,
			href: appRoutes.dashboardView("research"),
			note: `${formatInteger(Number(context.peakHour?.sampleCount ?? 0))} muestras agregadas en la hora pico.`
		});
	} else cards.push(buildUnavailableCard("hour-vs-hour", "Hora vs hora", "Ritmo intradia", appRoutes.dashboardView("research")));
	return cards;
}
function buildHistoricalCards(context) {
	const cards = [];
	if (context.latestMonthlyRow && context.previousMonthlyRow) {
		const monthDelta = Number(context.previousMonthlyRow.demandScore) > 0 ? (Number(context.latestMonthlyRow.demandScore) - Number(context.previousMonthlyRow.demandScore)) / Number(context.previousMonthlyRow.demandScore) : null;
		cards.push({
			id: "month-vs-month",
			title: "Mes vs mes",
			eyebrow: "Cambio mensual",
			summary: `${formatMonthLabel(context.latestMonthlyRow.monthKey)} se compara con ${formatMonthLabel(context.previousMonthlyRow.monthKey)} en demanda, ocupacion y estaciones activas.`,
			metricA: `${formatMonthLabel(context.latestMonthlyRow.monthKey)}: ${formatInteger(Number(context.latestMonthlyRow.demandScore))} pts · ocupacion ${formatPercent(Number(context.latestMonthlyRow.avgOccupancy))}`,
			metricB: `${formatMonthLabel(context.previousMonthlyRow.monthKey)}: ${formatInteger(Number(context.previousMonthlyRow.demandScore))} pts · ocupacion ${formatPercent(Number(context.previousMonthlyRow.avgOccupancy))}`,
			delta: `Demanda mensual ${formatDelta$1(monthDelta)}`,
			href: appRoutes.reports(),
			note: `Estaciones activas ${formatInteger(Number(context.latestMonthlyRow.activeStations))} vs ${formatInteger(Number(context.previousMonthlyRow.activeStations))}.`
		});
	} else cards.push(buildUnavailableCard("month-vs-month", "Mes vs mes", "Cambio mensual", appRoutes.reports()));
	if (context.latestYear && context.previousYear) {
		const yearDelta = context.previousYear.demandScore > 0 ? (context.latestYear.demandScore - context.previousYear.demandScore) / context.previousYear.demandScore : null;
		cards.push({
			id: "year-vs-year",
			title: "Ano vs ano",
			eyebrow: "Lectura anual",
			summary: `${context.latestYear.year} agrega ${formatInteger(context.latestYear.demandScore)} puntos de demanda frente a ${context.previousYear.year}.`,
			metricA: `${context.latestYear.year}: ${formatInteger(context.latestYear.demandScore)} pts · ocupacion media ${formatPercent(average(context.latestYear.occupancyValues))}`,
			metricB: `${context.previousYear.year}: ${formatInteger(context.previousYear.demandScore)} pts · ocupacion media ${formatPercent(average(context.previousYear.occupancyValues))}`,
			delta: `Variacion anual ${formatDelta$1(yearDelta)}`,
			href: appRoutes.reports(),
			note: `Red media de ${formatDecimal(average(context.latestYear.activeStations) ?? 0)} estaciones activas frente a ${formatDecimal(average(context.previousYear.activeStations) ?? 0)}.`
		});
	} else cards.push(buildUnavailableCard("year-vs-year", "Ano vs ano", "Lectura anual", appRoutes.reports()));
	if (context.recentDemand.length >= 40) {
		const last7 = context.sortedRecentDemand.slice(-7);
		const previous30 = context.sortedRecentDemand.slice(-37, -7);
		const last7Demand = average(last7.map((row) => Number(row.demandScore)));
		const previous30Demand = average(previous30.map((row) => Number(row.demandScore)));
		const periodDelta = last7Demand !== null && previous30Demand && previous30Demand > 0 ? (last7Demand - previous30Demand) / previous30Demand : null;
		cards.push({
			id: "periods",
			title: "Periodos",
			eyebrow: "Ventanas comparables",
			summary: "La ultima semana se compara con la base movil previa de treinta dias para detectar aceleraciones o frenadas.",
			metricA: `Ultimos 7 dias: ${formatDecimal(last7Demand ?? 0)} pts/dia · ocupacion ${formatPercent(average(last7.map((row) => Number(row.avgOccupancy))))}`,
			metricB: `Base previa 30 dias: ${formatDecimal(previous30Demand ?? 0)} pts/dia · ocupacion ${formatPercent(average(previous30.map((row) => Number(row.avgOccupancy))))}`,
			delta: `Cambio de periodo ${formatDelta$1(periodDelta)}`,
			href: appRoutes.dashboardConclusions(),
			note: `Cobertura reciente: ${context.datasetCoverageDays} dias historicos en total.`
		});
	} else cards.push(buildUnavailableCard("periods", "Periodos", "Ventanas comparables", appRoutes.dashboardConclusions()));
	const expansionCandidate = context.monthlySeries.map((row, index) => {
		if (index === 0) return null;
		return {
			index,
			monthKey: row.monthKey,
			stationDelta: Number(row.activeStations) - Number(context.monthlySeries[index - 1]?.activeStations ?? 0)
		};
	}).filter((candidate) => Boolean(candidate)).sort((left, right) => right.stationDelta - left.stationDelta)[0] ?? null;
	if (expansionCandidate && expansionCandidate.stationDelta > 0) {
		const beforeSlice = context.monthlySeries.slice(Math.max(0, expansionCandidate.index - 2), expansionCandidate.index);
		const afterSlice = context.monthlySeries.slice(expansionCandidate.index, Math.min(context.monthlySeries.length, expansionCandidate.index + 2));
		const beforeDemand = average(beforeSlice.map((row) => Number(row.demandScore)));
		const afterDemand = average(afterSlice.map((row) => Number(row.demandScore)));
		const expansionDelta = beforeDemand && beforeDemand > 0 && afterDemand !== null ? (afterDemand - beforeDemand) / beforeDemand : null;
		cards.push({
			id: "before-after-expansion",
			title: "Antes vs despues ampliacion",
			eyebrow: "Hito detectado",
			summary: `Se detecta la mayor ampliacion proxy en ${formatMonthLabel(expansionCandidate.monthKey)} por un salto de ${formatInteger(expansionCandidate.stationDelta)} estaciones activas.`,
			metricA: `Antes: ${formatDecimal(beforeDemand ?? 0)} pts/mes · ${formatDecimal(average(beforeSlice.map((row) => Number(row.activeStations))) ?? 0)} estaciones medias`,
			metricB: `Despues: ${formatDecimal(afterDemand ?? 0)} pts/mes · ${formatDecimal(average(afterSlice.map((row) => Number(row.activeStations))) ?? 0)} estaciones medias`,
			delta: `Cambio tras ampliacion ${formatDelta$1(expansionDelta)}`,
			href: appRoutes.reports(),
			note: "La fecha se infiere por el mayor salto en estaciones activas, no por un calendario externo de hitos."
		});
	} else cards.push(buildUnavailableCard("before-after-expansion", "Antes vs despues ampliacion", "Hito detectado", appRoutes.reports(), "Hace falta un salto claro en estaciones activas o un calendario de hitos para fijar el corte."));
	if (context.recentDemand.length >= 10) {
		const peakDay = [...context.recentDemand].sort((left, right) => Number(right.demandScore) - Number(left.demandScore))[0];
		const normalDays = context.recentDemand.filter((row) => row.day !== peakDay?.day);
		const normalDemand = average(normalDays.map((row) => Number(row.demandScore)));
		const eventDelta = normalDemand && normalDemand > 0 && peakDay ? (Number(peakDay.demandScore) - normalDemand) / normalDemand : null;
		cards.push({
			id: "events-vs-normal",
			title: "Eventos vs normal",
			eyebrow: "Pico anomalo",
			summary: `El dia ${peakDay?.day ?? "sin fecha"} marca el mayor pico reciente y se compara con un dia normal medio del mismo tramo.`,
			metricA: `Pico anomalo: ${formatInteger(Number(peakDay?.demandScore ?? 0))} pts · ocupacion ${formatPercent(Number(peakDay?.avgOccupancy ?? 0))}`,
			metricB: `Dia normal: ${formatDecimal(normalDemand ?? 0)} pts · ocupacion ${formatPercent(average(normalDays.map((row) => Number(row.avgOccupancy))))}`,
			delta: `Exceso sobre normal ${formatDelta$1(eventDelta)}`,
			href: appRoutes.dashboardConclusions(),
			note: "Esta lectura usa un pico estadistico reciente como proxy de evento; no consume un calendario oficial de eventos."
		});
	} else cards.push(buildUnavailableCard("events-vs-normal", "Eventos vs normal", "Pico anomalo", appRoutes.dashboardConclusions()));
	return cards;
}
function buildChangeCards(context) {
	const cards = [];
	if (context.latestMonthPayload && context.previousMonthPayload) {
		const latestTop = context.latestMonthPayload.topStationsByDemand;
		const previousTop = context.previousMonthPayload.topStationsByDemand;
		const latestLeader = latestTop[0] ?? null;
		const previousLeader = previousTop[0] ?? null;
		const overlap = latestTop.filter((row) => previousTop.some((candidate) => candidate.stationId === row.stationId)).length;
		cards.push({
			id: "ranking-changes",
			title: "Ranking cambios",
			eyebrow: "Movimiento de lideres",
			summary: latestLeader && previousLeader ? latestLeader.stationId === previousLeader.stationId ? `${latestLeader.stationName} mantiene el liderato mensual por demanda media.` : `El lider cambia de ${previousLeader.stationName} a ${latestLeader.stationName}.` : "No hay suficiente ranking mensual para medir cambios.",
			metricA: latestLeader ? `${formatMonthLabel(context.latestMonthPayload.selectedMonth ?? context.latestMonth ?? "")}: ${latestLeader.stationName} · ${formatDecimal(latestLeader.avgDemand)} pts` : "Sin lider mensual reciente",
			metricB: previousLeader ? `${formatMonthLabel(context.previousMonthPayload.selectedMonth ?? context.previousMonth ?? "")}: ${previousLeader.stationName} · ${formatDecimal(previousLeader.avgDemand)} pts` : "Sin lider mensual previo",
			delta: `${overlap}/5 estaciones coinciden entre ambos top 5`,
			href: context.latestMonthPayload.selectedMonth ? appRoutes.reportMonth(context.latestMonthPayload.selectedMonth) : appRoutes.reports(),
			note: "La comparativa usa el top de estaciones por demanda media entre meses consecutivos."
		});
	} else cards.push(buildUnavailableCard("ranking-changes", "Ranking cambios", "Movimiento de lideres", appRoutes.reports()));
	if (context.recentPayload) cards.push({
		id: "demand-changes",
		title: "Demanda cambios",
		eyebrow: "Pulso reciente",
		summary: "Cambio de demanda comparando la ultima ventana de siete dias frente a la anterior.",
		metricA: `Ultimos 7 dias: ${formatInteger(context.recentPayload.metrics.demandLast7Days)} pts`,
		metricB: `7 dias previos: ${formatInteger(context.recentPayload.metrics.demandPrevious7Days)} pts`,
		delta: `Cambio de demanda ${formatDelta$1(context.recentPayload.metrics.demandDeltaRatio)}`,
		href: appRoutes.dashboardConclusions(),
		note: `Ultima cobertura util ${context.recentPayload.sourceLastDay ?? "sin fecha"}.`
	});
	else cards.push(buildUnavailableCard("demand-changes", "Demanda cambios", "Pulso reciente", appRoutes.dashboardConclusions()));
	if (context.historyRows.length >= 14) {
		const last7 = context.historyRows.slice(-7);
		const previous7 = context.historyRows.slice(-14, -7);
		const last7Balance = average(last7.map((row) => Number(row.balanceIndex)));
		const previous7Balance = average(previous7.map((row) => Number(row.balanceIndex)));
		const balanceDelta = last7Balance !== null && previous7Balance && previous7Balance > 0 ? (last7Balance - previous7Balance) / previous7Balance : null;
		cards.push({
			id: "balance-changes",
			title: "Balance cambios",
			eyebrow: "Equilibrio del sistema",
			summary: "Evolucion del indice de equilibrio comparando la ultima semana con la anterior.",
			metricA: `Ultimos 7 dias: ${formatDecimal(last7Balance ?? 0, 2)} indice medio`,
			metricB: `Semana previa: ${formatDecimal(previous7Balance ?? 0, 2)} indice medio`,
			delta: `Cambio de balance ${formatDelta$1(balanceDelta)}`,
			href: appRoutes.dashboardView("data"),
			note: `Series con ${formatInteger(last7.reduce((sum, row) => sum + Number(row.sampleCount), 0))} muestras recientes.`
		});
	} else cards.push(buildUnavailableCard("balance-changes", "Balance cambios", "Equilibrio del sistema", appRoutes.dashboardView("data")));
	return cards;
}
function buildPeriodOptions(sortedRecentDemand) {
	const options = [];
	const appendPeriodOption = (id, label, rows, notePrefix) => {
		if (rows.length === 0) return;
		const demandAverage = average(rows.map((row) => Number(row.demandScore)));
		const occupancyAverage = average(rows.map((row) => Number(row.avgOccupancy)));
		const totalSamples = rows.reduce((sum, row) => sum + Number(row.sampleCount), 0);
		const rangeLabel = rows.length > 1 ? `${rows[0]?.day ?? ""} -> ${rows[rows.length - 1]?.day ?? ""}` : rows[0]?.day ?? "";
		options.push({
			id,
			label,
			href: appRoutes.dashboardConclusions(),
			primaryLabel: "Demanda media",
			primaryValue: demandAverage,
			primaryDisplay: `${formatDecimal(demandAverage ?? 0)} pts/dia`,
			secondaryLabel: "Ocupacion media",
			secondaryDisplay: formatPercent(occupancyAverage),
			tertiaryLabel: "Cobertura",
			tertiaryDisplay: `${formatInteger(totalSamples)} muestras`,
			note: `${notePrefix}: ${rangeLabel}`
		});
	};
	appendPeriodOption("last-7d", "Ultimos 7 dias", sortedRecentDemand.slice(-7), "Ventana reciente");
	appendPeriodOption("previous-7d", "7 dias previos", sortedRecentDemand.slice(-14, -7), "Ventana previa");
	appendPeriodOption("last-30d", "Ultimos 30 dias", sortedRecentDemand.slice(-30), "Ventana reciente");
	appendPeriodOption("previous-30d", "30 dias previos", sortedRecentDemand.slice(-60, -30), "Ventana previa");
	return options;
}
function buildInteractiveComparisonData(context) {
	const periodOptions = buildPeriodOptions(context.sortedRecentDemand);
	const dimensions = [
		buildInteractiveDimension({
			id: "stations",
			label: "Estaciones",
			description: "Compara manualmente dos estaciones concretas por giro, disponibilidad actual y horas problema.",
			options: [...context.stations].sort((left, right) => left.name.localeCompare(right.name, "es")).map((station) => ({
				id: station.id,
				label: `${station.name} (${station.id})`,
				href: appRoutes.dashboardStation(station.id),
				primaryLabel: "Giro",
				primaryValue: context.turnoverMap.get(station.id) ?? null,
				primaryDisplay: `${formatDecimal(context.turnoverMap.get(station.id) ?? 0)} pts`,
				secondaryLabel: "Snapshot",
				secondaryDisplay: `${station.bikesAvailable}/${station.capacity} bicis`,
				tertiaryLabel: "Horas problema",
				tertiaryDisplay: `${formatDecimal(context.availabilityMap.get(station.id) ?? 0)} h`,
				note: `Ultima muestra ${formatRecordedAtSummary(station.recordedAt)}`
			})),
			defaultLeftId: context.topStation?.stationId ?? null,
			defaultRightId: context.secondStation?.stationId ?? null
		}),
		buildInteractiveDimension({
			id: "districts",
			label: "Barrios",
			description: "Enfrenta dos barrios con datos reales de estaciones, disponibilidad y giro medio.",
			options: [...context.districtRows].sort((left, right) => left.name.localeCompare(right.name, "es")).map((district) => ({
				id: district.slug,
				label: district.name,
				href: appRoutes.districtDetail(district.slug),
				primaryLabel: "Giro medio",
				primaryValue: district.avgTurnover,
				primaryDisplay: `${formatDecimal(district.avgTurnover)} pts`,
				secondaryLabel: "Estaciones",
				secondaryDisplay: `${formatInteger(district.stationCount)} estaciones`,
				tertiaryLabel: "Bicis disponibles",
				tertiaryDisplay: `${formatInteger(district.bikesAvailable)} bicis`,
				note: `Riesgo medio ${formatDecimal(district.avgAvailabilityRisk)} h problema`
			})),
			defaultLeftId: context.topDistrict?.slug ?? null,
			defaultRightId: context.bottomDistrict?.slug ?? null
		}),
		buildInteractiveDimension({
			id: "months",
			label: "Meses",
			description: "Permite elegir dos meses concretos del historico publicado y comparar demanda, ocupacion y red activa.",
			options: [...context.monthlySeries].sort((left, right) => right.monthKey.localeCompare(left.monthKey, "es")).map((row) => ({
				id: row.monthKey,
				label: formatMonthLabel(row.monthKey),
				href: appRoutes.reportMonth(row.monthKey),
				primaryLabel: "Demanda mensual",
				primaryValue: Number(row.demandScore),
				primaryDisplay: `${formatInteger(Number(row.demandScore))} pts`,
				secondaryLabel: "Ocupacion media",
				secondaryDisplay: formatPercent(Number(row.avgOccupancy)),
				tertiaryLabel: "Estaciones activas",
				tertiaryDisplay: `${formatInteger(Number(row.activeStations))} estaciones`,
				note: `${formatInteger(Number(row.sampleCount))} muestras agregadas`
			})),
			defaultLeftId: context.latestMonthlyRow?.monthKey ?? null,
			defaultRightId: context.previousMonthlyRow?.monthKey ?? null
		}),
		buildInteractiveDimension({
			id: "years",
			label: "Anos",
			description: "Compara dos anos completos agregando los meses disponibles para cada periodo.",
			options: [...context.yearlyRows].sort((left, right) => right.year.localeCompare(left.year, "es")).map((row) => ({
				id: row.year,
				label: row.year,
				href: appRoutes.reports(),
				primaryLabel: "Demanda anual",
				primaryValue: row.demandScore,
				primaryDisplay: `${formatInteger(row.demandScore)} pts`,
				secondaryLabel: "Ocupacion media",
				secondaryDisplay: formatPercent(average(row.occupancyValues)),
				tertiaryLabel: "Estaciones activas medias",
				tertiaryDisplay: `${formatDecimal(average(row.activeStations) ?? 0)} estaciones`,
				note: `${row.activeStations.length} meses con datos`
			})),
			defaultLeftId: context.latestYear?.year ?? null,
			defaultRightId: context.previousYear?.year ?? null
		}),
		buildInteractiveDimension({
			id: "hours",
			label: "Horas",
			description: "Selecciona dos horas del dia para comparar ritmo medio, ocupacion y muestras acumuladas.",
			options: [...context.hourlyProfile].sort((left, right) => Number(left.hour) - Number(right.hour)).map((row) => ({
				id: String(row.hour),
				label: `${row.hour}:00`,
				href: appRoutes.dashboardView("research"),
				primaryLabel: "Bicis disponibles",
				primaryValue: Number(row.avgBikesAvailable),
				primaryDisplay: `${formatDecimal(Number(row.avgBikesAvailable))} bicis`,
				secondaryLabel: "Ocupacion media",
				secondaryDisplay: formatPercent(Number(row.avgOccupancy)),
				tertiaryLabel: "Muestras",
				tertiaryDisplay: `${formatInteger(Number(row.sampleCount))} muestras`
			})),
			defaultLeftId: context.peakHour ? String(context.peakHour.hour) : null,
			defaultRightId: context.quietHour ? String(context.quietHour.hour) : null
		}),
		buildInteractiveDimension({
			id: "periods",
			label: "Periodos",
			description: "Compara ventanas temporales recientes sin salir del comparador para detectar aceleracion o frenada.",
			options: periodOptions,
			defaultLeftId: periodOptions.find((option) => option.id === "last-7d")?.id ?? null,
			defaultRightId: periodOptions.find((option) => option.id === "previous-30d")?.id ?? null
		})
	].filter((dimension) => Boolean(dimension));
	return {
		defaultDimensionId: dimensions[0]?.id ?? null,
		dimensions
	};
}
function buildComparisonHubViewModel(input) {
	const context = deriveComparisonContext(input);
	return {
		interactive: buildInteractiveComparisonData(context),
		sections: [
			{
				id: "current",
				title: "Comparativas operativas",
				description: "Lecturas directas para comparar estaciones, barrios, franjas horarias y comportamiento laboral frente al fin de semana.",
				cards: buildCurrentCards(context)
			},
			{
				id: "historical",
				title: "Comparativas historicas",
				description: "Cortes temporales para comparar meses, anos, periodos y grandes cambios en la red o en la demanda.",
				cards: buildHistoricalCards(context)
			},
			{
				id: "changes",
				title: "Cambios detectados",
				description: "Deltas recientes de rankings, demanda y balance para entender si el sistema mejora, empeora o gira de lideres.",
				cards: buildChangeCards(context)
			}
		]
	};
}
//#endregion
//#region src/lib/comparison-hub.ts
var COMPARISON_HUB_CACHE_TTL_SECONDS = 300;
async function withTimeout(promise, timeoutMs, fallbackValue) {
	return Promise.race([promise, new Promise((resolve) => {
		setTimeout(() => resolve(fallbackValue), timeoutMs);
	})]);
}
function buildFallbackComparisonHubData(nowIso = (/* @__PURE__ */ new Date()).toISOString()) {
	return {
		latestMonth: null,
		generatedAt: nowIso,
		dataState: "no_coverage",
		interactive: {
			defaultDimensionId: null,
			dimensions: []
		},
		sections: buildFallbackComparisonSections()
	};
}
async function getRecentHistoryRows() {
	return prisma.$queryRaw`
    SELECT
      TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
      SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
      AVG("occupancyAvg") AS "avgOccupancy",
      AVG(CASE
        WHEN ABS("occupancyAvg" - 0.5) >= 0.5 THEN 0
        ELSE 1 - (2 * ABS("occupancyAvg" - 0.5))
      END) AS "balanceIndex",
      SUM("sampleCount") AS "sampleCount"
    FROM "HourlyStationStat"
    WHERE "bucketStart" >= NOW() - INTERVAL '90 days'
      AND "occupancyAvg" IS NOT NULL
    GROUP BY TO_CHAR("bucketStart", 'YYYY-MM-DD')
    ORDER BY day ASC;
  `;
}
async function getComparisonHubData() {
	return withCache("comparison-hub:snapshot", COMPARISON_HUB_CACHE_TTL_SECONDS, async () => {
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const sourceTimeoutMs = 8e3;
		const [stationsResponse, turnoverResponse, availabilityResponse, districtCollection, monthsResponse, monthlySeries, recentDemand, hourlyProfile, historyRows, dataset] = await Promise.all([
			withTimeout(fetchStations().catch(() => buildFallbackStations(nowIso)), sourceTimeoutMs, buildFallbackStations(nowIso)),
			withTimeout(fetchRankingsLite("turnover", 10).catch(() => ({
				type: "turnover",
				limit: 10,
				rankings: [],
				generatedAt: nowIso,
				dataState: "no_coverage"
			})), sourceTimeoutMs, {
				type: "turnover",
				limit: 10,
				rankings: [],
				generatedAt: nowIso,
				dataState: "no_coverage"
			}),
			withTimeout(fetchRankingsLite("availability", 10).catch(() => ({
				type: "availability",
				limit: 10,
				rankings: [],
				generatedAt: nowIso,
				dataState: "no_coverage"
			})), sourceTimeoutMs, {
				type: "availability",
				limit: 10,
				rankings: [],
				generatedAt: nowIso,
				dataState: "no_coverage"
			}),
			withTimeout(fetchDistrictCollection().catch(() => null), sourceTimeoutMs, null),
			withTimeout(fetchAvailableDataMonths().catch(() => ({
				months: [],
				generatedAt: nowIso
			})), sourceTimeoutMs, {
				months: [],
				generatedAt: nowIso
			}),
			withTimeout(fetchCachedMonthlyDemandCurve(24).catch(() => []), sourceTimeoutMs, []),
			withTimeout(fetchCachedDailyDemandCurve(90).catch(() => []), sourceTimeoutMs, []),
			withTimeout(fetchCachedSystemHourlyProfile(30).catch(() => []), sourceTimeoutMs, []),
			withTimeout(getRecentHistoryRows().catch(() => []), sourceTimeoutMs, []),
			withTimeout(fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)), sourceTimeoutMs, buildFallbackDatasetSnapshot(nowIso))
		]);
		const districtRows = buildDistrictSeoRows({
			stations: stationsResponse.stations,
			districtCollection,
			turnoverRankings: turnoverResponse.rankings,
			availabilityRankings: availabilityResponse.rankings
		});
		const validMonths = monthsResponse.months.filter(isValidMonthKey);
		const latestMonth = validMonths[0] ?? monthlySeries[monthlySeries.length - 1]?.monthKey ?? null;
		const previousMonth = validMonths[1] ?? monthlySeries[monthlySeries.length - 2]?.monthKey ?? null;
		const [recentConclusions, latestMonthConclusions, previousMonthConclusions] = await Promise.all([
			withTimeout(getDailyMobilityConclusions().catch(() => null), sourceTimeoutMs, null),
			latestMonth ? withTimeout(getDailyMobilityConclusions(latestMonth).catch(() => null), sourceTimeoutMs, null) : Promise.resolve(null),
			previousMonth ? withTimeout(getDailyMobilityConclusions(previousMonth).catch(() => null), sourceTimeoutMs, null) : Promise.resolve(null)
		]);
		const { interactive, sections } = buildComparisonHubViewModel({
			stations: stationsResponse.stations,
			turnoverRankings: turnoverResponse.rankings.map((row) => ({
				stationId: row.stationId,
				turnoverScore: Number(row.turnoverScore)
			})),
			availabilityRankings: availabilityResponse.rankings.map((row) => ({
				stationId: row.stationId,
				emptyHours: Number(row.emptyHours),
				fullHours: Number(row.fullHours)
			})),
			districtRows,
			monthlySeries: monthlySeries.map((row) => ({
				monthKey: row.monthKey,
				demandScore: Number(row.demandScore),
				avgOccupancy: Number(row.avgOccupancy),
				activeStations: Number(row.activeStations),
				sampleCount: Number(row.sampleCount)
			})),
			recentDemand: recentDemand.map((row) => ({
				day: row.day,
				demandScore: Number(row.demandScore),
				avgOccupancy: Number(row.avgOccupancy),
				sampleCount: Number(row.sampleCount)
			})),
			hourlyProfile: hourlyProfile.map((row) => ({
				hour: Number(row.hour),
				avgOccupancy: Number(row.avgOccupancy),
				avgBikesAvailable: Number(row.avgBikesAvailable),
				sampleCount: Number(row.sampleCount)
			})),
			historyRows: historyRows.map((row) => ({
				day: row.day,
				demandScore: Number(row.demandScore),
				avgOccupancy: Number(row.avgOccupancy),
				balanceIndex: Number(row.balanceIndex),
				sampleCount: Number(row.sampleCount)
			})),
			datasetCoverageDays: dataset.coverage.totalDays,
			latestMonth,
			previousMonth,
			recentPayload: recentConclusions?.payload ?? null,
			latestMonthPayload: latestMonthConclusions?.payload ?? null,
			previousMonthPayload: previousMonthConclusions?.payload ?? null
		});
		return {
			latestMonth,
			generatedAt: nowIso,
			dataState: combineDataStates([
				dataset.dataState,
				stationsResponse.dataState,
				turnoverResponse.dataState,
				availabilityResponse.dataState
			]),
			interactive,
			sections
		};
	});
}
/**
* Muchas lecturas en paralelo (API cacheada, Prisma, conclusiones diarias).
* Un tope de pocos segundos devolvía siempre el fallback vacío en producción (p. ej. cold start / DB remota).
*/
async function getComparisonHubDataWithTimeout(timeoutMs = 35e3) {
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	return Promise.race([getComparisonHubData(), new Promise((resolve) => {
		setTimeout(() => {
			resolve(buildFallbackComparisonHubData(nowIso));
		}, timeoutMs);
	})]);
}
//#endregion
//#region src/app/comparar.tsx
init_routes();
init_site();
init_page_shell();
function getFirstSearchParam(value) {
	if (Array.isArray(value)) return value[0] ?? null;
	return value ?? null;
}
function CompareHubFallback({ initialQuery }) {
	const data = buildFallbackComparisonHubData();
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		shouldShowDataStateNotice("loading") ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: "loading",
			subject: "las comparativas del hub",
			description: "Estamos preparando el snapshot comparativo compartido.",
			href: appRoutes.status(),
			actionLabel: "Revisar estado"
		}) : null,
		/* @__PURE__ */ jsx(InteractiveComparePanel, {
			data: data.interactive,
			initialQuery
		}),
		/* @__PURE__ */ jsx("section", {
			className: "grid gap-4 md:grid-cols-3",
			children: data.sections.map((section) => /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: section.title
					}),
					/* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: section.cards.length
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--muted)]",
						children: section.description
					})
				]
			}, section.id))
		})
	] });
}
async function CompareHubContent({ initialQuery }) {
	const data = await getComparisonHubDataWithTimeout();
	const comparisonCount = data.sections.reduce((count, section) => count + section.cards.length, 0);
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-3",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Comparativas activas"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: comparisonCount
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Lecturas listas para explorar ahora mismo."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultimo mes"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: data.latestMonth ? formatMonthLabel(data.latestMonth) : "Sin dato"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Referencia temporal mas reciente publicada."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Generado"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: new Date(data.generatedAt).toLocaleDateString("es-ES")
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Snapshot compartido del comparador."
						})
					]
				})
			]
		}),
		shouldShowDataStateNotice(data.dataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: data.dataState,
			subject: "las comparativas del hub",
			description: "El comparador usa el mismo snapshot compartido que dashboard, informes y API. Si ves cobertura parcial o dataset antiguo, las lecturas comparativas pueden no estar completas.",
			href: appRoutes.status(),
			actionLabel: "Revisar estado"
		}) : null,
		/* @__PURE__ */ jsx(InteractiveComparePanel, {
			data: data.interactive,
			initialQuery
		}),
		data.sections.map((section) => /* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: section.title
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: section.title
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: section.description
				})
			] }), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: section.cards.map((card) => /* @__PURE__ */ jsxs(Link, {
					to: card.href,
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: card.eyebrow
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: card.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-relaxed text-[var(--muted)]",
							children: card.summary
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 space-y-2 text-sm",
							children: [/* @__PURE__ */ jsx("p", {
								className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
								children: card.metricA
							}), /* @__PURE__ */ jsx("p", {
								className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
								children: card.metricB
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-sm font-bold text-[var(--primary)]",
							children: card.delta
						}),
						card.note ? /* @__PURE__ */ jsx("p", {
							className: "mt-2 text-xs leading-relaxed text-[var(--muted)]",
							children: card.note
						}) : null
					]
				}, card.id))
			})]
		}, section.id))
	] });
}
var Route$18 = createFileRoute("/comparar")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Hub comparativo para leer estacion vs estacion, barrio vs barrio, mes vs mes, ano vs ano y cambios de demanda, rankings y balance."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Comparador"
	}),
	loader: async () => {
		const cityName = getCityName();
		const breadcrumbs = createRootBreadcrumbs({
			label: "Comparar",
			href: appRoutes.compare()
		});
		return {
			breadcrumbs,
			structuredData: {
				"@context": "https://schema.org",
				"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
					"@type": "CollectionPage",
					name: `Comparador ${cityName}`,
					description: "Comparativas activas entre estaciones, barrios, periodos y cambios del sistema.",
					url: toAbsoluteRouteUrl(appRoutes.compare())
				}]
			}
		};
	},
	component: ComparePage
});
function ComparePage() {
	const { breadcrumbs, structuredData } = Route$18.useLoaderData();
	const search = useSearch({ from: Route$18.fullPath });
	const initialQuery = {
		dimensionId: getFirstSearchParam(search.dimension),
		leftId: getFirstSearchParam(search.left),
		rightId: getFirstSearchParam(search.right)
	};
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
				/* @__PURE__ */ jsx(PublicSectionNav, {
					activeItemId: "explore",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: /* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Analisis comparativo"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Comparador"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Superficie publica para comparar estaciones, barrios, meses, anos, horas, periodos y cambios recientes de rankings, demanda y balance a partir del historico compartido."
							})
						]
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsx(Link, {
							to: appRoutes.dashboardView("research"),
							className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: "Abrir analisis del dashboard"
						}), /* @__PURE__ */ jsx(Link, {
							to: appRoutes.explore(),
							className: "ui-inline-action",
							children: "Volver al hub Explorar"
						})]
					}), /* @__PURE__ */ jsx(PublicSearchForm, {})]
				})
			]
		}),
		/* @__PURE__ */ jsx(Suspense, {
			fallback: /* @__PURE__ */ jsx(CompareHubFallback, { initialQuery }),
			children: /* @__PURE__ */ jsx(CompareHubContent, { initialQuery })
		})
	] });
}
//#endregion
//#region src/app/biciradar.tsx
init_TrackedAnchor();
init_routes();
init_site();
init_page_shell();
init_badge();
init_card();
var GOOGLE_GROUP_URL$1 = "https://groups.google.com/g/testers-biciradar";
var PLAY_STORE_URL$1 = "https://play.google.com/store/apps/details?id=com.gcaguilar.biciradar";
var APP_STORE_URL$1 = "https://apps.apple.com/es/app/biciradar/id6760931316";
var DOWNLOAD_CTA_BASE = {
	source: "biciradar_hero",
	ctaId: "app_external",
	isExternal: true,
	sourceRole: "utility",
	destinationRole: "utility",
	transitionKind: "within_public"
};
var DOWNLOAD_CTAS = [
	{
		href: APP_STORE_URL$1,
		label: "Descargar en App Store",
		destination: "app_store",
		className: "inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95",
		iconPath: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
	},
	{
		href: GOOGLE_GROUP_URL$1,
		label: "Android para testers",
		destination: "google_group",
		className: "inline-flex items-center gap-2 rounded-xl border border-[var(--primary)] bg-transparent px-5 py-2.5 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
		iconPath: "M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"
	},
	{
		href: PLAY_STORE_URL$1,
		label: "Abrir Google Play",
		destination: "google_play",
		className: "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/50",
		iconPath: "M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"
	}
];
var CITIES = [
	{
		name: "Zaragoza",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: true
	},
	{
		name: "Madrid",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: false
	},
	{
		name: "Barcelona",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: false
	},
	{
		name: "Valencia",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: false
	},
	{
		name: "Sevilla",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: false
	}
];
var FEATURES = [
	{
		icon: "📍",
		title: "Estaciones cercanas",
		description: "Encuentra las estaciones de bicicleta publica mas cercanas a tu posicion actual con distancia y direccion."
	},
	{
		icon: "🚲",
		title: "Bicis en tiempo real",
		description: "Consulta el numero de bicicletas disponibles en cada estacion, actualizado en tiempo real."
	},
	{
		icon: "🅿️",
		title: "Huecos libres",
		description: "Comprueba los anclajes libres antes de llegar para no quedarte sin sitio donde aparcar."
	},
	{
		icon: "⭐",
		title: "Estaciones favoritas",
		description: "Guarda tus estaciones mas usadas para acceder a su estado con un solo toque."
	},
	{
		icon: "📊",
		title: "Historico de uso",
		description: "Observa patrones de uso y disponibilidad historica para planificar mejor tus viajes."
	},
	{
		icon: "⚡",
		title: "Bicis electricas",
		description: "Identifica rapidamente estaciones con bicicletas electricas disponibles."
	},
	{
		icon: "🔔",
		title: "Alertas inteligentes",
		description: "Recibe notificaciones cuando una estacion muy utilizada se quede vacia o llena."
	},
	{
		icon: "🌙",
		title: "Modo offline",
		description: "Accede a tus estaciones favoritas y ultima posicion conocida sin conexion a internet."
	}
];
var Route$17 = createFileRoute("/biciradar")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "La app definitiva para encontrar estaciones de bicis compartidas. Zaragoza, Madrid, Barcelona, Valencia y Sevilla. Bicis disponibles, huecos libres y estaciones favoritas."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Bici Radar - App de bicis compartidas en tiempo real"
	}),
	component: BiciRadarPage
});
function CityCard({ city }) {
	return /* @__PURE__ */ jsxs(Card, {
		variant: "stat",
		className: "flex-row items-center gap-3 px-4 py-3",
		children: [/* @__PURE__ */ jsx("span", {
			className: "text-2xl",
			children: city.flag
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex-1",
			children: [/* @__PURE__ */ jsx("h3", {
				className: "text-sm font-bold text-[var(--foreground)]",
				children: city.name
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-1 flex flex-wrap gap-1.5",
				children: [city.supportsEbikes && /* @__PURE__ */ jsx(Badge, {
					variant: "success",
					className: "px-2 py-0.5 text-[10px] normal-case tracking-normal",
					children: "Bicis electricas"
				}), city.supportsUsagePatterns && /* @__PURE__ */ jsx(Badge, {
					className: "px-2 py-0.5 text-[10px] normal-case tracking-normal",
					children: "Patrones de uso"
				})]
			})]
		})]
	});
}
function FeatureCard$1({ feature }) {
	return /* @__PURE__ */ jsxs(Card, {
		variant: "stat",
		className: "p-4",
		children: [/* @__PURE__ */ jsx("span", {
			className: "flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/12 text-lg",
			children: feature.icon
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
			className: "text-sm font-bold text-[var(--foreground)]",
			children: feature.title
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-xs text-[var(--muted)]",
			children: feature.description
		})] })]
	});
}
function DownloadCtas({ labels, classNameByDestination }) {
	return /* @__PURE__ */ jsx(Fragment$1, { children: DOWNLOAD_CTAS.map((cta) => /* @__PURE__ */ jsxs(TrackedAnchor, {
		href: cta.href,
		target: "_blank",
		rel: "noopener noreferrer",
		ctaEvent: {
			...DOWNLOAD_CTA_BASE,
			destination: cta.destination
		},
		className: classNameByDestination?.[cta.destination] ?? cta.className,
		children: [/* @__PURE__ */ jsx("svg", {
			className: "h-5 w-5",
			viewBox: "0 0 24 24",
			fill: "currentColor",
			"aria-hidden": "true",
			children: /* @__PURE__ */ jsx("path", { d: cta.iconPath })
		}), labels?.[cta.destination] ?? cta.label]
	}, cta.destination)) });
}
function BiciRadarPage() {
	const siteUrl = getSiteUrl();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Bici Radar",
		href: appRoutes.biciradar()
	});
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
			"@type": "SoftwareApplication",
			name: "Bici Radar",
			description: "App para encontrar estaciones de bicis compartidas en Zaragoza, Madrid, Barcelona, Valencia y Sevilla. Bicis disponibles y huecos libres en tiempo real.",
			applicationCategory: "TravelApplication",
			operatingSystem: "Android, iOS",
			url: `${siteUrl}${appRoutes.biciradar()}`,
			offers: {
				"@type": "Offer",
				price: "0",
				priceCurrency: "EUR"
			},
			publisher: {
				"@type": "Organization",
				name: SITE_NAME,
				url: siteUrl
			}
		}]
	};
	return /* @__PURE__ */ jsxs(PageShell, {
		className: "gap-8 py-8 md:py-12",
		children: [
			/* @__PURE__ */ jsx(PublicPageViewTracker, {
				pageType: "product",
				template: "biciradar",
				pageSlug: "biciradar"
			}),
			/* @__PURE__ */ jsx("script", {
				type: "application/ld+json",
				suppressHydrationWarning: true,
				dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
			}),
			/* @__PURE__ */ jsxs("header", {
				className: "ui-page-hero",
				children: [
					/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
					/* @__PURE__ */ jsx(PublicSectionNav, {
						activeItemId: "home",
						className: "mt-1"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col items-center text-center",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/60 text-4xl shadow-lg shadow-[var(--primary)]/25",
								children: "🚲"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl",
								children: "Bici Radar"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 max-w-xl text-base text-[var(--muted)] md:text-lg",
								children: "La app definitiva para encontrar bicis compartidas en tiempo real. Zaragoza, Madrid, Barcelona, Valencia y Sevilla."
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 max-w-2xl text-sm text-[var(--muted)]",
								children: "En iOS ya puedes descargar la version publica desde la App Store. En Android el acceso sigue siendo para testers: primero debes unirte al Google Group y despues abrir desde tu telefono el enlace de Google Play."
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-6 flex flex-wrap justify-center gap-3",
								children: /* @__PURE__ */ jsx(DownloadCtas, {})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsxs(Card, {
				variant: "stat",
				className: "rounded-2xl p-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mb-6 text-center",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-2xl font-black text-[var(--foreground)] md:text-3xl",
						children: "Ciudades disponibles"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "Bici Radar esta disponible en las principales ciudades de Espania"
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
					children: CITIES.map((city) => /* @__PURE__ */ jsx(CityCard, { city }, city.name))
				})]
			}) }),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsxs("div", {
				className: "mb-6 text-center",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-2xl font-black text-[var(--foreground)] md:text-3xl",
					children: "Caracteristicas"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: "Todo lo que necesitas para moverte en bicicleta por la ciudad"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: FEATURES.map((feature) => /* @__PURE__ */ jsx(FeatureCard$1, { feature }, feature.title))
			})] }),
			/* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsxs(Card, {
				variant: "stat",
				className: "rounded-2xl p-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mb-6 text-center",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-black text-[var(--foreground)] md:text-3xl",
							children: "Descarga la app"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-sm text-[var(--muted)]",
							children: "iOS ya esta publicado · Android requiere acceso como tester"
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex flex-wrap justify-center gap-4",
						children: /* @__PURE__ */ jsx(DownloadCtas, {
							labels: {
								google_group: "1. Unirse al grupo (Android)",
								google_play: "2. Abrir Google Play en tu telefono",
								app_store: "App Store (iOS)"
							},
							classNameByDestination: {
								app_store: "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/50",
								google_group: "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/50",
								google_play: "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/50"
							}
						})
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-4 text-center text-xs text-[var(--muted)]",
						children: "En Android, el enlace de Google Play solo tiene sentido despues de unirte al grupo de testers y abrirlo desde tu telefono."
					})
				]
			}) })
		]
	});
}
//#endregion
//#region src/app/beta.tsx
init_routes();
init_site();
init_page_shell();
var GOOGLE_GROUP_URL = "https://groups.google.com/g/testers-biciradar";
var PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.gcaguilar.biciradar";
var APP_STORE_URL = "https://apps.apple.com/es/app/biciradar/id6760931316";
var Route$16 = createFileRoute("/beta")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Bici Radar ya esta disponible en App Store para iPhone. En Android el acceso sigue para testers: unete al Google Group y abre desde tu telefono el enlace de Google Play."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Bici Radar - iOS disponible y Android para testers"
	}),
	component: BetaPage
});
function FeatureCard({ icon, title, description }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "ui-section-card flex flex-col items-start gap-3",
		children: [/* @__PURE__ */ jsx("span", {
			className: "flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/12 text-lg",
			children: icon
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
			className: "text-sm font-bold text-[var(--foreground)]",
			children: title
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-xs text-[var(--muted)]",
			children: description
		})] })]
	});
}
function StepCard({ step, title, description }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
		children: [/* @__PURE__ */ jsx("span", {
			className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white",
			children: step
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
			className: "text-sm font-bold text-[var(--foreground)]",
			children: title
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-xs text-[var(--muted)]",
			children: description
		})] })]
	});
}
function FaqItem({ question, answer }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
		children: [/* @__PURE__ */ jsx("h3", {
			className: "text-sm font-bold text-[var(--foreground)]",
			children: question
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-2 text-xs leading-relaxed text-[var(--muted)]",
			children: answer
		})]
	});
}
function BetaPage() {
	const siteUrl = getSiteUrl();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Bici Radar",
		href: appRoutes.beta()
	});
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			buildBreadcrumbStructuredData(breadcrumbs),
			{
				"@type": "MobileApplication",
				name: "Bici Radar - Estaciones y disponibilidad",
				description: "App para encontrar estaciones de Bizi Zaragoza cercanas, ver bicis y huecos libres en tiempo real y guardar favoritas. iOS disponible en App Store y Android en acceso para testers.",
				operatingSystem: "Android, iOS",
				applicationCategory: "TravelApplication",
				url: `${siteUrl}${appRoutes.beta()}`,
				installUrl: APP_STORE_URL,
				softwareVersion: "1.0",
				inLanguage: "es",
				offers: {
					"@type": "Offer",
					price: "0",
					priceCurrency: "EUR"
				},
				publisher: {
					"@type": "Organization",
					name: SITE_NAME,
					url: siteUrl
				},
				areaServed: {
					"@type": "City",
					name: "Zaragoza"
				}
			},
			{
				"@type": "FAQPage",
				mainEntity: [
					{
						"@type": "Question",
						name: "Que es la app de Bizi Zaragoza?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "Es una aplicacion movil que te permite encontrar estaciones de Bizi Zaragoza cercanas, ver en tiempo real cuantas bicicletas y huecos libres hay, y guardar tus estaciones favoritas para acceder a ellas rapidamente."
						}
					},
					{
						"@type": "Question",
						name: "Como puedo descargar la app?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "En iOS ya esta publicada en la App Store. En Android primero debes unirte al Google Group de testers y despues abrir desde tu telefono el enlace de Google Play para instalarla."
						}
					},
					{
						"@type": "Question",
						name: "La app es gratuita?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "Si, la app es completamente gratuita."
						}
					}
				]
			}
		]
	};
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-3xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Disponibilidad por plataforma"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Bici Radar en tu movil"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Encuentra estaciones cercanas, consulta bicis y huecos libres en tiempo real y guarda tus favoritas para tenerlas siempre a mano. En iOS ya puedes descargar la version publica desde la App Store. En Android el acceso sigue para testers: unete al Google Group y despues abre desde tu telefono el enlace de Google Play."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "ui-chip",
								children: "Gratuita"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "ui-chip",
								children: "iOS publico"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "ui-chip",
								children: "Android testers"
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3",
					children: [
						/* @__PURE__ */ jsxs("a", {
							href: APP_STORE_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95",
							children: [/* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" })
							}), "Descargar en App Store"]
						}),
						/* @__PURE__ */ jsxs("a", {
							href: GOOGLE_GROUP_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex items-center gap-2 rounded-xl border border-[var(--primary)] bg-transparent px-5 py-2.5 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
							children: [/* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M17.523 2.237a.625.625 0 0 0-.857.228l-1.376 2.4A8.154 8.154 0 0 0 12 4.098c-1.153 0-2.254.264-3.29.767L7.334 2.465a.626.626 0 0 0-1.085.629l1.344 2.348A7.677 7.677 0 0 0 4 11.874h16a7.677 7.677 0 0 0-3.593-6.432l1.344-2.348a.625.625 0 0 0-.228-.857zM9 9.375a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zm6 0a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zM4 13.125v6.25A1.875 1.875 0 0 0 5.875 21.25h.75v2.375a1.375 1.375 0 1 0 2.75 0V21.25h1.25v2.375a1.375 1.375 0 1 0 2.75 0V21.25h.75A1.875 1.875 0 0 0 20 19.375v-6.25H4zM1.375 13.125a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5zm18.5 0a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5z" })
							}), "Unirse al grupo de testers"]
						}),
						/* @__PURE__ */ jsxs("a", {
							href: PLAY_STORE_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex items-center gap-2 rounded-xl border border-[var(--primary)] bg-transparent px-5 py-2.5 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
							children: [/* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z" })
							}), "Abrir Google Play"]
						})
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: "En Android abre el enlace de Google Play desde tu telefono despues de entrar en el grupo de testers."
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-4",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)] md:text-2xl",
				children: "Que puedes hacer con Bici Radar"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "Pensada para el dia a dia del usuario de BiziZaragoza."
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ jsx(FeatureCard, {
					icon: "📍",
					title: "Estaciones cercanas",
					description: "Localiza al instante las estaciones de Bizi mas cercanas a tu posicion actual con distancia y direccion."
				}),
				/* @__PURE__ */ jsx(FeatureCard, {
					icon: "🚲",
					title: "Bicis en tiempo real",
					description: "Consulta cuantas bicicletas hay disponibles en cada estacion, actualizado en tiempo real."
				}),
				/* @__PURE__ */ jsx(FeatureCard, {
					icon: "🅿️",
					title: "Huecos libres",
					description: "Comprueba los anclajes libres antes de llegar para no quedarte sin sitio donde aparcar."
				}),
				/* @__PURE__ */ jsx(FeatureCard, {
					icon: "⭐",
					title: "Estaciones favoritas",
					description: "Guarda las estaciones que mas usas para acceder a su estado con un solo toque."
				})
			]
		})] }),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)] md:text-2xl",
				children: "Como instalarla"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "El proceso cambia segun la plataforma."
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ jsxs("article", {
					className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
							children: "iOS"
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-2 text-base font-bold text-[var(--foreground)]",
							children: "Version publica en App Store"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Si usas iPhone o iPad, ya puedes descargar Bici Radar como cualquier otra app publica. No hace falta TestFlight ni registro previo."
						}),
						/* @__PURE__ */ jsx("a", {
							href: APP_STORE_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "mt-4 inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: "Descargar en App Store"
						})
					]
				}), /* @__PURE__ */ jsxs("article", {
					className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
							children: "Android"
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-2 text-base font-bold text-[var(--foreground)]",
							children: "Acceso para testers"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "En Android todavia no esta abierto para todo el mundo. Primero tienes que entrar en el Google Group de testers y luego abrir desde tu telefono el enlace de Google Play."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 grid gap-3",
							children: [/* @__PURE__ */ jsx(StepCard, {
								step: 1,
								title: "Unete al Google Group",
								description: "Accede al grupo de testers para quedar habilitado como probador de la app en Android."
							}), /* @__PURE__ */ jsx(StepCard, {
								step: 2,
								title: "Abre Google Play desde tu telefono",
								description: "Cuando ya estes dentro del grupo, abre en tu movil el enlace de Google Play para instalar la app."
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ jsx("a", {
								href: GOOGLE_GROUP_URL,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "inline-flex rounded-xl border border-[var(--primary)] bg-transparent px-4 py-2 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
								children: "Unirse al grupo"
							}), /* @__PURE__ */ jsx("a", {
								href: PLAY_STORE_URL,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/40",
								children: "Abrir Google Play"
							})]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-2",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("span", {
							className: "flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/12 text-lg",
							children: /* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5 text-green-600 dark:text-green-400",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M17.523 2.237a.625.625 0 0 0-.857.228l-1.376 2.4A8.154 8.154 0 0 0 12 4.098c-1.153 0-2.254.264-3.29.767L7.334 2.465a.626.626 0 0 0-1.085.629l1.344 2.348A7.677 7.677 0 0 0 4 11.874h16a7.677 7.677 0 0 0-3.593-6.432l1.344-2.348a.625.625 0 0 0-.228-.857zM9 9.375a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zm6 0a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zM4 13.125v6.25A1.875 1.875 0 0 0 5.875 21.25h.75v2.375a1.375 1.375 0 1 0 2.75 0V21.25h1.25v2.375a1.375 1.375 0 1 0 2.75 0V21.25h.75A1.875 1.875 0 0 0 20 19.375v-6.25H4zM1.375 13.125a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5zm18.5 0a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5z" })
							})
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-bold text-[var(--foreground)]",
							children: "Android"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-amber-600 dark:text-amber-400",
							children: "Disponible para testers"
						})] })]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--muted)]",
						children: "Primero unete al Google Group y despues abre desde tu telefono el enlace de Google Play."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ jsx("a", {
							href: GOOGLE_GROUP_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex w-fit rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: "Unirse al grupo"
						}), /* @__PURE__ */ jsx("a", {
							href: PLAY_STORE_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex w-fit rounded-xl border border-[var(--primary)] bg-transparent px-4 py-2 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
							children: "Abrir Google Play"
						})]
					})
				]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("span", {
							className: "flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)]/8 text-lg",
							children: /* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5 text-[var(--muted)]",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" })
							})
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-bold text-[var(--foreground)]",
							children: "iOS"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-green-600 dark:text-green-400",
							children: "Version publica"
						})] })]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--muted)]",
						children: "La version publica ya esta disponible en la App Store para iPhone y iPad."
					}),
					/* @__PURE__ */ jsx("a", {
						href: APP_STORE_URL,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "inline-flex w-fit rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
						children: "Descargar en App Store"
					})
				]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)] md:text-2xl",
				children: "Preguntas frecuentes"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "Todo lo importante sobre la disponibilidad y la instalacion."
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "grid gap-3 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Que es Bici Radar?",
						answer: "Es una aplicacion movil que te permite encontrar estaciones de Bizi Zaragoza cercanas, ver en tiempo real cuantas bicicletas y huecos libres hay, y guardar tus estaciones favoritas para acceder a ellas rapidamente."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "La app es gratuita?",
						answer: "Si, la app es completamente gratuita. No tiene publicidad ni compras dentro de la app."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Como puedo descargar la app en Android?",
						answer: "Primero unete al Google Group de testers. Cuando ya estes dentro, abre desde tu telefono el enlace de Google Play para instalar la app."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Como puedo descargar la app en iOS?",
						answer: "Puedes descargar la app gratuitamente desde la App Store. Es la version publica y no necesitas invitacion ni TestFlight."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Que datos usa la app?",
						answer: "La app utiliza los datos publicos del sistema Bizi Zaragoza para mostrarte la disponibilidad en tiempo real de bicicletas y anclajes en cada estacion."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Como puedo enviar feedback?",
						answer: "Puedes enviarnos comentarios directamente desde Play Store o App Store. Tu opinion es clave para mejorar la app."
					})
				]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)] md:text-2xl",
				children: "Explora tambien"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "Mientras tanto, accede a toda la analitica desde el navegador."
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ jsxs(Link, {
						to: appRoutes.dashboard(),
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Dashboard en tiempo real"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Mapa interactivo, estado del sistema y alertas."
						})]
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: appRoutes.seoPage("estaciones-con-mas-bicis"),
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Estaciones con mas bicis"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Donde hay bicicletas disponibles ahora mismo."
						})]
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: appRoutes.dashboardStations(),
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Directorio de estaciones"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Ficha detallada de cada estacion del sistema."
						})]
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: appRoutes.reports(),
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Informes mensuales"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Archivo historico con datos agregados por mes."
						})]
					})
				]
			})]
		})
	] });
}
//#endregion
//#region src/app/barrios-bizi-zaragoza.tsx
var $$splitComponentImporter$3 = () => import("./barrios-bizi-zaragoza-C3mNRmsc.js");
var Route$15 = createFileRoute("/barrios-bizi-zaragoza")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
//#endregion
//#region src/app/about.tsx
var $$splitComponentImporter$2 = () => import("./about-DZd3drS3.js");
var Route$14 = createFileRoute("/about")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
//#endregion
//#region src/app/index.tsx
var $$splitComponentImporter$1 = () => import("./app-BsGlRXvy.js");
var Route$13 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
//#endregion
//#region src/app/dashboard/status.tsx
init_routes();
var $$splitComponentImporter = () => import("./status-skkFiNuH.js");
var Route$12 = createFileRoute("/dashboard/status")({
	head: () => ({
		meta: [{ charset: "utf-8" }, {
			name: "viewport",
			content: "width=device-width, initial-scale=1"
		}],
		title: "Dashboard Status"
	}),
	loader: () => {
		throw redirect({ to: appRoutes.status() });
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
}), Table, TableHeader, TableBody, TableRow, TableHead, TableCell;
var init_table = __esmMin((() => {
	init_utils();
	Table = React.forwardRef(function Table({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("table", {
			ref,
			className: cn("w-full caption-bottom text-sm text-[var(--foreground)]", className),
			...props
		});
	});
	TableHeader = React.forwardRef(function TableHeader({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("thead", {
			ref,
			className: cn("[&_tr]:border-b", className),
			...props
		});
	});
	TableBody = React.forwardRef(function TableBody({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("tbody", {
			ref,
			className: cn("[&_tr:last-child]:border-0", className),
			...props
		});
	});
	TableRow = React.forwardRef(function TableRow({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("tr", {
			ref,
			className: cn("border-b border-[var(--border)] transition-colors", className),
			...props
		});
	});
	TableHead = React.forwardRef(function TableHead({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("th", {
			ref,
			className: cn("h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-[0.09em] text-[var(--muted)]", className),
			...props
		});
	});
	TableCell = React.forwardRef(function TableCell({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("td", {
			ref,
			className: cn("px-3 py-2 align-middle", className),
			...props
		});
	});
	React.forwardRef(function TableCaption({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("caption", {
			ref,
			className: cn("mt-3 text-xs text-[var(--muted)]", className),
			...props
		});
	});
}));
//#endregion
//#region src/app/dashboard/_components/mobility-insights-model.ts
init_table();
var PERIODS = [
	{
		key: "all",
		label: "Todo el dia",
		from: 0,
		to: 23
	},
	{
		key: "morning",
		label: "Mañana",
		from: 6,
		to: 11
	},
	{
		key: "midday",
		label: "Mediodia",
		from: 12,
		to: 16
	},
	{
		key: "evening",
		label: "Tarde",
		from: 17,
		to: 21
	},
	{
		key: "night",
		label: "Noche",
		from: 22,
		to: 5
	}
];
function getPeriodByHour(hour) {
	if (hour >= 6 && hour <= 11) return "morning";
	if (hour >= 12 && hour <= 16) return "midday";
	if (hour >= 17 && hour <= 21) return "evening";
	return "night";
}
function isPeriodKey(value) {
	if (!value) return false;
	return PERIODS.some((period) => period.key === value);
}
function resolvePeriod(value) {
	return isPeriodKey(value) ? value : "all";
}
function getDayLabel(day) {
	if (typeof day !== "string" || day.length < 10) return day;
	const month = day.slice(5, 7);
	return `${day.slice(8, 10)}/${month}`;
}
function getMatrixCellColor(value, maxValue) {
	if (!Number.isFinite(value) || value <= 0 || maxValue <= 0) return "rgba(176, 129, 135, 0.16)";
	return `rgba(234, 6, 21, ${.2 + Math.min(1, Math.max(0, value / maxValue)) * .72})`;
}
function isObject(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function isMobilityResponse(value) {
	return isObject(value) && typeof value.methodology === "string" && typeof value.generatedAt === "string" && Array.isArray(value.hourlySignals) && Array.isArray(value.dailyDemand);
}
function toSafeNumber(value) {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : 0;
}
function buildStationDistrictLookup(stations, districts) {
	if (!districts) return /* @__PURE__ */ new Map();
	return buildStationDistrictMap(stations, districts);
}
function buildPeriodInsights(mobilityData, stationDistrictMap) {
	if (!mobilityData) return [];
	const periodMaps = /* @__PURE__ */ new Map();
	PERIODS.forEach((period) => {
		periodMaps.set(period.key, /* @__PURE__ */ new Map());
	});
	for (const row of mobilityData.hourlySignals) {
		const district = stationDistrictMap.get(row.stationId);
		if (!district) continue;
		const hour = Number(row.hour);
		const departures = Math.max(0, toSafeNumber(row.departures));
		const arrivals = Math.max(0, toSafeNumber(row.arrivals));
		const periodsToUpdate = ["all"];
		if (Number.isFinite(hour)) periodsToUpdate.push(getPeriodByHour(hour));
		for (const periodKey of periodsToUpdate) {
			const districtMap = periodMaps.get(periodKey);
			if (!districtMap) continue;
			const current = districtMap.get(district) ?? {
				outbound: 0,
				inbound: 0,
				hourly: /* @__PURE__ */ new Map()
			};
			current.outbound += departures;
			current.inbound += arrivals;
			if (Number.isFinite(hour)) {
				const hourSignal = current.hourly.get(hour) ?? {
					departures: 0,
					arrivals: 0
				};
				hourSignal.departures += departures;
				hourSignal.arrivals += arrivals;
				current.hourly.set(hour, hourSignal);
			}
			districtMap.set(district, current);
		}
	}
	return PERIODS.map((period) => {
		const districtMap = periodMaps.get(period.key) ?? /* @__PURE__ */ new Map();
		const districtRows = Array.from(districtMap.entries()).map(([district, values]) => ({
			district,
			outbound: values.outbound,
			inbound: values.inbound,
			volume: values.outbound + values.inbound,
			net: values.inbound - values.outbound
		})).sort((left, right) => right.volume - left.volume);
		const matrix = districtRows.map((origin) => {
			const originHourly = districtMap.get(origin.district)?.hourly;
			return districtRows.map((destination) => {
				if (origin.district === destination.district) return 0;
				const destHourly = districtMap.get(destination.district)?.hourly;
				if (!originHourly || !destHourly) return 0;
				let affinity = 0;
				for (const [hour, originSignal] of originHourly.entries()) {
					const destSignal = destHourly.get(hour);
					if (!destSignal) continue;
					affinity += Math.min(originSignal.departures, destSignal.arrivals);
				}
				return affinity;
			});
		});
		const maxFlow = matrix.reduce((max, values) => Math.max(max, values.reduce((innerMax, value) => Math.max(innerMax, value), 0)), 0);
		return {
			key: period.key,
			label: period.label,
			districts: districtRows,
			matrix,
			maxFlow,
			totalFlow: districtRows.reduce((sum, row) => sum + row.outbound, 0)
		};
	});
}
function buildTopRoutes(activeInsights) {
	if (!activeInsights) return [];
	const candidates = [];
	activeInsights.matrix.forEach((originRow, originIndex) => {
		originRow.forEach((value, destinationIndex) => {
			if (value <= 0 || originIndex === destinationIndex) return;
			const origin = activeInsights.districts[originIndex]?.district;
			const destination = activeInsights.districts[destinationIndex]?.district;
			if (!origin || !destination) return;
			candidates.push({
				origin,
				destination,
				flow: value
			});
		});
	});
	return candidates.sort((left, right) => right.flow - left.flow).slice(0, 12);
}
function resolveSelectedDistrictName(activeInsights, selectedDistrict, currentSelection) {
	if (!activeInsights || activeInsights.districts.length === 0) return "";
	if (currentSelection && activeInsights.districts.some((district) => district.district === currentSelection)) return currentSelection;
	return selectedDistrict ?? activeInsights.districts[0]?.district ?? "";
}
function buildTopEmitterTowardReference(activeInsights, selectedDistrictName) {
	if (!activeInsights || !selectedDistrictName) return null;
	const refIndex = activeInsights.districts.findIndex((district) => district.district === selectedDistrictName);
	if (refIndex < 0) return null;
	let bestIndex = -1;
	let bestFlow = 0;
	for (let index = 0; index < activeInsights.matrix.length; index += 1) {
		if (index === refIndex) continue;
		const value = activeInsights.matrix[index]?.[refIndex] ?? 0;
		if (value > bestFlow) {
			bestFlow = value;
			bestIndex = index;
		}
	}
	if (bestIndex < 0 || bestFlow <= 0) return null;
	return {
		district: activeInsights.districts[bestIndex].district,
		flow: bestFlow
	};
}
function buildTopReceiverFromReference(activeInsights, selectedDistrictName) {
	if (!activeInsights || !selectedDistrictName) return null;
	const refIndex = activeInsights.districts.findIndex((district) => district.district === selectedDistrictName);
	if (refIndex < 0) return null;
	let bestIndex = -1;
	let bestFlow = 0;
	for (let index = 0; index < activeInsights.matrix.length; index += 1) {
		if (index === refIndex) continue;
		const value = activeInsights.matrix[refIndex]?.[index] ?? 0;
		if (value > bestFlow) {
			bestFlow = value;
			bestIndex = index;
		}
	}
	if (bestIndex < 0 || bestFlow <= 0) return null;
	return {
		district: activeInsights.districts[bestIndex].district,
		flow: bestFlow
	};
}
function buildDailyCurveData(mobilityData) {
	if (!mobilityData) return [];
	return mobilityData.dailyDemand.map((row) => ({
		day: row.day,
		label: getDayLabel(row.day),
		demandScore: toSafeNumber(row.demandScore),
		avgOccupancyRatio: toSafeNumber(row.avgOccupancy)
	}));
}
function buildChordNodes(activeInsights) {
	if (!activeInsights || activeInsights.districts.length === 0) return [];
	const radius = 115;
	const center = 140;
	return activeInsights.districts.map((district, index) => {
		const angle = Math.PI * 2 * index / activeInsights.districts.length - Math.PI / 2;
		return {
			district: district.district,
			x: center + radius * Math.cos(angle),
			y: center + radius * Math.sin(angle)
		};
	});
}
function buildChordLinks(chordNodes, topRoutes) {
	if (chordNodes.length === 0) return [];
	const nodeNames = new Set(chordNodes.map((node) => node.district));
	return topRoutes.filter((route) => nodeNames.has(route.origin) && nodeNames.has(route.destination)).slice(0, 12);
}
//#endregion
//#region src/app/dashboard/_components/MobilityInsights.tsx
init_card();
init_select();
init_routes();
init_sentry_reporting();
function MobilityInsightsContent({ stations, selectedStationId, mobilityDays = 14, demandDays = 30 }) {
	const searchParams = useSearchParams();
	const [mobilityData, setMobilityData] = useState(null);
	const [districts, setDistricts] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState(null);
	const [selectedDistrictName, setSelectedDistrictName] = useState("");
	const selectedMonth = searchParams.get("month");
	const activePeriod = resolvePeriod(searchParams.get("period"));
	useEffect(() => {
		const controller = new AbortController();
		let isActive = true;
		const loadData = async () => {
			try {
				setIsLoading(true);
				setErrorMessage(null);
				const searchParams = new URLSearchParams({
					mobilityDays: String(mobilityDays),
					demandDays: String(demandDays)
				});
				if (selectedMonth) searchParams.set("month", selectedMonth);
				const [mobilityResponse, districtsPayload] = await Promise.all([fetch(`${appRoutes.api.mobility()}?${searchParams.toString()}`, { signal: controller.signal }), fetchDistrictCollection(controller.signal)]);
				if (!mobilityResponse.ok || !districtsPayload) throw new Error("No se pudieron cargar los datos de movilidad.");
				const mobilityPayload = await mobilityResponse.json();
				if (!isActive) return;
				if (!isMobilityResponse(mobilityPayload)) throw new Error("Respuesta de movilidad invalida.");
				if (!isDistrictCollection(districtsPayload)) throw new Error("GeoJSON de distritos invalido.");
				setMobilityData(mobilityPayload);
				setDistricts(districtsPayload);
			} catch (error) {
				if (error.name === "AbortError") return;
				captureExceptionWithContext(error, {
					area: "dashboard.mobility-insights",
					operation: "loadData",
					extra: {
						mobilityDays,
						demandDays,
						selectedMonth
					}
				});
				console.error("[Dashboard] Error cargando movilidad", error);
				if (isActive) setErrorMessage("No se pudieron cargar los insights de movilidad.");
			} finally {
				if (isActive) setIsLoading(false);
			}
		};
		loadData();
		return () => {
			isActive = false;
			controller.abort();
		};
	}, [
		demandDays,
		mobilityDays,
		selectedMonth
	]);
	const stationDistrictMap = useMemo(() => {
		return buildStationDistrictLookup(stations, districts);
	}, [districts, stations]);
	const periodInsights = useMemo(() => {
		return buildPeriodInsights(mobilityData, stationDistrictMap);
	}, [mobilityData, stationDistrictMap]);
	const activeInsights = periodInsights.find((insights) => insights.key === activePeriod) ?? periodInsights[0];
	const topRoutes = useMemo(() => buildTopRoutes(activeInsights), [activeInsights]);
	const selectedDistrict = selectedStationId ? stationDistrictMap.get(selectedStationId) ?? null : null;
	useEffect(() => {
		setSelectedDistrictName((current) => {
			return resolveSelectedDistrictName(activeInsights, selectedDistrict, current);
		});
	}, [activeInsights, selectedDistrict]);
	const selectedDistrictFlow = activeInsights?.districts.find((district) => district.district === selectedDistrictName);
	/** Barrio distinto del de referencia con mayor flujo estimado matrix[i][ref] (aportes hacia el referencia). */
	const topEmitterTowardRef = useMemo(() => buildTopEmitterTowardReference(activeInsights, selectedDistrictName), [activeInsights, selectedDistrictName]);
	/** Barrio distinto con mayor flujo estimado matrix[ref][j] (recibe salidas del referencia). */
	const topReceiverFromRef = useMemo(() => buildTopReceiverFromReference(activeInsights, selectedDistrictName), [activeInsights, selectedDistrictName]);
	const dailyCurveData = useMemo(() => buildDailyCurveData(mobilityData), [mobilityData]);
	const chordNodes = useMemo(() => buildChordNodes(activeInsights), [activeInsights]);
	const chordLinks = useMemo(() => buildChordLinks(chordNodes, topRoutes), [chordNodes, topRoutes]);
	const mobilityDataState = resolveMobilityDataState({
		dailyDemandCount: mobilityData?.dailyDemand.length ?? 0,
		hourlySignalCount: mobilityData?.hourlySignals.length ?? 0,
		requestedDemandDays: demandDays
	});
	const resolvedMobilityState = isLoading ? "loading" : errorMessage ? "error" : mobilityData?.dataState ?? mobilityDataState;
	const canRenderInsights = resolvedMobilityState === "ok" || resolvedMobilityState === "partial" || resolvedMobilityState === "stale";
	return /* @__PURE__ */ jsxs("section", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-3xl font-black leading-tight tracking-tight text-[var(--foreground)]",
					children: "Analisis de flujo por barrios"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-[var(--muted)]",
					children: "Distribucion interdistrital de trayectos y metricas de balance neto."
				})] }), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)]/80 p-1",
					children: PERIODS.map((period) => /* @__PURE__ */ jsx(Link, {
						href: appRoutes.dashboardFlow({
							month: selectedMonth,
							period: period.key === "all" ? null : period.key
						}),
						"aria-current": activePeriod === period.key ? "page" : void 0,
						className: `rounded-md px-4 py-1.5 text-xs font-bold transition ${activePeriod === period.key ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`,
						children: period.label
					}, period.key))
				})]
			}),
			shouldShowDataStateNotice(resolvedMobilityState) ? /* @__PURE__ */ jsx(DataStateNotice, {
				state: resolvedMobilityState,
				subject: "los insights de movilidad",
				description: errorMessage ?? (isLoading ? "Estamos calculando flujo, rutas y demanda agregada." : resolvedMobilityState === "partial" ? "Hay datos suficientes para analizar movilidad, pero la ventana disponible es parcial." : resolvedMobilityState === "stale" ? "Las curvas estan disponibles, pero el dataset actual no esta fresco." : "No hay datos de movilidad suficientes para esta ventana."),
				href: appRoutes.status(),
				actionLabel: "Ver estado"
			}) : null,
			canRenderInsights && mobilityData && activeInsights ? /* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-6 xl:grid-cols-12",
				children: [
					/* @__PURE__ */ jsxs(Card, {
						className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-8",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap items-start justify-between gap-3",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
									className: "text-lg font-bold text-[var(--foreground)]",
									children: "Diagrama chord interdistrital"
								}), /* @__PURE__ */ jsx("p", {
									className: "mt-1 max-w-2xl text-xs leading-relaxed text-[var(--muted)]",
									children: "Resume de un vistazo que barrios parecen enviar o recibir mas flujo en el periodo activo. Cada nodo es un barrio y cada curva representa un corredor estimado: cuanto mas marcada, mas volumen relativo."
								})] }), /* @__PURE__ */ jsxs("div", {
									className: "text-right text-xs text-[var(--muted)]",
									children: [/* @__PURE__ */ jsxs("span", { children: ["Barrios representados: ", chordNodes.length] }), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Link, {
										href: appRoutes.dashboardHelp("diagrama-chord"),
										className: "font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
										children: "Como interpretarlo"
									}) })]
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-4 flex items-center justify-center rounded-full border border-dashed border-[var(--border)] bg-[var(--secondary)] py-4",
								children: /* @__PURE__ */ jsxs("svg", {
									viewBox: "0 0 280 280",
									className: "h-[260px] w-[260px]",
									children: [
										/* @__PURE__ */ jsx("circle", {
											cx: "140",
											cy: "140",
											r: "116",
											fill: "none",
											stroke: "rgba(234,6,21,0.22)"
										}),
										chordLinks.map((link, index) => {
											const from = chordNodes.find((node) => node.district === link.origin);
											const to = chordNodes.find((node) => node.district === link.destination);
											if (!from || !to) return null;
											const controlX = 140;
											const controlY = 140;
											const opacity = .25 + Math.min(.65, link.flow / (activeInsights.maxFlow || 1));
											return /* @__PURE__ */ jsx("path", {
												d: `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`,
												fill: "none",
												stroke: `rgba(234, 6, 21, ${opacity})`,
												strokeWidth: 1.2 + link.flow / (activeInsights.maxFlow || 1) * 3
											}, `${link.origin}-${link.destination}-${index}`);
										}),
										chordNodes.map((node) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("circle", {
											cx: node.x,
											cy: node.y,
											r: "5",
											fill: "#ea0615"
										}), /* @__PURE__ */ jsx("text", {
											x: node.x,
											y: node.y - 10,
											textAnchor: "middle",
											fontSize: "9",
											fill: "var(--foreground)",
											children: node.district.slice(0, 10)
										})] }, node.district))
									]
								})
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]",
								children: /* @__PURE__ */ jsxs("span", {
									className: "ui-legend-item",
									children: [/* @__PURE__ */ jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[var(--primary)]" }), " Mayor flujo estimado"]
								})
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-6 xl:col-span-4",
						children: [/* @__PURE__ */ jsxs(Card, {
							className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Rutas de mayor flujo"
							}), /* @__PURE__ */ jsx("div", {
								className: "mt-4 space-y-4",
								children: topRoutes.slice(0, 4).length === 0 ? /* @__PURE__ */ jsx("p", {
									className: "text-sm text-[var(--muted)]",
									children: "Sin rutas destacadas para este periodo."
								}) : topRoutes.slice(0, 4).map((route) => {
									const width = Math.max(12, Math.round(route.flow / (activeInsights.maxFlow || 1) * 100));
									return /* @__PURE__ */ jsxs("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-between gap-2 text-sm",
											children: [/* @__PURE__ */ jsxs("span", {
												className: "font-semibold text-[var(--foreground)]",
												children: [
													route.origin,
													" → ",
													route.destination
												]
											}), /* @__PURE__ */ jsx("span", {
												className: "font-bold text-[var(--muted)]",
												children: route.flow.toFixed(0)
											})]
										}), /* @__PURE__ */ jsx(Progress, {
											className: "bg-black/20",
											value: width,
											indicatorClassName: "bg-[var(--primary)]"
										})]
									}, `${route.origin}-${route.destination}`);
								})
							})]
						}), /* @__PURE__ */ jsxs(Card, {
							className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5",
							children: [
								/* @__PURE__ */ jsx("h3", {
									className: "text-base font-bold text-[var(--foreground)]",
									children: "Resumen de balance neto"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3",
									children: [
										/* @__PURE__ */ jsx("label", {
											className: "block text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]",
											children: "Barrio de referencia"
										}),
										/* @__PURE__ */ jsxs(Select$1, {
											value: selectedDistrictName,
											onValueChange: (value) => setSelectedDistrictName(value ?? ""),
											children: [/* @__PURE__ */ jsxs(SelectTrigger, {
												"aria-label": "Seleccionar barrio de referencia",
												className: "mt-2 w-full bg-[var(--card)]",
												children: [/* @__PURE__ */ jsx(SelectValue, { placeholder: "Selecciona un barrio" }), /* @__PURE__ */ jsx(SelectIcon, {})]
											}), /* @__PURE__ */ jsx(SelectContent, { children: activeInsights.districts.map((district) => /* @__PURE__ */ jsx(SelectItem, {
												value: district.district,
												children: district.district
											}, district.district)) })]
										}),
										/* @__PURE__ */ jsx("p", {
											className: "mt-2 text-xs text-[var(--muted)]",
											children: "Cambia el barrio para revisar su saldo neto y los barrios con mas flujo estimado hacia el y desde el."
										})
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-4 grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-center",
										children: [
											/* @__PURE__ */ jsx("p", {
												className: "text-[10px] font-bold uppercase tracking-[0.1em] text-rose-500",
												children: "Mayor aporte hacia referencia"
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-rose-500/80",
												children: ["Emisor hacia ", selectedDistrictName || "…"]
											}),
											/* @__PURE__ */ jsx("p", {
												className: "mt-1 text-sm font-bold text-[var(--foreground)]",
												children: topEmitterTowardRef?.district ?? "N/D"
											}),
											/* @__PURE__ */ jsx("p", {
												className: "text-xl font-black text-rose-500",
												children: topEmitterTowardRef ? topEmitterTowardRef.flow.toFixed(0) : "—"
											})
										]
									}), /* @__PURE__ */ jsxs("div", {
										className: "rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center",
										children: [
											/* @__PURE__ */ jsx("p", {
												className: "text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-500",
												children: "Mayor destino desde referencia"
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-500/80",
												children: ["Receptor desde ", selectedDistrictName || "…"]
											}),
											/* @__PURE__ */ jsx("p", {
												className: "mt-1 text-sm font-bold text-[var(--foreground)]",
												children: topReceiverFromRef?.district ?? "N/D"
											}),
											/* @__PURE__ */ jsx("p", {
												className: "text-xl font-black text-emerald-500",
												children: topReceiverFromRef ? topReceiverFromRef.flow.toFixed(0) : "—"
											})
										]
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs text-[var(--muted)]",
									children: selectedDistrictFlow ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("span", {
										className: "font-semibold text-[var(--foreground)]",
										children: selectedDistrictName
									}), `: ${selectedDistrictFlow.net >= 0 ? "+" : ""}${selectedDistrictFlow.net.toFixed(1)} de balance neto, ${selectedDistrictFlow.inbound.toFixed(0)} entradas estimadas y ${selectedDistrictFlow.outbound.toFixed(0)} salidas estimadas.`] }) : "No hay un barrio de referencia disponible para este periodo."
								})
							]
						})]
					}),
					/* @__PURE__ */ jsxs(Card, {
						className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-6",
						children: [
							/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Balance neto por barrio"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-4 space-y-5",
								children: activeInsights.districts.map((district) => {
									const net = district.net;
									const maxMagnitude = Math.max(1, district.volume);
									const width = Math.min(50, Math.abs(net) / maxMagnitude * 100);
									const isImporter = net >= 0;
									return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
										className: "mb-1 flex items-center justify-between text-xs",
										children: [/* @__PURE__ */ jsx("span", {
											className: "font-bold text-[var(--foreground)]",
											children: district.district
										}), /* @__PURE__ */ jsxs("span", {
											className: `font-black ${isImporter ? "text-emerald-500" : "text-rose-500"}`,
											children: [net >= 0 ? "+" : "", net.toFixed(1)]
										})]
									}), /* @__PURE__ */ jsx("div", {
										className: "relative h-3 w-full rounded-full bg-black/20",
										children: isImporter ? /* @__PURE__ */ jsx("div", {
											className: "absolute left-1/2 h-full rounded-r-full bg-emerald-500",
											style: { width: `${width}%` }
										}) : /* @__PURE__ */ jsx("div", {
											className: "absolute right-1/2 h-full rounded-l-full bg-rose-500",
											style: { width: `${width}%` }
										})
									})] }, district.district);
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-6 flex justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]",
								children: [
									/* @__PURE__ */ jsx("span", { children: "Emisor neto" }),
									/* @__PURE__ */ jsx("span", { children: "Neutro" }),
									/* @__PURE__ */ jsx("span", { children: "Receptor neto" })
								]
							})
						]
					}),
					/* @__PURE__ */ jsxs(Card, {
						className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-6",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Matriz origen-destino"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-[10px] text-[var(--muted)]",
								children: "Datos en vivo"
							})]
						}), activeInsights.districts.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "mt-4 text-sm text-[var(--muted)]",
							children: "Sin volumen suficiente."
						}) : /* @__PURE__ */ jsx(ScrollArea, {
							className: "mt-3 max-h-[420px]",
							children: /* @__PURE__ */ jsxs(Table, {
								className: "min-w-full border-collapse text-[11px]",
								children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [/* @__PURE__ */ jsx(TableHead, {
									className: "sticky left-0 z-10 h-auto bg-[var(--card)] px-2 py-2 text-left font-semibold normal-case tracking-normal text-[var(--muted)]",
									children: "O \\ D"
								}), activeInsights.districts.map((district) => /* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-2 py-2 text-left font-semibold normal-case tracking-normal text-[var(--muted)]",
									children: district.district
								}, `dest-${district.district}`))] }) }), /* @__PURE__ */ jsx(TableBody, { children: activeInsights.districts.map((origin, originIndex) => /* @__PURE__ */ jsxs(TableRow, { children: [/* @__PURE__ */ jsx(TableCell, {
									className: "sticky left-0 bg-[var(--card)] px-2 py-2 font-semibold text-[var(--foreground)]",
									children: origin.district
								}), activeInsights.matrix[originIndex]?.map((value, destinationIndex) => /* @__PURE__ */ jsx(TableCell, {
									className: "border border-[var(--border)] px-2 py-2 text-right",
									style: {
										backgroundColor: getMatrixCellColor(value, activeInsights.maxFlow),
										color: value / (activeInsights.maxFlow || 1) > .5 ? "#ffffff" : "var(--foreground)"
									},
									children: value.toFixed(1)
								}, `${originIndex}-${destinationIndex}`))] }, `origin-${origin.district}`)) })]
							})
						})]
					}),
					/* @__PURE__ */ jsxs(Card, {
						className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-12",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Curva diaria de demanda"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-xs text-[var(--muted)]",
								children: "Muestra como cambia la actividad diaria y la ocupacion media en el periodo activo."
							})] }), /* @__PURE__ */ jsxs("div", {
								className: "text-right text-xs text-[var(--muted)]",
								children: [/* @__PURE__ */ jsxs("span", { children: [mobilityData.demandDays, " dias"] }), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Link, {
									href: appRoutes.dashboardHelp("demanda-no-viajes-reales"),
									className: "font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
									children: "Entender curva"
								}) })]
							})]
						}), dailyCurveData.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "mt-4 text-sm text-[var(--muted)]",
							children: "Sin datos de demanda diaria."
						}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChartWrapper, {
							height: "h-[260px]",
							children: /* @__PURE__ */ jsx("div", {
								className: "mt-3 h-[260px]",
								children: /* @__PURE__ */ jsx(MeasuredResponsiveContainer, { children: /* @__PURE__ */ jsxs(AreaChart, {
									data: dailyCurveData,
									margin: {
										top: 8,
										right: 10,
										left: 0,
										bottom: 0
									},
									children: [
										/* @__PURE__ */ jsx(CartesianGrid, {
											strokeDasharray: "3 3",
											stroke: "rgba(234, 6, 21, 0.22)"
										}),
										/* @__PURE__ */ jsx(XAxis, {
											dataKey: "label",
											tick: { fontSize: 11 },
											minTickGap: 14
										}),
										/* @__PURE__ */ jsx(YAxis, {
											yAxisId: "score",
											tick: { fontSize: 11 },
											width: 42
										}),
										/* @__PURE__ */ jsx(YAxis, {
											yAxisId: "occ",
											orientation: "right",
											tick: { fontSize: 11 },
											width: 38,
											tickFormatter: (value) => formatPercent$1(value)
										}),
										/* @__PURE__ */ jsx(Tooltip, { formatter: (value, name) => {
											const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value);
											if (name === "Demanda") return [numericValue.toFixed(1), "Demanda"];
											return [formatPercent$1(numericValue), "Ocupacion media"];
										} }),
										/* @__PURE__ */ jsx(Area, {
											yAxisId: "score",
											type: "monotone",
											dataKey: "demandScore",
											name: "Demanda",
											stroke: "#ea0615",
											fill: "rgba(234, 6, 21, 0.26)",
											strokeWidth: 2
										}),
										/* @__PURE__ */ jsx(Area, {
											yAxisId: "occ",
											type: "monotone",
											dataKey: "avgOccupancyRatio",
											name: "Ocupacion",
											stroke: "#14b8a6",
											fill: "rgba(20, 184, 166, 0.2)",
											strokeWidth: 2
										})
									]
								}) })
							})
						}), /* @__PURE__ */ jsx("p", {
							className: "text-[11px] text-[var(--muted)]",
							children: mobilityData.methodology
						})] })]
					})
				]
			}) : null
		]
	});
}
function MobilityInsights(props) {
	return /* @__PURE__ */ jsx(Suspense, {
		fallback: /* @__PURE__ */ jsx("div", { className: "ui-section-card h-96 animate-pulse" }),
		children: /* @__PURE__ */ jsx(MobilityInsightsContent, { ...props })
	});
}
//#endregion
//#region src/app/dashboard/redistribucion/_components/ClassificationLegend.tsx
function ClassificationLegend() {
	return /* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsxs(Card, {
		className: "p-4",
		children: [/* @__PURE__ */ jsx("h2", {
			className: "mb-3 text-sm font-semibold text-[var(--foreground)]",
			children: "Clasificación de estaciones"
		}), /* @__PURE__ */ jsx("div", {
			className: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
			children: CLASSIFICATIONS.map((c) => /* @__PURE__ */ jsxs(Card, {
				variant: "stat",
				className: `gap-2 rounded-lg border p-3 text-sm ${c.bg}`,
				children: [/* @__PURE__ */ jsx(Badge, {
					variant: "muted",
					className: `w-fit border-transparent px-0 py-0 text-xs font-semibold normal-case tracking-normal ${c.color}`,
					children: c.label
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs text-[var(--muted)]",
					children: c.description
				})]
			}, c.code))
		})]
	}) });
}
var CLASSIFICATIONS;
var init_ClassificationLegend = __esmMin((() => {
	init_badge();
	init_card();
	CLASSIFICATIONS = [
		{
			code: "overstock",
			label: "A — Sobrestock",
			color: "text-orange-700 dark:text-orange-400",
			bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
			description: "Ocupacion alta sostenida, baja rotación e inmóvil. Bicis \"paradas\". Candidata a donar."
		},
		{
			code: "deficit",
			label: "B — Déficit",
			color: "text-red-700 dark:text-red-400",
			bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
			description: "Ocupacion baja crónica, alta presión de salida. Necesita más stock base."
		},
		{
			code: "peak_saturation",
			label: "C — Saturación puntual",
			color: "text-amber-700 dark:text-amber-400",
			bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
			description: "Solo se llena en franjas concretas. Fuera de esas horas, vuelve a la normalidad."
		},
		{
			code: "peak_emptying",
			label: "D — Vaciado puntual",
			color: "text-yellow-700 dark:text-yellow-400",
			bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
			description: "Solo se vacía en hora punta. Se recupera después sin intervención."
		},
		{
			code: "balanced",
			label: "E — Equilibrada",
			color: "text-green-700 dark:text-green-400",
			bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
			description: "Fluctúa dentro de banda objetivo. No requiere intervención activa."
		},
		{
			code: "data_review",
			label: "F — Revisar dato",
			color: "text-slate-600 dark:text-slate-400",
			bg: "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700",
			description: "Dato anómalo o sensor sospechoso. Excluida de decisiones logísticas hasta validar."
		}
	];
}));
//#endregion
//#region src/app/dashboard/redistribucion/_components/RebalancingSummaryCards.tsx
function RebalancingSummaryCards({ summary }) {
	return /* @__PURE__ */ jsx("div", {
		className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6",
		children: [
			{
				label: "Donantes",
				value: (summary.byAction.donor ?? 0) + (summary.byAction.peak_remove ?? 0),
				color: "text-orange-600 dark:text-orange-400",
				description: "tienen exceso de bicis"
			},
			{
				label: "Receptoras",
				value: (summary.byAction.receptor ?? 0) + (summary.byAction.peak_fill ?? 0),
				color: "text-red-600 dark:text-red-400",
				description: "necesitan bicis"
			},
			{
				label: "Urgencia alta",
				value: summary.criticalUrgencyCount + summary.highUrgencyCount,
				color: "text-rose-600 dark:text-rose-400",
				description: "requieren atención prioritaria"
			},
			{
				label: "Transferencias",
				value: summary.stationsWithTransfer,
				color: "text-sky-600 dark:text-sky-400",
				description: "movimientos sugeridos"
			},
			{
				label: "Equilibradas",
				value: summary.byAction.stable ?? 0,
				color: "text-green-600 dark:text-green-400",
				description: "sin intervención necesaria"
			},
			{
				label: "A revisar",
				value: summary.byAction.review ?? 0,
				color: "text-slate-500 dark:text-slate-400",
				description: "dato anómalo, excluidas"
			}
		].map((card) => /* @__PURE__ */ jsxs(Card, {
			variant: "stat",
			className: "gap-1 px-4 py-3",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: `text-3xl font-black tabular-nums ${card.color}`,
					children: card.value
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs font-semibold text-[var(--foreground)]",
					children: card.label
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: card.description
				})
			]
		}, card.label))
	});
}
var init_RebalancingSummaryCards = __esmMin((() => {
	init_card();
}));
//#endregion
//#region src/app/dashboard/redistribucion/_components/RebalancingTable.tsx
function copyToClipboard(diagnostics) {
	const text = diagnostics.map((d) => [
		d.stationName,
		d.stationId,
		d.districtName ?? "",
		d.inferredType,
		CLASSIFICATION_LABEL[d.classification],
		`${Math.round(d.currentOccupancy * 100)}%`,
		ACTION_LABEL[d.actionGroup],
		URGENCY_LABEL[d.urgency]
	].join("	")).join("\n");
	navigator.clipboard.writeText(text);
}
function exportToCSV(diagnostics, filename) {
	const csvContent = [[
		"Estación",
		"ID",
		"Barrio",
		"Tipo",
		"Clasificación",
		"Ocupación",
		"Banda",
		"Acción",
		"Urgencia",
		"Score"
	], ...diagnostics.map((d) => [
		d.stationName,
		d.stationId,
		d.districtName ?? "",
		d.inferredType,
		CLASSIFICATION_LABEL[d.classification],
		`${Math.round(d.currentOccupancy * 100)}%`,
		`${Math.round(d.targetBand.min * 100)}%-${Math.round(d.targetBand.max * 100)}%`,
		ACTION_LABEL[d.actionGroup],
		URGENCY_LABEL[d.urgency],
		Math.round(d.priorityScore * 100).toString()
	])].map((row) => row.map((cell) => `"${cell.replace(/"/g, "\"\"")}"`).join(",")).join("\n");
	const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${filename}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}
function OccupancyBar({ occupancy, bandMin, bandMax }) {
	const pct = Math.round(occupancy * 100);
	const barColor = occupancy >= bandMin && occupancy <= bandMax ? "bg-green-500" : occupancy < bandMin ? "bg-red-500" : "bg-orange-500";
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "relative h-2 w-20 rounded-full bg-[var(--border)]",
			children: [/* @__PURE__ */ jsx("div", {
				className: "absolute top-0 h-full rounded-full bg-green-200 dark:bg-green-900/50",
				style: {
					left: `${bandMin * 100}%`,
					width: `${(bandMax - bandMin) * 100}%`
				}
			}), /* @__PURE__ */ jsx("div", {
				className: `absolute top-0 h-full w-1 rounded-full ${barColor}`,
				style: { left: `${Math.min(99, pct)}%` }
			})]
		}), /* @__PURE__ */ jsxs("span", {
			className: "tabular-nums text-xs",
			children: [pct, "%"]
		})]
	});
}
function FilterSelect({ value, onChange, options, ariaLabel }) {
	return /* @__PURE__ */ jsxs(Select$1, {
		value: value || SELECT_ALL_VALUE,
		onValueChange: (nextValue) => onChange(nextValue && nextValue !== SELECT_ALL_VALUE ? nextValue : ""),
		children: [/* @__PURE__ */ jsxs(SelectTrigger, {
			"aria-label": ariaLabel,
			className: "h-8 min-h-8 rounded-md px-2 py-0 text-xs",
			children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
		}), /* @__PURE__ */ jsx(SelectContent, { children: options.map((opt) => /* @__PURE__ */ jsx(SelectItem, {
			value: opt.value || SELECT_ALL_VALUE,
			children: opt.label
		}, opt.value || SELECT_ALL_VALUE)) })]
	});
}
function RebalancingTable({ diagnostics, initialParams }) {
	const [sorting, setSorting] = useState(() => {
		if (initialParams?.sort) {
			const [id, desc] = initialParams.sort.split(":");
			return [{
				id,
				desc: desc === "desc"
			}];
		}
		return [{
			id: "priorityScore",
			desc: true
		}];
	});
	const [columnFilters, setColumnFilters] = useState(() => {
		if (initialParams?.filter) {
			const [id, value] = initialParams.filter.split(":");
			return [{
				id,
				value
			}];
		}
		return [];
	});
	const [globalFilter, setGlobalFilter] = useState(initialParams?.search ?? "");
	const [expandedId, setExpandedId] = useState(null);
	const [pagination, setPagination] = useState({
		pageIndex: initialParams?.page ?? 0,
		pageSize: initialParams?.pageSize ?? PAGE_SIZE$1
	});
	const [columnVisibility, setColumnVisibility] = useState({
		select: true,
		stationName: true,
		districtName: true,
		inferredType: true,
		classification: true,
		currentOccupancy: true,
		actionGroup: true,
		urgency: true,
		priorityScore: true,
		expand: true
	});
	const [rowSelection, setRowSelection] = useState({});
	const [activeQuickFilter, setActiveQuickFilter] = useState("all");
	const [openToolbarAccordions, setOpenToolbarAccordions] = useState([]);
	const handleToggle = useCallback((stationId) => {
		setExpandedId((id) => id === stationId ? null : stationId);
	}, []);
	const handleKeyDown = useCallback((e, stationId) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleToggle(stationId);
		}
	}, [handleToggle]);
	const handleHeaderClick = useCallback((e, column) => {
		if (!column.getCanSort()) return;
		if (e.shiftKey && sorting.length > 0) if (sorting.find((s) => s.id === column.id)) setSorting((prev) => prev.map((s) => s.id === column.id ? {
			...s,
			desc: !s.desc
		} : s));
		else setSorting((prev) => [...prev, {
			id: column.id,
			desc: true
		}]);
		else column.toggleSorting();
	}, [sorting]);
	const updateURL = useCallback(() => {
		const params = new URLSearchParams();
		if (sorting.length > 0) params.set("sort", `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`);
		if (globalFilter) params.set("search", globalFilter);
		if (columnFilters.length > 0) params.set("filter", `${columnFilters[0].id}:${columnFilters[0].value}`);
		if (pagination.pageIndex > 0) params.set("page", String(pagination.pageIndex));
		if (pagination.pageSize !== PAGE_SIZE$1) params.set("pageSize", String(pagination.pageSize));
		const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
		window.history.replaceState(null, "", url);
	}, [
		sorting,
		globalFilter,
		columnFilters,
		pagination
	]);
	useEffect(() => {
		updateURL();
	}, [updateURL]);
	const table = useReactTable({
		data: diagnostics,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
			pagination,
			columnVisibility,
			rowSelection
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getRowId: (row) => row.stationId,
		enableMultiSort: true
	});
	const totalRows = table.getFilteredRowModel().rows.length;
	const pageCount = table.getPageCount();
	const pageIndex = pagination.pageIndex;
	const pageSize = pagination.pageSize;
	const selectedCount = Object.keys(rowSelection).length;
	const applyQuickFilter = useCallback((filterId) => {
		setActiveQuickFilter(filterId);
		const qf = QUICK_FILTERS.find((f) => f.id === filterId);
		if (!qf || !qf.filter) setColumnFilters([]);
		else setColumnFilters([qf.filter]);
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 sm:p-3",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "flex items-center gap-2",
						children: /* @__PURE__ */ jsx(Input, {
							placeholder: "Buscar estación o barrio...",
							value: globalFilter,
							onChange: (e) => setGlobalFilter(e.target.value),
							"aria-label": "Buscar estación o barrio",
							className: "h-8 min-h-8 w-40 rounded-md bg-[var(--background)] px-3 text-xs"
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex items-center gap-1",
						children: QUICK_FILTERS.map((qf) => /* @__PURE__ */ jsx(Button, {
							onClick: () => applyQuickFilter(qf.id),
							variant: activeQuickFilter === qf.id ? "default" : "chip",
							size: "sm",
							className: `min-h-7 rounded px-2 py-1 text-xs ${activeQuickFilter === qf.id ? "border-[var(--primary)]" : "text-[var(--foreground)]"}`,
							children: qf.label
						}, qf.id))
					}),
					/* @__PURE__ */ jsx(FilterSelect, {
						value: columnFilters.find((f) => f.id === "classification")?.value ?? "",
						onChange: (value) => setColumnFilters((prev) => [...prev.filter((f) => f.id !== "classification"), ...value ? [{
							id: "classification",
							value
						}] : []]),
						options: CLASSIFICATION_OPTIONS,
						ariaLabel: "Filtrar por clasificación"
					}),
					/* @__PURE__ */ jsx(FilterSelect, {
						value: columnFilters.find((f) => f.id === "actionGroup")?.value ?? "",
						onChange: (value) => setColumnFilters((prev) => [...prev.filter((f) => f.id !== "actionGroup"), ...value ? [{
							id: "actionGroup",
							value
						}] : []]),
						options: ACTION_OPTIONS,
						ariaLabel: "Filtrar por acción"
					}),
					/* @__PURE__ */ jsx(FilterSelect, {
						value: columnFilters.find((f) => f.id === "urgency")?.value ?? "",
						onChange: (value) => setColumnFilters((prev) => [...prev.filter((f) => f.id !== "urgency"), ...value ? [{
							id: "urgency",
							value
						}] : []]),
						options: URGENCY_OPTIONS,
						ariaLabel: "Filtrar por urgencia"
					}),
					(globalFilter || columnFilters.length > 0) && /* @__PURE__ */ jsx(Button, {
						onClick: () => {
							setGlobalFilter("");
							setColumnFilters([]);
							setActiveQuickFilter("all");
						},
						variant: "ghost",
						size: "sm",
						className: "min-h-7 px-1 text-xs text-[var(--primary)] hover:underline",
						children: "Limpiar filtros"
					}),
					/* @__PURE__ */ jsx(Accordion, {
						value: openToolbarAccordions,
						onValueChange: setOpenToolbarAccordions,
						className: "w-full sm:w-auto",
						children: /* @__PURE__ */ jsxs(AccordionItem, {
							value: "columns",
							className: "rounded-md border border-[var(--border)] bg-[var(--card)]",
							children: [/* @__PURE__ */ jsx(AccordionTrigger, {
								className: "px-2 py-1.5 text-xs text-[var(--primary)] [&>span]:text-xs [&>span]:font-semibold",
								children: "Columnas"
							}), /* @__PURE__ */ jsx(AccordionContent, {
								className: "space-y-1 border-none p-2 text-xs",
								children: table.getAllLeafColumns().map((column) => /* @__PURE__ */ jsxs("label", {
									className: "flex items-center gap-2 whitespace-nowrap text-xs text-[var(--foreground)]",
									children: [/* @__PURE__ */ jsx(Checkbox, {
										checked: column.getIsVisible(),
										onChange: () => column.toggleVisibility(),
										"aria-label": `Mostrar columna ${COLUMN_VISIBILITY_LABELS[column.id] ?? column.id}`
									}), COLUMN_VISIBILITY_LABELS[column.id] ?? column.id]
								}, column.id))
							})]
						})
					}),
					totalRows > 0 && /* @__PURE__ */ jsx(Button, {
						onClick: () => {
							copyToClipboard(selectedCount > 0 ? table.getSelectedRowModel().rows.map((r) => r.original) : table.getFilteredRowModel().rows.map((r) => r.original));
						},
						variant: "ghost",
						size: "sm",
						className: "min-h-7 px-1 text-xs text-[var(--primary)] hover:underline",
						children: selectedCount > 0 ? `Copiar ${selectedCount}` : "Copiar"
					}),
					totalRows > 0 && /* @__PURE__ */ jsx(Button, {
						onClick: () => exportToCSV(table.getFilteredRowModel().rows.map((r) => r.original), "estaciones-redistribucion"),
						variant: "ghost",
						size: "sm",
						className: "min-h-7 px-1 text-xs text-[var(--primary)] hover:underline",
						children: "Exportar CSV"
					}),
					selectedCount > 0 && /* @__PURE__ */ jsxs("span", {
						className: "text-xs text-[var(--muted)]",
						children: [
							selectedCount,
							" seleccionado",
							selectedCount !== 1 ? "s" : ""
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs(ScrollArea, {
				className: "overflow-x-auto rounded-xl border border-[var(--border)] max-w-[100vw]",
				children: [/* @__PURE__ */ jsxs(Table, {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ jsx(TableHeader, {
						className: "sticky top-0 border-b border-[var(--border)] bg-[var(--card)]",
						children: table.getHeaderGroups().map((headerGroup) => /* @__PURE__ */ jsx(TableRow, { children: headerGroup.headers.map((header) => /* @__PURE__ */ jsxs(TableHead, {
							className: `h-auto select-none whitespace-nowrap px-3 py-2 text-left text-xs font-semibold normal-case tracking-normal text-[var(--muted)] ${header.column.getCanSort() ? "cursor-pointer hover:text-[var(--foreground)]" : ""}`,
							onClick: (e) => handleHeaderClick(e, header.column),
							style: { width: header.getSize() },
							children: [
								header.isPlaceholder ? null : typeof header.column.columnDef.header === "function" ? header.column.columnDef.header(header.getContext()) : header.column.columnDef.header,
								header.column.getIsSorted() === "asc" && " ↑",
								header.column.getIsSorted() === "desc" && " ↓"
							]
						}, header.id)) }, headerGroup.id))
					}), /* @__PURE__ */ jsx(TableBody, {
						className: "divide-y divide-[var(--border)]",
						children: table.getRowModel().rows.map((row) => {
							const isExpanded = expandedId === row.original.stationId;
							const diagnostic = row.original;
							return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(TableRow, {
								className: "cursor-pointer bg-[var(--card)] transition-colors hover:bg-[var(--surface-hover,var(--card))]",
								onClick: () => handleToggle(diagnostic.stationId),
								onKeyDown: (e) => handleKeyDown(e, diagnostic.stationId),
								tabIndex: 0,
								role: "button",
								"aria-expanded": isExpanded,
								children: row.getVisibleCells().map((cell) => {
									const colId = cell.column.id;
									if (colId === "expand") return /* @__PURE__ */ jsx(TableCell, {
										className: "px-3 py-2.5 text-xs text-[var(--muted)]",
										children: isExpanded ? "▲" : "▼"
									}, colId);
									return /* @__PURE__ */ jsx(TableCell, {
										className: "px-3 py-2.5",
										children: typeof cell.column.columnDef.cell === "function" ? cell.column.columnDef.cell(cell.getContext()) : null
									}, colId);
								})
							}), isExpanded && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
								colSpan: 11,
								className: "border-b border-[var(--border)] bg-[var(--surface-secondary,var(--card))] px-4 pb-4 pt-2",
								children: /* @__PURE__ */ jsxs("div", {
									className: "grid gap-4 text-xs sm:grid-cols-2",
									children: [
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "mb-1 font-semibold text-[var(--foreground)]",
											children: "Razones de clasificación"
										}), /* @__PURE__ */ jsx("ul", {
											className: "space-y-1 text-[var(--muted)]",
											children: diagnostic.classificationReasons.map((r, i) => /* @__PURE__ */ jsxs("li", {
												className: "flex gap-1",
												children: [/* @__PURE__ */ jsx("span", {
													className: "shrink-0 text-[var(--primary)]",
													children: "›"
												}), r]
											}, i))
										})] }),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "mb-1 font-semibold text-[var(--foreground)]",
											children: "Razones de acción"
										}), /* @__PURE__ */ jsx("ul", {
											className: "space-y-1 text-[var(--muted)]",
											children: diagnostic.actionReasons.map((r, i) => /* @__PURE__ */ jsxs("li", {
												className: "flex gap-1",
												children: [/* @__PURE__ */ jsx("span", {
													className: "shrink-0 text-[var(--primary)]",
													children: "›"
												}), r]
											}, i))
										})] }),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "mb-1 font-semibold text-[var(--foreground)]",
											children: "Predicción"
										}), /* @__PURE__ */ jsxs("p", {
											className: "text-[var(--muted)]",
											children: [
												"Riesgo vacío 1h: ",
												/* @__PURE__ */ jsxs("strong", { children: [Math.round(diagnostic.risk.riskEmptyAt1h * 100), "%"] }),
												" ",
												"· Riesgo lleno 1h: ",
												/* @__PURE__ */ jsxs("strong", { children: [Math.round(diagnostic.risk.riskFullAt1h * 100), "%"] }),
												" ",
												"· Autocorrección:",
												" ",
												/* @__PURE__ */ jsxs("strong", { children: [Math.round(diagnostic.risk.selfCorrectionProbability * 100), "%"] }),
												diagnostic.risk.estimatedRecoveryMinutes !== null && ` · Recuperación: ~${diagnostic.risk.estimatedRecoveryMinutes} min`
											]
										})] }),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "mb-1 font-semibold text-[var(--foreground)]",
											children: "Red cercana"
										}), /* @__PURE__ */ jsxs("p", {
											className: "text-[var(--muted)]",
											children: [
												diagnostic.network.nearbyStations.length,
												" estaciones en radio 500m · Ajuste urgencia:",
												" ",
												Math.round(diagnostic.network.urgencyAdjustment * 100),
												"%"
											]
										})] })
									]
								})
							}) })] }, row.id);
						})
					})]
				}), totalRows === 0 && /* @__PURE__ */ jsx("p", {
					className: "py-8 text-center text-sm text-[var(--muted)]",
					children: "No hay estaciones que mostrar con los filtros actuales."
				})]
			}),
			pageCount > 1 && /* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-xs text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("span", { children: [
							pageIndex * pageSize + 1,
							"-",
							Math.min((pageIndex + 1) * pageSize, totalRows),
							" de ",
							totalRows
						] }),
						/* @__PURE__ */ jsxs(Select$1, {
							value: String(pageSize),
							onValueChange: (nextValue) => {
								if (!nextValue) return;
								setPagination({
									...pagination,
									pageSize: Number(nextValue),
									pageIndex: 0
								});
							},
							children: [/* @__PURE__ */ jsxs(SelectTrigger, {
								"aria-label": "Filas por página",
								className: "h-7 min-h-7 w-20 rounded-md bg-[var(--background)] px-2 py-0 text-xs",
								children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
							}), /* @__PURE__ */ jsx(SelectContent, { children: [
								10,
								20,
								50,
								100
							].map((size) => /* @__PURE__ */ jsx(SelectItem, {
								value: String(size),
								children: size
							}, size)) })]
						}),
						/* @__PURE__ */ jsx("span", { children: "por página" })
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ jsx(Button, {
							onClick: () => setPagination({
								...pagination,
								pageIndex: 0
							}),
							disabled: pageIndex === 0,
							variant: "ghost",
							size: "sm",
							className: "h-7 min-h-7 rounded px-2 py-1 text-xs",
							children: "««"
						}),
						/* @__PURE__ */ jsx(Button, {
							onClick: () => setPagination({
								...pagination,
								pageIndex: Math.max(0, pageIndex - 1)
							}),
							disabled: pageIndex === 0,
							variant: "ghost",
							size: "sm",
							className: "h-7 min-h-7 rounded px-2 py-1 text-xs",
							children: "«"
						}),
						/* @__PURE__ */ jsx(Button, {
							onClick: () => setPagination({
								...pagination,
								pageIndex: Math.min(pageCount - 1, pageIndex + 1)
							}),
							disabled: pageIndex >= pageCount - 1,
							variant: "ghost",
							size: "sm",
							className: "h-7 min-h-7 rounded px-2 py-1 text-xs",
							children: "»"
						}),
						/* @__PURE__ */ jsx(Button, {
							onClick: () => setPagination({
								...pagination,
								pageIndex: pageCount - 1
							}),
							disabled: pageIndex >= pageCount - 1,
							variant: "ghost",
							size: "sm",
							className: "h-7 min-h-7 rounded px-2 py-1 text-xs",
							children: "»»"
						})
					]
				})]
			})
		]
	});
}
var PAGE_SIZE$1, SELECT_ALL_VALUE, COLUMN_VISIBILITY_LABELS, CLASSIFICATION_STYLE, CLASSIFICATION_LABEL, ACTION_LABEL, URGENCY_STYLE, URGENCY_LABEL, CLASSIFICATION_OPTIONS, ACTION_OPTIONS, URGENCY_OPTIONS, QUICK_FILTERS, columns;
var init_RebalancingTable = __esmMin((() => {
	init_button();
	init_checkbox();
	init_input();
	init_scroll_area();
	init_select();
	init_table();
	PAGE_SIZE$1 = 20;
	SELECT_ALL_VALUE = "__all__";
	COLUMN_VISIBILITY_LABELS = {
		select: "☑",
		stationName: "Estación",
		districtName: "Barrio",
		inferredType: "Tipo",
		classification: "Clasificación",
		currentOccupancy: "Ocupación",
		actionGroup: "Acción",
		urgency: "Urgencia",
		priorityScore: "Score",
		expand: "Expand"
	};
	CLASSIFICATION_STYLE = {
		overstock: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
		deficit: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
		peak_saturation: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
		peak_emptying: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
		balanced: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
		data_review: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
	};
	CLASSIFICATION_LABEL = {
		overstock: "A Sobrestock",
		deficit: "B Déficit",
		peak_saturation: "C Sat. punta",
		peak_emptying: "D Vaciado punta",
		balanced: "E Equilibrada",
		data_review: "F Revisar dato"
	};
	ACTION_LABEL = {
		donor: "Donar",
		receptor: "Recibir",
		peak_remove: "Retirar (prev.)",
		peak_fill: "Reponer (prev.)",
		stable: "No actuar",
		review: "Revisar"
	};
	URGENCY_STYLE = {
		critical: "text-rose-600 dark:text-rose-400 font-bold",
		high: "text-red-600 dark:text-red-400 font-semibold",
		medium: "text-amber-600 dark:text-amber-400",
		low: "text-slate-500",
		none: "text-slate-400"
	};
	URGENCY_LABEL = {
		critical: "Crítica",
		high: "Alta",
		medium: "Media",
		low: "Baja",
		none: "—"
	};
	CLASSIFICATION_OPTIONS = [{
		value: "",
		label: "Todas"
	}, ...Object.entries(CLASSIFICATION_LABEL).map(([value, label]) => ({
		value,
		label
	}))];
	ACTION_OPTIONS = [{
		value: "",
		label: "Todas"
	}, ...Object.entries(ACTION_LABEL).map(([value, label]) => ({
		value,
		label
	}))];
	URGENCY_OPTIONS = [{
		value: "",
		label: "Todas"
	}, ...Object.entries(URGENCY_LABEL).map(([value, label]) => ({
		value,
		label
	}))];
	QUICK_FILTERS = [
		{
			id: "all",
			label: "Todas",
			filter: null
		},
		{
			id: "donors",
			label: "Donantes",
			filter: {
				id: "actionGroup",
				value: "donor"
			}
		},
		{
			id: "receptors",
			label: "Receptoras",
			filter: {
				id: "actionGroup",
				value: "receptor"
			}
		},
		{
			id: "critical",
			label: "Críticas",
			filter: {
				id: "urgency",
				value: "critical"
			}
		},
		{
			id: "high",
			label: "Altas",
			filter: {
				id: "urgency",
				value: "high"
			}
		},
		{
			id: "review",
			label: "Revisar",
			filter: {
				id: "actionGroup",
				value: "review"
			}
		}
	];
	columns = [
		{
			id: "select",
			header: ({ table }) => /* @__PURE__ */ jsx(Checkbox, {
				checked: table.getIsAllRowsSelected(),
				onChange: table.getToggleAllRowsSelectedHandler(),
				"aria-label": "Seleccionar todas las filas"
			}),
			cell: ({ row }) => /* @__PURE__ */ jsx(Checkbox, {
				checked: row.getIsSelected(),
				onChange: row.getToggleSelectedHandler(),
				"aria-label": `Seleccionar estación ${row.original.stationName}`,
				onClick: (e) => e.stopPropagation()
			}),
			size: 40,
			enableSorting: false
		},
		{
			accessorKey: "stationName",
			header: "Estación",
			cell: ({ row }) => /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("p", {
				className: "font-medium text-[var(--foreground)]",
				children: row.original.stationName
			}), /* @__PURE__ */ jsxs("p", {
				className: "text-xs text-[var(--muted)]",
				children: ["#", row.original.stationId]
			})] })
		},
		{
			accessorKey: "districtName",
			header: "Barrio",
			cell: ({ getValue }) => /* @__PURE__ */ jsx("span", {
				className: "text-xs text-[var(--muted)]",
				children: getValue() ?? "—"
			})
		},
		{
			id: "inferredType",
			header: "Tipo",
			cell: ({ row }) => /* @__PURE__ */ jsx("span", {
				className: "text-xs text-[var(--muted)] capitalize",
				children: row.original.inferredType
			})
		},
		{
			accessorKey: "classification",
			header: "Clasificación",
			cell: ({ getValue }) => {
				const value = getValue();
				return /* @__PURE__ */ jsx("span", {
					className: `inline-block rounded px-1.5 py-0.5 text-xs font-medium ${CLASSIFICATION_STYLE[value]}`,
					children: CLASSIFICATION_LABEL[value]
				});
			}
		},
		{
			accessorKey: "currentOccupancy",
			header: "Ocupación / Banda",
			cell: ({ row }) => /* @__PURE__ */ jsx(OccupancyBar, {
				occupancy: row.original.currentOccupancy,
				bandMin: row.original.targetBand.min,
				bandMax: row.original.targetBand.max
			})
		},
		{
			accessorKey: "actionGroup",
			header: "Acción",
			cell: ({ getValue }) => /* @__PURE__ */ jsx("span", {
				className: "text-xs font-medium text-[var(--foreground)]",
				children: ACTION_LABEL[getValue()]
			})
		},
		{
			accessorKey: "urgency",
			header: "Urgencia",
			cell: ({ getValue }) => {
				const value = getValue();
				return /* @__PURE__ */ jsx("span", {
					className: `text-xs ${URGENCY_STYLE[value]}`,
					children: URGENCY_LABEL[value]
				});
			}
		},
		{
			accessorKey: "priorityScore",
			header: "Score",
			cell: ({ getValue }) => /* @__PURE__ */ jsx("span", {
				className: "text-xs tabular-nums text-[var(--muted)]",
				children: (getValue() * 100).toFixed(0)
			})
		},
		{
			id: "expand",
			header: "",
			cell: () => /* @__PURE__ */ jsx("span", { className: "text-xs text-[var(--muted)]" })
		}
	];
}));
//#endregion
//#region src/app/dashboard/redistribucion/_components/TransferTable.tsx
function TransferTable({ transfers }) {
	if (transfers.length === 0) return /* @__PURE__ */ jsx(Card, {
		className: "p-8 text-center text-sm text-[var(--muted)]",
		children: "No hay transferencias sugeridas en este momento. Las estaciones están dentro de banda o se autocorrigen."
	});
	return /* @__PURE__ */ jsx("div", {
		className: "space-y-3",
		children: transfers.map((t, i) => /* @__PURE__ */ jsxs(Card, {
			className: "p-4",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 text-sm font-semibold",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "text-orange-600 dark:text-orange-400",
								children: t.originStationName
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-[var(--muted)]",
								children: "→"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-sky-600 dark:text-sky-400",
								children: t.destinationStationName
							})
						]
					}), /* @__PURE__ */ jsxs(Badge, {
						className: "rounded-full bg-[var(--primary)] px-3 py-1 text-sm font-bold normal-case tracking-normal text-white",
						children: [t.bikesToMove, " bicis"]
					})]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-2 text-xs text-[var(--muted)]",
					children: [
						"Ventana horaria: ",
						/* @__PURE__ */ jsxs("strong", { children: [
							t.timeWindow.start,
							"–",
							t.timeWindow.end
						] }),
						" ·",
						" ",
						"Confianza: ",
						Math.round(t.confidence * 100),
						"%"
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-3 flex flex-wrap gap-4 text-xs",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[var(--muted)]",
							children: "Vaciados evitados "
						}), /* @__PURE__ */ jsxs("strong", {
							className: "text-green-600 dark:text-green-400",
							children: [t.expectedImpact.emptiesAvoided.toFixed(1), "h"]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[var(--muted)]",
							children: "Llenos evitados "
						}), /* @__PURE__ */ jsxs("strong", {
							className: "text-green-600 dark:text-green-400",
							children: [t.expectedImpact.fullsAvoided.toFixed(1), "h"]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[var(--muted)]",
							children: "Usos recuperados "
						}), /* @__PURE__ */ jsxs("strong", {
							className: "text-sky-600 dark:text-sky-400",
							children: ["~", t.expectedImpact.usesRecovered.toFixed(0)]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[var(--muted)]",
							children: "Score logístico "
						}), /* @__PURE__ */ jsxs("strong", { children: [Math.round(t.expectedImpact.costScore * 100), "%"] })] })
					]
				}),
				/* @__PURE__ */ jsx(Accordion, {
					className: "mt-3",
					children: /* @__PURE__ */ jsxs(AccordionItem, {
						value: `transfer-reasons-${i}`,
						children: [/* @__PURE__ */ jsx(AccordionTrigger, {
							className: "px-0 py-0 text-xs text-[var(--primary)]",
							children: "Por qué se recomienda esta transferencia"
						}), /* @__PURE__ */ jsx(AccordionContent, {
							className: "mt-2 border-t-0 px-0 py-0",
							children: /* @__PURE__ */ jsx("ul", {
								className: "space-y-1 text-xs text-[var(--muted)]",
								children: t.reasons.map((r, j) => /* @__PURE__ */ jsxs("li", {
									className: "flex gap-1",
									children: [/* @__PURE__ */ jsx("span", {
										className: "shrink-0 text-[var(--primary)]",
										children: "›"
									}), r]
								}, j))
							})
						})]
					})
				})
			]
		}, i))
	});
}
var init_TransferTable = __esmMin((() => {
	init_accordion();
	init_badge();
	init_card();
}));
//#endregion
//#region src/app/dashboard/redistribucion/_components/KpiCards.tsx
function pct(v) {
	return `${Math.round(v * 100)}%`;
}
function fmt(v, unit = "") {
	if (v === null) return "—";
	return `${v.toFixed(1)}${unit}`;
}
function KpiCards({ kpis, baseline }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs(Card, {
				className: "p-4",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "mb-3 text-sm font-semibold text-[var(--foreground)]",
					children: "KPIs de servicio"
				}), /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-red-600 dark:text-red-400",
							children: pct(kpis.service.systemPctTimeEmpty)
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "% tiempo vacías (sistema)"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-orange-600 dark:text-orange-400",
							children: pct(kpis.service.systemPctTimeFull)
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "% tiempo llenas (sistema)"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-[var(--foreground)]",
							children: fmt(kpis.service.avgCriticalEpisodeMinutes, " min")
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Episodio crítico promedio"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
							className: "text-2xl font-black tabular-nums text-sky-600 dark:text-sky-400",
							children: ["~", kpis.service.estimatedLostUses.toFixed(0)]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Usos perdidos estimados"
						})] })
					]
				})]
			}),
			/* @__PURE__ */ jsxs(Card, {
				className: "p-4",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "mb-3 text-sm font-semibold text-[var(--foreground)]",
					children: "Impacto esperado de intervenciones"
				}), /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-green-600 dark:text-green-400",
							children: fmt(kpis.impact.totalEmptiesAvoided, "h")
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Horas vacías evitadas"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-green-600 dark:text-green-400",
							children: fmt(kpis.impact.totalFullsAvoided, "h")
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Horas llenas evitadas"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
							className: "text-2xl font-black tabular-nums text-sky-600 dark:text-sky-400",
							children: ["~", kpis.impact.totalUsesRecovered.toFixed(0)]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Usos recuperados"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-[var(--foreground)]",
							children: kpis.impact.improvementVsBaselinePct !== null ? `${kpis.impact.improvementVsBaselinePct.toFixed(1)}%` : "—"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Mejora vs sin intervención"
						})] })
					]
				})]
			}),
			/* @__PURE__ */ jsxs(Card, {
				className: "p-4",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "mb-3 text-sm font-semibold text-[var(--foreground)]",
					children: "Comparativa de escenarios"
				}), /* @__PURE__ */ jsx(ScrollArea, {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ jsxs(Table, {
						className: "text-xs",
						children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, {
							className: "text-left text-[var(--muted)]",
							children: [
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 pr-4 normal-case tracking-normal",
									children: "Escenario"
								}),
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 pr-4 normal-case tracking-normal",
									children: "Vaciados evitados"
								}),
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 pr-4 normal-case tracking-normal",
									children: "Llenos evitados"
								}),
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 pr-4 normal-case tracking-normal",
									children: "Movimientos"
								}),
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 normal-case tracking-normal",
									children: "Coste / incidente"
								})
							]
						}) }), /* @__PURE__ */ jsx(TableBody, { children: [
							baseline.doNothing,
							baseline.simpleRules,
							baseline.recommended
						].map((s) => /* @__PURE__ */ jsxs(TableRow, {
							className: s.label === "Sistema recomendado" ? "font-semibold" : "",
							children: [
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 pr-4",
									children: s.label
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 pr-4 tabular-nums",
									children: s.emptiesAvoided.toFixed(1)
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 pr-4 tabular-nums",
									children: s.fullsAvoided.toFixed(1)
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 pr-4 tabular-nums",
									children: s.totalMoves
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 tabular-nums",
									children: s.costPerIncidentAvoided !== null ? s.costPerIncidentAvoided.toFixed(2) : "—"
								})
							]
						}, s.label)) })]
					})
				})]
			})
		]
	});
}
var init_KpiCards = __esmMin((() => {
	init_card();
	init_scroll_area();
	init_table();
}));
//#endregion
//#region src/app/dashboard/redistribucion/_components/RedistribucionClient.tsx
var RedistribucionClient_exports = /* @__PURE__ */ __exportAll({ RedistribucionClient: () => RedistribucionClient });
function RedistribucionClient({ initialReport, districtNames, tableParams }) {
	const [report, setReport] = useState(initialReport);
	const [activeTab, setActiveTab] = useState("estaciones");
	const [selectedDistrict, setSelectedDistrict] = useState(initialReport.districtFilter ?? "");
	const [selectedDays, setSelectedDays] = useState(initialReport.analysisWindowDays);
	const [loadError, setLoadError] = useState(null);
	const [isReportLoading, setIsReportLoading] = useState(false);
	const [isPending, startTransition] = useTransition();
	const didMountRef = useRef(false);
	useEffect(() => {
		if (!didMountRef.current) {
			didMountRef.current = true;
			return;
		}
		const controller = new AbortController();
		let isActive = true;
		const refreshReport = async () => {
			setLoadError(null);
			setIsReportLoading(true);
			try {
				const response = await fetch(appRoutes.api.rebalancingReport({
					district: selectedDistrict || null,
					days: selectedDays
				}), {
					cache: "no-store",
					signal: controller.signal
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const nextReport = await response.json();
				if (!isActive) return;
				startTransition(() => {
					setReport(nextReport);
				});
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") return;
				captureExceptionWithContext(error, {
					area: "dashboard.redistribucion",
					operation: "refreshReport",
					extra: {
						days: selectedDays,
						district: selectedDistrict || null
					}
				});
				if (!isActive) return;
				setLoadError("No se pudo actualizar el informe. Mostramos la ultima version disponible.");
			} finally {
				if (isActive) setIsReportLoading(false);
			}
		};
		refreshReport();
		return () => {
			isActive = false;
			controller.abort();
		};
	}, [
		selectedDays,
		selectedDistrict,
		startTransition
	]);
	function handleDistrictChange(value) {
		setSelectedDistrict(value);
	}
	function handleDaysChange(value) {
		setSelectedDays(value);
	}
	const isUpdatingReport = isReportLoading || isPending;
	const tabs = [
		{
			id: "estaciones",
			label: `Estaciones (${report.summary.totalStations})`
		},
		{
			id: "transferencias",
			label: `Transferencias (${report.transfers.length})`
		},
		{
			id: "kpis",
			label: "KPIs e impacto"
		},
		{
			id: "metodologia",
			label: "Metodología"
		}
	];
	return /* @__PURE__ */ jsxs(PageShell, {
		maxWidthClassName: "max-w-[1280px]",
		className: "bg-[var(--background)] sm:px-6",
		children: [
			/* @__PURE__ */ jsx(DashboardPageViewTracker, {
				routeKey: "dashboard_redistribucion",
				pageType: "dashboard",
				template: "redistribucion_report"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
							className: "text-2xl font-black text-[var(--foreground)]",
							children: "Redistribución"
						}), /* @__PURE__ */ jsxs("p", {
							className: "mt-0.5 text-sm text-[var(--muted)]",
							children: [
								"Diagnóstico operativo de estaciones · ventana ",
								report.analysisWindowDays,
								" días ·",
								" ",
								/* @__PURE__ */ jsx("time", {
									dateTime: report.generatedAt,
									children: new Date(report.generatedAt).toLocaleString("es-ES", {
										dateStyle: "short",
										timeStyle: "short"
									})
								})
							]
						})] }), /* @__PURE__ */ jsx(TrackedAnchor, {
							href: appRoutes.api.rebalancingReport({
								district: selectedDistrict || null,
								days: selectedDays,
								format: "csv"
							}),
							download: true,
							trackingEvent: buildExportClickEvent({
								surface: "dashboard",
								routeKey: "dashboard_redistribucion",
								source: "redistribucion_header",
								ctaId: "rebalancing_csv",
								entityType: "api",
								module: "redistribucion_export"
							}),
							className: "rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover,var(--card))]",
							children: "Descargar CSV"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-4 flex flex-wrap gap-3",
						children: [
							/* @__PURE__ */ jsxs(Select$1, {
								value: selectedDistrict || ALL_DISTRICTS_VALUE,
								onValueChange: (value) => {
									const nextValue = value === ALL_DISTRICTS_VALUE ? "" : value ?? "";
									trackUmamiEvent(buildFilterChangeEvent({
										surface: "dashboard",
										routeKey: "dashboard_redistribucion",
										module: "district_filter",
										source: "redistribucion_filters",
										destination: nextValue ? "filtered" : "all"
									}));
									handleDistrictChange(nextValue);
								},
								children: [/* @__PURE__ */ jsxs(SelectTrigger, {
									"aria-label": "Filtrar redistribucion por barrio",
									className: "min-h-9 min-w-[230px] bg-[var(--card)]",
									children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
								}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
									value: ALL_DISTRICTS_VALUE,
									children: "Todos los barrios"
								}), districtNames.map((d) => /* @__PURE__ */ jsx(SelectItem, {
									value: d,
									children: d
								}, d))] })]
							}),
							/* @__PURE__ */ jsxs(Select$1, {
								value: String(selectedDays),
								onValueChange: (value) => {
									const nextValue = Number(value);
									trackUmamiEvent(buildFilterChangeEvent({
										surface: "dashboard",
										routeKey: "dashboard_redistribucion",
										module: "analysis_window",
										source: "redistribucion_filters",
										period: `${nextValue}_days`
									}));
									handleDaysChange(nextValue);
								},
								children: [/* @__PURE__ */ jsxs(SelectTrigger, {
									"aria-label": "Cambiar ventana temporal del informe",
									className: "min-h-9 min-w-[190px] bg-[var(--card)]",
									children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
								}), /* @__PURE__ */ jsx(SelectContent, { children: ANALYSIS_WINDOWS.map((d) => /* @__PURE__ */ jsxs(SelectItem, {
									value: String(d),
									children: [
										"Últimos ",
										d,
										" días"
									]
								}, d)) })]
							}),
							isUpdatingReport && /* @__PURE__ */ jsx("span", {
								className: "self-center text-xs text-[var(--muted)] animate-pulse",
								children: "Actualizando…"
							})
						]
					}),
					loadError ? /* @__PURE__ */ jsx("p", {
						className: "mt-3 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100",
						children: loadError
					}) : null
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mb-6",
				children: /* @__PURE__ */ jsx(RebalancingSummaryCards, { summary: report.summary })
			}),
			/* @__PURE__ */ jsxs(Tabs, {
				value: activeTab,
				onValueChange: (value) => {
					if (!tabs.some((tab) => tab.id === value) || value === activeTab) return;
					const nextTab = value;
					trackUmamiEvent(buildPanelOpenEvent({
						surface: "dashboard",
						routeKey: "dashboard_redistribucion",
						module: nextTab,
						source: "redistribucion_tabs"
					}));
					setActiveTab(nextTab);
				},
				children: [
					/* @__PURE__ */ jsx(TabsList, {
						className: "mb-4 gap-1 border-b border-[var(--border)]",
						"aria-label": "Secciones del informe de redistribucion",
						children: tabs.map((tab) => /* @__PURE__ */ jsx(TabsTrigger, {
							value: tab.id,
							className: "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
							children: tab.label
						}, tab.id))
					}),
					/* @__PURE__ */ jsxs(TabsContent, {
						className: "space-y-6",
						value: "estaciones",
						children: [/* @__PURE__ */ jsx(ClassificationLegend, {}), /* @__PURE__ */ jsx(RebalancingTable, {
							diagnostics: report.diagnostics,
							initialParams: tableParams
						})]
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						className: "space-y-6",
						value: "transferencias",
						children: /* @__PURE__ */ jsx(TransferTable, { transfers: report.transfers })
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						className: "space-y-6",
						value: "kpis",
						children: /* @__PURE__ */ jsx(KpiCards, {
							kpis: report.kpis,
							baseline: report.baselineComparison
						})
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						className: "space-y-6",
						value: "metodologia",
						children: /* @__PURE__ */ jsx(MetodologiaPanel, {})
					})
				]
			})
		]
	});
}
function MetodologiaPanel() {
	return /* @__PURE__ */ jsxs("div", {
		className: "prose prose-sm max-w-none rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--foreground)]",
		children: [
			/* @__PURE__ */ jsx("h2", { children: "Cómo funciona el sistema de redistribución" }),
			/* @__PURE__ */ jsx("h3", { children: "1. Diagnóstico estructural (clasificación A-F)" }),
			/* @__PURE__ */ jsxs("p", { children: [
				"Cada estación se clasifica según su comportamiento histórico en los últimos N días. La clasificación se basa en ocupación media, porcentaje de tiempo vacía/llena, rotación relativa e immobilidad. El sistema tiene 6 clases: ",
				/* @__PURE__ */ jsx("strong", { children: "A Sobrestock" }),
				", ",
				/* @__PURE__ */ jsx("strong", { children: "B Déficit" }),
				",",
				" ",
				/* @__PURE__ */ jsx("strong", { children: "C Saturación puntual" }),
				", ",
				/* @__PURE__ */ jsx("strong", { children: "D Vaciado puntual" }),
				",",
				" ",
				/* @__PURE__ */ jsx("strong", { children: "E Equilibrada" }),
				" y ",
				/* @__PURE__ */ jsx("strong", { children: "F Revisar dato" }),
				"."
			] }),
			/* @__PURE__ */ jsx("h3", { children: "2. Tipología inferida" }),
			/* @__PURE__ */ jsxs("p", { children: [
				"El tipo de estación (residencial, oficinas, intermodal, turística, ocio, mixta) se infiere automáticamente de los patrones horarios históricos. Esto define la ",
				/* @__PURE__ */ jsx("em", { children: "banda objetivo" }),
				": el rango de ocupación aceptable para cada tipo y franja horaria."
			] }),
			/* @__PURE__ */ jsx("h3", { children: "3. Predicción de riesgo (1h/3h)" }),
			/* @__PURE__ */ jsx("p", { children: "Se estima la probabilidad de vaciado o llenado en las próximas 1 y 3 horas mezclando el estado actual con el patrón histórico esperado. La influencia del estado actual decrece con el horizonte." }),
			/* @__PURE__ */ jsx("h3", { children: "4. Red y elasticidad" }),
			/* @__PURE__ */ jsx("p", { children: "Antes de urgir una intervención, el sistema evalúa si las estaciones cercanas (radio 500m) pueden absorber la demanda. Si existen alternativas robustas, la urgencia se reduce hasta un 50%." }),
			/* @__PURE__ */ jsx("h3", { children: "5. Origen-destino y logística" }),
			/* @__PURE__ */ jsx("p", { children: "El algoritmo de matching empareja donantes (exceso) con receptoras (déficit) considerando distancia, urgencia relativa y zona. Cada transferencia incluye número de bicis, ventana horaria sugerida, impacto esperado y coste logístico normalizado." }),
			/* @__PURE__ */ jsx("h3", { children: "Limitaciones" }),
			/* @__PURE__ */ jsxs("ul", { children: [
				/* @__PURE__ */ jsx("li", { children: "No hay datos de viajes individuales ni ID de bicicleta." }),
				/* @__PURE__ */ jsx("li", { children: "El clima y eventos no se modelan explícitamente (solo a través del patrón histórico)." }),
				/* @__PURE__ */ jsx("li", { children: "Las predicciones son estimaciones estadísticas, no certezas." }),
				/* @__PURE__ */ jsx("li", { children: "Los umbrales son configurables y deben calibrarse tras observar resultados reales." })
			] })
		]
	});
}
var ANALYSIS_WINDOWS, ALL_DISTRICTS_VALUE;
var init_RedistribucionClient = __esmMin((() => {
	init_TrackedAnchor();
	init_select();
	init_tabs();
	init_routes();
	init_sentry_reporting();
	init_umami();
	init_page_shell();
	init_ClassificationLegend();
	init_RebalancingSummaryCards();
	init_RebalancingTable();
	init_TransferTable();
	init_KpiCards();
	ANALYSIS_WINDOWS = [
		7,
		15,
		30,
		60
	];
	ALL_DISTRICTS_VALUE = "__all_districts__";
}));
//#endregion
//#region src/app/dashboard/redistribucion.tsx
init_routes();
init_site();
init_DashboardPageViewTracker();
init_page_shell();
var Route$11 = createFileRoute("/dashboard/redistribucion")({
	head: () => ({
		meta: [{ charset: "utf-8" }, {
			name: "viewport",
			content: "width=device-width, initial-scale=1"
		}],
		title: "Redistribución | Dashboard Bizi"
	}),
	loader: async ({ searchParams }) => {
		const params = searchParams ? await searchParams : {};
		const getFirst = (v) => Array.isArray(v) ? v[0] : v;
		const sort = getFirst(params.sort);
		const filter = getFirst(params.filter);
		const search = getFirst(params.search);
		const page = getFirst(params.page);
		const pageSize = getFirst(params.pageSize);
		const tableParams = {
			sort: sort?.includes(":") ? sort : void 0,
			filter: filter?.includes(":") ? filter : void 0,
			search,
			page: page ? Number(page) : void 0,
			pageSize: pageSize ? Number(pageSize) : void 0
		};
		const { buildRebalancingReport } = await import("./rebalancing-report-Dd7X6Ko1.js");
		const { fetchDistrictCollection } = await import("./districts-BYB_N80e.js");
		const [report, districtCollection] = await Promise.all([buildRebalancingReport({ days: 15 }), fetchDistrictCollection().catch(() => null)]);
		return {
			report,
			districtNames: districtCollection ? [...new Set(districtCollection.features.map((f) => f.properties?.distrito).filter((d) => typeof d === "string"))].sort((a, b) => a.localeCompare(b, "es")) : [],
			tableParams
		};
	},
	component: RedistribucionPage
});
function RedistribucionPage() {
	const { report, districtNames, tableParams } = Route$11.useLoaderData();
	const { RedistribucionClient } = (init_RedistribucionClient(), __toCommonJS(RedistribucionClient_exports));
	return /* @__PURE__ */ jsx(RedistribucionClient, {
		initialReport: report,
		districtNames,
		tableParams
	});
}
//#endregion
//#region src/app/dashboard/flujo.tsx
init_routes();
init_site();
init_DashboardPageViewTracker();
init_page_shell();
var Route$10 = createFileRoute("/dashboard/flujo")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Analiza corredores de movilidad de Bizi Zaragoza, curva diaria de demanda e impacto horario del transporte publico."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Analisis de flujo"
	}),
	loader: async ({ searchParams }) => {
		const siteUrl = getSiteUrl();
		const resolvedSearchParams = searchParams ? await searchParams : {};
		const [stations, availableMonths] = await Promise.all([fetchStations().catch(() => ({
			stations: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		})), fetchAvailableDataMonths().catch(() => ({
			months: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		}))]);
		const activeMonth = resolveActiveMonth(availableMonths.months, normalizeMonthSearchParam(resolvedSearchParams.month));
		const selectedStationId = stations.stations[0]?.id ?? "";
		const breadcrumbs = createRootBreadcrumbs({
			label: "Dashboard",
			href: appRoutes.dashboard()
		}, {
			label: "Flujo",
			href: appRoutes.dashboardFlow()
		});
		return {
			stations,
			availableMonths,
			activeMonth,
			selectedStationId,
			breadcrumbs,
			structuredData: {
				"@context": "https://schema.org",
				"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
					"@type": "Dataset",
					name: "Corredores y flujo por barrios de Bizi Zaragoza",
					description: "Datos agregados de movilidad, demanda, impacto del transporte publico y flujos entre barrios para el analisis urbano.",
					url: `${siteUrl}${appRoutes.dashboardFlow()}`,
					creator: {
						"@type": "Organization",
						name: SITE_NAME,
						url: siteUrl
					},
					distribution: [{
						"@type": "DataDownload",
						encodingFormat: "application/json",
						contentUrl: `${siteUrl}${appRoutes.api.mobility()}`
					}, {
						"@type": "DataDownload",
						encodingFormat: "application/json",
						contentUrl: `${siteUrl}${appRoutes.api.history()}`
					}]
				}]
			}
		};
	},
	component: DashboardFlowPage
});
function DashboardFlowPage() {
	const { stations, availableMonths, activeMonth, selectedStationId, breadcrumbs, structuredData } = Route$10.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(DashboardPageViewTracker, {
			routeKey: "dashboard_flow",
			pageType: "dashboard",
			template: "flow_analysis"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsxs(PageHeaderCard, { children: [/* @__PURE__ */ jsx(SiteBreadcrumbs, {
			items: breadcrumbs,
			className: "mb-3"
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 text-[var(--primary)]",
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white",
						children: "B"
					}), /* @__PURE__ */ jsx("h1", {
						className: "text-lg font-bold text-[var(--foreground)]",
						children: "Bizi Zaragoza"
					})]
				}), /* @__PURE__ */ jsx(DashboardRouteLinks, {
					activeRoute: "flow",
					routes: [
						"dashboard",
						"stations",
						"flow",
						"conclusions",
						"help"
					],
					variant: "inline",
					className: "hidden items-center gap-5 md:flex"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-end gap-2",
				children: [
					/* @__PURE__ */ jsx(DashboardRouteLinks, {
						activeRoute: "flow",
						routes: [
							"dashboard",
							"stations",
							"flow",
							"conclusions",
							"help"
						],
						variant: "chips",
						className: "flex flex-wrap items-center gap-2 md:hidden"
					}),
					/* @__PURE__ */ jsx(ThemeToggleButton, {}),
					/* @__PURE__ */ jsx(GitHubRepoButton, {})
				]
			})]
		})] }),
		/* @__PURE__ */ jsx(Suspense, { children: /* @__PURE__ */ jsx(MonthFilter, {
			months: availableMonths.months,
			activeMonth,
			routeKey: "dashboard_flow",
			source: "dashboard_flow"
		}) }),
		/* @__PURE__ */ jsx(Suspense, { children: /* @__PURE__ */ jsx(MobilityInsights, {
			stations: stations.stations,
			selectedStationId,
			mobilityDays: 14,
			demandDays: 30
		}) })
	] });
}
//#endregion
//#region src/app/dashboard/estaciones/_components/StationsDirectoryClient.tsx
init_button();
init_card();
init_input();
init_routes();
init_umami();
init_DashboardPageViewTracker();
init_page_shell();
function normalize(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function StationsDirectoryClient({ stations, dataState }) {
	const [query, setQuery] = useState("");
	const filteredStations = useMemo(() => {
		const normalized = normalize(query);
		if (!normalized) return stations;
		return stations.filter((station) => {
			return normalize(`${station.id} ${station.name}`).includes(normalized);
		});
	}, [query, stations]);
	const directoryDataState = query.trim() ? resolveDataState({
		hasCoverage: dataState !== "no_coverage",
		hasData: filteredStations.length > 0
	}) : dataState;
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(DashboardPageViewTracker, {
			routeKey: "dashboard_stations",
			pageType: "dashboard",
			template: "stations_directory"
		}),
		/* @__PURE__ */ jsxs(PageHeaderCard, {
			className: "z-40 bg-[var(--card)]",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]",
						children: "Estaciones"
					}), /* @__PURE__ */ jsx("h1", {
						className: "text-xl font-bold text-[var(--foreground)]",
						children: "Directorio de estaciones"
					})] }), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-end gap-2",
						children: [
							/* @__PURE__ */ jsx(DashboardRouteLinks, {
								activeRoute: "stations",
								routes: [
									"dashboard",
									"stations",
									"flow",
									"conclusions",
									"help"
								],
								variant: "inline",
								className: "hidden items-center gap-5 md:flex"
							}),
							/* @__PURE__ */ jsx(DashboardRouteLinks, {
								activeRoute: "stations",
								routes: [
									"dashboard",
									"stations",
									"flow",
									"conclusions",
									"help"
								],
								variant: "chips",
								className: "flex flex-wrap items-center gap-2 md:hidden"
							}),
							/* @__PURE__ */ jsx(ThemeToggleButton, {}),
							/* @__PURE__ */ jsx(GitHubRepoButton, {})
						]
					})]
				}),
				/* @__PURE__ */ jsx(CitySwitcher, {
					compact: true,
					className: "mt-3"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-3",
					children: [/* @__PURE__ */ jsx("label", {
						htmlFor: "stations-directory-search",
						className: "sr-only",
						children: "Buscar por nombre o ID"
					}), /* @__PURE__ */ jsx(Input, {
						id: "stations-directory-search",
						type: "text",
						value: query,
						onChange: (event) => setQuery(event.target.value),
						className: "bg-[var(--secondary)]",
						placeholder: "Buscar por nombre o ID"
					})]
				})
			]
		}),
		shouldShowDataStateNotice(directoryDataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: directoryDataState,
			subject: "el directorio de estaciones",
			description: query.trim() ? "No hay estaciones que coincidan con la busqueda actual." : "El directorio usa el mismo snapshot compartido que el dashboard principal.",
			href: appRoutes.status(),
			actionLabel: "Ver estado"
		}) : null,
		/* @__PURE__ */ jsx("section", {
			className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
			children: filteredStations.map((station) => {
				const occupancy = station.capacity > 0 ? station.bikesAvailable / station.capacity : 0;
				return /* @__PURE__ */ jsxs(Card, {
					className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]",
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]",
							children: ["ID ", station.id]
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-1 text-lg font-semibold text-[var(--foreground)]",
							children: station.name
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--muted)]",
							children: [
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-[10px] uppercase tracking-[0.12em]",
									children: "Bicis"
								}), /* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: station.bikesAvailable
								})] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-[10px] uppercase tracking-[0.12em]",
									children: "Anclajes"
								}), /* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: station.anchorsFree
								})] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-[10px] uppercase tracking-[0.12em]",
									children: "Ocupacion"
								}), /* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: formatPercent$1(occupancy)
								})] })
							]
						}),
						/* @__PURE__ */ jsx(TrackedLink, {
							href: appRoutes.dashboardStation(station.id),
							trackingEvent: buildEntitySelectEvent({
								surface: "dashboard",
								routeKey: "dashboard_stations",
								entityType: "station",
								source: "stations_directory",
								module: "station_card"
							}),
							className: buttonVariants({
								variant: "outline",
								size: "sm",
								className: "mt-3 min-h-0 border-[var(--primary)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
							}),
							children: "Ver detalle"
						})
					]
				}, station.id);
			})
		})
	] });
}
//#endregion
//#region src/app/dashboard/estaciones.tsx
init_routes();
var Route$9 = createFileRoute("/dashboard/estaciones")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Explora todas las estaciones de Bizi Zaragoza y entra al detalle de disponibilidad, patrones horarios y comparativas."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Estaciones"
	}),
	loader: async () => {
		return { stations: await fetchStations().catch(() => buildFallbackStations((/* @__PURE__ */ new Date()).toISOString())) };
	},
	component: StationsDirectoryPage
});
function StationsDirectoryPage() {
	const { stations } = Route$9.useLoaderData();
	return /* @__PURE__ */ jsx(StationsDirectoryClient, {
		stations: stations.stations,
		dataState: stations.dataState
	});
}
//#endregion
//#region src/app/dashboard/conclusiones.tsx
init_routes();
init_site();
init_DashboardPageViewTracker();
init_page_shell();
function formatDelta(deltaRatio) {
	if (deltaRatio === null || !Number.isFinite(deltaRatio)) return "Sin referencia";
	return `${deltaRatio >= 0 ? "+" : ""}${Math.round(deltaRatio * 100)}%`;
}
function formatDate(value) {
	if (!value) return "Sin datos";
	const parsed = new Date(value.length <= 10 ? `${value}T00:00:00.000Z` : value);
	if (Number.isNaN(parsed.getTime())) return value;
	return parsed.toLocaleDateString("es-ES");
}
function formatHourLabel(hour) {
	return `${String(hour).padStart(2, "0")}:00-${String((hour + 1) % 24).padStart(2, "0")}:00`;
}
function getDemandCardLabel(selectedMonth) {
	return selectedMonth ? "Variacion demanda del mes" : "Variacion demanda 7 dias";
}
function getDemandCardDetail(payload) {
	const monthLabel = payload.selectedMonth ? toMonthOptions([payload.selectedMonth])[0]?.label ?? payload.selectedMonth : null;
	return payload.selectedMonth ? `Demanda agregada: ${formatInteger$1(payload.metrics.demandLast7Days)} puntos en ${monthLabel} (indice de actividad, no viajes exactos).` : `Demanda agregada: ${formatInteger$1(payload.metrics.demandLast7Days)} puntos en 7 dias (indice de actividad, no viajes exactos).`;
}
function getOccupancyCardLabel(selectedMonth) {
	return selectedMonth ? "Ocupacion media del mes" : "Ocupacion media 7 dias";
}
function getPeriodCaption(selectedMonth, fallback) {
	if (!selectedMonth) return fallback;
	return toMonthOptions([selectedMonth])[0]?.label ?? selectedMonth;
}
function getWeekPatternSummary(payload) {
	const { weekdayWeekendProfile } = payload;
	if (!weekdayWeekendProfile.dominantPeriod) return "Aun no hay suficiente muestra para comparar dias laborables y fin de semana.";
	return weekdayWeekendProfile.dominantPeriod === "weekday" ? `Entre semana la red concentra mas actividad media por dia que en fin de semana (${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} vs ${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} pts).` : `En fin de semana la red concentra mas actividad media por dia que entre semana (${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} vs ${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} pts).`;
}
function buildFallbackPayload() {
	return {
		dateKey: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		selectedMonth: null,
		sourceFirstDay: null,
		sourceLastDay: null,
		totalHistoricalDays: 0,
		stationsWithData: 0,
		activeStations: 0,
		metrics: {
			demandLast7Days: 0,
			demandPrevious7Days: 0,
			demandDeltaRatio: null,
			occupancyLast7Days: 0,
			occupancyPrevious7Days: 0,
			occupancyDeltaRatio: null
		},
		summary: "Todavia no hay historico suficiente para generar conclusiones de movilidad.",
		highlights: [],
		recommendations: ["Recoge al menos varios dias de datos para habilitar recomendaciones operativas."],
		peakDemandHours: [],
		topDistrictsByDemand: [],
		topStationsByDemand: [],
		leastUsedStations: [],
		weekdayWeekendProfile: {
			weekday: {
				avgDemand: 0,
				avgOccupancy: 0,
				daysCount: 0
			},
			weekend: {
				avgDemand: 0,
				avgOccupancy: 0,
				daysCount: 0
			},
			demandGapRatio: null,
			dominantPeriod: null
		}
	};
}
var Route$8 = createFileRoute("/dashboard/conclusiones")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Resumen ejecutivo de movilidad en Zaragoza con demanda, horas pico, barrios mas activos y patrones entre semana y fin de semana."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Conclusiones de movilidad"
	}),
	loader: async ({ searchParams }) => {
		const siteUrl = getSiteUrl();
		const resolvedSearchParams = searchParams ? await searchParams : {};
		const fallbackPayload = buildFallbackPayload();
		const availableMonths = await fetchAvailableDataMonths().catch(() => ({
			months: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		}));
		const activeMonth = resolveActiveMonth(availableMonths.months, normalizeMonthSearchParam(resolvedSearchParams.month));
		const { payload, fromCache } = await getDailyMobilityConclusions(activeMonth).catch(() => ({
			payload: fallbackPayload,
			fromCache: false
		}));
		const breadcrumbs = createRootBreadcrumbs({
			label: "Dashboard",
			href: appRoutes.dashboard()
		}, {
			label: "Conclusiones",
			href: appRoutes.dashboardConclusions()
		});
		return {
			payload,
			fromCache,
			availableMonths,
			activeMonth,
			breadcrumbs,
			structuredData: {
				"@context": "https://schema.org",
				"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
					"@type": "Report",
					name: "Conclusiones de movilidad en Zaragoza",
					description: payload.summary,
					datePublished: payload.generatedAt,
					dateModified: payload.generatedAt,
					inLanguage: "es",
					publisher: {
						"@type": "Organization",
						name: SITE_NAME,
						url: siteUrl
					},
					about: {
						"@type": "Dataset",
						name: "Movilidad urbana de Bizi Zaragoza",
						distribution: [{
							"@type": "DataDownload",
							encodingFormat: "application/json",
							contentUrl: `${siteUrl}${appRoutes.api.history()}`
						}]
					}
				}]
			}
		};
	},
	component: DashboardConclusionsPage
});
function DashboardConclusionsPage() {
	const { payload, fromCache, availableMonths, activeMonth, breadcrumbs, structuredData } = Route$8.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(DashboardPageViewTracker, {
			routeKey: "dashboard_conclusions",
			pageType: "dashboard",
			template: "conclusions_report"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsxs(PageHeaderCard, { children: [/* @__PURE__ */ jsx(SiteBreadcrumbs, {
			items: breadcrumbs,
			className: "mb-3"
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 text-[var(--primary)]",
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white",
						children: "B"
					}), /* @__PURE__ */ jsx("h1", {
						className: "text-lg font-bold text-[var(--foreground)]",
						children: "Bizi Zaragoza"
					})]
				}), /* @__PURE__ */ jsx(DashboardRouteLinks, {
					activeRoute: "conclusions",
					routes: [
						"dashboard",
						"stations",
						"flow",
						"conclusions",
						"help"
					],
					variant: "inline",
					className: "hidden items-center gap-5 md:flex"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-end gap-2",
				children: [
					/* @__PURE__ */ jsx(DashboardRouteLinks, {
						activeRoute: "conclusions",
						routes: [
							"dashboard",
							"stations",
							"flow",
							"conclusions",
							"help"
						],
						variant: "chips",
						className: "flex flex-wrap items-center gap-2 md:hidden"
					}),
					/* @__PURE__ */ jsx(ThemeToggleButton, {}),
					/* @__PURE__ */ jsx(GitHubRepoButton, {})
				]
			})]
		})] }),
		/* @__PURE__ */ jsx(Suspense, { children: /* @__PURE__ */ jsx(MonthFilter, {
			months: availableMonths.months,
			activeMonth,
			routeKey: "dashboard_conclusions",
			source: "dashboard_conclusions"
		}) }),
		/* @__PURE__ */ jsx("section", {
			className: "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl space-y-2",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
							children: "Informe ejecutivo diario"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-black leading-tight text-[var(--foreground)] md:text-3xl",
							children: "Conclusiones generales de movilidad en Zaragoza"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-[var(--muted)]",
							children: payload.summary
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: ["Dia informe ", payload.dateKey]
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: ["Cobertura desde ", formatDate(payload.sourceFirstDay)]
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: ["Ultima muestra ", formatDate(payload.sourceLastDay)]
						}),
						/* @__PURE__ */ jsx("span", {
							className: "ui-chip",
							children: fromCache ? "Actualizacion diaria en cache" : "Actualizado hoy"
						})
					]
				})]
			})
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: getDemandCardLabel(payload.selectedMonth)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: formatDelta(payload.metrics.demandDeltaRatio)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: getDemandCardDetail(payload)
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: getOccupancyCardLabel(payload.selectedMonth)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: formatPercent$1(payload.metrics.occupancyLast7Days)
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-[var(--muted)]",
							children: ["Variacion: ", formatDelta(payload.metrics.occupancyDeltaRatio)]
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura historica"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: payload.totalHistoricalDays
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Dias con informacion consolidada."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-6 xl:grid-cols-12",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card xl:col-span-7",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: "Hallazgos principales"
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs text-[var(--muted)]",
						children: [
							"Cobertura desde ",
							formatDate(payload.sourceFirstDay),
							" hasta ",
							formatDate(payload.sourceLastDay),
							"."
						]
					}),
					payload.highlights.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "mt-4 text-sm text-[var(--muted)]",
						children: "Sin highlights disponibles para el dia actual."
					}) : /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-3",
						children: payload.highlights.map((item) => /* @__PURE__ */ jsxs("article", {
							className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: item.title
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-xs text-[var(--muted)]",
								children: item.detail
							})]
						}, `${item.title}-${item.detail}`))
					})
				]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card xl:col-span-5",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "text-base font-bold text-[var(--foreground)]",
					children: "Recomendaciones operativas"
				}), payload.recommendations.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "mt-4 text-sm text-[var(--muted)]",
					children: "Sin recomendaciones para hoy."
				}) : /* @__PURE__ */ jsx("ol", {
					className: "mt-4 space-y-3 text-sm text-[var(--muted)]",
					children: payload.recommendations.map((recommendation, index) => /* @__PURE__ */ jsxs("li", {
						className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
						children: [/* @__PURE__ */ jsx("span", {
							className: "mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[10px] font-bold text-[var(--primary)]",
							children: index + 1
						}), recommendation]
					}, `${recommendation}-${index}`))
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 xl:grid-cols-2",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Entre semana vs fin de semana"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-xs text-[var(--muted)]",
								children: getPeriodCaption(payload.selectedMonth, "Ventana actual")
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-sm text-[var(--muted)]",
							children: getWeekPatternSummary(payload)
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 grid gap-3 md:grid-cols-2",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
										children: "Entre semana"
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "mt-2 text-xl font-black text-[var(--foreground)]",
										children: [payload.weekdayWeekendProfile.weekday.avgDemand.toFixed(1), " pts"]
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "mt-1 text-xs text-[var(--muted)]",
										children: [
											"Ocupacion media ",
											formatPercent$1(payload.weekdayWeekendProfile.weekday.avgOccupancy),
											" · ",
											payload.weekdayWeekendProfile.weekday.daysCount,
											" dias"
										]
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
										children: "Fin de semana"
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "mt-2 text-xl font-black text-[var(--foreground)]",
										children: [payload.weekdayWeekendProfile.weekend.avgDemand.toFixed(1), " pts"]
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "mt-1 text-xs text-[var(--muted)]",
										children: [
											"Ocupacion media ",
											formatPercent$1(payload.weekdayWeekendProfile.weekend.avgOccupancy),
											" · ",
											payload.weekdayWeekendProfile.weekend.daysCount,
											" dias"
										]
									})
								]
							})]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-3 text-xs text-[var(--muted)]",
							children: ["Variacion relativa fin de semana vs laborable: ", formatDelta(payload.weekdayWeekendProfile.demandGapRatio)]
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-base font-bold text-[var(--foreground)]",
							children: "Horas pico de demanda"
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-[var(--muted)]",
							children: getPeriodCaption(payload.selectedMonth, "Ultimos 7 dias")
						})]
					}), payload.peakDemandHours.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "mt-4 text-sm text-[var(--muted)]",
						children: "Todavia no hay suficiente historico horario para detectar picos."
					}) : /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-3",
						children: payload.peakDemandHours.map((slot, index) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: formatHourLabel(slot.hour)
							}), /* @__PURE__ */ jsx("p", {
								className: "text-[11px] text-[var(--muted)]",
								children: "Franja con mayor actividad agregada"
							})] }), /* @__PURE__ */ jsxs("p", {
								className: "text-xs font-bold text-[var(--foreground)]",
								children: [formatInteger$1(slot.demandScore), " pts"]
							})]
						}, `${slot.hour}-${index}`))
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-base font-bold text-[var(--foreground)]",
							children: "Barrios con mas demanda"
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-[var(--muted)]",
							children: getPeriodCaption(payload.selectedMonth, "Ultimos 7 dias")
						})]
					}), payload.topDistrictsByDemand.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "mt-4 text-sm text-[var(--muted)]",
						children: "No se ha podido agrupar la demanda por barrios todavia."
					}) : /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-3",
						children: payload.topDistrictsByDemand.map((district, index) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: district.district
							}), /* @__PURE__ */ jsx("p", {
								className: "text-[11px] text-[var(--muted)]",
								children: "Mayor intensidad agregada de uso reciente"
							})] }), /* @__PURE__ */ jsxs("p", {
								className: "text-xs font-bold text-[var(--foreground)]",
								children: [formatInteger$1(district.demandScore), " pts"]
							})]
						}, `${district.district}-${index}`))
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 xl:grid-cols-2",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: payload.selectedMonth ? "Estaciones con mayor demanda media del mes" : "Estaciones con mayor demanda media (30 dias)"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-[var(--muted)]",
						children: payload.selectedMonth ? getPeriodCaption(payload.selectedMonth, "") : "Actualizacion diaria en cache de BD"
					})]
				}), payload.topStationsByDemand.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-[var(--muted)]",
					children: "Sin ranking de estaciones disponible todavia."
				}) : /* @__PURE__ */ jsx("div", {
					className: "mt-4 space-y-2",
					children: payload.topStationsByDemand.map((station, index) => /* @__PURE__ */ jsxs(Link, {
						href: appRoutes.dashboardStation(station.stationId),
						className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex min-w-0 items-center gap-3",
							children: [/* @__PURE__ */ jsx("span", {
								className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]",
								children: index + 1
							}), /* @__PURE__ */ jsxs("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ jsx("p", {
									className: "truncate text-sm font-semibold text-[var(--foreground)]",
									children: station.stationName
								}), /* @__PURE__ */ jsxs("p", {
									className: "text-[11px] text-[var(--muted)]",
									children: ["ID ", station.stationId]
								})]
							})]
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-xs font-bold text-[var(--foreground)]",
							children: ["Indice ", station.avgDemand.toFixed(1)]
						})]
					}, station.stationId))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: payload.selectedMonth ? "Estaciones menos usadas del mes" : "Estaciones menos usadas"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-[var(--muted)]",
						children: "Tambien enlaza al detalle"
					})]
				}), payload.leastUsedStations.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-[var(--muted)]",
					children: "Sin ranking de estaciones menos usadas disponible todavia."
				}) : /* @__PURE__ */ jsx("div", {
					className: "mt-4 space-y-2",
					children: payload.leastUsedStations.map((station, index) => /* @__PURE__ */ jsxs(Link, {
						href: appRoutes.dashboardStation(station.stationId),
						className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex min-w-0 items-center gap-3",
							children: [/* @__PURE__ */ jsx("span", {
								className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)]/8 text-xs font-bold text-[var(--foreground)]",
								children: index + 1
							}), /* @__PURE__ */ jsxs("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ jsx("p", {
									className: "truncate text-sm font-semibold text-[var(--foreground)]",
									children: station.stationName
								}), /* @__PURE__ */ jsxs("p", {
									className: "text-[11px] text-[var(--muted)]",
									children: ["ID ", station.stationId]
								})]
							})]
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-xs font-bold text-[var(--foreground)]",
							children: ["Indice ", station.avgDemand.toFixed(1)]
						})]
					}, station.stationId))
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 xl:grid-cols-2",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: "Informes mensuales publicados"
					}), /* @__PURE__ */ jsx(Link, {
						href: appRoutes.reports(),
						className: "text-xs font-bold text-[var(--primary)] transition hover:opacity-80",
						children: "Ver archivo completo"
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-4 space-y-2",
					children: availableMonths.months.slice(0, 6).map((month) => /* @__PURE__ */ jsxs(Link, {
						href: appRoutes.reportMonth(month),
						className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: ["Informe ", toMonthOptions([month])[0]?.label ?? month]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-[11px] text-[var(--muted)]",
							children: "URL indexable permanente con resumen y enlaces al dashboard filtrado."
						})] }), /* @__PURE__ */ jsx("span", {
							className: "text-xs font-bold text-[var(--primary)]",
							children: "Abrir"
						})]
					}, month))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: "Landings SEO relacionadas"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-[var(--muted)]",
						children: "Enlazadas al dashboard y al detalle de estaciones"
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-4 grid gap-2 md:grid-cols-2",
					children: [
						[appRoutes.dashboardStations(), "Estaciones mas usadas"],
						[`${appRoutes.dashboard()}?rankingTab=turnover`, "Ranking de estaciones"],
						[appRoutes.dashboardFlow(), "Viajes por dia"],
						[appRoutes.reports(), "Viajes por mes"]
					].map(([href, label]) => /* @__PURE__ */ jsx(Link, {
						href,
						className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)]",
						children: label
					}, href))
				})]
			})]
		})
	] });
}
//#endregion
//#region src/app/dashboard/ayuda/_components/help-center-selectors.ts
var CATEGORY_PRIORITY_MAP = new Map(CATEGORY_PRIORITY.map((category, index) => [category, index]));
var FAQ_PRIORITY_MAP = new Map(FAQ_PRIORITY_IDS.map((faqId, index) => [faqId, index]));
var FAQ_INDEX_MAP = new Map(FAQ_ITEMS.map((item, index) => [item.id, index]));
function normalizeText(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function compareCategories(a, b) {
	const rankA = CATEGORY_PRIORITY_MAP.get(a) ?? Number.MAX_SAFE_INTEGER;
	const rankB = CATEGORY_PRIORITY_MAP.get(b) ?? Number.MAX_SAFE_INTEGER;
	if (rankA !== rankB) return rankA - rankB;
	return a.localeCompare(b, "es-ES");
}
function compareFaqItems(a, b) {
	const rankA = FAQ_PRIORITY_MAP.get(a.id) ?? Number.MAX_SAFE_INTEGER;
	const rankB = FAQ_PRIORITY_MAP.get(b.id) ?? Number.MAX_SAFE_INTEGER;
	if (rankA !== rankB) return rankA - rankB;
	return (FAQ_INDEX_MAP.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (FAQ_INDEX_MAP.get(b.id) ?? Number.MAX_SAFE_INTEGER);
}
function formatDateTime$1(value) {
	if (!value) return "Sin datos";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "Sin datos";
	return parsed.toLocaleString("es-ES");
}
function getHelpCenterCategories() {
	const uniqueCategories = new Set(FAQ_ITEMS.map((item) => item.category));
	return Array.from(uniqueCategories.values()).sort(compareCategories);
}
function filterHelpCenterFaqItems(params) {
	const normalizedQuery = normalizeText(params.query);
	return FAQ_ITEMS.filter((item) => {
		if (params.activeCategory && item.category !== params.activeCategory) return false;
		if (!normalizedQuery) return true;
		return normalizeText(`${item.category} ${item.question} ${item.answer}`).includes(normalizedQuery);
	});
}
function groupHelpCenterFaqItems(items) {
	const sortedItems = [...items].sort((a, b) => {
		const categoryDiff = compareCategories(a.category, b.category);
		if (categoryDiff !== 0) return categoryDiff;
		return compareFaqItems(a, b);
	});
	const map = /* @__PURE__ */ new Map();
	for (const item of sortedItems) {
		const rows = map.get(item.category) ?? [];
		rows.push(item);
		map.set(item.category, rows);
	}
	return Array.from(map.entries());
}
function getHelpCenterCategoryCounts() {
	const counts = /* @__PURE__ */ new Map();
	for (const item of FAQ_ITEMS) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
	return counts;
}
function getHelpCenterCategoryMatchesBySearch(params) {
	const normalizedQuery = normalizeText(params.query);
	const counts = /* @__PURE__ */ new Map();
	for (const category of params.categories) counts.set(category, 0);
	for (const item of FAQ_ITEMS) {
		if (!normalizedQuery) {
			counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
			continue;
		}
		if (normalizeText(`${item.category} ${item.question} ${item.answer}`).includes(normalizedQuery)) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
	}
	return counts;
}
function buildHelpCenterFaqStructuredData() {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: FAQ_ITEMS.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer
			}
		}))
	};
}
//#endregion
//#region src/app/dashboard/ayuda/_components/HelpCenterClient.tsx
init_TrackedAnchor();
init_accordion();
init_badge();
init_button();
init_input();
init_routes();
init_umami();
init_DashboardPageViewTracker();
var HELP_CENTER_FAQ_STRUCTURED_DATA = buildHelpCenterFaqStructuredData();
var HELP_CENTER_CATEGORIES = getHelpCenterCategories();
var HELP_CENTER_CATEGORY_COUNTS = getHelpCenterCategoryCounts();
function HelpCenterClient({ historyMeta }) {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState(null);
	const [openItemId, setOpenItemId] = useState(FAQ_ITEMS[0]?.id ?? "");
	const breadcrumbs = [
		{
			label: "Inicio",
			href: appRoutes.home()
		},
		{
			label: "Dashboard",
			href: appRoutes.dashboard()
		},
		{
			label: "Ayuda",
			href: appRoutes.dashboardHelp()
		}
	];
	const normalizedQuery = useMemo(() => normalizeText(query), [query]);
	const filteredItems = useMemo(() => {
		return filterHelpCenterFaqItems({
			query,
			activeCategory
		});
	}, [activeCategory, query]);
	const categories = HELP_CENTER_CATEGORIES;
	const groupedItems = useMemo(() => {
		return groupHelpCenterFaqItems(filteredItems);
	}, [filteredItems]);
	const categoryCounts = HELP_CENTER_CATEGORY_COUNTS;
	const categoryMatchesBySearch = useMemo(() => {
		return getHelpCenterCategoryMatchesBySearch({
			categories,
			query
		});
	}, [categories, query]);
	const faqStructuredData = HELP_CENTER_FAQ_STRUCTURED_DATA;
	const showFilteredCount = normalizedQuery.length > 0 || activeCategory !== null;
	const resolvedOpenItemId = filteredItems.length === 0 ? "" : filteredItems.some((item) => item.id === openItemId) ? openItemId : filteredItems[0]?.id ?? "";
	return /* @__PURE__ */ jsxs("div", {
		className: "relative flex min-h-screen w-full flex-col overflow-x-hidden",
		children: [
			/* @__PURE__ */ jsx(DashboardPageViewTracker, {
				routeKey: "dashboard_help",
				pageType: "dashboard",
				template: "help_center"
			}),
			/* @__PURE__ */ jsx("script", {
				type: "application/ld+json",
				suppressHydrationWarning: true,
				dangerouslySetInnerHTML: { __html: JSON.stringify(faqStructuredData) }
			}),
			/* @__PURE__ */ jsx(PageHeaderCard, {
				className: "px-6 py-4 md:px-10",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex w-full max-w-5xl items-center justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-8",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3 text-[var(--primary)]",
							children: [/* @__PURE__ */ jsx("div", {
								className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white",
								children: "B"
							}), /* @__PURE__ */ jsx("h2", {
								className: "text-lg font-bold text-[var(--foreground)]",
								children: "Bizi Zaragoza"
							})]
						}), /* @__PURE__ */ jsx(DashboardRouteLinks, {
							activeRoute: "help",
							routes: [
								"dashboard",
								"stations",
								"flow",
								"conclusions",
								"help"
							],
							variant: "inline",
							className: "hidden items-center gap-6 md:flex"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-end gap-3",
						children: [
							/* @__PURE__ */ jsxs("label", {
								htmlFor: "help-search-desktop",
								className: "hidden items-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 sm:flex",
								children: [/* @__PURE__ */ jsx("span", {
									className: "sr-only",
									children: "Buscar ayuda o preguntas frecuentes"
								}), /* @__PURE__ */ jsx(Input, {
									id: "help-search-desktop",
									type: "text",
									value: query,
									onChange: (event) => setQuery(event.target.value),
									className: "h-auto min-h-0 w-44 border-0 bg-transparent px-0 py-0 text-sm text-[var(--foreground)] shadow-none outline-none placeholder:text-[var(--muted)] focus:border-0",
									placeholder: "Buscar ayuda..."
								})]
							}),
							/* @__PURE__ */ jsx(DashboardRouteLinks, {
								activeRoute: "help",
								routes: [
									"dashboard",
									"stations",
									"flow",
									"conclusions",
									"help"
								],
								variant: "chips",
								className: "flex flex-wrap items-center gap-2 md:hidden"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.api.history(),
								trackingEvent: buildExportClickEvent({
									surface: "dashboard",
									routeKey: "dashboard_help",
									source: "help_header",
									ctaId: "history_json",
									entityType: "api",
									module: "help_header"
								}),
								className: "ui-icon-button",
								children: "Historico"
							}),
							/* @__PURE__ */ jsx(ThemeToggleButton, {}),
							/* @__PURE__ */ jsx(GitHubRepoButton, {})
						]
					})]
				})
			}),
			/* @__PURE__ */ jsxs("main", {
				className: "mx-auto w-full max-w-5xl px-6 py-10",
				children: [
					/* @__PURE__ */ jsx(SiteBreadcrumbs, {
						items: breadcrumbs,
						className: "mb-6"
					}),
					/* @__PURE__ */ jsxs("label", {
						htmlFor: "help-search-mobile",
						className: "mb-6 flex items-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm sm:hidden",
						children: [/* @__PURE__ */ jsx("span", {
							className: "sr-only",
							children: "Buscar ayuda o preguntas frecuentes"
						}), /* @__PURE__ */ jsx(Input, {
							id: "help-search-mobile",
							type: "text",
							value: query,
							onChange: (event) => setQuery(event.target.value),
							className: "h-auto min-h-0 w-full border-0 bg-transparent px-0 py-0 text-sm text-[var(--foreground)] shadow-none outline-none placeholder:text-[var(--muted)] focus:border-0",
							placeholder: "Buscar ayuda..."
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "max-w-2xl",
							children: [
								/* @__PURE__ */ jsx(Badge, {
									className: "mb-4 px-3 py-1 text-xs font-bold tracking-[0.14em]",
									children: "Centro de ayuda"
								}),
								/* @__PURE__ */ jsx("h1", {
									className: "text-4xl font-black leading-tight tracking-tight text-[var(--foreground)] md:text-5xl",
									children: "Preguntas frecuentes"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-4 text-lg text-[var(--muted)]",
									children: "Explora nuestra metodologia y resuelve dudas sobre como procesamos los datos de Bizi Zaragoza en tiempo real."
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)]",
									children: [
										/* @__PURE__ */ jsxs("span", {
											className: "rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1",
											children: [filteredItems.length, " preguntas visibles"]
										}),
										activeCategory ? /* @__PURE__ */ jsxs(Button, {
											variant: "ghost",
											onClick: () => setActiveCategory(null),
											className: "h-auto min-h-0 rounded-full border border-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
											children: [
												"Categoria: ",
												activeCategory,
												" ×"
											]
										}) : null,
										normalizedQuery ? /* @__PURE__ */ jsxs(Button, {
											variant: "ghost",
											onClick: () => setQuery(""),
											className: "h-auto min-h-0 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 transition hover:border-[var(--primary)] hover:text-[var(--primary)]",
											children: [
												"Buscar: ",
												query,
												" ×"
											]
										}) : null
									]
								})
							]
						}), /* @__PURE__ */ jsxs("aside", {
							className: "w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
									children: "Cobertura de datos"
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-1 text-sm text-[var(--foreground)]",
									children: ["Datos desde: ", /* @__PURE__ */ jsx("span", {
										className: "font-semibold",
										children: formatDateTime$1(historyMeta?.coverage?.firstRecordedAt)
									})]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: ["Ultima muestra: ", formatDateTime$1(historyMeta?.coverage?.lastRecordedAt)]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: [
										"Dias disponibles: ",
										historyMeta?.coverage?.totalDays ?? 0,
										" · Estaciones activas:",
										" ",
										historyMeta?.coverage?.totalStations ?? 0
									]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-3 text-xs text-[var(--muted)]",
									children: ["Fuente: ", historyMeta?.source?.provider ?? "Bizi Zaragoza GBFS"]
								}),
								/* @__PURE__ */ jsx(TrackedAnchor, {
									href: historyMeta?.source?.gbfsDiscoveryUrl ?? "https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json",
									target: "_blank",
									rel: "noreferrer",
									trackingEvent: buildCtaClickEvent({
										surface: "dashboard",
										routeKey: "dashboard_help",
										source: "help_coverage",
										ctaId: "source_feed_open",
										destination: "gbfs_feed",
										isExternal: true
									}),
									className: "mt-1 inline-flex text-xs font-semibold text-[var(--primary)] underline decoration-[var(--primary)]/40 underline-offset-2",
									children: "Ver feed de origen"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-4 flex flex-wrap gap-2",
									children: [/* @__PURE__ */ jsx(TrackedLink, {
										href: appRoutes.api.history(),
										trackingEvent: buildExportClickEvent({
											surface: "dashboard",
											routeKey: "dashboard_help",
											source: "help_coverage",
											ctaId: "history_json",
											entityType: "api",
											module: "help_coverage"
										}),
										className: "rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white",
										children: "Ver historico completo"
									}), /* @__PURE__ */ jsx(TrackedLink, {
										href: appRoutes.api.openApi(),
										trackingEvent: buildCtaClickEvent({
											surface: "dashboard",
											routeKey: "dashboard_help",
											source: "help_coverage",
											ctaId: "api_open",
											destination: "openapi",
											entityType: "api"
										}),
										className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-xs font-bold text-[var(--foreground)]",
										children: "Definicion API"
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3",
						children: categories.map((category) => {
							const isCategoryFilterActive = activeCategory === category;
							const categoryMatches = categoryMatchesBySearch.get(category) ?? 0;
							const totalInCategory = categoryCounts.get(category) ?? 0;
							return /* @__PURE__ */ jsxs(Button, {
								variant: "ghost",
								onClick: () => {
									const nextCategory = activeCategory === category ? null : category;
									trackUmamiEvent(buildPanelOpenEvent({
										surface: "dashboard",
										routeKey: "dashboard_help",
										module: nextCategory ? "faq_category" : "faq_category_reset",
										source: category
									}));
									setActiveCategory(nextCategory);
								},
								"aria-pressed": isCategoryFilterActive,
								className: `h-auto min-h-0 w-full flex-col items-start justify-start rounded-xl border bg-[var(--card)] p-6 text-left transition hover:border-[var(--primary)] ${isCategoryFilterActive ? "border-[var(--primary)] bg-[var(--primary)]/6 shadow-[0_0_0_1px_var(--primary-soft)]" : "border-[var(--border)]"}`,
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "mb-4 flex items-start justify-between gap-3",
										children: [/* @__PURE__ */ jsx("div", {
											className: "flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-xl font-black text-[var(--primary)]",
											children: category.slice(0, 1)
										}), /* @__PURE__ */ jsxs("span", {
											className: `rounded-full px-2.5 py-1 text-[11px] font-bold ${isCategoryFilterActive ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)]"}`,
											children: [
												categoryMatches,
												"/",
												totalInCategory
											]
										})]
									}),
									/* @__PURE__ */ jsx("h3", {
										className: "text-xl font-bold text-[var(--foreground)]",
										children: category
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-2 text-sm text-[var(--muted)]",
										children: showFilteredCount ? `${categoryMatches} de ${totalInCategory} preguntas coinciden.` : `${totalInCategory} preguntas disponibles.`
									})
								]
							}, category);
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-14 space-y-8",
						children: groupedItems.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted)]",
							children: "No hay coincidencias para la busqueda actual."
						}) : groupedItems.map(([category, items]) => /* @__PURE__ */ jsxs("section", {
							className: "space-y-4",
							children: [/* @__PURE__ */ jsxs("h2", {
								className: "flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]",
								children: [
									/* @__PURE__ */ jsx("span", { className: "h-1 w-8 rounded-full bg-[var(--primary)]" }),
									category,
									/* @__PURE__ */ jsx("span", {
										className: "rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)]",
										children: items.length
									})
								]
							}), /* @__PURE__ */ jsx(Accordion, {
								className: "space-y-3",
								value: resolvedOpenItemId ? [resolvedOpenItemId] : [],
								onValueChange: (value) => setOpenItemId(value[0] ?? ""),
								children: items.map((item) => /* @__PURE__ */ jsxs(AccordionItem, {
									value: item.id,
									className: "overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]",
									children: [/* @__PURE__ */ jsx(AccordionTrigger, {
										className: "h-auto min-h-0 px-5 py-4",
										children: /* @__PURE__ */ jsx("p", {
											className: "text-base font-semibold text-[var(--foreground)]",
											children: item.question
										})
									}), /* @__PURE__ */ jsx(AccordionContent, {
										className: "px-5 py-4 text-sm leading-relaxed text-[var(--muted)]",
										children: item.answer
									})]
								}, item.id))
							})]
						}, category))
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "relative mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 p-8 text-white",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "max-w-md",
							children: [/* @__PURE__ */ jsx("h2", {
								className: "text-2xl font-bold",
								children: "No encontraste lo que buscabas?"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-sm text-white/85",
								children: "Si necesitas soporte directo o quieres compartir feedback, usa el acceso dedicado y deja contexto sobre la vista, la estacion o el problema detectado."
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-6 flex flex-wrap gap-3",
							children: [/* @__PURE__ */ jsx(FeedbackCta, {
								source: "help_support_block",
								ctaId: "feedback_help_open",
								module: "help_support_block",
								className: "rounded-lg bg-white px-6 py-3 text-sm font-bold text-[var(--primary)] transition hover:bg-white/90",
								pendingClassName: "rounded-lg border border-white/30 bg-black/20 px-6 py-3 text-sm font-bold text-white/80",
								pendingLabel: "Feedback pronto",
								children: "Enviar feedback"
							}), /* @__PURE__ */ jsx("a", {
								href: "https://www.linkedin.com/in/guillermocastella/",
								target: "_blank",
								rel: "noreferrer",
								className: "rounded-lg border border-white/30 bg-black/20 px-6 py-3 text-sm font-bold text-white",
								children: "Contacto"
							})]
						})]
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/ayuda.tsx
init_routes();
function buildFallbackHistoryMetadata(nowIso) {
	return {
		source: getSharedDataSource(),
		coverage: {
			firstRecordedAt: null,
			lastRecordedAt: null,
			totalSamples: 0,
			totalStations: 0,
			totalDays: 0,
			generatedAt: nowIso
		},
		generatedAt: nowIso
	};
}
var Route$7 = createFileRoute("/dashboard/ayuda")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "FAQ del dashboard de Bizi Zaragoza para entender alertas, rankings, movilidad, predicciones y metodologia de calculo."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Centro de ayuda"
	}),
	loader: async () => {
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		return { historyMeta: await fetchHistoryMetadata().catch(() => buildFallbackHistoryMetadata(nowIso)) };
	},
	component: DashboardHelpPage
});
function DashboardHelpPage() {
	const { historyMeta } = Route$7.useLoaderData();
	return /* @__PURE__ */ jsx(HelpCenterClient, { historyMeta });
}
//#endregion
//#region src/app/dashboard/alertas/_components/AlertsHistoryClient.tsx
init_button();
init_card();
init_input();
init_scroll_area();
init_select();
init_table();
init_routes();
init_sentry_reporting();
init_page_shell();
var PAGE_SIZE = 100;
var DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
var ALL_STATIONS_VALUE = "__all_stations__";
function formatDateTime(value) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return value;
	return parsed.toLocaleString("es-ES");
}
function parseAlertTypeFilter(value) {
	if (value === "LOW_BIKES" || value === "LOW_ANCHORS") return value;
	return "all";
}
function parseStateFilter(value) {
	if (value === "active" || value === "resolved") return value;
	return "all";
}
function parseSeverityFilter(value) {
	if (value === "1" || value === "2") return value;
	return "all";
}
function parseDateInput(value) {
	if (!value || !DATE_INPUT_PATTERN.test(value)) return "";
	return value;
}
function parsePageIndex(value) {
	if (!value) return 0;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) return 0;
	return parsed - 1;
}
function toLocalDateInputValue(date) {
	return (/* @__PURE__ */ new Date(date.getTime() - date.getTimezoneOffset() * 6e4)).toISOString().slice(0, 10);
}
function getRangeForLastDays(days) {
	const end = /* @__PURE__ */ new Date();
	const start = new Date(end);
	start.setDate(end.getDate() - Math.max(days - 1, 0));
	return {
		fromDate: toLocalDateInputValue(start),
		toDate: toLocalDateInputValue(end)
	};
}
function parseViewStateFromSearchParams(params, stations) {
	const stationIdCandidate = (params.get("stationId") ?? "").trim();
	return {
		stationId: Boolean(stationIdCandidate) && (stations.length === 0 || stations.some((station) => station.id === stationIdCandidate)) ? stationIdCandidate : "",
		alertType: parseAlertTypeFilter(params.get("alertType")),
		stateFilter: parseStateFilter(params.get("state")),
		severityFilter: parseSeverityFilter(params.get("severity")),
		fromDate: parseDateInput(params.get("from")),
		toDate: parseDateInput(params.get("to")),
		page: parsePageIndex(params.get("page"))
	};
}
function buildViewQueryFromState(state) {
	const params = new URLSearchParams();
	if (state.stationId) params.set("stationId", state.stationId);
	if (state.alertType !== "all") params.set("alertType", state.alertType);
	if (state.stateFilter !== "all") params.set("state", state.stateFilter);
	if (state.severityFilter !== "all") params.set("severity", state.severityFilter);
	if (state.fromDate) params.set("from", state.fromDate);
	if (state.toDate) params.set("to", state.toDate);
	if (state.page > 0) params.set("page", String(state.page + 1));
	return params.toString();
}
function AlertsHistoryClient({ stations }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [stationId, setStationId] = useState("");
	const [alertType, setAlertType] = useState("all");
	const [stateFilter, setStateFilter] = useState("all");
	const [severityFilter, setSeverityFilter] = useState("all");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [page, setPage] = useState(0);
	const [isUrlReady, setIsUrlReady] = useState(false);
	const lastSyncedUrlRef = useRef(null);
	const prevStationsLengthRef = useRef(-1);
	const [rows, setRows] = useState([]);
	const [totalRows, setTotalRows] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState(null);
	const apiQueryString = useMemo(() => {
		const params = new URLSearchParams();
		params.set("limit", String(PAGE_SIZE));
		params.set("offset", String(page * PAGE_SIZE));
		if (stationId) params.set("stationId", stationId);
		if (alertType !== "all") params.set("alertType", alertType);
		if (stateFilter !== "all") params.set("state", stateFilter);
		if (severityFilter !== "all") params.set("severity", severityFilter);
		if (fromDate) params.set("from", `${fromDate}T00:00:00.000Z`);
		if (toDate) params.set("to", `${toDate}T23:59:59.999Z`);
		return params.toString();
	}, [
		alertType,
		fromDate,
		page,
		severityFilter,
		stateFilter,
		stationId,
		toDate
	]);
	const viewQueryString = useMemo(() => buildViewQueryFromState({
		stationId,
		alertType,
		stateFilter,
		severityFilter,
		fromDate,
		toDate,
		page
	}), [
		alertType,
		fromDate,
		page,
		severityFilter,
		stateFilter,
		stationId,
		toDate
	]);
	useEffect(() => {
		const serialized = searchParams.toString();
		const urlChanged = lastSyncedUrlRef.current === null || serialized !== lastSyncedUrlRef.current;
		const stationsJustHydrated = prevStationsLengthRef.current === 0 && stations.length > 0 && !urlChanged;
		if (!urlChanged && !stationsJustHydrated) {
			prevStationsLengthRef.current = stations.length;
			setIsUrlReady(true);
			return;
		}
		const parsedState = parseViewStateFromSearchParams(new URLSearchParams(serialized), stations);
		setStationId(parsedState.stationId);
		setAlertType(parsedState.alertType);
		setStateFilter(parsedState.stateFilter);
		setSeverityFilter(parsedState.severityFilter);
		setFromDate(parsedState.fromDate);
		setToDate(parsedState.toDate);
		setPage(parsedState.page);
		if (urlChanged) lastSyncedUrlRef.current = serialized;
		prevStationsLengthRef.current = stations.length;
		setIsUrlReady(true);
	}, [searchParams, stations]);
	useEffect(() => {
		if (!isUrlReady) return;
		if (buildViewQueryFromState(parseViewStateFromSearchParams(new URLSearchParams(window.location.search), stations)) === viewQueryString) return;
		const nextUrl = viewQueryString.length > 0 ? `${pathname}?${viewQueryString}` : pathname;
		router.replace(nextUrl, { scroll: false });
	}, [
		isUrlReady,
		pathname,
		router,
		stations,
		viewQueryString
	]);
	useAbortableAsyncEffect(async (signal, isActive) => {
		try {
			const payload = await fetchJson(`${appRoutes.api.alertsHistory()}?${apiQueryString}`, {
				signal,
				cache: "no-store",
				errorMessage: "No se pudo cargar el historial de alertas."
			});
			if (!isActive()) return;
			setRows(Array.isArray(payload.alerts) ? payload.alerts : []);
			setTotalRows(Number(payload.pagination?.total ?? 0));
		} catch (error) {
			if (!isActive()) return;
			captureExceptionWithContext(error, {
				area: "dashboard.alerts-history",
				operation: "loadHistory",
				extra: { query: apiQueryString }
			});
			console.error("[Dashboard] Error cargando historial de alertas.", error);
			setRows([]);
			setTotalRows(0);
			setErrorMessage("No se pudo cargar el historial de alertas.");
		}
	}, [apiQueryString], {
		onStart: () => {
			setIsLoading(true);
			setErrorMessage(null);
		},
		onSettled: () => {
			setIsLoading(false);
		}
	});
	const pageCount = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
	const hasNextPage = page + 1 < pageCount;
	const hasPreviousPage = page > 0;
	const stats = useMemo(() => {
		return {
			active: rows.filter((row) => row.isActive).length,
			critical: rows.filter((row) => row.severity >= 2).length
		};
	}, [rows]);
	const copyToClipboard = useCallback(() => {
		const text = [[
			"Fecha",
			"Estación",
			"ID",
			"Tipo",
			"Severidad",
			"Estado",
			"Valor",
			"Ventana"
		], ...rows.map((row) => [
			formatDateTime(row.generatedAt),
			row.stationName,
			row.stationId,
			formatAlertType(row.alertType),
			row.severity >= 2 ? "Crítica" : "Media",
			row.isActive ? "Activa" : "Resuelta",
			row.metricValue.toFixed(1),
			`${row.windowHours}h`
		])].map((row) => row.join("	")).join("\n");
		navigator.clipboard.writeText(text);
	}, [rows]);
	const downloadCsvHref = useMemo(() => {
		const params = new URLSearchParams(apiQueryString);
		params.set("offset", "0");
		params.set("limit", "2000");
		params.set("format", "csv");
		return `${appRoutes.api.alertsHistory()}?${params.toString()}`;
	}, [apiQueryString]);
	const activeQuickRange = useMemo(() => {
		if (!fromDate || !toDate) return null;
		const today = getRangeForLastDays(1);
		const last7Days = getRangeForLastDays(7);
		const last30Days = getRangeForLastDays(30);
		if (fromDate === today.fromDate && toDate === today.toDate) return "today";
		if (fromDate === last7Days.fromDate && toDate === last7Days.toDate) return "last7";
		if (fromDate === last30Days.fromDate && toDate === last30Days.toDate) return "last30";
		return null;
	}, [fromDate, toDate]);
	const hasActiveFilters = stationId.length > 0 || alertType !== "all" || stateFilter !== "all" || severityFilter !== "all" || fromDate.length > 0 || toDate.length > 0 || page > 0;
	const applyQuickRange = (days) => {
		const range = getRangeForLastDays(days);
		setFromDate(range.fromDate);
		setToDate(range.toDate);
		setPage(0);
	};
	const clearFilters = () => {
		setStationId("");
		setAlertType("all");
		setStateFilter("all");
		setSeverityFilter("all");
		setFromDate("");
		setToDate("");
		setPage(0);
	};
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsxs(PageHeaderCard, { children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3 text-[var(--primary)]",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white",
							children: "B"
						}), /* @__PURE__ */ jsx("h1", {
							className: "text-lg font-bold text-[var(--foreground)]",
							children: "Historial de alertas"
						})]
					}), /* @__PURE__ */ jsx(DashboardRouteLinks, {
						routes: [
							"dashboard",
							"stations",
							"flow",
							"conclusions",
							"help"
						],
						variant: "inline",
						className: "hidden items-center gap-5 md:flex"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-end gap-2",
					children: [
						/* @__PURE__ */ jsx(DashboardRouteLinks, {
							routes: [
								"dashboard",
								"stations",
								"flow",
								"conclusions",
								"help"
							],
							variant: "chips",
							className: "flex flex-wrap items-center gap-2 md:hidden"
						}),
						/* @__PURE__ */ jsx(Link, {
							to: appRoutes.dashboard(),
							className: "ui-icon-button",
							"aria-label": "Volver al dashboard",
							children: "Inicio"
						}),
						/* @__PURE__ */ jsx(ThemeToggleButton, {}),
						/* @__PURE__ */ jsx(GitHubRepoButton, {})
					]
				})]
			}),
			/* @__PURE__ */ jsx(CitySwitcher, {
				compact: true,
				className: "mt-3"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-6",
				children: [
					/* @__PURE__ */ jsxs(Select$1, {
						value: stationId || ALL_STATIONS_VALUE,
						onValueChange: (value) => {
							setStationId(!value || value === ALL_STATIONS_VALUE ? "" : value);
							setPage(0);
						},
						children: [/* @__PURE__ */ jsxs(SelectTrigger, {
							"aria-label": "Filtrar por estación",
							className: "w-full bg-[var(--secondary)]",
							children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
							value: ALL_STATIONS_VALUE,
							children: "Todas las estaciones"
						}), stations.map((station) => /* @__PURE__ */ jsx(SelectItem, {
							value: station.id,
							children: station.name
						}, station.id))] })]
					}),
					/* @__PURE__ */ jsxs(Select$1, {
						value: alertType,
						onValueChange: (value) => {
							setAlertType(value ?? "all");
							setPage(0);
						},
						children: [/* @__PURE__ */ jsxs(SelectTrigger, {
							"aria-label": "Filtrar por tipo de alerta",
							className: "w-full bg-[var(--secondary)]",
							children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [
							/* @__PURE__ */ jsx(SelectItem, {
								value: "all",
								children: "Todos los tipos"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "LOW_BIKES",
								children: "Pocas bicis"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "LOW_ANCHORS",
								children: "Pocos anclajes"
							})
						] })]
					}),
					/* @__PURE__ */ jsxs(Select$1, {
						value: stateFilter,
						onValueChange: (value) => {
							setStateFilter(value ?? "all");
							setPage(0);
						},
						children: [/* @__PURE__ */ jsxs(SelectTrigger, {
							"aria-label": "Filtrar por estado",
							className: "w-full bg-[var(--secondary)]",
							children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [
							/* @__PURE__ */ jsx(SelectItem, {
								value: "all",
								children: "Todos los estados"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "active",
								children: "Activas"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "resolved",
								children: "Resueltas"
							})
						] })]
					}),
					/* @__PURE__ */ jsxs(Select$1, {
						value: severityFilter,
						onValueChange: (value) => {
							setSeverityFilter(value ?? "all");
							setPage(0);
						},
						children: [/* @__PURE__ */ jsxs(SelectTrigger, {
							"aria-label": "Filtrar por severidad",
							className: "w-full bg-[var(--secondary)]",
							children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [
							/* @__PURE__ */ jsx(SelectItem, {
								value: "all",
								children: "Todas las severidades"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "1",
								children: "Media"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "2",
								children: "Critica"
							})
						] })]
					}),
					/* @__PURE__ */ jsx(Input, {
						type: "date",
						value: fromDate,
						onChange: (event) => {
							setFromDate(event.target.value);
							setPage(0);
						},
						"aria-label": "Fecha desde",
						className: "bg-[var(--secondary)]"
					}),
					/* @__PURE__ */ jsx(Input, {
						type: "date",
						value: toDate,
						onChange: (event) => {
							setToDate(event.target.value);
							setPage(0);
						},
						"aria-label": "Fecha hasta",
						className: "bg-[var(--secondary)]"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]",
						children: "Rangos rapidos"
					}),
					/* @__PURE__ */ jsx(Button, {
						onClick: () => applyQuickRange(1),
						variant: activeQuickRange === "today" ? "default" : "outline",
						size: "sm",
						className: `rounded-full px-3 py-1 text-xs ${activeQuickRange === "today" ? "border-[var(--primary)]" : "hover:border-[var(--primary)]"}`,
						children: "Hoy"
					}),
					/* @__PURE__ */ jsx(Button, {
						onClick: () => applyQuickRange(7),
						variant: activeQuickRange === "last7" ? "default" : "outline",
						size: "sm",
						className: `rounded-full px-3 py-1 text-xs ${activeQuickRange === "last7" ? "border-[var(--primary)]" : "hover:border-[var(--primary)]"}`,
						children: "7 dias"
					}),
					/* @__PURE__ */ jsx(Button, {
						onClick: () => applyQuickRange(30),
						variant: activeQuickRange === "last30" ? "default" : "outline",
						size: "sm",
						className: `rounded-full px-3 py-1 text-xs ${activeQuickRange === "last30" ? "border-[var(--primary)]" : "hover:border-[var(--primary)]"}`,
						children: "30 dias"
					}),
					/* @__PURE__ */ jsx(Button, {
						onClick: clearFilters,
						disabled: !hasActiveFilters,
						variant: "outline",
						size: "sm",
						className: "rounded-full px-3 py-1 text-xs hover:border-[var(--primary)]",
						children: "Limpiar filtros"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "ml-auto text-xs text-[var(--muted)]",
						children: "La URL refleja los filtros actuales."
					})
				]
			})
		] }),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs(Card, {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Total filtrado"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: totalRows
					})]
				}),
				/* @__PURE__ */ jsxs(Card, {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Activas (pagina)"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: stats.active
					})]
				}),
				/* @__PURE__ */ jsxs(Card, {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Criticas (pagina)"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: stats.critical
					})]
				}),
				/* @__PURE__ */ jsxs(Card, {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Exportar"
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							onClick: copyToClipboard,
							disabled: rows.length === 0,
							variant: "outline",
							size: "sm",
							className: "px-3 py-2 text-xs",
							children: "Copiar"
						}), /* @__PURE__ */ jsx("a", {
							href: downloadCsvHref,
							className: "inline-flex rounded-lg border border-[var(--primary)] px-3 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
							children: "CSV"
						})]
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]",
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: "flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: "Registros de alertas"
					}), /* @__PURE__ */ jsxs("p", {
						className: "text-xs text-[var(--muted)]",
						children: [
							"Pagina ",
							page + 1,
							"/",
							pageCount,
							" · ",
							rows.length,
							" filas"
						]
					})]
				}),
				isLoading ? /* @__PURE__ */ jsx("p", {
					className: "px-4 py-6 text-sm text-[var(--muted)]",
					children: "Cargando historial..."
				}) : errorMessage ? /* @__PURE__ */ jsx("p", {
					className: "px-4 py-6 text-sm text-[var(--muted)]",
					children: errorMessage
				}) : rows.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "px-4 py-6 text-sm text-[var(--muted)]",
					children: "No hay alertas para los filtros actuales."
				}) : /* @__PURE__ */ jsx(ScrollArea, {
					className: "overflow-x-auto max-h-[600px]",
					children: /* @__PURE__ */ jsxs(Table, {
						className: "min-w-full border-collapse text-sm",
						children: [/* @__PURE__ */ jsx(TableHeader, {
							className: "sticky top-0 z-10 bg-[var(--secondary)]",
							children: /* @__PURE__ */ jsxs(TableRow, {
								className: "text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]",
								children: [
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Fecha"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Estacion"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Tipo"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Severidad"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Estado"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Valor"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Ventana"
									})
								]
							})
						}), /* @__PURE__ */ jsx(TableBody, { children: rows.map((row) => /* @__PURE__ */ jsxs(TableRow, {
							className: "border-t border-[var(--border)] text-[var(--foreground)]",
							children: [
								/* @__PURE__ */ jsx(TableCell, {
									className: "whitespace-nowrap px-4 py-3 text-xs text-[var(--muted)]",
									children: formatDateTime(row.generatedAt)
								}),
								/* @__PURE__ */ jsxs(TableCell, {
									className: "px-4 py-3",
									children: [/* @__PURE__ */ jsx("p", {
										className: "font-semibold",
										children: row.stationName
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-[var(--muted)]",
										children: row.stationId
									})]
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "whitespace-nowrap px-4 py-3",
									children: formatAlertType(row.alertType)
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-4 py-3",
									children: /* @__PURE__ */ jsx("span", {
										className: `rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${row.severity >= 2 ? "bg-[var(--primary)]/15 text-[var(--primary)]" : "bg-amber-500/15 text-amber-500"}`,
										children: row.severity >= 2 ? "Critica" : "Media"
									})
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-4 py-3",
									children: /* @__PURE__ */ jsx("span", {
										className: `rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${row.isActive ? "bg-emerald-500/15 text-emerald-500" : "bg-slate-500/15 text-slate-300"}`,
										children: row.isActive ? "Activa" : "Resuelta"
									})
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "whitespace-nowrap px-4 py-3 text-xs",
									children: row.metricValue.toFixed(1)
								}),
								/* @__PURE__ */ jsxs(TableCell, {
									className: "whitespace-nowrap px-4 py-3 text-xs text-[var(--muted)]",
									children: [row.windowHours, "h"]
								})
							]
						}, row.id)) })]
					})
				}),
				/* @__PURE__ */ jsxs("footer", {
					className: "flex items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
					children: [/* @__PURE__ */ jsxs("p", {
						className: "text-xs text-[var(--muted)]",
						children: [
							"Muestra de ",
							PAGE_SIZE,
							" filas por pagina"
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							onClick: () => hasPreviousPage && setPage((current) => current - 1),
							disabled: !hasPreviousPage || isLoading,
							variant: "outline",
							size: "sm",
							className: "text-xs",
							children: "Anterior"
						}), /* @__PURE__ */ jsx(Button, {
							onClick: () => hasNextPage && setPage((current) => current + 1),
							disabled: !hasNextPage || isLoading,
							variant: "outline",
							size: "sm",
							className: "text-xs",
							children: "Siguiente"
						})]
					})]
				})
			]
		})
	] });
}
//#endregion
//#region src/app/dashboard/alertas.tsx
init_routes();
var Route$6 = createFileRoute("/dashboard/alertas")({
	head: () => ({
		meta: [
			{ charset: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: "Consulta alertas activas y resueltas de Bizi Zaragoza para detectar estaciones vacias, llenas o con riesgo operativo."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		title: "Historial de alertas"
	}),
	loader: async () => {
		return { stations: await fetchStations().catch(() => ({
			stations: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		})) };
	},
	component: DashboardAlertsHistoryPage
});
function DashboardAlertsHistoryPage() {
	const { stations } = Route$6.useLoaderData();
	return /* @__PURE__ */ jsx(AlertsHistoryClient, { stations: stations.stations });
}
//#endregion
//#region src/lib/oauth.ts
init_site();
var OAUTH_SCOPE = "public_api.read";
function getOAuthJwtSecret() {
	const configuredSecret = process.env.JWT_SECRET?.trim();
	if (!configuredSecret) return null;
	return new TextEncoder().encode(configuredSecret);
}
function getOAuthIssuer() {
	return getSiteUrl();
}
function getOAuthScope() {
	return OAUTH_SCOPE;
}
function getProtectedResourceMetadataUrl() {
	return `${getSiteUrl()}/.well-known/oauth-protected-resource`;
}
async function verifyOAuthAccessToken(token) {
	const jwtSecret = getOAuthJwtSecret();
	if (!jwtSecret) return null;
	try {
		const { payload } = await jwtVerify(token, jwtSecret, {
			issuer: getOAuthIssuer(),
			audience: getSiteUrl()
		});
		if (payload.tokenUse !== "oauth_access") return null;
		return payload;
	} catch {
		return null;
	}
}
//#endregion
//#region src/lib/security/rate-limit.ts
function normalizeKeyPart(value) {
	if (value === null || value === void 0 || value === "") return "unknown";
	return String(value).replace(/[^a-zA-Z0-9:_-]/g, "_");
}
function getRateLimitHeaders(decision) {
	return {
		"X-RateLimit-Limit": String(decision.limit),
		"X-RateLimit-Remaining": String(decision.remaining),
		"X-RateLimit-Reset": String(Math.ceil(decision.resetAt / 1e3))
	};
}
async function consumeRateLimit(options) {
	const now = Date.now();
	const resetAt = now + options.windowMs;
	const client = await getRedisClient();
	if (!client) {
		updateExecutionContext({ cacheBackend: "redis-unavailable" });
		logger.warn("rate_limit.redis_unavailable", { namespace: options.namespace });
		return {
			allowed: true,
			limit: options.limit,
			remaining: options.limit,
			resetAt,
			retryAfterSeconds: 0,
			backend: "bypass"
		};
	}
	const key = [
		"ratelimit",
		getCity(),
		normalizeKeyPart(options.namespace),
		...options.identifierParts.map((part) => normalizeKeyPart(part))
	].join(":");
	const counter = await client.incr(key);
	if (counter === 1) await client.pExpire(key, options.windowMs);
	let ttlMs = await client.pTTL(key);
	if (ttlMs < 0) {
		ttlMs = options.windowMs;
		await client.pExpire(key, options.windowMs);
	}
	const decision = {
		allowed: counter <= options.limit,
		limit: options.limit,
		remaining: Math.max(0, options.limit - counter),
		resetAt: now + ttlMs,
		retryAfterSeconds: counter <= options.limit ? 0 : Math.max(1, Math.ceil(ttlMs / 1e3)),
		backend: "redis"
	};
	updateExecutionContext({
		cacheBackend: "redis",
		rateLimited: !decision.allowed
	});
	return decision;
}
//#endregion
//#region src/lib/security/public-api.ts
function getBearerChallengeHeader() {
	return `Bearer realm="BiziDashboard API", scope="${getOAuthScope()}", resource_metadata="${getProtectedResourceMetadataUrl()}"`;
}
/**
* Validate API key using either multi-key system or legacy single-key
*/
async function validatePublicApiKey(providedKey) {
	if (!isMultiKeySystemEnabled()) {
		const configuredKey = getPublicApiKey();
		if (!configuredKey) return {
			valid: false,
			info: null
		};
		return {
			valid: isApiKeyValid(providedKey, configuredKey),
			info: null
		};
	}
	if (!providedKey) return {
		valid: false,
		info: null
	};
	const info = await validateApiKey(providedKey);
	return {
		valid: info !== null,
		info
	};
}
async function enforcePublicApiAccess(options) {
	const publicApiKey = readPublicApiKey(options.request.headers);
	const bearerToken = options.request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
	const oauthPayload = bearerToken ? await verifyOAuthAccessToken(bearerToken) : null;
	if (options.requireApiKey && !isMultiKeySystemEnabled() && !getPublicApiKey()) return {
		ok: false,
		response: Response.json({ error: "Public API key is not configured for this elevated route." }, { status: 503 })
	};
	if (oauthPayload && oauthPayload.scope.split(/\s+/u).includes(getOAuthScope())) {
		const keyDecision = await consumeRateLimit({
			namespace: `${options.namespace}:oauth-client`,
			identifierParts: [oauthPayload.clientId],
			limit: options.limit,
			windowMs: options.windowMs
		});
		const headers = getRateLimitHeaders(keyDecision);
		if (keyDecision.backend === "unavailable") return {
			ok: false,
			response: Response.json({ error: "Rate limiting backend unavailable." }, {
				status: 503,
				headers
			})
		};
		if (!keyDecision.allowed) return {
			ok: false,
			response: Response.json({ error: "Too many requests for this route." }, {
				status: 429,
				headers: {
					...headers,
					"Retry-After": String(keyDecision.retryAfterSeconds)
				}
			})
		};
		return {
			ok: true,
			headers,
			providedKey: null,
			apiKeyInfo: null
		};
	}
	const validation = await validatePublicApiKey(publicApiKey);
	if (options.requireApiKey && !validation.valid) {
		await recordSecurityEvent({
			eventType: "auth_failed",
			route: options.route,
			requestId: options.requestId,
			ip: options.clientIp,
			userAgent: options.userAgent,
			outcome: "denied",
			reasonCode: "public_api_key_invalid"
		});
		return {
			ok: false,
			response: Response.json({ error: "Valid X-Public-Api-Key required for this route." }, {
				status: 401,
				headers: { "WWW-Authenticate": getBearerChallengeHeader() }
			})
		};
	}
	const rateLimits = validation.info ? getApiKeyRateLimits(validation.info) : {
		limit: options.limit,
		windowMs: options.windowMs
	};
	const rateLimitKey = validation.info?.id ?? publicApiKey ?? options.clientIp;
	const keyDecision = await consumeRateLimit({
		namespace: `${options.namespace}:key`,
		identifierParts: [rateLimitKey],
		limit: rateLimits.limit,
		windowMs: rateLimits.windowMs
	});
	const headers = getRateLimitHeaders(keyDecision);
	if (keyDecision.backend === "unavailable") return {
		ok: false,
		response: Response.json({ error: "Rate limiting backend unavailable." }, {
			status: 503,
			headers
		})
	};
	if (!keyDecision.allowed) {
		await recordSecurityEvent({
			eventType: "rate_limit_exceeded",
			route: options.route,
			requestId: options.requestId,
			ip: options.clientIp,
			userAgent: options.userAgent,
			outcome: "denied",
			reasonCode: "rate_limit"
		});
		return {
			ok: false,
			response: Response.json({ error: "Too many requests for this route." }, {
				status: 429,
				headers: {
					...headers,
					"Retry-After": String(keyDecision.retryAfterSeconds)
				}
			})
		};
	}
	return {
		ok: true,
		headers,
		providedKey: publicApiKey,
		apiKeyInfo: validation.info
	};
}
//#endregion
//#region src/app/api/status.ts
init_sentry_reporting();
var Route$5 = createFileRoute("/api/status")({ server: { handlers: { GET: async (opts) => {
	const request = opts?.request;
	if (!request) try {
		const payload = await withCache("status:current", 60, async () => {
			const data = await getPipelineStatusSummary();
			if (!data || typeof data !== "object") throw new Error("Respuesta invalida al consultar el estado del sistema.");
			return {
				...data,
				dataState: resolveStatusDataState(data)
			};
		});
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60, stale-while-revalidate=60"
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.status",
			operation: "GET /api/status"
		});
		logger.error("api.status.failed", { error });
		return new Response(JSON.stringify({
			error: "Failed to fetch status",
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			dataState: "error"
		}), { status: 500 });
	}
	return withApiRequest(request, {
		route: "/api/status",
		routeGroup: "public.api"
	}, async ({ requestId, clientIp, userAgent }) => {
		try {
			const format = new URL(request.url).searchParams.get("format");
			const access = await enforcePublicApiAccess({
				route: "/api/status",
				request,
				requestId,
				clientIp,
				userAgent,
				namespace: "public-status",
				limit: 40,
				windowMs: 6e4,
				requireApiKey: format === "csv"
			});
			if (!access.ok) return access.response;
			const payload = await withCache("status:current", 60, async () => {
				const data = await getPipelineStatusSummary();
				return {
					...data,
					dataState: resolveStatusDataState(data)
				};
			});
			if (format === "csv") {
				const csv = "timestamp,lastCollection,status\n" + (payload.pipeline?.lastSuccessfulPoll || "") + "," + (payload.pipeline?.lastSuccessfulPoll || "") + "," + (payload.quality?.freshness?.lastUpdated || "");
				return new Response(csv, {
					status: 200,
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						...access.headers
					}
				});
			}
			return new Response(JSON.stringify(payload), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
					...access.headers
				}
			});
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "api.status",
				operation: "GET /api/status"
			});
			return new Response(JSON.stringify({
				error: "Failed to fetch status",
				dataState: "error"
			}), { status: 500 });
		}
	});
} } } });
//#endregion
//#region src/lib/csv.ts
function escapeCsvCell(value) {
	return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}
function toCsv(headers, rows) {
	return [headers.map(escapeCsvCell).join(","), ...rows.map((row) => row.map(escapeCsvCell).join(","))].join("\n");
}
function rowsToCsv(headers, rows) {
	return toCsv(headers, rows.map((row) => headers.map((h) => row[h])));
}
//#endregion
//#region src/lib/api-response.ts
function errorResponse(message, status = 500, requestId) {
	return Response.json({
		error: message,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		dataState: "error",
		...requestId && { requestId }
	}, { status });
}
//#endregion
//#region src/app/api/stations.ts
init_sentry_reporting();
var Route$4 = createFileRoute("/api/stations")({ server: { handlers: { GET: async (opts) => {
	const request = opts?.request;
	if (!request) try {
		const [stations, dataset] = await Promise.all([getStationsWithLatestStatus(), getSharedDatasetSnapshot().catch(() => null)]);
		const payload = {
			stations,
			generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			dataState: resolveStationsDataState({
				count: stations.length,
				coverage: dataset?.coverage,
				status: dataset?.pipeline
			})
		};
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60, stale-while-revalidate=60"
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.stations",
			operation: "GET /api/stations"
		});
		logger.error("api.stations.failed", { error });
		return new Response(JSON.stringify({
			error: "Failed to fetch stations",
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			dataState: "error"
		}), { status: 500 });
	}
	return withApiRequest(request, {
		route: "/api/stations",
		routeGroup: "public.api"
	}, async ({ requestId, clientIp, userAgent }) => {
		try {
			const format = new URL(request.url).searchParams.get("format");
			const access = await enforcePublicApiAccess({
				route: "/api/stations",
				request,
				requestId,
				clientIp,
				userAgent,
				namespace: "public-stations",
				limit: 40,
				windowMs: 6e4,
				requireApiKey: format === "csv"
			});
			if (!access.ok) return access.response;
			const [stations, dataset] = await Promise.all([getStationsWithLatestStatus(), getSharedDatasetSnapshot().catch(() => null)]);
			const payload = {
				stations,
				generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
				dataState: resolveStationsDataState({
					count: stations.length,
					coverage: dataset?.coverage,
					status: dataset?.pipeline
				})
			};
			if (format === "csv") {
				const csv = rowsToCsv([
					"stationId",
					"stationName",
					"lat",
					"lon",
					"capacity",
					"bikesAvailable",
					"anchorsFree",
					"recordedAt"
				], payload.stations);
				return new Response(csv, {
					status: 200,
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition": "attachment; filename=\"stations-current.csv\"",
						"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
						...access.headers
					}
				});
			}
			return new Response(JSON.stringify(payload), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
					...access.headers
				}
			});
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "api.stations",
				operation: "GET /api/stations"
			});
			logger.error("api.stations.failed", { error });
			return errorResponse("Failed to fetch stations", 500);
		}
	});
} } } });
//#endregion
//#region src/app/api/rankings.ts
var Route$3 = createFileRoute("/api/rankings")({ server: { handlers: { GET: async (opts) => {
	const request = opts?.request;
	if (!request) try {
		const [rankings, stations, dataset] = await Promise.all([
			getStationRankings("turnover", 50),
			getStationsWithLatestStatus(),
			getSharedDatasetSnapshot().catch(() => null)
		]);
		const enriched = enrichRankingRows(rankings, new Map(stations.map((s) => [s.id, s.name])), /* @__PURE__ */ new Map());
		const payload = {
			type: "turnover",
			limit: 50,
			rankings: enriched,
			districtSpotlight: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			dataState: resolveRankingsDataState({
				count: enriched.length,
				coverage: dataset?.coverage
			})
		};
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=300"
			}
		});
	} catch (error) {
		return new Response(JSON.stringify({
			error: "Failed to fetch rankings",
			dataState: "error"
		}), { status: 500 });
	}
	return withApiRequest(request, {
		route: "/api/rankings",
		routeGroup: "public.api"
	}, async ({ requestId, clientIp, userAgent }) => {
		try {
			const typeParam = new URL(request.url).searchParams.get("type") ?? "turnover";
			const type = typeParam;
			const limitParam = parseInt(new URL(request.url).searchParams.get("limit") ?? "20");
			const limit = Math.min(Math.max(1, limitParam), 200);
			const format = new URL(request.url).searchParams.get("format");
			const access = await enforcePublicApiAccess({
				route: "/api/rankings",
				request,
				requestId,
				clientIp,
				userAgent,
				namespace: "public-rankings",
				limit: 40,
				windowMs: 6e4,
				requireApiKey: false
			});
			if (!access.ok) return access.response;
			const [rankings, stations, districtCollection, dataset] = await Promise.all([
				getStationRankings(type, limit),
				getStationsWithLatestStatus(),
				fetchDistrictCollection().catch(() => null),
				getSharedDatasetSnapshot().catch(() => null)
			]);
			let enriched = enrichRankingRows(rankings, new Map(stations.map((s) => [s.id, s.name])), districtCollection !== null ? buildStationDistrictMap(stations.map((s) => ({
				id: s.id,
				lon: s.lon,
				lat: s.lat
			})), districtCollection) : /* @__PURE__ */ new Map());
			const peakMap = buildPeakFullHoursByStation([]);
			enriched = attachPeakFullHours(enriched, peakMap);
			const districtSpotlight = buildDistrictSpotlight(enriched, typeParam);
			const payload = {
				type,
				limit,
				rankings: enriched,
				districtSpotlight,
				generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
				dataState: resolveRankingsDataState({
					count: enriched.length,
					coverage: dataset?.coverage
				})
			};
			if (format === "csv") {
				const csv = [[
					"stationId",
					"turnoverScore",
					"emptyHours",
					"fullHours",
					"totalHours"
				], ...payload.rankings.map((r) => [
					r.stationId,
					r.turnoverScore,
					r.emptyHours,
					r.fullHours,
					r.totalHours
				])].map((r) => r.join(",")).join("\n");
				return new Response(csv, {
					status: 200,
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						...access.headers
					}
				});
			}
			return new Response(JSON.stringify(payload), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=300, stale-while-revalidate=300",
					...access.headers
				}
			});
		} catch (error) {
			return errorResponse("Failed to fetch rankings", 500);
		}
	});
} } } });
//#endregion
//#region src/app/api/alerts.ts
init_sentry_reporting();
var Route$2 = createFileRoute("/api/alerts")({ server: { handlers: { GET: async (opts) => {
	const request = opts?.request;
	if (!request) try {
		const payload = {
			limit: 50,
			alerts: await getActiveAlerts(50),
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=300"
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.alerts",
			operation: "GET /api/alerts"
		});
		logger.error("api.alerts.failed", { error });
		return new Response(JSON.stringify({ error: "Failed to fetch alerts" }), { status: 500 });
	}
	return withApiRequest(request, {
		route: "/api/alerts",
		routeGroup: "public.api"
	}, async ({ requestId, clientIp, userAgent }) => {
		try {
			const limitParam = request?.url ? parseInt(new URL(request.url).searchParams.get("limit") ?? "50") : 50;
			const limit = Math.min(Math.max(1, limitParam), 200);
			const access = await enforcePublicApiAccess({
				route: "/api/alerts",
				request,
				requestId,
				clientIp,
				userAgent,
				namespace: "public-alerts",
				limit: 40,
				windowMs: 6e4,
				requireApiKey: false
			});
			if (!access.ok) return access.response;
			const payload = {
				limit,
				alerts: await getActiveAlerts(limit),
				generatedAt: (/* @__PURE__ */ new Date()).toISOString()
			};
			return new Response(JSON.stringify(payload), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=300, stale-while-revalidate=300",
					...access.headers
				}
			});
		} catch (error) {
			return errorResponse("Failed to fetch alerts", 500);
		}
	});
} } } });
//#endregion
//#region src/app/api/health/ready.ts
var Route$1 = createFileRoute("/api/health/ready")({ server: { handlers: { GET: async () => {
	return new Response(JSON.stringify({
		status: "ok",
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	}), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
} } } });
//#endregion
//#region src/app/api/health/live.ts
var Route = createFileRoute("/api/health/live")({ server: { handlers: { GET: async () => {
	return new Response(JSON.stringify({
		status: "ok",
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	}), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
} } } });
//#endregion
//#region src/routeTree.gen.ts
var ViajesPorMesZaragozaRoute = Route$38.update({
	id: "/viajes-por-mes-zaragoza",
	path: "/viajes-por-mes-zaragoza",
	getParentRoute: () => Route$39
});
var ViajesPorDiaZaragozaRoute = Route$37.update({
	id: "/viajes-por-dia-zaragoza",
	path: "/viajes-por-dia-zaragoza",
	getParentRoute: () => Route$39
});
var UsoBiziPorHoraRoute = Route$36.update({
	id: "/uso-bizi-por-hora",
	path: "/uso-bizi-por-hora",
	getParentRoute: () => Route$39
});
var UsoBiziPorEstacionRoute = Route$35.update({
	id: "/uso-bizi-por-estacion",
	path: "/uso-bizi-por-estacion",
	getParentRoute: () => Route$39
});
var RegisterRoute = Route$34.update({
	id: "/register",
	path: "/register",
	getParentRoute: () => Route$39
});
var RedistribucionBiziZaragozaRoute = Route$33.update({
	id: "/redistribucion-bizi-zaragoza",
	path: "/redistribucion-bizi-zaragoza",
	getParentRoute: () => Route$39
});
var RankingEstacionesBiziRoute = Route$32.update({
	id: "/ranking-estaciones-bizi",
	path: "/ranking-estaciones-bizi",
	getParentRoute: () => Route$39
});
var ProfileRoute = Route$31.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => Route$39
});
var MetodologiaRoute = Route$30.update({
	id: "/metodologia",
	path: "/metodologia",
	getParentRoute: () => Route$39
});
var MapaEstacionesBiziZaragozaRoute = Route$29.update({
	id: "/mapa-estaciones-bizi-zaragoza",
	path: "/mapa-estaciones-bizi-zaragoza",
	getParentRoute: () => Route$39
});
var LoginRoute = Route$28.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$39
});
var InformesMensualesBiziZaragozaRoute = Route$27.update({
	id: "/informes-mensuales-bizi-zaragoza",
	path: "/informes-mensuales-bizi-zaragoza",
	getParentRoute: () => Route$39
});
var InformesRoute = Route$26.update({
	id: "/informes",
	path: "/informes",
	getParentRoute: () => Route$39
});
var ExplorarRoute = Route$25.update({
	id: "/explorar",
	path: "/explorar",
	getParentRoute: () => Route$39
});
var EstadoRoute = Route$24.update({
	id: "/estado",
	path: "/estado",
	getParentRoute: () => Route$39
});
var EstadisticasBiziZaragozaRoute = Route$23.update({
	id: "/estadisticas-bizi-zaragoza",
	path: "/estadisticas-bizi-zaragoza",
	getParentRoute: () => Route$39
});
var EstacionesMasUsadasZaragozaRoute = Route$22.update({
	id: "/estaciones-mas-usadas-zaragoza",
	path: "/estaciones-mas-usadas-zaragoza",
	getParentRoute: () => Route$39
});
var EstacionesConMasBicisRoute = Route$21.update({
	id: "/estaciones-con-mas-bicis",
	path: "/estaciones-con-mas-bicis",
	getParentRoute: () => Route$39
});
var DevelopersRoute = Route$20.update({
	id: "/developers",
	path: "/developers",
	getParentRoute: () => Route$39
});
var DashboardRoute = Route$19.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$39
});
var CompararRoute = Route$18.update({
	id: "/comparar",
	path: "/comparar",
	getParentRoute: () => Route$39
});
var BiciradarRoute = Route$17.update({
	id: "/biciradar",
	path: "/biciradar",
	getParentRoute: () => Route$39
});
var BetaRoute = Route$16.update({
	id: "/beta",
	path: "/beta",
	getParentRoute: () => Route$39
});
var BarriosBiziZaragozaRoute = Route$15.update({
	id: "/barrios-bizi-zaragoza",
	path: "/barrios-bizi-zaragoza",
	getParentRoute: () => Route$39
});
var AboutRoute = Route$14.update({
	id: "/about",
	path: "/about",
	getParentRoute: () => Route$39
});
var IndexRoute = Route$13.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$39
});
var DashboardStatusRoute = Route$12.update({
	id: "/status",
	path: "/status",
	getParentRoute: () => DashboardRoute
});
var DashboardRedistribucionRoute = Route$11.update({
	id: "/redistribucion",
	path: "/redistribucion",
	getParentRoute: () => DashboardRoute
});
var DashboardFlujoRoute = Route$10.update({
	id: "/flujo",
	path: "/flujo",
	getParentRoute: () => DashboardRoute
});
var DashboardEstacionesRoute = Route$9.update({
	id: "/estaciones",
	path: "/estaciones",
	getParentRoute: () => DashboardRoute
});
var DashboardConclusionesRoute = Route$8.update({
	id: "/conclusiones",
	path: "/conclusiones",
	getParentRoute: () => DashboardRoute
});
var DashboardAyudaRoute = Route$7.update({
	id: "/ayuda",
	path: "/ayuda",
	getParentRoute: () => DashboardRoute
});
var DashboardAlertasRoute = Route$6.update({
	id: "/alertas",
	path: "/alertas",
	getParentRoute: () => DashboardRoute
});
var ApiStatusRoute = Route$5.update({
	id: "/api/status",
	path: "/api/status",
	getParentRoute: () => Route$39
});
var ApiStationsRoute = Route$4.update({
	id: "/api/stations",
	path: "/api/stations",
	getParentRoute: () => Route$39
});
var ApiRankingsRoute = Route$3.update({
	id: "/api/rankings",
	path: "/api/rankings",
	getParentRoute: () => Route$39
});
var ApiAlertsRoute = Route$2.update({
	id: "/api/alerts",
	path: "/api/alerts",
	getParentRoute: () => Route$39
});
var InformesChar91monthChar93RouteRoute = Route$42.update({
	id: "/month",
	path: "/month",
	getParentRoute: () => InformesRoute
});
var ApiHealthReadyRoute = Route$1.update({
	id: "/api/health/ready",
	path: "/api/health/ready",
	getParentRoute: () => Route$39
});
var ApiHealthLiveRoute = Route.update({
	id: "/api/health/live",
	path: "/api/health/live",
	getParentRoute: () => Route$39
});
var DashboardViewsChar91modeChar93RouteRoute = Route$41.update({
	id: "/views/mode",
	path: "/views/mode",
	getParentRoute: () => DashboardRoute
});
var DashboardEstacionesRouteChildren = { DashboardEstacionesChar91stationIdChar93RouteRoute: Route$40.update({
	id: "/stationId",
	path: "/stationId",
	getParentRoute: () => DashboardEstacionesRoute
}) };
var DashboardRouteChildren = {
	DashboardAlertasRoute,
	DashboardAyudaRoute,
	DashboardConclusionesRoute,
	DashboardEstacionesRoute: DashboardEstacionesRoute._addFileChildren(DashboardEstacionesRouteChildren),
	DashboardFlujoRoute,
	DashboardRedistribucionRoute,
	DashboardStatusRoute,
	DashboardViewsChar91modeChar93RouteRoute
};
var DashboardRouteWithChildren = DashboardRoute._addFileChildren(DashboardRouteChildren);
var InformesRouteChildren = { InformesChar91monthChar93RouteRoute };
var rootRouteChildren = {
	IndexRoute,
	AboutRoute,
	BarriosBiziZaragozaRoute,
	BetaRoute,
	BiciradarRoute,
	CompararRoute,
	DashboardRoute: DashboardRouteWithChildren,
	DevelopersRoute,
	EstacionesConMasBicisRoute,
	EstacionesMasUsadasZaragozaRoute,
	EstadisticasBiziZaragozaRoute,
	EstadoRoute,
	ExplorarRoute,
	InformesRoute: InformesRoute._addFileChildren(InformesRouteChildren),
	InformesMensualesBiziZaragozaRoute,
	LoginRoute,
	MapaEstacionesBiziZaragozaRoute,
	MetodologiaRoute,
	ProfileRoute,
	RankingEstacionesBiziRoute,
	RedistribucionBiziZaragozaRoute,
	RegisterRoute,
	UsoBiziPorEstacionRoute,
	UsoBiziPorHoraRoute,
	ViajesPorDiaZaragozaRoute,
	ViajesPorMesZaragozaRoute,
	ApiAlertsRoute,
	ApiRankingsRoute,
	ApiStationsRoute,
	ApiStatusRoute,
	ApiHealthLiveRoute,
	ApiHealthReadyRoute
};
var routeTree = Route$39._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/integrations/tanstack-query/root-provider.tsx
function getContext() {
	return { queryClient: new QueryClient() };
}
//#endregion
//#region src/router.tsx
function getRouter() {
	const context = getContext();
	const router = createRouter({
		routeTree,
		context,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0
	});
	setupRouterSsrQueryIntegration({
		router,
		queryClient: context.queryClient
	});
	return router;
}
//#endregion
export { getRouter };
