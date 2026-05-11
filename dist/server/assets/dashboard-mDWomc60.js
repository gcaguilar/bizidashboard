import { a as cn, n as init_card, o as init_utils, t as Card } from "./card-BqIrN6Ld.js";
import { a as getSiteUrl, n as SITE_TITLE, o as init_site, t as SITE_NAME } from "./site-B6Gst4bb.js";
import { n as init_page_shell, r as CitySwitcher, t as PageShell } from "./page-shell-CC8M_45q.js";
import { _ as SiteBreadcrumbs, a as buildBreadcrumbStructuredData, i as buildFallbackStatus, n as buildFallbackDatasetSnapshot, o as createRootBreadcrumbs, r as buildFallbackStations } from "./shared-data-fallbacks-BSFw5LEs.js";
import { r as init_sentry_reporting, t as captureExceptionWithContext } from "./sentry-reporting-CvzcSweH.js";
import { i as combineDataStates, p as shouldShowDataStateNotice, r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { c as parseJsonValue, n as buildStationDistrictMap, r as fetchDistrictCollection, s as isRecord } from "./districts-e09LFoic.js";
import { a as init_tabs, c as FeedbackCta, f as fetchRankings, g as fetchStatus, h as fetchStations, i as TabsTrigger, l as fetchAlerts, m as fetchSharedDatasetSnapshot, n as TabsContent, o as Checkbox, r as TabsList, s as init_checkbox, t as Tabs } from "./tabs-BWlq-PRw.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { a as DashboardRouteLinks, i as GitHubRepoButton, n as init_DashboardPageViewTracker, o as PageHeaderCard, r as ThemeToggleButton, t as DashboardPageViewTracker } from "./DashboardPageViewTracker-SrI8-Aae.js";
import { t as DataStateNotice } from "./DataStateNotice-BAkqjtQM.js";
import { n as haversineDistanceMeters, t as formatDistanceMeters } from "./geo-C-dxtd4-.js";
import { r as resolveDashboardViewMode, t as DASHBOARD_MODE_META } from "./dashboard-modes-Ba8TJts7.js";
import { a as buildEntitySelectEvent, h as trackUmamiEvent, p as init_umami, r as buildDashboardModeChangeEvent, s as buildFilterChangeEvent, t as TrackedLink, u as buildPanelOpenEvent } from "./TrackedLink-BHId783N.js";
import { n as init_input, t as Input } from "./input-CNtnRSUp.js";
import { t as Progress } from "./progress-DkkST3KE.js";
import { n as useSystemMetrics } from "./useSystemMetrics-D1dA0yxm.js";
import * as React from "react";
import { lazy, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/lib/map-view-state.ts
init_site();
init_sentry_reporting();
init_routes();
var DEFAULT_DASHBOARD_MAP_VIEW = {
	latitude: 41.65,
	longitude: -.88,
	zoom: 12
};
function roundCoordinate(value) {
	return Math.round(value * 1e4) / 1e4;
}
function roundZoom(value) {
	return Math.round(value * 10) / 10;
}
function resolveDashboardMapViewState(searchParams) {
	const lat = Number(searchParams.get("mapLat"));
	const lng = Number(searchParams.get("mapLng"));
	const zoom = Number(searchParams.get("mapZoom"));
	return {
		latitude: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : DEFAULT_DASHBOARD_MAP_VIEW.latitude,
		longitude: Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : DEFAULT_DASHBOARD_MAP_VIEW.longitude,
		zoom: Number.isFinite(zoom) && zoom >= 3 && zoom <= 19 ? zoom : DEFAULT_DASHBOARD_MAP_VIEW.zoom
	};
}
function serializeDashboardMapViewState(state) {
	return {
		mapLat: String(roundCoordinate(state.latitude)),
		mapLng: String(roundCoordinate(state.longitude)),
		mapZoom: String(roundZoom(state.zoom))
	};
}
//#endregion
//#region src/lib/dashboard-url-state.ts
function buildDashboardUrlSearchParams(currentParams, state) {
	const nextParams = new URLSearchParams(currentParams.toString());
	nextParams.set("timeWindow", state.activeWindowId);
	nextParams.set("mode", state.viewMode);
	if (state.selectedStationId) nextParams.set("stationId", state.selectedStationId);
	else nextParams.delete("stationId");
	const trimmedQuery = state.searchQuery.trim();
	if (trimmedQuery) nextParams.set("q", trimmedQuery);
	else nextParams.delete("q");
	if (state.onlyWithBikes) nextParams.set("onlyWithBikes", "1");
	else nextParams.delete("onlyWithBikes");
	if (state.onlyWithAnchors) nextParams.set("onlyWithAnchors", "1");
	else nextParams.delete("onlyWithAnchors");
	for (const [key, value] of Object.entries(serializeDashboardMapViewState(state.mapViewState))) nextParams.set(key, value);
	return nextParams;
}
//#endregion
//#region src/app/dashboard/_components/DashboardLayout.tsx
function DashboardLayout({ children, mode = "overview" }) {
	return /* @__PURE__ */ jsx("div", {
		"data-mode": mode,
		className: "dashboard-shell mx-auto flex w-full max-w-[1280px] flex-col gap-6 overflow-x-hidden",
		children
	});
}
//#endregion
//#region src/app/dashboard/_components/DashboardHeader.tsx
init_button();
init_checkbox();
init_input();
function DashboardHeader({ timeWindows, activeWindowId, onChangeWindow, searchQuery, onChangeSearch, onlyWithBikes, onlyWithAnchors, onToggleOnlyWithBikes, onToggleOnlyWithAnchors, filteredStationsCount, totalStationsCount, filteredOutCount, favoriteCount, activeAlertsCount, activeWindowLabel, isMobilityPreviewLoading, isRefreshingData, nearestMessage, datasetSummaryLabel, onUseGeolocation, canUseGeolocation, onJumpToNearest, canJumpToNearest, refreshCountdownLabel, refreshProgress }) {
	const hasAvailabilityFilter = filteredOutCount > 0;
	return /* @__PURE__ */ jsxs(PageHeaderCard, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 items-center gap-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3 text-[var(--primary)]",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white",
							children: "B"
						}), /* @__PURE__ */ jsx("h1", {
							className: "text-xl font-bold tracking-tight text-[var(--foreground)]",
							children: "Bizi Zaragoza"
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "hidden xl:block",
						children: /* @__PURE__ */ jsx(CitySwitcher, {
							compact: true,
							className: "min-w-[320px]"
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "hidden items-center gap-2 rounded-lg bg-[var(--primary)]/10 p-1 lg:flex",
						children: timeWindows.map((window) => /* @__PURE__ */ jsx(Button, {
							onClick: () => onChangeWindow(window.id),
							"aria-pressed": activeWindowId === window.id,
							className: `rounded-md px-4 py-1.5 text-xs font-semibold transition ${activeWindowId === window.id ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--foreground)]"}`,
							variant: "ghost",
							size: "sm",
							children: window.label
						}, window.id))
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2",
				children: [
					/* @__PURE__ */ jsx(FeedbackCta, {
						source: "dashboard_header",
						ctaId: "feedback_header_open",
						module: "dashboard_header",
						className: "ui-icon-button hidden sm:inline-flex",
						pendingClassName: "ui-icon-button hidden cursor-not-allowed opacity-70 sm:inline-flex",
						children: "Feedback"
					}),
					/* @__PURE__ */ jsx(ThemeToggleButton, {}),
					/* @__PURE__ */ jsx(GitHubRepoButton, {})
				]
			})]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mt-3 xl:hidden",
			children: /* @__PURE__ */ jsx(CitySwitcher, { compact: true })
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mt-3 flex flex-wrap items-start justify-between gap-3 border-t border-[var(--border)]/70 pt-3",
			children: [
				/* @__PURE__ */ jsx(DashboardRouteLinks, {
					activeRoute: "dashboard",
					routes: [
						"stations",
						"flow",
						"conclusions",
						"help"
					],
					variant: "chips",
					className: "flex flex-wrap items-center gap-2 sm:hidden"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "w-full",
					children: [/* @__PURE__ */ jsx("label", {
						htmlFor: "dashboard-search",
						className: "sr-only",
						children: "Buscar estacion, identificador o barrio"
					}), /* @__PURE__ */ jsx(Input, {
						id: "dashboard-search",
						type: "text",
						className: "min-h-11 border-[var(--border)] bg-[var(--secondary)] py-2",
						placeholder: "Buscar estacion, ID o barrio...",
						value: searchQuery,
						onChange: (event) => onChangeSearch(event.target.value)
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-2 py-1.5",
					children: [/* @__PURE__ */ jsxs("label", {
						className: "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]",
						children: [/* @__PURE__ */ jsx(Checkbox, {
							checked: onlyWithBikes,
							onChange: (event) => onToggleOnlyWithBikes(event.target.checked),
							className: "h-5 w-5 accent-[var(--primary)]"
						}), "Solo con bicis"]
					}), /* @__PURE__ */ jsxs("label", {
						className: "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]",
						children: [/* @__PURE__ */ jsx(Checkbox, {
							checked: onlyWithAnchors,
							onChange: (event) => onToggleOnlyWithAnchors(event.target.checked),
							className: "h-5 w-5 accent-[var(--primary)]"
						}), "Solo con huecos"]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex min-w-[220px] flex-1 flex-col gap-1 text-xs text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("p", { children: [
							"Estaciones: ",
							filteredStationsCount,
							"/",
							totalStationsCount,
							hasAvailabilityFilter ? ` (filtradas ${filteredOutCount})` : "",
							" · Favoritas: ",
							favoriteCount,
							" · Alertas activas: ",
							activeAlertsCount,
							" · Ventana: ",
							activeWindowLabel,
							isMobilityPreviewLoading ? " (actualizando flujo...)" : ""
						] }),
						/* @__PURE__ */ jsx("p", { children: isRefreshingData ? "Refrescando datos del sistema ahora..." : "Resumen operativo disponible justo debajo." }),
						/* @__PURE__ */ jsx("p", { children: datasetSummaryLabel })
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap items-center gap-2 rounded-lg bg-[var(--primary)]/10 p-1 lg:hidden",
					children: timeWindows.map((window) => /* @__PURE__ */ jsx(Button, {
						onClick: () => onChangeWindow(window.id),
						"aria-pressed": activeWindowId === window.id,
						className: `rounded-md px-3 py-1 text-xs font-semibold transition ${activeWindowId === window.id ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`,
						variant: "ghost",
						size: "sm",
						children: window.label
					}, window.id))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--foreground)]",
						children: nearestMessage
					}), canJumpToNearest ? /* @__PURE__ */ jsx(Button, {
						onClick: onJumpToNearest,
						className: "rounded-lg border border-[var(--primary)] px-2 py-1 text-[11px] font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
						variant: "ghost",
						size: "sm",
						children: "Ir a la mas cercana"
					}) : canUseGeolocation ? /* @__PURE__ */ jsx(Button, {
						onClick: onUseGeolocation,
						className: "rounded-lg border border-[var(--primary)] px-2 py-1 text-[11px] font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
						variant: "ghost",
						size: "sm",
						children: "Usar mi ubicacion"
					}) : null]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "w-full",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]",
						children: [/* @__PURE__ */ jsx("span", { children: "Proxima actualizacion automatica en menos de 2 min" }), /* @__PURE__ */ jsx("span", { children: isRefreshingData ? "actualizando..." : `siguiente en ${refreshCountdownLabel}` })]
					}), /* @__PURE__ */ jsx(Progress, {
						className: "bg-black/15",
						value: Math.max(0, Math.min(100, refreshProgress)),
						indicatorClassName: "bg-[var(--primary)] duration-500"
					})]
				})
			]
		})
	] });
}
//#endregion
//#region src/app/dashboard/_components/ModeIntroBanner.tsx
init_utils();
init_card();
function ModeIntroBanner({ mode }) {
	const copy = DASHBOARD_MODE_META[mode];
	return /* @__PURE__ */ jsxs(Card, {
		className: `rounded-2xl bg-gradient-to-r px-5 py-5 ${copy.introTone}`,
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: copy.introEyebrow
			}),
			/* @__PURE__ */ jsx("h2", {
				className: "mt-1 text-2xl font-black tracking-tight text-[var(--foreground)]",
				children: copy.introTitle
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 max-w-3xl text-sm text-[var(--muted)]",
				children: copy.introDescription
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/DashboardQuickLinks.tsx
init_button();
init_umami();
function DashboardQuickLinks({ selectedStationDetailUrl }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "grid gap-4 md:grid-cols-2 xl:grid-cols-5",
		children: [
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Detalle de estacion"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Abre la vista completa de la estacion seleccionada para ver prediccion, mapa por barrios y comparativas."
					}),
					/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(TrackedLink, {
							href: selectedStationDetailUrl,
							trackingEvent: buildPanelOpenEvent({
								surface: "dashboard",
								routeKey: "dashboard_home",
								module: "station_detail",
								source: "dashboard_quick_links"
							}),
							children: "Abrir detalle completo"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Flujo por barrios"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Consulta la matriz O-D, el chord y las rutas de mayor volumen en una pagina dedicada."
					}),
					/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(TrackedLink, {
							href: appRoutes.dashboardFlow(),
							trackingEvent: buildPanelOpenEvent({
								surface: "dashboard",
								routeKey: "dashboard_home",
								module: "flow",
								source: "dashboard_quick_links"
							}),
							children: "Ir a analisis de flujo"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Conclusiones diarias"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Resumen ejecutivo de movilidad, tendencias semanales y recomendaciones operativas."
					}),
					/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(TrackedLink, {
							href: appRoutes.dashboardConclusions(),
							trackingEvent: buildPanelOpenEvent({
								surface: "dashboard",
								routeKey: "dashboard_home",
								module: "conclusions",
								source: "dashboard_quick_links"
							}),
							children: "Ver conclusiones"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Centro de ayuda"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Metodologia, criterios de alertas y documentacion en una pagina independiente."
					}),
					/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(TrackedLink, {
							href: appRoutes.dashboardHelp(),
							trackingEvent: buildPanelOpenEvent({
								surface: "dashboard",
								routeKey: "dashboard_home",
								module: "help",
								source: "dashboard_quick_links"
							}),
							children: "Abrir ayuda"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Paginas SEO"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Rankings indexables, series temporales e informes mensuales enlazados al dashboard."
					}),
					/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(TrackedLink, {
							href: appRoutes.reports(),
							trackingEvent: buildPanelOpenEvent({
								surface: "dashboard",
								routeKey: "dashboard_home",
								module: "reports",
								source: "dashboard_quick_links",
								destination: "report_archive"
							}),
							children: "Ver informes y rankings"
						})
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/ModeHeader.tsx
init_tabs();
var MODE_OPTIONS = [
	{
		id: "overview",
		label: DASHBOARD_MODE_META.overview.label,
		description: DASHBOARD_MODE_META.overview.description
	},
	{
		id: "operations",
		label: DASHBOARD_MODE_META.operations.label,
		description: DASHBOARD_MODE_META.operations.description
	},
	{
		id: "research",
		label: DASHBOARD_MODE_META.research.label,
		description: DASHBOARD_MODE_META.research.description
	},
	{
		id: "data",
		label: DASHBOARD_MODE_META.data.label,
		description: DASHBOARD_MODE_META.data.description
	}
];
function ModeHeader({ activeMode }) {
	return /* @__PURE__ */ jsx("section", {
		className: "rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow-soft)]",
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Modo de vista"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-bold text-[var(--foreground)]",
					children: "Panel multi-rol"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-[var(--muted)]",
					children: "Cambia entre vistas segun si quieres un resumen, operar, investigar o revisar metodologia."
				})
			] }), /* @__PURE__ */ jsx(TabsList, {
				className: "grid gap-2 border-none sm:grid-cols-2 xl:grid-cols-4",
				"aria-label": "Modos del dashboard",
				children: MODE_OPTIONS.map((mode) => {
					const isActive = activeMode === mode.id;
					return /* @__PURE__ */ jsxs(TabsTrigger, {
						value: mode.id,
						className: `h-auto min-h-0 w-full flex-col items-start justify-start rounded-xl border px-4 py-3 text-left transition ${isActive ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-[var(--shadow-soft)]" : "border-[var(--border)] bg-[var(--secondary)] hover:border-[var(--primary)]/35 hover:bg-[var(--card)]"}`,
						children: [/* @__PURE__ */ jsx("p", {
							className: `text-sm font-bold ${isActive ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`,
							children: mode.label
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-xs text-[var(--muted)]",
							children: mode.description
						})]
					}, mode.id);
				})
			})]
		})
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
//#region src/app/dashboard/_components/WidgetSkeleton.tsx
var WidgetSkeleton = memo(function WidgetSkeleton({ className = "", lines = 3 }) {
	return /* @__PURE__ */ jsxs("div", {
		className: `ui-section-card animate-pulse ${className}`.trim(),
		children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-32" }), /* @__PURE__ */ jsx("div", {
			className: "mt-4 space-y-3",
			children: Array.from({ length: lines }).map((_, index) => /* @__PURE__ */ jsx(Skeleton, { className: "h-4" }, index))
		})]
	});
});
//#endregion
//#region src/lib/recent-station-history.ts
var MAX_RECENT_SNAPSHOTS = 20;
function trimRecentSnapshots(snapshots) {
	return snapshots.slice(-MAX_RECENT_SNAPSHOTS);
}
function buildStationSnapshotMap(stations) {
	return stations.reduce((accumulator, station) => {
		accumulator[station.id] = Number(station.bikesAvailable);
		return accumulator;
	}, {});
}
function normalizeStationSnapshot(value) {
	if (!isRecord(value)) return {};
	const snapshot = {};
	for (const [key, entry] of Object.entries(value)) {
		if (!Number.isFinite(entry)) continue;
		snapshot[key] = Number(entry);
	}
	return snapshot;
}
function parseStationSnapshot(rawValue) {
	const parsed = parseJsonValue(rawValue);
	if (parsed === null) return null;
	return normalizeStationSnapshot(parsed);
}
function parseRecentSnapshots(rawValue) {
	const parsed = parseJsonValue(rawValue);
	if (!Array.isArray(parsed)) return [];
	return trimRecentSnapshots(parsed.filter(isRecord).map((item) => ({
		recordedAt: typeof item.recordedAt === "string" ? item.recordedAt : (/* @__PURE__ */ new Date(0)).toISOString(),
		snapshot: normalizeStationSnapshot(item.snapshot)
	})));
}
function pushRecentSnapshot(snapshots, nextSnapshot) {
	const previous = snapshots[snapshots.length - 1];
	if (previous && previous.recordedAt === nextSnapshot.recordedAt) return trimRecentSnapshots([...snapshots.slice(0, -1), nextSnapshot]);
	return trimRecentSnapshots([...snapshots, nextSnapshot]);
}
//#endregion
//#region src/app/dashboard/_components/DashboardClient.tsx
init_routes();
init_tabs();
init_umami();
init_DashboardPageViewTracker();
var OverviewModeView = lazy(() => import("./OverviewModeView-CdfzxT5f.js").then((module) => module.OverviewModeView), {
	ssr: false,
	loading: () => /* @__PURE__ */ jsx(WidgetSkeleton, {
		className: "min-h-[360px]",
		lines: 6
	})
});
var OperationsModeView = lazy(() => import("./OperationsModeView-DBuTg2c6.js").then((module) => module.OperationsModeView), {
	ssr: false,
	loading: () => /* @__PURE__ */ jsx(WidgetSkeleton, {
		className: "min-h-[320px]",
		lines: 6
	})
});
var ResearchModeView = lazy(() => import("./ResearchModeView-CwF0crU0.js").then((module) => module.ResearchModeView), {
	ssr: false,
	loading: () => /* @__PURE__ */ jsx(WidgetSkeleton, {
		className: "min-h-[360px]",
		lines: 6
	})
});
var DataModeView = lazy(() => import("./DataModeView-CPHO7Yss.js").then((module) => module.DataModeView), {
	ssr: false,
	loading: () => /* @__PURE__ */ jsx(WidgetSkeleton, {
		className: "min-h-[260px]",
		lines: 5
	})
});
var FAVORITES_STORAGE_KEY = "bizidashboard-favorite-stations";
var TREND_SNAPSHOT_STORAGE_KEY = "bizidashboard-session-station-snapshot";
var RECENT_SNAPSHOTS_STORAGE_KEY = "bizidashboard-session-recent-station-snapshots";
var REFRESH_AFTER_LAST_DATA_MS = 5 * 6e4;
var MIN_REFRESH_FALLBACK_MS = 3e4;
var TIME_WINDOWS = [
	{
		id: "24h",
		label: "Ultimas 24h",
		mobilityDays: 1,
		demandDays: 7
	},
	{
		id: "7d",
		label: "7 dias",
		mobilityDays: 7,
		demandDays: 14
	},
	{
		id: "30d",
		label: "Mes",
		mobilityDays: 30,
		demandDays: 30
	},
	{
		id: "365d",
		label: "Anual",
		mobilityDays: 365,
		demandDays: 365
	}
];
var EMPTY_MOBILITY_PREVIEW = {
	hourlySignals: [],
	dailyDemand: [],
	systemHourlyProfile: []
};
function normalizeText(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function resolveTimeWindowId(value) {
	if (!value) return TIME_WINDOWS[1]?.id ?? "7d";
	return TIME_WINDOWS.some((window) => window.id === value) ? value : TIME_WINDOWS[1]?.id ?? "7d";
}
function parseBooleanFilter(value) {
	return value === "1" || value === "true";
}
function resolveStationId(stations, value) {
	if (value && stations.some((station) => station.id === value)) return value;
	return stations[0]?.id ?? "";
}
function computeStationTrends(previousSnapshot, currentStations) {
	const trends = {};
	for (const station of currentStations) {
		const previousBikes = previousSnapshot[station.id];
		if (!Number.isFinite(previousBikes)) {
			trends[station.id] = "flat";
			continue;
		}
		if (station.bikesAvailable > previousBikes) trends[station.id] = "up";
		else if (station.bikesAvailable < previousBikes) trends[station.id] = "down";
		else trends[station.id] = "flat";
	}
	return trends;
}
function writeJsonStorageItem(storage, key, value) {
	try {
		storage.setItem(key, JSON.stringify(value));
	} catch {}
}
function toTimestamp(value) {
	if (!value) return null;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? null : parsed;
}
function resolveLatestDataUpdatedAt(dataset, stations, status) {
	const stationRecordings = stations.stations.map((station) => toTimestamp(station.recordedAt)).filter((value) => value !== null);
	const candidates = [
		toTimestamp(dataset.lastUpdated.lastSampleAt),
		toTimestamp(dataset.coverage.generatedAt),
		...stationRecordings,
		toTimestamp(status.pipeline.lastSuccessfulPoll),
		toTimestamp(stations.generatedAt),
		toTimestamp(status.timestamp)
	].filter((value) => value !== null);
	if (candidates.length === 0) return /* @__PURE__ */ new Date();
	return new Date(Math.max(...candidates));
}
function resolveNextRefreshAt(dataset, stations, status) {
	if (stations.stations.length === 0) return new Date(Date.now() + MIN_REFRESH_FALLBACK_MS);
	const latestUpdate = resolveLatestDataUpdatedAt(dataset, stations, status);
	return new Date(Math.max(latestUpdate.getTime() + REFRESH_AFTER_LAST_DATA_MS, Date.now() + MIN_REFRESH_FALLBACK_MS));
}
function formatCountdown(valueMs) {
	const safeMs = Math.max(0, valueMs);
	if (safeMs < 6e4) return `${Math.ceil(safeMs / 1e3)}s`;
	return `${Math.ceil(safeMs / 6e4)} min`;
}
function DashboardClient({ initialData }) {
	const dashboardRouteKey = "dashboard_home";
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [stationsData, setStationsData] = useState(initialData.stations);
	const [statusData, setStatusData] = useState(initialData.status);
	const [alertsData, setAlertsData] = useState(initialData.alerts);
	const [rankingsData, setRankingsData] = useState(initialData.rankings);
	const [selectedStationId, setSelectedStationId] = useState(() => resolveStationId(initialData.stations.stations, searchParams.get("stationId")));
	const [viewMode, setViewMode] = useState(() => resolveDashboardViewMode(searchParams.get("mode")));
	const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
	const [activeWindowId, setActiveWindowId] = useState(() => resolveTimeWindowId(searchParams.get("timeWindow")));
	const [favoriteStationIds, setFavoriteStationIds] = useState([]);
	const [onlyWithBikes, setOnlyWithBikes] = useState(() => parseBooleanFilter(searchParams.get("onlyWithBikes")));
	const [onlyWithAnchors, setOnlyWithAnchors] = useState(() => parseBooleanFilter(searchParams.get("onlyWithAnchors")));
	const [mapViewState, setMapViewState] = useState(() => resolveDashboardMapViewState(searchParams));
	const [stationTrendById, setStationTrendById] = useState({});
	const [recentSnapshots, setRecentSnapshots] = useState([]);
	const [isRefreshingData, setIsRefreshingData] = useState(false);
	const [nextRefreshAt, setNextRefreshAt] = useState(() => resolveNextRefreshAt(initialData.dataset, initialData.stations, initialData.status));
	const [refreshCountdownMs, setRefreshCountdownMs] = useState(0);
	const [userLocation, setUserLocation] = useState(null);
	const [geolocationError, setGeolocationError] = useState(null);
	const [isGeolocationEnabled, setIsGeolocationEnabled] = useState(false);
	const [districts, setDistricts] = useState(null);
	const [mobilityPreview, setMobilityPreview] = useState(EMPTY_MOBILITY_PREVIEW);
	const [isMobilityPreviewLoading, setIsMobilityPreviewLoading] = useState(false);
	const filteredStations = useMemo(() => {
		return stationsData.stations.filter((station) => {
			if (onlyWithBikes && station.bikesAvailable <= 0) return false;
			if (onlyWithAnchors && station.anchorsFree <= 0) return false;
			return true;
		});
	}, [
		onlyWithAnchors,
		onlyWithBikes,
		stationsData.stations
	]);
	const activeWindow = TIME_WINDOWS.find((window) => window.id === activeWindowId) ?? TIME_WINDOWS[1];
	const selectedStation = useMemo(() => {
		if (filteredStations.length === 0) return null;
		return filteredStations.find((station) => station.id === selectedStationId) ?? filteredStations[0];
	}, [filteredStations, selectedStationId]);
	const stationDistrictMap = useMemo(() => {
		if (!districts) return /* @__PURE__ */ new Map();
		return buildStationDistrictMap(stationsData.stations, districts);
	}, [districts, stationsData.stations]);
	const nearestStation = useMemo(() => {
		if (!userLocation || stationsData.stations.length === 0) return null;
		let bestMatch = null;
		for (const station of stationsData.stations) {
			if (!Number.isFinite(station.lat) || !Number.isFinite(station.lon)) continue;
			const distanceMeters = haversineDistanceMeters(userLocation, {
				latitude: station.lat,
				longitude: station.lon
			});
			if (!bestMatch || distanceMeters < bestMatch.distanceMeters) bestMatch = {
				stationId: station.id,
				distanceMeters
			};
		}
		return bestMatch;
	}, [stationsData.stations, userLocation]);
	const shouldLoadDistricts = searchQuery.trim().length > 0;
	useEffect(() => {
		if (!shouldLoadDistricts || districts) return;
		const controller = new AbortController();
		let isActive = true;
		const loadDistricts = async () => {
			try {
				const payload = await fetchDistrictCollection(controller.signal);
				if (!payload || !isActive) return;
				setDistricts(payload);
			} catch (error) {
				if (error.name === "AbortError") return;
				captureExceptionWithContext(error, {
					area: "dashboard.client",
					operation: "loadDistrictsForSearch",
					extra: { searchQuery }
				});
				console.error("[Dashboard] No se pudieron cargar distritos para busqueda por barrio.", error);
			}
		};
		loadDistricts();
		return () => {
			isActive = false;
			controller.abort();
		};
	}, [
		districts,
		searchQuery,
		shouldLoadDistricts
	]);
	useEffect(() => {
		if (typeof window === "undefined") return;
		const currentSnapshot = buildStationSnapshotMap(initialData.stations.stations);
		setFavoriteStationIds(parsedFavorites);
		const previousSnapshot = parseStationSnapshot(window.sessionStorage.getItem(TREND_SNAPSHOT_STORAGE_KEY));
		if (previousSnapshot) setStationTrendById(computeStationTrends(previousSnapshot, initialData.stations.stations));
		const nextRecentSnapshots = pushRecentSnapshot(parseRecentSnapshots(window.sessionStorage.getItem(RECENT_SNAPSHOTS_STORAGE_KEY)), {
			recordedAt: initialData.stations.generatedAt,
			snapshot: currentSnapshot
		});
		setRecentSnapshots(nextRecentSnapshots);
		writeJsonStorageItem(window.sessionStorage, TREND_SNAPSHOT_STORAGE_KEY, currentSnapshot);
		writeJsonStorageItem(window.sessionStorage, RECENT_SNAPSHOTS_STORAGE_KEY, nextRecentSnapshots);
	}, [initialData.stations]);
	useEffect(() => {
		if (typeof window === "undefined") return;
		writeJsonStorageItem(window.localStorage, FAVORITES_STORAGE_KEY, favoriteStationIds);
	}, [favoriteStationIds]);
	useEffect(() => {
		if (!isGeolocationEnabled) return;
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			setGeolocationError("La geolocalizacion no esta disponible en este navegador.");
			return;
		}
		const watcherId = navigator.geolocation.watchPosition((position) => {
			setUserLocation({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude
			});
			setGeolocationError(null);
		}, (error) => {
			setGeolocationError(error.message || "No se pudo obtener tu ubicacion.");
		}, {
			enableHighAccuracy: true,
			timeout: 12e3,
			maximumAge: 9e4
		});
		return () => {
			navigator.geolocation.clearWatch(watcherId);
		};
	}, [isGeolocationEnabled]);
	useEffect(() => {
		if (filteredStations.length === 0) {
			setSelectedStationId("");
			return;
		}
		if (filteredStations.some((station) => station.id === selectedStationId)) return;
		setSelectedStationId(filteredStations[0]?.id ?? "");
	}, [filteredStations, selectedStationId]);
	useEffect(() => {
		const stationIdFromUrl = resolveStationId(stationsData.stations, searchParams.get("stationId"));
		const windowIdFromUrl = resolveTimeWindowId(searchParams.get("timeWindow"));
		const modeFromUrl = resolveDashboardViewMode(searchParams.get("mode"));
		const queryFromUrl = searchParams.get("q") ?? "";
		const onlyWithBikesFromUrl = parseBooleanFilter(searchParams.get("onlyWithBikes"));
		const onlyWithAnchorsFromUrl = parseBooleanFilter(searchParams.get("onlyWithAnchors"));
		const mapViewFromUrl = resolveDashboardMapViewState(searchParams);
		setSelectedStationId((current) => current === stationIdFromUrl ? current : stationIdFromUrl);
		setActiveWindowId((current) => current === windowIdFromUrl ? current : windowIdFromUrl);
		setViewMode((current) => current === modeFromUrl ? current : modeFromUrl);
		setSearchQuery((current) => current === queryFromUrl ? current : queryFromUrl);
		setOnlyWithBikes((current) => current === onlyWithBikesFromUrl ? current : onlyWithBikesFromUrl);
		setOnlyWithAnchors((current) => current === onlyWithAnchorsFromUrl ? current : onlyWithAnchorsFromUrl);
		setMapViewState((current) => current.latitude === mapViewFromUrl.latitude && current.longitude === mapViewFromUrl.longitude && current.zoom === mapViewFromUrl.zoom ? current : mapViewFromUrl);
	}, [searchParams, stationsData.stations]);
	useEffect(() => {
		const nextParams = buildDashboardUrlSearchParams(searchParams, {
			activeWindowId,
			viewMode,
			selectedStationId,
			searchQuery,
			onlyWithBikes,
			onlyWithAnchors,
			mapViewState
		});
		if (!(nextParams.toString() !== searchParams.toString())) return;
		const nextQuery = nextParams.toString();
		const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
		router.replace(nextUrl, { scroll: false });
	}, [
		activeWindowId,
		mapViewState,
		onlyWithAnchors,
		onlyWithBikes,
		pathname,
		router,
		searchParams,
		searchQuery,
		selectedStationId,
		viewMode
	]);
	useEffect(() => {
		if (!searchQuery.trim()) return;
		const query = normalizeText(searchQuery);
		const sourceStations = filteredStations.length > 0 ? filteredStations : stationsData.stations;
		const bestStationMatch = sourceStations.find((station) => {
			const normalizedName = normalizeText(station.name);
			const normalizedId = normalizeText(station.id);
			return normalizedName.includes(query) || normalizedId.includes(query);
		});
		if (bestStationMatch) {
			if (bestStationMatch.id !== selectedStationId) setSelectedStationId(bestStationMatch.id);
			return;
		}
		if (stationDistrictMap.size === 0) return;
		const matchingDistrict = Array.from(new Set(stationDistrictMap.values())).find((district) => normalizeText(district).includes(query));
		if (!matchingDistrict) return;
		const districtStation = sourceStations.find((station) => stationDistrictMap.get(station.id) === matchingDistrict);
		if (districtStation && districtStation.id !== selectedStationId) setSelectedStationId(districtStation.id);
	}, [
		filteredStations,
		searchQuery,
		selectedStationId,
		stationDistrictMap,
		stationsData.stations
	]);
	const toggleFavoriteStation = useCallback((stationId) => {
		setFavoriteStationIds((current) => {
			if (current.includes(stationId)) return current.filter((id) => id !== stationId);
			return [...current, stationId];
		});
	}, []);
	const selectStationWithTracking = useCallback((stationId, source, module = "station_selector") => {
		if (!stationId || stationId === selectedStationId) return;
		trackUmamiEvent(buildEntitySelectEvent({
			surface: "dashboard",
			routeKey: dashboardRouteKey,
			entityType: "station",
			source,
			module
		}));
		setSelectedStationId(stationId);
	}, [dashboardRouteKey, selectedStationId]);
	const handleChangeMode = useCallback((mode) => {
		if (mode === viewMode) return;
		trackUmamiEvent(buildDashboardModeChangeEvent({
			routeKey: dashboardRouteKey,
			mode,
			source: "mode_header"
		}));
		setViewMode(mode);
	}, [dashboardRouteKey, viewMode]);
	const handleChangeWindow = useCallback((windowId) => {
		if (windowId === activeWindowId) return;
		trackUmamiEvent(buildFilterChangeEvent({
			surface: "dashboard",
			routeKey: dashboardRouteKey,
			module: "time_window",
			source: "dashboard_header",
			timeWindow: windowId
		}));
		setActiveWindowId(windowId);
	}, [activeWindowId, dashboardRouteKey]);
	const handleToggleOnlyWithBikes = useCallback((value) => {
		if (value === onlyWithBikes) return;
		trackUmamiEvent(buildFilterChangeEvent({
			surface: "dashboard",
			routeKey: dashboardRouteKey,
			module: "only_with_bikes",
			source: "dashboard_header",
			destination: value ? "enabled" : "disabled"
		}));
		setOnlyWithBikes(value);
	}, [dashboardRouteKey, onlyWithBikes]);
	const handleToggleOnlyWithAnchors = useCallback((value) => {
		if (value === onlyWithAnchors) return;
		trackUmamiEvent(buildFilterChangeEvent({
			surface: "dashboard",
			routeKey: dashboardRouteKey,
			module: "only_with_anchors",
			source: "dashboard_header",
			destination: value ? "enabled" : "disabled"
		}));
		setOnlyWithAnchors(value);
	}, [dashboardRouteKey, onlyWithAnchors]);
	const enableGeolocation = useCallback(() => {
		setIsGeolocationEnabled(true);
		setGeolocationError(null);
	}, []);
	const refreshDashboardData = useCallback(async () => {
		const fetchJson = async (url) => {
			try {
				const response = await fetch(url, { cache: "no-store" });
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return {
					ok: true,
					data: await response.json()
				};
			} catch (error) {
				captureExceptionWithContext(error, {
					area: "dashboard.client",
					operation: "refreshDashboardData.fetchJson",
					extra: { url }
				});
				console.error(`[Dashboard] No se pudo refrescar ${url}`, error);
				return { ok: false };
			}
		};
		setIsRefreshingData(true);
		try {
			const rankingLimit = Math.max(50, Math.min(200, stationsData.stations.length || 50));
			const [stationsResult, alertsResult, turnoverResult, availabilityResult, statusResult] = await Promise.all([
				fetchJson(appRoutes.api.stations()),
				fetchJson(appRoutes.api.alerts({ limit: 20 })),
				fetchJson(appRoutes.api.rankings({
					type: "turnover",
					limit: rankingLimit
				})),
				fetchJson(appRoutes.api.rankings({
					type: "availability",
					limit: rankingLimit
				})),
				fetchJson(appRoutes.api.status())
			]);
			if (stationsResult.ok) {
				const nextStationSnapshot = buildStationSnapshotMap(stationsResult.data.stations);
				const previousSnapshot = parseStationSnapshot(window.sessionStorage.getItem(TREND_SNAPSHOT_STORAGE_KEY));
				const fallbackSnapshot = buildStationSnapshotMap(stationsData.stations);
				setStationTrendById(computeStationTrends(previousSnapshot ?? fallbackSnapshot, stationsResult.data.stations));
				writeJsonStorageItem(window.sessionStorage, TREND_SNAPSHOT_STORAGE_KEY, nextStationSnapshot);
				const nextRecentSnapshots = pushRecentSnapshot(parseRecentSnapshots(window.sessionStorage.getItem(RECENT_SNAPSHOTS_STORAGE_KEY)), {
					recordedAt: stationsResult.data.generatedAt,
					snapshot: nextStationSnapshot
				});
				setRecentSnapshots(nextRecentSnapshots);
				writeJsonStorageItem(window.sessionStorage, RECENT_SNAPSHOTS_STORAGE_KEY, nextRecentSnapshots);
				setStationsData(stationsResult.data);
			}
			if (alertsResult.ok) setAlertsData(alertsResult.data);
			if (turnoverResult.ok && availabilityResult.ok) setRankingsData({
				turnover: turnoverResult.data,
				availability: availabilityResult.data
			});
			if (statusResult.ok) setStatusData(statusResult.data);
			const latestStations = stationsResult.ok ? stationsResult.data : stationsData;
			const latestStatus = statusResult.ok ? statusResult.data : statusData;
			setNextRefreshAt(resolveNextRefreshAt(initialData.dataset, latestStations, latestStatus));
		} finally {
			setIsRefreshingData(false);
		}
	}, [
		initialData.dataset,
		stationsData,
		statusData
	]);
	useEffect(() => {
		const delayMs = nextRefreshAt.getTime() - Date.now();
		if (delayMs <= 0) {
			refreshDashboardData();
			return;
		}
		const timeoutId = window.setTimeout(() => {
			refreshDashboardData();
		}, delayMs);
		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [nextRefreshAt, refreshDashboardData]);
	useEffect(() => {
		setRefreshCountdownMs(Math.max(0, nextRefreshAt.getTime() - Date.now()));
		const timerId = window.setInterval(() => {
			setRefreshCountdownMs(Math.max(0, nextRefreshAt.getTime() - Date.now()));
		}, 1e3);
		return () => {
			window.clearInterval(timerId);
		};
	}, [nextRefreshAt]);
	useEffect(() => {
		const controller = new AbortController();
		let isActive = true;
		const refreshMobilityPreview = async () => {
			if (isActive) setIsMobilityPreviewLoading(true);
			try {
				const searchParams = new URLSearchParams({
					mobilityDays: String(activeWindow.mobilityDays),
					demandDays: String(activeWindow.demandDays)
				});
				const selectedMonth = new URLSearchParams(window.location.search).get("month");
				if (selectedMonth) searchParams.set("month", selectedMonth);
				const response = await fetch(`${appRoutes.api.mobility()}?${searchParams.toString()}`, { signal: controller.signal });
				if (!response.ok) throw new Error("No se pudo cargar la vista previa de flujo.");
				const payload = await response.json();
				if (!isActive) return;
				setMobilityPreview({
					hourlySignals: Array.isArray(payload.hourlySignals) ? payload.hourlySignals : [],
					dailyDemand: Array.isArray(payload.dailyDemand) ? payload.dailyDemand : [],
					systemHourlyProfile: Array.isArray(payload.systemHourlyProfile) ? payload.systemHourlyProfile : []
				});
			} catch (error) {
				if (error.name === "AbortError") return;
				captureExceptionWithContext(error, {
					area: "dashboard.client",
					operation: "refreshMobilityPreview",
					extra: {
						mobilityDays: activeWindow.mobilityDays,
						demandDays: activeWindow.demandDays
					}
				});
				console.error("Error al refrescar vista previa de flujo.", error);
				if (isActive) setMobilityPreview(EMPTY_MOBILITY_PREVIEW);
			} finally {
				if (isActive) setIsMobilityPreviewLoading(false);
			}
		};
		refreshMobilityPreview();
		return () => {
			isActive = false;
			controller.abort();
		};
	}, [activeWindow.demandDays, activeWindow.mobilityDays]);
	const selectedStationDetailUrl = selectedStation ? appRoutes.dashboardStation(selectedStation.id) : appRoutes.dashboardStations();
	const totalStationsCount = stationsData.stations.length;
	const filteredOutCount = Math.max(0, totalStationsCount - filteredStations.length);
	const nearestStationInfo = nearestStation ? stationsData.stations.find((station) => station.id === nearestStation.stationId) ?? null : null;
	const refreshProgress = (REFRESH_AFTER_LAST_DATA_MS - Math.max(0, refreshCountdownMs)) / REFRESH_AFTER_LAST_DATA_MS * 100;
	const hasAvailabilityFilter = onlyWithBikes || onlyWithAnchors;
	const nearestMessage = nearestStationInfo && nearestStation ? `📍 Estacion mas cercana: ${nearestStationInfo.name} · A ${formatDistanceMeters(nearestStation.distanceMeters)} de ti` : geolocationError ? `📍 ${geolocationError}` : isGeolocationEnabled ? "📍 Buscando tu ubicacion para calcular la estacion mas cercana..." : "📍 Activa tu ubicacion para calcular la estacion mas cercana.";
	const systemMetrics = useSystemMetrics({
		stations: stationsData.stations,
		rankings: rankingsData,
		alerts: alertsData,
		status: statusData
	});
	const datasetLastSampleAt = statusData.quality.freshness.lastUpdated ?? initialData.dataset.lastUpdated.lastSampleAt;
	const updatedText = statusData.quality.freshness.lastUpdated ? new Date(statusData.quality.freshness.lastUpdated).toLocaleString("es-ES") : "sin datos";
	const sharedDatasetUpdatedText = datasetLastSampleAt ? new Date(datasetLastSampleAt).toLocaleString("es-ES") : "sin datos";
	const datasetSummaryLabel = `Cobertura ${initialData.dataset.coverage.totalDays} dias · ${initialData.dataset.coverage.totalStations} estaciones · ultima muestra ${sharedDatasetUpdatedText}`;
	const topFrictionStationName = systemMetrics.topFriction ? stationsData.stations.find((station) => station.id === systemMetrics.topFriction?.stationId)?.name ?? systemMetrics.topFriction.stationId : null;
	const frictionByStationId = useMemo(() => Object.fromEntries(rankingsData.availability.rankings.map((row) => [row.stationId, row.emptyHours + row.fullHours])), [rankingsData.availability.rankings]);
	const dashboardDataState = combineDataStates([
		initialData.dataset.dataState,
		stationsData.dataState,
		statusData.dataState,
		rankingsData.turnover.dataState,
		rankingsData.availability.dataState
	]);
	return /* @__PURE__ */ jsxs(DashboardLayout, {
		mode: viewMode,
		children: [
			/* @__PURE__ */ jsx(DashboardPageViewTracker, {
				routeKey: dashboardRouteKey,
				pageType: "dashboard",
				template: "dashboard_home"
			}),
			/* @__PURE__ */ jsx(DashboardHeader, {
				timeWindows: TIME_WINDOWS,
				activeWindowId,
				onChangeWindow: handleChangeWindow,
				searchQuery,
				onChangeSearch: setSearchQuery,
				onlyWithBikes,
				onlyWithAnchors,
				onToggleOnlyWithBikes: handleToggleOnlyWithBikes,
				onToggleOnlyWithAnchors: handleToggleOnlyWithAnchors,
				filteredStationsCount: filteredStations.length,
				totalStationsCount,
				filteredOutCount: hasAvailabilityFilter ? filteredOutCount : 0,
				favoriteCount: favoriteStationIds.length,
				activeAlertsCount: alertsData.alerts.length,
				activeWindowLabel: activeWindow.label,
				isMobilityPreviewLoading,
				isRefreshingData,
				nearestMessage,
				datasetSummaryLabel,
				onUseGeolocation: enableGeolocation,
				canUseGeolocation: !isGeolocationEnabled && !(nearestStationInfo && nearestStation),
				onJumpToNearest: () => {
					if (!nearestStationInfo) return;
					setOnlyWithBikes(false);
					setOnlyWithAnchors(false);
					selectStationWithTracking(nearestStationInfo.id, "nearest_station", "geolocation");
				},
				canJumpToNearest: Boolean(nearestStationInfo && nearestStation),
				refreshCountdownLabel: formatCountdown(refreshCountdownMs),
				refreshProgress
			}),
			shouldShowDataStateNotice(dashboardDataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
				state: dashboardDataState,
				subject: "el dashboard",
				description: "Todos los paneles comparten el mismo snapshot de cobertura, estado y rankings. Si este banner marca cobertura parcial o dataset antiguo, el resto de widgets heredan esa misma limitacion.",
				href: appRoutes.status(),
				actionLabel: "Abrir estado"
			}) : null,
			/* @__PURE__ */ jsxs(Tabs, {
				value: viewMode,
				onValueChange: (value) => {
					if (value === "overview" || value === "operations" || value === "research" || value === "data") handleChangeMode(value);
				},
				children: [
					/* @__PURE__ */ jsx(ModeHeader, { activeMode: viewMode }),
					/* @__PURE__ */ jsx(ModeIntroBanner, { mode: viewMode }),
					/* @__PURE__ */ jsx(TabsContent, {
						value: "overview",
						children: viewMode === "overview" ? /* @__PURE__ */ jsx(OverviewModeView, {
							status: statusData,
							stationsGeneratedAt: stationsData.generatedAt,
							totalStations: totalStationsCount,
							stations: stationsData.stations,
							filteredStations,
							selectedStationId,
							onSelectStation: (stationId) => selectStationWithTracking(stationId, "overview_mode", "overview"),
							favoriteStationIds,
							onToggleFavorite: toggleFavoriteStation,
							trendByStationId: stationTrendById,
							nearestStationId: nearestStation?.stationId ?? null,
							nearestDistanceMeters: nearestStation?.distanceMeters ?? null,
							userLocation,
							mapViewState,
							onViewStateCommit: setMapViewState,
							frictionByStationId,
							systemMetrics,
							updatedText,
							topFrictionStationName,
							mobilityPreview,
							activeWindowLabel: activeWindow.label,
							activeWindowDemandDays: activeWindow.demandDays
						}) : null
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						value: "operations",
						children: viewMode === "operations" ? /* @__PURE__ */ jsx(OperationsModeView, {
							stations: stationsData.stations,
							filteredStations,
							totalStations: totalStationsCount,
							selectedStationId,
							onSelectStation: (stationId) => selectStationWithTracking(stationId, "operations_mode", "operations"),
							favoriteStationIds,
							onToggleFavorite: toggleFavoriteStation,
							trendByStationId: stationTrendById,
							nearestStationId: nearestStation?.stationId ?? null,
							nearestDistanceMeters: nearestStation?.distanceMeters ?? null,
							userLocation,
							mapViewState,
							onViewStateCommit: setMapViewState,
							frictionByStationId,
							alerts: alertsData,
							rankings: rankingsData,
							balanceIndex: systemMetrics.balanceIndex,
							criticalStationsCount: systemMetrics.criticalStations.length,
							dailyInsight: systemMetrics.dailyInsight,
							topFrictionStationName,
							activeAlertsCount: systemMetrics.activeAlerts.length
						}) : null
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						value: "research",
						children: viewMode === "research" ? /* @__PURE__ */ jsx(ResearchModeView, {
							stations: stationsData.stations,
							filteredStations,
							selectedStationId,
							onSelectStation: (stationId) => selectStationWithTracking(stationId, "research_mode", "research"),
							favoriteStationIds,
							onToggleFavorite: toggleFavoriteStation,
							trendByStationId: stationTrendById,
							nearestStationId: nearestStation?.stationId ?? null,
							rankings: rankingsData,
							dailyDemand: mobilityPreview.dailyDemand,
							systemHourlyProfile: mobilityPreview.systemHourlyProfile,
							hourlySignals: mobilityPreview.hourlySignals,
							windowLabel: activeWindow.label,
							requestedDays: activeWindow.demandDays,
							recentSnapshots
						}) : null
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						value: "data",
						children: viewMode === "data" ? /* @__PURE__ */ jsx(DataModeView, {
							stationsCsvUrl: appRoutes.api.stations({ format: "csv" }),
							frictionCsvUrl: appRoutes.api.rankings({
								type: "availability",
								limit: 200,
								format: "csv"
							}),
							historyJsonUrl: appRoutes.api.history(),
							historyCsvUrl: appRoutes.api.history({ format: "csv" }),
							alertsCsvUrl: appRoutes.api.alertsHistory({
								format: "csv",
								state: "all",
								limit: 500
							}),
							statusCsvUrl: appRoutes.api.status({ format: "csv" })
						}) : null
					})
				]
			}),
			/* @__PURE__ */ jsx(DashboardQuickLinks, { selectedStationDetailUrl }),
			/* @__PURE__ */ jsxs("footer", {
				className: "pb-4 text-center text-[11px] text-[var(--muted)]",
				suppressHydrationWarning: true,
				children: [
					"© ",
					(/* @__PURE__ */ new Date()).getFullYear(),
					" Bizi Zaragoza - Sistema de analitica de movilidad urbana."
				]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard.tsx?tsr-split=component
init_routes();
init_sentry_reporting();
init_page_shell();
function toErrorMessage(error) {
	if (error instanceof Error) return error.message;
	return String(error);
}
function isMissingTableError(error) {
	const message = toErrorMessage(error).toLowerCase();
	if (message.includes("no such table") || message.includes("p2021")) return true;
	if (error && typeof error === "object") {
		const maybeError = error;
		if (maybeError.cause && isMissingTableError(maybeError.cause)) return true;
		if (maybeError.meta?.driverAdapterError && isMissingTableError(maybeError.meta.driverAdapterError)) return true;
	}
	return false;
}
async function DashboardPage() {
	const siteUrl = getSiteUrl();
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const fallbackStations = buildFallbackStations(nowIso);
	const fallbackStatus = buildFallbackStatus(nowIso);
	const fallbackDataset = buildFallbackDatasetSnapshot(nowIso);
	const fallbackAlerts = {
		limit: 20,
		alerts: [],
		generatedAt: nowIso
	};
	const fallbackTurnover = {
		type: "turnover",
		limit: 50,
		rankings: [],
		districtSpotlight: [],
		generatedAt: nowIso,
		dataState: "no_coverage"
	};
	const fallbackAvailability = {
		type: "availability",
		limit: 50,
		rankings: [],
		districtSpotlight: [],
		generatedAt: nowIso,
		dataState: "no_coverage"
	};
	const loadErrors = [];
	const schemaMissingFlags = [];
	const withFallback = async (label, fetcher, fallback) => {
		try {
			return await fetcher();
		} catch (error) {
			const schemaMissing = isMissingTableError(error);
			captureExceptionWithContext(error, {
				area: "dashboard.ssr",
				operation: "DashboardPage.withFallback",
				tags: {
					panel: label,
					schemaMissing
				},
				extra: { label }
			});
			console.error(`[Dashboard] Error cargando ${label}:`, error);
			loadErrors.push(label);
			if (schemaMissing) schemaMissingFlags.push(true);
			return fallback;
		}
	};
	const [stations, dataset] = await Promise.all([withFallback("estaciones", fetchStations, fallbackStations), withFallback("metadatos compartidos", fetchSharedDatasetSnapshot, fallbackDataset)]);
	const rankingLimit = Math.max(50, Math.min(200, stations.stations.length > 0 ? stations.stations.length : 50));
	const [status, alerts, turnover, availability] = await Promise.all([
		withFallback("estado del sistema", fetchStatus, fallbackStatus),
		withFallback("alertas", () => fetchAlerts(20), fallbackAlerts),
		withFallback("ranking de uso", () => fetchRankings("turnover", rankingLimit), {
			...fallbackTurnover,
			limit: rankingLimit
		}),
		withFallback("ranking de disponibilidad", () => fetchRankings("availability", rankingLimit), {
			...fallbackAvailability,
			limit: rankingLimit
		})
	]);
	const initialData = {
		dataset,
		stations,
		status,
		alerts,
		rankings: {
			turnover,
			availability
		}
	};
	const isSchemaMissing = schemaMissingFlags.length > 0;
	const breadcrumbs = createRootBreadcrumbs({
		label: "Dashboard",
		href: appRoutes.dashboard()
	});
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			buildBreadcrumbStructuredData(breadcrumbs),
			{
				"@type": "WebApplication",
				name: `${SITE_TITLE} Dashboard`,
				applicationCategory: "BusinessApplication",
				operatingSystem: "Web",
				url: `${siteUrl}${appRoutes.dashboard()}`,
				description: "Panel principal de Bizi Zaragoza con estado del sistema, mapa en tiempo real, demanda, rankings y flujo urbano.",
				publisher: {
					"@type": "Organization",
					name: SITE_NAME,
					url: siteUrl
				}
			},
			{
				"@type": "Dataset",
				name: "Estado y analitica del sistema Bizi Zaragoza",
				description: "Datos agregados de estaciones, alertas, demanda, ocupacion y salud del sistema para el dashboard principal.",
				url: `${siteUrl}${appRoutes.dashboard()}`,
				distribution: [
					{
						"@type": "DataDownload",
						encodingFormat: "application/json",
						contentUrl: `${siteUrl}${appRoutes.api.stations()}`
					},
					{
						"@type": "DataDownload",
						encodingFormat: "text/csv",
						contentUrl: `${siteUrl}${appRoutes.api.stations()}?format=csv`
					},
					{
						"@type": "DataDownload",
						encodingFormat: "application/json",
						contentUrl: `${siteUrl}${appRoutes.api.status()}`
					}
				]
			}
		]
	};
	return /* @__PURE__ */ jsxs(PageShell, {
		maxWidthClassName: "",
		children: [
			/* @__PURE__ */ jsx("script", {
				type: "application/ld+json",
				suppressHydrationWarning: true,
				dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mx-auto mb-4 w-full max-w-[1280px]",
				children: /* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs })
			}),
			loadErrors.length > 0 ? /* @__PURE__ */ jsxs("section", {
				className: "mx-auto mb-6 w-full max-w-[1280px] rounded-2xl border border-amber-500/40 bg-amber-500/12 px-4 py-3 text-sm text-amber-100 shadow-[var(--shadow-soft)]",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "font-semibold",
					children: [
						"No se pudieron cargar algunos paneles: ",
						loadErrors.join(", "),
						"."
					]
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs text-amber-200/80",
					children: isSchemaMissing ? "La base de datos parece no estar inicializada. Ejecuta `bun prisma migrate deploy` con la misma DATABASE_URL del servidor." : "Revisa los logs del servidor para mas detalles."
				})]
			}) : null,
			/* @__PURE__ */ jsx(DashboardClient, { initialData })
		]
	});
}
//#endregion
export { DashboardPage as component };
