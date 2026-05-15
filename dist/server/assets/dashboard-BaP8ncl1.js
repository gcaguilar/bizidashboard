import { n as cn, t as PageShell } from "./page-shell-DP1spWfk.js";
import { a as buildExportClickEvent, i as buildEntitySelectEvent, l as buildPanelOpenEvent, n as buildDashboardModeChangeEvent, o as buildFilterChangeEvent, p as trackUmamiEvent } from "./umami-BYNhNb0r.js";
import { t as TrackedLink } from "./TrackedLink-dteSAIPr.js";
import { r as appRoutes } from "./routes-CFkMZBCM.js";
import { n as SiteBreadcrumbs } from "./createSsrRpc-BFE1gq-C.js";
import { a as Badge, t as Card } from "./card-BX20N-Ev.js";
import { n as ANALYTICS_WINDOWS, t as ALERT_THRESHOLDS } from "./types-DbADi-Xa.js";
import { n as formatAlertType, o as formatPercent } from "./format-DRxgyIYB.js";
import { n as buttonVariants, t as Button } from "./button-Bgvi3bSh.js";
import { a as isRecord, n as buildStationDistrictMap, o as parseJsonValue, r as fetchDistrictCollection } from "./districts-DMcc_jOx.js";
import { n as haversineDistanceMeters, t as formatDistanceMeters } from "./geo-C-pZxQbr.js";
import { t as captureExceptionWithContext } from "./sentry-reporting-6fzVQr1k.js";
import { t as TIMEZONE } from "./timezone-DIvdn6H4.js";
import { n as useAbortableAsyncEffect, t as fetchJson } from "./useAbortableAsyncEffect-afF5quzV.js";
import { r as resolveDataState, t as combineDataStates, u as shouldShowDataStateNotice } from "./data-state-UX6jPIR_.js";
import { t as DataStateNotice } from "./DataStateNotice-Dzz1drH7.js";
import { r as resolveDashboardViewMode, t as DASHBOARD_MODE_META } from "./dashboard-modes-DmynMJBV.js";
import { a as MetricGrid, c as GitHubRepoButton, d as Progress, f as FeedbackCta, i as MetricCard, l as DashboardRouteLinks, n as MeasuredResponsiveContainer, o as Skeleton, r as ChartWrapper, s as ThemeToggleButton, t as Route, u as PageHeaderCard } from "./dashboard-DxMM1V45.js";
import { a as Checkbox, i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-KaqJfHCb.js";
import { a as ScrollArea, i as TrackedAnchor, n as AlertDescription, o as DashboardPageViewTracker, r as AlertTitle, s as Input, t as Alert } from "./alert-BmvSL5Kt.js";
import * as React from "react";
import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Tooltip } from "@base-ui/react/tooltip";
import { Layer, Map as Map$1, Marker, Popup, Source } from "react-map-gl/maplibre";
import { Area, AreaChart, CartesianGrid, Legend, Line, Tooltip as Tooltip$1, XAxis, YAxis } from "recharts";
import { Combobox } from "@base-ui/react/combobox";
import { Popover } from "@base-ui/react/popover";
//#region src/lib/map-view-state.ts
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
function DashboardHeader({ timeWindows, activeWindowId, onChangeWindow, searchQuery, onChangeSearch, onlyWithBikes, onlyWithAnchors, onToggleOnlyWithBikes, onToggleOnlyWithAnchors, filteredStationsCount, totalStationsCount, filteredOutCount, favoriteCount, activeAlertsCount, activeWindowLabel, isMobilityPreviewLoading, isRefreshingData, nearestMessage, datasetSummaryLabel, onUseGeolocation, canUseGeolocation, onJumpToNearest, canJumpToNearest, refreshCountdownLabel, refreshProgress }) {
	const hasAvailabilityFilter = filteredOutCount > 0;
	return /* @__PURE__ */ jsxs(PageHeaderCard, { children: [/* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap items-center justify-between gap-4",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex min-w-0 items-center gap-6",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-3 text-[var(--primary)]",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white",
					children: "B"
				}), /* @__PURE__ */ jsx("h1", {
					className: "text-xl font-bold tracking-tight text-[var(--foreground)]",
					children: "Bizi Zaragoza"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "hidden items-center gap-2 rounded-lg bg-[var(--primary)]/10 p-1 lg:flex",
				children: timeWindows.map((window) => /* @__PURE__ */ jsx(Button, {
					onClick: () => onChangeWindow(window.id),
					"aria-pressed": activeWindowId === window.id,
					className: `rounded-md px-4 py-1.5 text-xs font-semibold transition ${activeWindowId === window.id ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--foreground)]"}`,
					variant: "ghost",
					size: "sm",
					children: window.label
				}, window.id))
			})]
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
	}), /* @__PURE__ */ jsxs("div", {
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
	})] });
}
//#endregion
//#region src/app/dashboard/_components/ModeIntroBanner.tsx
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
//#region src/app/dashboard/_components/useSystemMetrics.ts
function occupancyRatio$1(station) {
	if (!Number.isFinite(station.capacity) || station.capacity <= 0) return 0;
	return Math.max(0, Math.min(1, station.bikesAvailable / station.capacity));
}
function calculateFrictionScore(emptyHours, fullHours) {
	return Math.max(0, emptyHours) + Math.max(0, fullHours);
}
function calculateBalanceIndex(stations) {
	const valid = stations.filter((station) => Number.isFinite(station.capacity) && station.capacity > 0);
	if (valid.length === 0) return 0;
	const deviation = valid.reduce((sum, station) => sum + Math.abs(occupancyRatio$1(station) - .5), 0);
	return Math.max(0, Math.min(1, 1 - 2 / valid.length * deviation));
}
function useSystemMetrics({ stations, rankings, alerts, status }) {
	return useMemo(() => {
		const totalStations = stations.length;
		const bikesAvailable = stations.reduce((sum, station) => sum + Math.max(0, station.bikesAvailable), 0);
		const anchorsFree = stations.reduce((sum, station) => sum + Math.max(0, station.anchorsFree), 0);
		const avgOccupancy = totalStations > 0 ? stations.reduce((sum, station) => sum + occupancyRatio$1(station), 0) / totalStations : 0;
		const balanceIndex = calculateBalanceIndex(stations);
		const criticalStations = stations.filter((station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0);
		const frictionRanking = rankings.availability.rankings.slice(0, 10).map((row) => ({
			...row,
			frictionScore: calculateFrictionScore(row.emptyHours, row.fullHours)
		}));
		const topFriction = frictionRanking[0] ?? null;
		return {
			totalStations,
			bikesAvailable,
			anchorsFree,
			avgOccupancy,
			balanceIndex,
			criticalStations,
			activeAlerts: alerts.alerts.filter((alert) => alert.isActive),
			frictionRanking,
			topFriction,
			dailyInsight: (() => {
				if (status.pipeline.healthStatus === "down") return "El sistema necesita atencion: la ultima ingesta o la calidad de datos muestran un problema claro.";
				if (criticalStations.length >= 10) return "Hay muchas estaciones en estado critico. Conviene priorizar redistribucion en las zonas mas saturadas o vacias.";
				if (balanceIndex >= .82) return "El sistema esta bastante equilibrado ahora mismo y la ocupacion media se mueve en una zona saludable.";
				if (avgOccupancy < .3) return "La red muestra una ocupacion media baja. Puede haber tension por falta de bicis en zonas clave.";
				if (avgOccupancy > .7) return "La red muestra una ocupacion media alta. Puede haber riesgo de falta de anclajes en estaciones populares.";
				return "La situacion global es estable, pero conviene vigilar las estaciones con mas horas problema para evitar friccion.";
			})()
		};
	}, [
		alerts.alerts,
		rankings.availability.rankings,
		stations,
		status.pipeline.healthStatus
	]);
}
memo(function WidgetSkeleton({ className = "", lines = 3 }) {
	return /* @__PURE__ */ jsxs("div", {
		className: `ui-section-card ${className}`.trim(),
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
Tooltip.Provider;
var Tooltip$2 = Tooltip.Root;
var TooltipTrigger = Tooltip.Trigger;
var TooltipContent = React.forwardRef(function TooltipContent({ className, children, ...props }, ref) {
	return /* @__PURE__ */ jsx(Tooltip.Portal, { children: /* @__PURE__ */ jsx(Tooltip.Positioner, {
		sideOffset: 8,
		children: /* @__PURE__ */ jsx(Tooltip.Popup, {
			ref,
			className: (state) => cn("z-50 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left text-[11px] leading-relaxed text-[var(--foreground)] shadow-[var(--shadow-soft)] backdrop-blur-md", typeof className === "function" ? className(state) : className),
			...props,
			children
		})
	}) });
});
//#endregion
//#region src/app/dashboard/_components/InfoHint.tsx
function InfoHint({ label, content }) {
	return /* @__PURE__ */ jsxs(Tooltip$2, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
		"aria-label": label,
		className: "inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[11px] font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]",
		children: "i"
	}), /* @__PURE__ */ jsx(TooltipContent, { children: content })] });
}
//#endregion
//#region src/app/dashboard/_components/BalanceIndexCard.tsx
function getBalanceTone(value) {
	if (value >= .8) return "text-emerald-400";
	if (value >= .6) return "text-amber-300";
	return "text-[var(--primary)]";
}
function getBalanceLabel(value) {
	if (value >= .8) return "Sistema equilibrado";
	if (value >= .6) return "Equilibrio mejorable";
	return "Desequilibrio alto";
}
function BalanceIndexCard({ balanceIndex, criticalStationsCount, density = "normal" }) {
	const percentage = Math.round(balanceIndex * 100);
	const compact = density === "compact";
	return /* @__PURE__ */ jsxs("article", {
		className: `ui-section-card ${compact ? "border-[var(--primary)]/30 bg-[var(--primary)]/6" : ""}`.trim(),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Operaciones"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-1 flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-lg font-bold text-[var(--foreground)]",
							children: "Balance index"
						}), /* @__PURE__ */ jsx(InfoHint, {
							label: "Como se calcula el balance index",
							content: "Se calcula comparando la ocupacion de cada estacion con el 50%. Si muchas estaciones estan cerca de ese punto, el sistema esta equilibrado y el indice sube hacia 1."
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "Mide como de cerca esta cada estacion del 50% de ocupacion. Cuanto mas cerca de 1, mas equilibrado esta el sistema."
					})
				] }), /* @__PURE__ */ jsx(Link, {
					to: appRoutes.dashboardHelp("balance-index"),
					className: "text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
					children: "Entender formula"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: `mt-5 flex items-end gap-4 ${compact ? "items-center" : ""}`.trim(),
				children: [/* @__PURE__ */ jsxs("p", {
					className: `${compact ? "text-4xl" : "text-5xl"} font-black ${getBalanceTone(balanceIndex)}`,
					children: [percentage, "%"]
				}), /* @__PURE__ */ jsxs("div", {
					className: "pb-1",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: getBalanceLabel(balanceIndex)
					}), /* @__PURE__ */ jsxs("p", {
						className: "text-xs text-[var(--muted)]",
						children: [criticalStationsCount, " estaciones en estado critico ahora mismo."]
					})]
				})]
			}),
			/* @__PURE__ */ jsx(Progress, {
				className: "mt-4 h-3 bg-black/15",
				value: percentage,
				indicatorClassName: "bg-[var(--primary)] duration-500"
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/DailyInsightsCard.tsx
function DailyInsightsCard({ insight, topFrictionStationName, activeAlertsCount }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Lectura diaria"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-1 text-lg font-bold text-[var(--foreground)]",
				children: "Lectura rapida del dia"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm text-[var(--foreground)]",
				children: insight
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 text-sm",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-semibold text-[var(--foreground)]",
							children: "Estacion a vigilar:"
						}),
						" ",
						topFrictionStationName ?? "Sin datos suficientes"
					]
				}), /* @__PURE__ */ jsxs("p", {
					className: "text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-semibold text-[var(--foreground)]",
							children: "Alertas activas:"
						}),
						" ",
						activeAlertsCount
					]
				})]
			})
		]
	});
}
//#endregion
//#region src/components/ui/empty-state-card.tsx
var EmptyStateCard = React.forwardRef(function EmptyStateCard({ className, title, description, actionLabel, actionSlot, ...props }, ref) {
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: cn("mt-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-5 text-sm text-[var(--muted)]", className),
		...props,
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "font-semibold text-[var(--foreground)]",
				children: title
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-1",
				children: description
			}),
			actionSlot ? /* @__PURE__ */ jsx(Button, {
				asChild: true,
				variant: "ghost",
				size: "sm",
				className: "mt-3 h-auto px-0 py-0 text-xs font-semibold text-[var(--primary)] hover:bg-transparent hover:text-[var(--primary)]",
				children: actionSlot
			}) : actionLabel ? /* @__PURE__ */ jsx("p", {
				className: "mt-3 text-xs font-semibold text-[var(--muted)]",
				children: actionLabel
			}) : null
		]
	});
});
//#endregion
//#region src/app/dashboard/_components/WidgetEmptyState.tsx
function WidgetEmptyState({ title, description, helpHref, helpLabel = "Entender este bloque" }) {
	return /* @__PURE__ */ jsx(EmptyStateCard, {
		title,
		description,
		actionSlot: helpHref ? /* @__PURE__ */ jsx(Link, {
			to: helpHref,
			children: helpLabel
		}) : void 0
	});
}
//#endregion
//#region src/app/dashboard/_components/DemandFlowCard.tsx
var MAX_VISIBLE_BARS = 12;
function formatDayLabel$1(day) {
	if (typeof day !== "string" || day.length < 10) return day;
	return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}
function formatDemandTick(value) {
	if (!Number.isFinite(value)) return "0";
	if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
	if (value >= 100) return String(Math.round(value));
	return value.toFixed(1);
}
function DemandFlowCard({ dailyDemand, windowLabel, requestedDays }) {
	const rows = (() => {
		if (dailyDemand.length <= MAX_VISIBLE_BARS) return dailyDemand;
		const sampledRows = [];
		let previousIndex = -1;
		for (let i = 0; i < MAX_VISIBLE_BARS; i += 1) {
			const index = Math.round(i * (dailyDemand.length - 1) / (MAX_VISIBLE_BARS - 1));
			if (index === previousIndex) continue;
			sampledRows.push(dailyDemand[index]);
			previousIndex = index;
		}
		return sampledRows;
	})();
	const maxDemand = Math.max(1, ...rows.map((row) => Number(row.demandScore) || 0));
	const daysWithSamples = dailyDemand.filter((row) => Number(row.sampleCount) > 0).length;
	const demandDataState = resolveDataState({
		hasCoverage: dailyDemand.length > 0,
		hasData: rows.length > 0,
		isPartial: daysWithSamples > 0 && daysWithSamples < requestedDays
	});
	const canRenderChart = demandDataState === "ok" || demandDataState === "partial";
	const yAxisTicks = [
		{
			value: maxDemand,
			color: "var(--primary)"
		},
		{
			value: maxDemand / 2,
			color: "var(--primary-soft)"
		},
		{
			value: 0,
			color: "var(--muted)"
		}
	];
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card h-full",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
					className: "text-sm font-bold uppercase tracking-[0.1em] text-[var(--foreground)]",
					children: "Flujo diario de demanda"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs text-[var(--muted)]",
					children: "Indice de actividad por dia para comparar intensidad, no viajes cerrados exactos."
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "text-right text-xs text-[var(--muted)]",
					children: [/* @__PURE__ */ jsxs("span", { children: [
						windowLabel,
						" · ",
						dailyDemand.length,
						"/",
						requestedDays,
						" dias"
					] }), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Link, {
						href: appRoutes.dashboardHelp("demanda-no-viajes-reales"),
						className: "font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
						children: "Entender metrica"
					}) })]
				})]
			}),
			demandDataState === "partial" ? /* @__PURE__ */ jsx(DataStateNotice, {
				state: demandDataState,
				subject: "la curva diaria",
				description: `Hay datos reales en ${daysWithSamples}/${requestedDays} dias; el resto se rellena como 0 para mantener la comparativa.`,
				href: appRoutes.status(),
				actionLabel: "Ver estado",
				className: "mt-4",
				compact: true
			}) : null,
			!canRenderChart ? /* @__PURE__ */ jsx(WidgetEmptyState, {
				title: demandDataState === "no_coverage" ? "Sin cobertura diaria" : "Sin datos de demanda",
				description: demandDataState === "no_coverage" ? "Aun no hay historico agregado suficiente para dibujar esta curva." : "Aun no hay suficiente serie diaria para dibujar la evolucion de la demanda en esta ventana.",
				helpHref: appRoutes.dashboardHelp("demanda-no-viajes-reales")
			}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
				className: "flex h-48 gap-2",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex w-10 shrink-0 flex-col justify-between py-1 text-right text-[10px] font-bold",
					children: yAxisTicks.map((tick, index) => /* @__PURE__ */ jsx("span", {
						style: { color: tick.color },
						children: formatDemandTick(tick.value)
					}, `${tick.value}-${index}`))
				}), /* @__PURE__ */ jsxs("div", {
					className: "relative flex flex-1 items-end gap-1 rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "pointer-events-none absolute inset-0 flex flex-col justify-between px-3 py-3",
						children: yAxisTicks.map((_, index) => /* @__PURE__ */ jsx("span", {
							className: index === 0 ? "block h-px" : "block h-px border-t",
							style: {
								borderColor: "var(--border)",
								backgroundColor: index === 0 ? "var(--border)" : "transparent"
							}
						}, `grid-${index}`))
					}), rows.map((row, index) => {
						const score = Number(row.demandScore) || 0;
						const height = Math.max(12, Math.round(score / maxDemand * 100));
						const alpha = .2 + (index + 1) / rows.length * .8;
						return /* @__PURE__ */ jsx("div", {
							className: "group relative z-10 flex h-full w-full items-end",
							children: /* @__PURE__ */ jsx("div", {
								className: "w-full rounded-t",
								style: {
									height: `${height}%`,
									backgroundColor: `rgba(234, 6, 21, ${alpha.toFixed(2)})`
								},
								title: `${formatDayLabel$1(row.day)} · ${score.toFixed(1)}`
							})
						}, `${row.day}-${index}`);
					})]
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-2 flex justify-between text-[10px] font-bold uppercase text-[var(--muted)]",
				children: [
					/* @__PURE__ */ jsx("span", { children: formatDayLabel$1(rows[0]?.day ?? "") }),
					/* @__PURE__ */ jsx("span", { children: formatDayLabel$1(rows[Math.floor(rows.length / 2)]?.day ?? "") }),
					/* @__PURE__ */ jsx("span", { children: formatDayLabel$1(rows[rows.length - 1]?.day ?? "") })
				]
			})] })
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/FlowPreviewPanel.tsx
function FlowPreviewPanel({ stations, hourlySignals }) {
	const [districts, setDistricts] = useState(null);
	const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
	const [districtError, setDistrictError] = useState(null);
	useAbortableAsyncEffect(async (signal, isActive) => {
		const payload = await fetchDistrictCollection(signal);
		if (!payload || !isActive()) return;
		setDistricts(payload);
	}, [], {
		onStart: () => {
			setIsLoadingDistricts(true);
			setDistrictError(null);
		},
		onError: (error) => {
			captureExceptionWithContext(error, {
				area: "dashboard.flow-preview",
				operation: "loadDistricts"
			});
			console.error("[Dashboard] No se pudo cargar distritos para preview de flujo.", error);
			setDistrictError("No se pudieron cargar los distritos para el resumen de flujo.");
		},
		onSettled: () => {
			setIsLoadingDistricts(false);
		}
	});
	const stationDistrictMap = useMemo(() => {
		if (!districts) return /* @__PURE__ */ new Map();
		return buildStationDistrictMap(stations, districts);
	}, [districts, stations]);
	const topRoutes = useMemo(() => {
		if (hourlySignals.length === 0 || stationDistrictMap.size === 0) return [];
		const districtTotals = /* @__PURE__ */ new Map();
		for (const row of hourlySignals) {
			const district = stationDistrictMap.get(row.stationId);
			if (!district) continue;
			const current = districtTotals.get(district) ?? {
				outbound: 0,
				inbound: 0
			};
			current.outbound += Math.max(0, Number(row.departures));
			current.inbound += Math.max(0, Number(row.arrivals));
			districtTotals.set(district, current);
		}
		const totalInbound = Array.from(districtTotals.values()).reduce((sum, row) => sum + row.inbound, 0);
		if (totalInbound <= 0) return [];
		const routeRows = [];
		for (const [originDistrict, values] of districtTotals.entries()) {
			if (values.outbound <= 0) continue;
			for (const [destinationDistrict, destinationValues] of districtTotals.entries()) {
				if (originDistrict === destinationDistrict || destinationValues.inbound <= 0) continue;
				routeRows.push({
					origin: originDistrict,
					destination: destinationDistrict,
					flow: values.outbound * (destinationValues.inbound / totalInbound)
				});
			}
		}
		return routeRows.sort((left, right) => right.flow - left.flow).slice(0, 4);
	}, [hourlySignals, stationDistrictMap]);
	const topFlowValue = Math.max(1, ...topRoutes.map((route) => route.flow));
	const flowPreviewState = resolveDataState({
		isLoading: isLoadingDistricts,
		error: districtError,
		hasCoverage: hourlySignals.length > 0,
		hasData: topRoutes.length > 0
	});
	const canRenderRoutes = flowPreviewState === "ok";
	return /* @__PURE__ */ jsxs("div", {
		className: "grid grid-cols-1 gap-8 p-6 lg:grid-cols-2",
		children: [/* @__PURE__ */ jsxs(Card, {
			className: "relative h-64 items-center justify-center rounded-xl border-dashed border-[var(--primary)]/35 bg-[var(--secondary)] p-0",
			children: [/* @__PURE__ */ jsx("div", {
				className: "absolute inset-0 opacity-20",
				style: { backgroundImage: "radial-gradient(circle at center, #ea0615 0%, transparent 70%)" }
			}), /* @__PURE__ */ jsxs("div", {
				className: "relative z-10 flex flex-col items-center text-center",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-4xl text-[var(--primary)]",
						children: "◎"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-sm font-bold text-[var(--foreground)]",
						children: "Modelo de distribucion espacial"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 max-w-sm text-xs text-[var(--muted)]",
						children: "Vista simplificada de la distribucion de trayectos entre los principales barrios."
					}),
					/* @__PURE__ */ jsx(Link, {
						href: appRoutes.dashboardFlow(),
						className: buttonVariants({
							variant: "default",
							size: "sm",
							className: "mt-4 min-h-0 bg-[#8f1018] px-4 py-2 text-xs font-bold hover:bg-[#731017]"
						}),
						children: "Expandir vista completa"
					})
				]
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "space-y-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
					className: "text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
					children: "Corredores de alto volumen"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs text-[var(--muted)]",
					children: "Rutas probables entre barrios estimadas a partir de entradas y salidas agregadas."
				})] }), /* @__PURE__ */ jsx(Link, {
					href: appRoutes.dashboardHelp("calculo-rutas"),
					className: buttonVariants({
						variant: "ghost",
						size: "sm",
						className: "min-h-0 px-1 py-0 text-xs font-semibold text-[var(--primary)] hover:underline"
					}),
					children: "Como se calcula"
				})]
			}), !canRenderRoutes ? /* @__PURE__ */ jsx(DataStateNotice, {
				state: flowPreviewState,
				subject: "el resumen de flujo",
				description: districtError ?? (isLoadingDistricts ? "Estamos cargando la geometria de barrios para estimar corredores." : "No hay suficientes señales horarias para estimar corredores en esta ventana."),
				href: appRoutes.status(),
				actionLabel: "Ver estado",
				compact: true
			}) : topRoutes.map((route) => {
				const flowPct = Math.max(8, Math.round(route.flow / topFlowValue * 100));
				return /* @__PURE__ */ jsxs(Card, {
					variant: "stat",
					className: "gap-2 rounded-lg p-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "mb-1 flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ jsxs("p", {
							className: "text-sm font-bold text-[var(--foreground)]",
							children: [
								route.origin,
								" → ",
								route.destination
							]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-[var(--foreground)]",
							children: route.flow.toFixed(0)
						})]
					}), /* @__PURE__ */ jsx(Progress, {
						className: "bg-black/25",
						value: flowPct,
						indicatorClassName: "bg-[var(--primary)]"
					})]
				}, `${route.origin}-${route.destination}`);
			})]
		})]
	});
}
//#endregion
//#region src/lib/map-features.ts
function buildStationFeatureCollection(params) {
	const { stations, getMarkerColor, favoriteStationIds, selectedStationId, frictionByStationId = {} } = params;
	return {
		type: "FeatureCollection",
		features: stations.filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lon)).map((station) => ({
			type: "Feature",
			properties: {
				stationId: station.id,
				stationName: station.name,
				markerColor: getMarkerColor(station),
				frictionScore: frictionByStationId[station.id] ?? 0,
				isFavorite: favoriteStationIds.has(station.id) ? 1 : 0,
				isSelected: selectedStationId && selectedStationId === station.id ? 1 : 0
			},
			geometry: {
				type: "Point",
				coordinates: [station.lon, station.lat]
			}
		}))
	};
}
//#endregion
//#region src/app/dashboard/_components/MapEngine.tsx
var DEFAULT_VIEW_STATE = {
	latitude: 41.65,
	longitude: -.88,
	zoom: 12
};
var FOCUS_ZOOM = 14.8;
var MAP_STYLE_LIGHT = {
	version: 8,
	sources: { cartoLight: {
		type: "raster",
		tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
		tileSize: 256,
		attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
	} },
	layers: [{
		id: "carto-light",
		type: "raster",
		source: "cartoLight"
	}]
};
var MAP_STYLE_DARK = {
	version: 8,
	sources: { cartoDark: {
		type: "raster",
		tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
		tileSize: 256,
		attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
	} },
	layers: [{
		id: "carto-dark",
		type: "raster",
		source: "cartoDark"
	}]
};
var CLUSTER_LAYER = {
	id: "clusters",
	type: "circle",
	source: "stations-source",
	filter: ["has", "point_count"],
	paint: {
		"circle-color": "#ea0615",
		"circle-radius": [
			"step",
			["get", "point_count"],
			18,
			20,
			22,
			50,
			28
		],
		"circle-stroke-color": "#ffffff",
		"circle-stroke-width": 2
	}
};
var SELECTED_HALO_LAYER = {
	id: "selected-halo",
	type: "circle",
	source: "stations-source",
	filter: [
		"all",
		["!", ["has", "point_count"]],
		[
			"==",
			["get", "isSelected"],
			1
		]
	],
	paint: {
		"circle-color": "rgba(234, 6, 21, 0.18)",
		"circle-radius": 16,
		"circle-stroke-color": "#ea0615",
		"circle-stroke-width": 1
	}
};
var UNCLUSTERED_POINTS_LAYER = {
	id: "unclustered-points",
	type: "circle",
	source: "stations-source",
	filter: ["!", ["has", "point_count"]],
	paint: {
		"circle-color": [
			"coalesce",
			["get", "markerColor"],
			"#64748b"
		],
		"circle-radius": [
			"case",
			[
				"==",
				["get", "isSelected"],
				1
			],
			10,
			8
		],
		"circle-stroke-color": [
			"case",
			[
				"==",
				["get", "isFavorite"],
				1
			],
			"#facc15",
			"#f8fafc"
		],
		"circle-stroke-width": [
			"case",
			[
				"==",
				["get", "isFavorite"],
				1
			],
			3,
			2
		],
		"circle-opacity": .96
	}
};
var OPERATIONS_HEAT_LAYER = {
	id: "operations-heat",
	type: "circle",
	source: "stations-source",
	filter: [
		"all",
		["!", ["has", "point_count"]],
		[
			">",
			[
				"coalesce",
				["get", "frictionScore"],
				0
			],
			0
		]
	],
	paint: {
		"circle-color": "#ea0615",
		"circle-radius": [
			"interpolate",
			["linear"],
			[
				"coalesce",
				["get", "frictionScore"],
				0
			],
			0,
			10,
			4,
			18,
			8,
			28,
			16,
			42
		],
		"circle-opacity": .14,
		"circle-blur": .7,
		"circle-stroke-width": 0
	}
};
function getMarkerColor(station) {
	if (station.capacity <= 0) return "#64748b";
	if (station.anchorsFree <= 0) return "#991b1b";
	if (station.bikesAvailable <= 0) return "#7c2d12";
	const ratio = station.bikesAvailable / station.capacity;
	if (ratio > .55) return "#0f766e";
	if (ratio > .25) return "#b45309";
	return "#b91c1c";
}
function getTrendLabel(trend) {
	if (trend === "up") return "↑ Suben bicis";
	if (trend === "down") return "↓ Bajan bicis";
	return "→ Sin cambios";
}
function MapEngine({ stations, viewMode = "overview", initialViewState, frictionByStationId = {}, selectedStationId, onSelectStation, favoriteStationIds = [], onToggleFavorite, trendByStationId, nearestStationId, nearestDistanceMeters, userLocation, onViewStateCommit }) {
	const mapRef = useRef(null);
	const [isMapReady, setIsMapReady] = useState(false);
	const [dismissedPopupId, setDismissedPopupId] = useState(null);
	const [isDarkTheme, setIsDarkTheme] = useState(true);
	const favoriteStationSet = useMemo(() => new Set(favoriteStationIds), [favoriteStationIds]);
	useEffect(() => {
		const root = document.documentElement;
		const syncTheme = () => {
			setIsDarkTheme(root.classList.contains("dark"));
		};
		syncTheme();
		const observer = new MutationObserver(syncTheme);
		observer.observe(root, {
			attributes: true,
			attributeFilter: ["class"]
		});
		return () => {
			observer.disconnect();
		};
	}, []);
	const stationCollection = useMemo(() => {
		return buildStationFeatureCollection({
			stations,
			getMarkerColor,
			favoriteStationIds: favoriteStationSet,
			selectedStationId,
			frictionByStationId
		});
	}, [
		favoriteStationSet,
		frictionByStationId,
		selectedStationId,
		stations
	]);
	const selectedStation = useMemo(() => {
		if (!selectedStationId) return null;
		return stations.find((station) => station.id === selectedStationId) ?? null;
	}, [selectedStationId, stations]);
	const popupStation = useMemo(() => {
		if (!selectedStationId || dismissedPopupId === selectedStationId) return null;
		return stations.find((station) => station.id === selectedStationId) ?? null;
	}, [
		dismissedPopupId,
		selectedStationId,
		stations
	]);
	useEffect(() => {
		if (!isMapReady || !selectedStation) return;
		if (!Number.isFinite(selectedStation.lat) || !Number.isFinite(selectedStation.lon)) return;
		mapRef.current?.flyTo({
			center: [selectedStation.lon, selectedStation.lat],
			zoom: FOCUS_ZOOM,
			duration: 850,
			essential: true
		});
	}, [isMapReady, selectedStation]);
	const handleZoomIn = () => {
		mapRef.current?.getMap()?.zoomIn({ duration: 240 });
	};
	const handleZoomOut = () => {
		mapRef.current?.getMap()?.zoomOut({ duration: 240 });
	};
	const commitMapViewState = () => {
		const map = mapRef.current?.getMap();
		if (!map || !onViewStateCommit) return;
		const center = map.getCenter();
		onViewStateCommit({
			latitude: center.lat,
			longitude: center.lng,
			zoom: map.getZoom()
		});
	};
	const expandCluster = async (clusterId, coordinates) => {
		const source = mapRef.current?.getMap().getSource("stations-source");
		if (!source) return;
		try {
			const zoom = await source.getClusterExpansionZoom(clusterId);
			if (!Number.isFinite(zoom)) return;
			mapRef.current?.flyTo({
				center: coordinates,
				zoom,
				duration: 480
			});
		} catch {
			return;
		}
	};
	const handleMapClick = (event) => {
		const feature = event.features?.[0];
		if (!feature) return;
		const properties = feature.properties ?? {};
		if (Boolean(properties.cluster)) {
			const clusterId = Number(properties.cluster_id);
			const coordinates = feature.geometry.coordinates;
			if (!Number.isFinite(clusterId) || !coordinates) return;
			expandCluster(clusterId, coordinates);
			return;
		}
		const stationId = String(properties.stationId ?? "");
		if (!stationId) return;
		setDismissedPopupId(null);
		onSelectStation?.(stationId);
	};
	const mapStyle = isDarkTheme ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
	if (stations.length === 0) return /* @__PURE__ */ jsx("div", {
		className: "flex h-full items-center justify-center text-sm text-[var(--muted)]",
		children: "No hay estaciones disponibles para los filtros actuales."
	});
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
		className: "absolute right-4 top-4 z-20 flex flex-col gap-2",
		children: [/* @__PURE__ */ jsx(Button, {
			onClick: handleZoomIn,
			variant: "outline",
			size: "icon",
			className: "h-9 w-9 bg-[var(--card)]/90 text-sm font-bold text-[var(--foreground)] backdrop-blur",
			"aria-label": "Acercar",
			children: "+"
		}), /* @__PURE__ */ jsx(Button, {
			onClick: handleZoomOut,
			variant: "outline",
			size: "icon",
			className: "h-9 w-9 bg-[var(--card)]/90 text-sm font-bold text-[var(--foreground)] backdrop-blur",
			"aria-label": "Alejar",
			children: "-"
		})]
	}), /* @__PURE__ */ jsxs(Map$1, {
		ref: mapRef,
		onLoad: () => setIsMapReady(true),
		onClick: handleMapClick,
		onMoveEnd: commitMapViewState,
		interactiveLayerIds: ["clusters", "unclustered-points"],
		initialViewState: {
			latitude: initialViewState?.latitude ?? DEFAULT_VIEW_STATE.latitude,
			longitude: initialViewState?.longitude ?? DEFAULT_VIEW_STATE.longitude,
			zoom: initialViewState?.zoom ?? DEFAULT_VIEW_STATE.zoom
		},
		styleDiffing: false,
		style: {
			width: "100%",
			height: "100%"
		},
		mapStyle,
		children: [
			/* @__PURE__ */ jsxs(Source, {
				id: "stations-source",
				type: "geojson",
				data: stationCollection,
				cluster: true,
				clusterRadius: 50,
				clusterMaxZoom: 13,
				children: [
					viewMode === "operations" ? /* @__PURE__ */ jsx(Layer, { ...OPERATIONS_HEAT_LAYER }) : null,
					/* @__PURE__ */ jsx(Layer, { ...CLUSTER_LAYER }),
					/* @__PURE__ */ jsx(Layer, { ...SELECTED_HALO_LAYER }),
					/* @__PURE__ */ jsx(Layer, { ...UNCLUSTERED_POINTS_LAYER })
				]
			}),
			userLocation ? /* @__PURE__ */ jsx(Marker, {
				longitude: userLocation.longitude,
				latitude: userLocation.latitude,
				anchor: "center",
				children: /* @__PURE__ */ jsxs("div", {
					className: "relative flex h-4 w-4 items-center justify-center",
					"aria-label": "Tu ubicacion aproximada",
					children: [/* @__PURE__ */ jsx("span", { className: "absolute inline-flex h-7 w-7 animate-ping rounded-full bg-sky-500/35" }), /* @__PURE__ */ jsx("span", { className: "relative inline-flex h-3 w-3 rounded-full border border-white bg-sky-500" })]
				})
			}) : null,
			popupStation ? /* @__PURE__ */ jsx(Popup, {
				longitude: popupStation.lon,
				latitude: popupStation.lat,
				offset: 18,
				closeOnClick: false,
				className: "station-map-popup",
				onClose: () => setDismissedPopupId(selectedStationId ?? null),
				children: /* @__PURE__ */ jsxs("div", {
					className: "min-w-[220px] text-[var(--foreground)]",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-2 flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-bold",
								children: popupStation.name
							}), /* @__PURE__ */ jsxs("p", {
								className: "text-xs text-[var(--muted)]",
								children: ["ID #", popupStation.id]
							})] }), /* @__PURE__ */ jsx(Button, {
								onClick: () => onToggleFavorite?.(popupStation.id),
								"aria-pressed": favoriteStationSet.has(popupStation.id),
								variant: "outline",
								size: "sm",
								className: `min-h-0 rounded-md px-2 py-1 text-xs font-bold transition ${favoriteStationSet.has(popupStation.id) ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/20" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"}`,
								children: favoriteStationSet.has(popupStation.id) ? "★ Favorita" : "☆ Favorita"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-2 gap-2 text-xs",
							children: [/* @__PURE__ */ jsxs("p", {
								className: "rounded bg-[var(--secondary)] px-2 py-1",
								children: ["🚲 Bicis: ", /* @__PURE__ */ jsx("span", {
									className: "font-semibold",
									children: popupStation.bikesAvailable
								})]
							}), /* @__PURE__ */ jsxs("p", {
								className: "rounded bg-[var(--secondary)] px-2 py-1",
								children: ["✕ Huecos: ", /* @__PURE__ */ jsx("span", {
									className: "font-semibold",
									children: popupStation.anchorsFree
								})]
							})]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-xs text-[var(--muted)]",
							children: ["Tendencia: ", getTrendLabel(trendByStationId?.[popupStation.id])]
						}),
						nearestStationId === popupStation.id ? /* @__PURE__ */ jsxs("p", {
							className: "mt-1 text-xs font-semibold text-[var(--primary)]",
							children: [
								"📍 A ",
								formatDistanceMeters(nearestDistanceMeters),
								" de ti"
							]
						}) : null
					]
				})
			}) : null
		]
	})] });
}
//#endregion
//#region src/app/dashboard/_components/MapPanel.tsx
var MAP_HEIGHT = 560;
function MapPanel({ stations, totalStations, viewMode = "overview", initialViewState, frictionByStationId = {}, selectedStationId, onSelectStation, favoriteStationIds = [], onToggleFavorite, trendByStationId, nearestStationId, nearestDistanceMeters, userLocation, onViewStateCommit }) {
	const isFilteredView = stations.length !== totalStations;
	const criticalCount = stations.filter((station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0).length;
	const headerTitle = viewMode === "operations" ? "Mapa de accion operativa" : "Mapa general del sistema";
	const headerHint = viewMode === "operations" ? `${criticalCount} estaciones en estado critico ahora mismo.` : "Usa el mapa para localizar estaciones, favoritos y zonas con problemas de disponibilidad.";
	const legendItems = viewMode === "operations" ? [
		"Halo rojo = friccion alta",
		"Rojo = tension alta",
		"Azul = favorita",
		"Toca para actuar"
	] : [
		"Rojo = desequilibrio",
		"Verde = estable",
		"Azul = favorita",
		"Toca para detalle"
	];
	return /* @__PURE__ */ jsxs(Card, {
		variant: "panel",
		className: "relative w-full",
		style: { height: `${MAP_HEIGHT}px` },
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "absolute left-4 top-4 z-20 max-w-[75%] rounded-lg border border-[var(--border)] bg-[var(--card)]/90 px-3 py-2 backdrop-blur",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "text-xs font-semibold text-[var(--foreground)]",
					children: [
						headerTitle,
						" · ",
						stations.length,
						"/",
						totalStations,
						" estaciones",
						isFilteredView ? " (filtradas)" : ""
					]
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-[11px] text-[var(--muted)]",
					children: headerHint
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "absolute bottom-4 left-4 z-20 flex max-w-[90%] flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)]/95 px-3 py-2 text-[11px] backdrop-blur",
				children: legendItems.map((item) => /* @__PURE__ */ jsx("span", {
					className: "ui-legend-item",
					children: item
				}, item))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "h-full w-full",
				children: /* @__PURE__ */ jsx(MapEngine, {
					stations,
					viewMode,
					initialViewState,
					frictionByStationId,
					selectedStationId,
					onSelectStation,
					favoriteStationIds,
					onToggleFavorite,
					trendByStationId,
					nearestStationId,
					nearestDistanceMeters,
					userLocation,
					onViewStateCommit
				})
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/NeighborhoodLoadCard.tsx
var SLICE_BASE_RED = 234;
var SLICE_BASE_GREEN = 6;
var SLICE_BASE_BLUE = 21;
function getSliceColor(index, total) {
	if (index === 0 || total <= 1) return `rgb(${SLICE_BASE_RED}, ${SLICE_BASE_GREEN}, ${SLICE_BASE_BLUE})`;
	const alpha = .9 - index / Math.max(1, total - 1) * .65;
	return `rgba(${SLICE_BASE_RED}, ${SLICE_BASE_GREEN}, ${SLICE_BASE_BLUE}, ${Math.max(.2, alpha).toFixed(2)})`;
}
function getOccupancy(station) {
	if (!Number.isFinite(station.capacity) || station.capacity <= 0) return 0;
	return Math.max(0, Math.min(1, station.bikesAvailable / station.capacity));
}
function NeighborhoodLoadCard({ stations }) {
	const [districts, setDistricts] = useState(null);
	useEffect(() => {
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
					area: "dashboard.neighborhood-load-card",
					operation: "loadDistricts"
				});
				console.error("[Dashboard] No se pudo cargar distritos para el donut.", error);
			}
		};
		loadDistricts();
		return () => {
			isActive = false;
			controller.abort();
		};
	}, []);
	const stationDistrictMap = useMemo(() => {
		if (!districts) return /* @__PURE__ */ new Map();
		return buildStationDistrictMap(stations, districts);
	}, [districts, stations]);
	const slices = useMemo(() => {
		const counter = /* @__PURE__ */ new Map();
		for (const feature of districts?.features ?? []) {
			const district = feature.properties?.distrito ?? "Distrito sin nombre";
			if (!counter.has(district)) counter.set(district, 0);
		}
		for (const station of stations) {
			const district = stationDistrictMap.get(station.id) ?? "Sin distrito";
			counter.set(district, (counter.get(district) ?? 0) + 1);
		}
		return Array.from(counter.entries()).map(([district, stationCount]) => ({
			district,
			stationCount
		})).sort((left, right) => {
			if (right.stationCount !== left.stationCount) return right.stationCount - left.stationCount;
			return left.district.localeCompare(right.district, "es");
		});
	}, [
		districts,
		stationDistrictMap,
		stations
	]);
	const totalStations = stations.length;
	const donutSlices = useMemo(() => {
		const slicesWithStations = slices.filter((slice) => slice.stationCount > 0);
		if (totalStations <= 0 || slicesWithStations.length === 0) return [];
		let currentOffset = 0;
		return slicesWithStations.map((slice, index) => {
			const size = slice.stationCount / totalStations * 100;
			const arc = {
				color: getSliceColor(index, slicesWithStations.length),
				size,
				offset: currentOffset
			};
			currentOffset += size;
			return arc;
		});
	}, [slices, totalStations]);
	const avgOccupancy = useMemo(() => {
		if (stations.length === 0) return 0;
		return stations.reduce((sum, station) => sum + getOccupancy(station), 0) / stations.length;
	}, [stations]);
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card h-full",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
				className: "text-sm font-bold uppercase tracking-[0.1em] text-[var(--foreground)]",
				children: "Carga por barrio"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-xs text-[var(--muted)]",
				children: "Distribucion de estaciones por distrito y ocupacion media actual de ciudad."
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "text-right text-xs text-[var(--muted)]",
				children: [/* @__PURE__ */ jsxs("span", { children: ["Barrios: ", slices.length] }), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Link, {
					href: appRoutes.dashboardHelp("estados-mapa"),
					className: "font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
					children: "Como leerlo"
				}) })]
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "relative h-28 w-28 shrink-0",
				children: [/* @__PURE__ */ jsxs("svg", {
					viewBox: "0 0 36 36",
					className: "h-full w-full",
					children: [/* @__PURE__ */ jsx("path", {
						d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831",
						fill: "none",
						stroke: "rgba(234, 6, 21, 0.12)",
						strokeWidth: "4"
					}), donutSlices.map((slice, index) => /* @__PURE__ */ jsx("path", {
						d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831",
						fill: "none",
						stroke: slice.color,
						strokeDasharray: `${slice.size}, 100`,
						strokeDashoffset: `${-slice.offset}`,
						strokeLinecap: "round",
						strokeWidth: "4"
					}, index))]
				}), /* @__PURE__ */ jsxs("div", {
					className: "absolute inset-0 flex flex-col items-center justify-center",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-lg font-bold text-[var(--foreground)]",
						children: totalStations
					}), /* @__PURE__ */ jsx("span", {
						className: "text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]",
						children: "Estaciones"
					})]
				})]
			}), /* @__PURE__ */ jsxs(ScrollArea, {
				className: "max-h-44 space-y-2 pr-1 text-[11px]",
				children: [slices.length === 0 || totalStations === 0 ? /* @__PURE__ */ jsx(WidgetEmptyState, {
					title: "Sin datos de distritos",
					description: "El mapa de barrios necesita el cruce entre estaciones y distritos. Si ese cruce no esta disponible, el reparto por barrio no puede calcularse.",
					helpHref: appRoutes.dashboardHelp("estados-mapa"),
					helpLabel: "Ver ayuda sobre barrios"
				}) : slices.map((slice, index) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-[var(--foreground)]",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "h-2 w-2 rounded-full",
							style: { backgroundColor: slice.stationCount > 0 ? getSliceColor(index, slices.length) : "rgba(100, 116, 139, 0.45)" }
						}),
						/* @__PURE__ */ jsx("span", {
							className: "font-semibold",
							children: slice.district
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "text-[var(--muted)]",
							children: [
								"(",
								Math.round(slice.stationCount / totalStations * 100),
								"%)"
							]
						})
					]
				}, slice.district)), /* @__PURE__ */ jsxs("p", {
					className: "pt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]",
					children: [
						"Ocupacion media ciudad: ",
						Math.round(avgOccupancy * 100),
						"%"
					]
				})]
			})]
		})]
	});
}
//#endregion
//#region src/app/dashboard/_components/SystemHealthCard.tsx
function SystemHealthCard({ totalStations, bikesAvailable, anchorsFree, avgOccupancy, updatedText }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Resumen"
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-1 text-lg font-bold text-[var(--foreground)]",
				children: "Salud general del sistema"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "Resumen rapido para entender cuantas estaciones hay, cuantas bicis quedan y como de equilibrada esta la red."
			}),
			/* @__PURE__ */ jsxs(MetricGrid, { children: [
				/* @__PURE__ */ jsx(MetricCard, {
					label: "Estaciones activas",
					value: totalStations
				}),
				/* @__PURE__ */ jsx(MetricCard, {
					label: "Bicis disponibles",
					value: bikesAvailable
				}),
				/* @__PURE__ */ jsx(MetricCard, {
					label: "Anclajes libres",
					value: anchorsFree
				}),
				/* @__PURE__ */ jsx(MetricCard, {
					label: "Ocupacion media",
					value: formatPercent(avgOccupancy)
				})
			] }),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-3 text-xs text-[var(--muted)]",
				children: ["Actualizado ", updatedText]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/SystemIntradayCard.tsx
function formatHour(hour) {
	return `${String(hour).padStart(2, "0")}:00`;
}
function SystemTooltip({ active, label, payload }) {
	if (!active || !payload || payload.length === 0) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs shadow-[var(--shadow-soft)]",
		children: [/* @__PURE__ */ jsxs("p", {
			className: "text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]",
			children: ["Hora ", label]
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-1 space-y-1",
			children: payload.map((row) => /* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-4",
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-[var(--muted)]",
					children: row.name
				}), /* @__PURE__ */ jsx("span", {
					className: "font-semibold text-[var(--foreground)]",
					children: row.name === "Ocupacion media" ? formatPercent(row.value ?? 0) : `${Number(row.value ?? 0).toFixed(1)} bicis`
				})]
			}, row.name))
		})]
	});
}
function SystemIntradayCard({ rows, windowLabel }) {
	const chartData = useMemo(() => rows.map((row) => ({
		...row,
		hourLabel: formatHour(row.hour)
	})), [rows]);
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card h-full",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
				className: "text-sm font-bold uppercase tracking-[0.1em] text-[var(--foreground)]",
				children: "Evolucion del sistema durante el dia"
			}), /* @__PURE__ */ jsxs("p", {
				className: "mt-1 text-xs text-[var(--muted)]",
				children: [
					"Media por hora de ocupacion y bicis disponibles para la ventana ",
					windowLabel.toLowerCase(),
					"."
				]
			})] }), /* @__PURE__ */ jsx(Link, {
				href: appRoutes.dashboardHelp("demanda-no-viajes-reales"),
				className: "text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
				children: "Como se calcula"
			})]
		}), chartData.length === 0 ? /* @__PURE__ */ jsx(WidgetEmptyState, {
			title: "Sin perfil horario suficiente",
			description: "Todavia no hay suficiente historico por hora para resumir como cambia la ocupacion y las bicis durante el dia.",
			helpHref: appRoutes.dashboardHelp("demanda-no-viajes-reales")
		}) : /* @__PURE__ */ jsxs("div", {
			className: "mt-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3",
			children: [/* @__PURE__ */ jsx(ChartWrapper, {
				height: "h-[280px]",
				children: /* @__PURE__ */ jsx("div", {
					className: "h-[280px]",
					children: /* @__PURE__ */ jsx(MeasuredResponsiveContainer, { children: /* @__PURE__ */ jsxs(AreaChart, {
						data: chartData,
						margin: {
							top: 8,
							right: 10,
							left: 0,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ jsx(CartesianGrid, {
								stroke: "var(--border)",
								vertical: false
							}),
							/* @__PURE__ */ jsx(XAxis, {
								dataKey: "hourLabel",
								tick: { fontSize: 11 },
								minTickGap: 12
							}),
							/* @__PURE__ */ jsx(YAxis, {
								yAxisId: "occupancy",
								tick: { fontSize: 11 },
								width: 42,
								tickFormatter: (value) => formatPercent(Number(value))
							}),
							/* @__PURE__ */ jsx(YAxis, {
								yAxisId: "bikes",
								orientation: "right",
								tick: { fontSize: 11 },
								width: 42
							}),
							/* @__PURE__ */ jsx(Tooltip$1, { content: /* @__PURE__ */ jsx(SystemTooltip, {}) }),
							/* @__PURE__ */ jsx(Legend, { iconType: "circle" }),
							/* @__PURE__ */ jsx(Area, {
								yAxisId: "occupancy",
								type: "monotone",
								dataKey: "avgOccupancy",
								name: "Ocupacion media",
								stroke: "#ea0615",
								fill: "rgba(234, 6, 21, 0.18)",
								strokeWidth: 2
							}),
							/* @__PURE__ */ jsx(Line, {
								yAxisId: "bikes",
								type: "monotone",
								dataKey: "avgBikesAvailable",
								name: "Bicis disponibles",
								stroke: "#0f766e",
								strokeWidth: 2,
								dot: false
							})
						]
					}) })
				})
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-3 text-[11px] text-[var(--muted)]",
				children: "La ocupacion mide el porcentaje medio de bicis sobre capacidad. Bicis disponibles refleja la media de bicis ancladas por estacion y hora, no un conteo unico de viajes."
			})]
		})]
	});
}
//#endregion
//#region src/app/dashboard/_components/OverviewModeView.tsx
function OverviewModeView({ status, totalStations, stations, filteredStations, selectedStationId, onSelectStation, favoriteStationIds, onToggleFavorite, trendByStationId, nearestStationId, nearestDistanceMeters, userLocation, mapViewState, onViewStateCommit, frictionByStationId, systemMetrics, updatedText, topFrictionStationName, mobilityPreview, activeWindowLabel, activeWindowDemandDays }) {
	const statusLabel = status.pipeline.healthStatus === "healthy" ? "saludable" : status.pipeline.healthStatus === "degraded" ? "degradado" : status.pipeline.healthStatus === "down" ? "caido" : "desconocido";
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "grid gap-6 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ jsx(SystemHealthCard, {
					totalStations: systemMetrics.totalStations,
					bikesAvailable: systemMetrics.bikesAvailable,
					anchorsFree: systemMetrics.anchorsFree,
					avgOccupancy: systemMetrics.avgOccupancy,
					updatedText
				}),
				/* @__PURE__ */ jsx(BalanceIndexCard, {
					balanceIndex: systemMetrics.balanceIndex,
					criticalStationsCount: systemMetrics.criticalStations.length
				}),
				/* @__PURE__ */ jsx(DailyInsightsCard, {
					insight: systemMetrics.dailyInsight,
					topFrictionStationName,
					activeAlertsCount: systemMetrics.activeAlerts.length
				})
			]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow-soft)]",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: "Estado del sistema"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "text-base font-bold text-[var(--foreground)]",
							children: "Diagnostico rapido fuera del panel principal"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-sm text-[var(--muted)]",
							children: [
								"Estado actual: ",
								/* @__PURE__ */ jsx("span", {
									className: "font-semibold text-[var(--foreground)]",
									children: statusLabel
								}),
								" · ultima referencia ",
								updatedText
							]
						})
					]
				}), /* @__PURE__ */ jsx(Button, {
					asChild: true,
					variant: "cta",
					size: "sm",
					children: /* @__PURE__ */ jsx(Link, {
						to: appRoutes.status(),
						children: "Abrir pagina de estado"
					})
				})]
			})
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-stretch",
			children: [/* @__PURE__ */ jsx("div", {
				className: "min-w-0 lg:col-span-3",
				children: /* @__PURE__ */ jsx(MapPanel, {
					stations: filteredStations,
					totalStations,
					viewMode: "overview",
					initialViewState: mapViewState,
					frictionByStationId,
					selectedStationId,
					onSelectStation,
					favoriteStationIds,
					onToggleFavorite,
					trendByStationId,
					nearestStationId,
					nearestDistanceMeters,
					userLocation,
					onViewStateCommit
				})
			}), /* @__PURE__ */ jsx("div", {
				className: "min-w-0 lg:col-span-1",
				children: /* @__PURE__ */ jsxs("div", {
					className: "ui-section-card h-full",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Resumen visual rapido disponible en el modo Operaciones y el historial completo en la pagina de alertas."
					}), /* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(Link, {
							to: appRoutes.dashboardAlerts(),
							children: "Abrir alertas completas"
						})
					})]
				})
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3",
			children: [
				/* @__PURE__ */ jsx(DemandFlowCard, {
					dailyDemand: mobilityPreview.dailyDemand,
					windowLabel: activeWindowLabel,
					requestedDays: activeWindowDemandDays
				}),
				/* @__PURE__ */ jsx(SystemIntradayCard, {
					rows: mobilityPreview.systemHourlyProfile,
					windowLabel: activeWindowLabel
				}),
				/* @__PURE__ */ jsx(NeighborhoodLoadCard, { stations })
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--primary)]/8 px-4 py-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-bold leading-tight text-[var(--foreground)]",
					children: "Analisis de flujo y corredores populares"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: "Movimiento entre barrios en tiempo real."
				})] }), /* @__PURE__ */ jsx(Button, {
					asChild: true,
					variant: "cta",
					size: "sm",
					children: /* @__PURE__ */ jsx(Link, {
						to: appRoutes.dashboardFlow(),
						children: "Vista completa"
					})
				})]
			}), /* @__PURE__ */ jsx(FlowPreviewPanel, {
				stations,
				hourlySignals: mobilityPreview.hourlySignals
			})]
		})
	] });
}
//#endregion
//#region src/app/dashboard/_components/AlertsPanel.tsx
function severityLabel(severity) {
	return severity >= 2 ? "critica" : "media";
}
function AlertsPanel({ alerts, stations, density = "normal" }) {
	const activeAlerts = alerts.alerts.filter((alert) => alert.isActive);
	const stationMap = new Map(stations?.map((station) => [station.id, station]) ?? []);
	const compact = density === "compact";
	return /* @__PURE__ */ jsxs("section", {
		className: "h-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]",
		children: [/* @__PURE__ */ jsxs("header", {
			className: `flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--primary)]/8 px-4 ${compact ? "py-3" : "py-4"}`,
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--primary)]",
				children: "Estaciones criticas"
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsxs(Badge, {
					variant: "default",
					className: "bg-[var(--primary)] text-white",
					children: [activeAlerts.length, " accion requerida"]
				}), /* @__PURE__ */ jsx(Button, {
					asChild: true,
					variant: "outline",
					size: "sm",
					children: /* @__PURE__ */ jsx(Link, {
						href: appRoutes.dashboardAlerts(),
						className: "rounded-full",
						children: "Historial"
					})
				})]
			})]
		}), activeAlerts.length === 0 ? /* @__PURE__ */ jsxs("div", {
			className: "space-y-3 p-4",
			children: [/* @__PURE__ */ jsx("p", {
				className: "text-sm text-[var(--muted)]",
				children: "No hay alertas activas en este momento."
			}), /* @__PURE__ */ jsx(Link, {
				href: appRoutes.dashboardAlerts(),
				className: "w-full rounded-lg border border-[var(--primary)] px-3 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
				children: "Ver historial de alertas"
			})]
		}) : /* @__PURE__ */ jsx(ScrollArea, {
			className: `max-h-[500px] p-4 ${compact ? "space-y-2" : "space-y-3"}`,
			children: /* @__PURE__ */ jsx("ul", {
				className: compact ? "space-y-2" : "space-y-3",
				children: activeAlerts.map((alert) => {
					const station = stationMap.get(alert.stationId);
					const stationName = station?.name ?? `Estacion ${alert.stationId}`;
					const occupancy = station && station.capacity > 0 ? station.bikesAvailable / station.capacity * 100 : 0;
					const isEmptyLike = alert.alertType === "LOW_BIKES";
					const progressValue = Math.max(0, Math.min(100, occupancy));
					return /* @__PURE__ */ jsxs("li", {
						className: `rounded-lg border px-3 py-3 ${isEmptyLike ? "border-[var(--primary)]/30 bg-[var(--primary)]/8" : "border-amber-500/30 bg-amber-500/10"} shadow-[var(--shadow-soft)]`,
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "mb-2 flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-bold text-[var(--foreground)]",
									children: stationName
								}), /* @__PURE__ */ jsxs("p", {
									className: "text-[11px] text-[var(--muted)]",
									children: [
										"#",
										alert.stationId,
										" · ",
										formatAlertType(alert.alertType)
									]
								})] }), /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx("span", {
										className: "inline-flex h-2.5 w-2.5 rounded-full bg-[var(--primary)] animate-pulse",
										"aria-hidden": "true"
									}), /* @__PURE__ */ jsx("span", {
										className: "text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]",
										children: isEmptyLike ? "VACIA" : "LLENA"
									})]
								})]
							}),
							/* @__PURE__ */ jsx(Progress, {
								className: "bg-black/20",
								value: progressValue,
								indicatorClassName: isEmptyLike ? "bg-[var(--primary)]" : "bg-amber-400"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-2 flex items-center justify-between text-[11px] text-[var(--muted)]",
								children: [
									/* @__PURE__ */ jsx("span", { children: severityLabel(alert.severity) }),
									/* @__PURE__ */ jsxs("span", { children: [
										isEmptyLike ? "Vacia" : "Llena",
										" desde aprox. ",
										alert.windowHours,
										"h"
									] }),
									/* @__PURE__ */ jsxs("span", { children: ["Valor ", alert.metricValue.toFixed(1)] })
								]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 text-[11px] text-[var(--muted)]",
								children: isEmptyLike ? "Poca bici disponible de forma sostenida en la ventana reciente." : "Pocos anclajes libres de forma sostenida en la ventana reciente."
							})
						]
					}, alert.id);
				})
			})
		})]
	});
}
//#endregion
//#region src/app/dashboard/_components/CriticalStationsPanel.tsx
function occupancyRatio(station) {
	if (!Number.isFinite(station.capacity) || station.capacity <= 0) return 0;
	return Math.max(0, Math.min(1, station.bikesAvailable / station.capacity));
}
function scoreCriticality(station) {
	const occupancy = occupancyRatio(station);
	const occupancyDistance = Math.abs(occupancy - .5);
	return (station.bikesAvailable <= 0 ? 1e3 : 0) + (station.anchorsFree <= 0 ? 900 : 0) + occupancyDistance * 100;
}
function CriticalStationsPanel({ stations, density = "normal" }) {
	const criticalStations = stations.filter((station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0 || occupancyRatio(station) < .1 || occupancyRatio(station) > .9).sort((left, right) => scoreCriticality(right) - scoreCriticality(left)).slice(0, 10);
	const compact = density === "compact";
	return /* @__PURE__ */ jsxs("section", {
		className: `ui-section-card h-full ${compact ? "border-[var(--primary)]/25 bg-[var(--primary)]/6" : ""}`.trim(),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Operaciones"
				}),
				/* @__PURE__ */ jsx("h3", {
					className: "mt-1 text-lg font-bold text-[var(--foreground)]",
					children: "Top estaciones criticas"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: "Prioriza estaciones vacias, llenas o con ocupacion extrema para actuar antes de que aumente la friccion."
				})
			] }), /* @__PURE__ */ jsx(Link, {
				to: appRoutes.dashboardHelp("alertas-activas"),
				className: "text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
				children: "Entender criterio"
			})]
		}), criticalStations.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "mt-4 text-sm text-[var(--muted)]",
			children: "No hay estaciones criticas destacadas ahora mismo."
		}) : /* @__PURE__ */ jsx("div", {
			className: `mt-4 ${compact ? "space-y-1.5" : "space-y-2"}`,
			children: criticalStations.map((station) => {
				const occupancy = occupancyRatio(station);
				const stateLabel = station.bikesAvailable <= 0 ? "Vacia" : station.anchorsFree <= 0 ? "Llena" : occupancy < .1 ? "Muy baja" : "Muy alta";
				return /* @__PURE__ */ jsxs(Link, {
					href: appRoutes.dashboardStation(station.id),
					className: `flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 ${compact ? "py-2.5" : "py-3"} transition hover:border-[var(--primary)]/40 hover:bg-[var(--card)]`,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ jsx("p", {
							className: "truncate text-sm font-semibold text-[var(--foreground)]",
							children: station.name
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-[11px] text-[var(--muted)]",
							children: [
								"#",
								station.id,
								" · ",
								stateLabel
							]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "text-right text-xs",
						children: [/* @__PURE__ */ jsx("p", {
							className: "font-bold text-[var(--foreground)]",
							children: formatPercent(occupancy)
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-[var(--muted)]",
							children: [
								station.bikesAvailable,
								" bicis · ",
								station.anchorsFree,
								" huecos"
							]
						})]
					})]
				}, station.id);
			})
		})]
	});
}
//#endregion
//#region src/app/dashboard/_components/RankingsTable.tsx
function RankingsTableContent({ rankings, stations, density = "normal" }) {
	const router = useRouter();
	const location = useLocation();
	const pathname = location.pathname;
	const searchParams = new URLSearchParams(location.searchStr ?? "");
	const activeTab = searchParams.get("rankingTab") === "turnover" ? "turnover" : "availability";
	const search = searchParams.get("rankingSearch") ?? "";
	const showAll = searchParams.get("rankingShowAll") === "1";
	const updateQuery = (next) => {
		const nextParams = new URLSearchParams(searchParams.toString());
		const nextTab = next.tab ?? activeTab;
		const nextSearch = next.search ?? search;
		const nextShowAll = next.showAll ?? showAll;
		nextParams.set("rankingTab", nextTab);
		if (nextSearch.trim()) nextParams.set("rankingSearch", nextSearch.trim());
		else nextParams.delete("rankingSearch");
		if (nextShowAll) nextParams.set("rankingShowAll", "1");
		else nextParams.delete("rankingShowAll");
		const nextQuery = nextParams.toString();
		router.navigate({
			to: nextQuery ? `${pathname}?${nextQuery}` : pathname,
			replace: true
		});
	};
	const stationMap = useMemo(() => {
		return new Map(stations.map((station) => [station.id, station]));
	}, [stations]);
	const rows = useMemo(() => {
		const activeRankings = rankings[activeTab]?.rankings ?? [];
		const normalizedSearch = search.trim().toLowerCase();
		const enriched = activeRankings.map((row) => {
			const station = stationMap.get(row.stationId);
			const problemHours = calculateFrictionScore(row.emptyHours, row.fullHours);
			const problemRate = row.totalHours > 0 ? problemHours / row.totalHours * 100 : 0;
			return {
				...row,
				stationName: station?.name ?? row.stationId,
				stationCapacity: station?.capacity ?? 0,
				problemHours,
				problemRate
			};
		});
		const filtered = normalizedSearch ? enriched.filter((row) => {
			const name = row.stationName.toLowerCase();
			const id = row.stationId.toLowerCase();
			return name.includes(normalizedSearch) || id.includes(normalizedSearch);
		}) : enriched;
		if (activeTab === "turnover") return filtered.sort((left, right) => right.turnoverScore - left.turnoverScore);
		return filtered.sort((left, right) => right.problemHours - left.problemHours);
	}, [
		activeTab,
		rankings,
		search,
		stationMap
	]);
	const visibleRows = showAll ? rows : rows.slice(0, 8);
	const maxTurnover = Math.max(1, ...rows.map((row) => row.turnoverScore));
	const maxProblemRate = Math.max(1, ...rows.map((row) => row.problemRate));
	const activeRankings = rankings[activeTab];
	const rankingsState = search.trim() ? resolveDataState({
		hasCoverage: activeRankings.dataState !== "no_coverage",
		hasData: visibleRows.length > 0
	}) : activeRankings.dataState;
	const canRenderRows = rankingsState === "ok" || rankingsState === "partial" || rankingsState === "stale";
	const itemClass = density === "compact" ? "rounded-lg border border-[var(--border)] bg-[var(--secondary)]/90 px-3 py-2" : "rounded-lg border border-[var(--border)] bg-[var(--secondary)]/90 px-3 py-2.5";
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card h-full",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
					children: "Cuellos de botella"
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-1 flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--muted)]",
						children: "Estaciones con mayor friccion operativa recurrente."
					}), /* @__PURE__ */ jsx(InfoHint, {
						label: "Como se calcula la friccion",
						content: "La friccion suma el tiempo en que una estacion estuvo vacia o llena. Cuantas mas horas problema acumula, mas alta aparece en el ranking."
					})]
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "text-right",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "ui-chip",
						children: [rows.length, " resultados"]
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-1",
						children: /* @__PURE__ */ jsx(Link, {
							href: appRoutes.dashboardHelp("ranking-rotacion-vs-criticidad"),
							className: "text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
							children: "Entender ranking"
						})
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ jsx(Button, {
						variant: activeTab === "availability" ? "default" : "outline",
						className: `rounded-full h-auto min-h-0 ${activeTab === "availability" ? "" : ""}`,
						onClick: () => {
							updateQuery({
								tab: "availability",
								showAll: false
							});
						},
						children: "Criticas"
					}), /* @__PURE__ */ jsx(Button, {
						variant: activeTab === "turnover" ? "default" : "outline",
						className: `rounded-full h-auto min-h-0 ${activeTab === "turnover" ? "" : ""}`,
						onClick: () => {
							updateQuery({
								tab: "turnover",
								showAll: false
							});
						},
						children: "Rotacion"
					})]
				}), /* @__PURE__ */ jsx(Input, {
					className: "h-8 min-h-0 min-w-[180px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]",
					placeholder: "Buscar estacion",
					value: search,
					onChange: (event) => {
						updateQuery({
							search: event.target.value,
							showAll: false
						});
					}
				})]
			}),
			rankingsState === "partial" || rankingsState === "stale" ? /* @__PURE__ */ jsx(DataStateNotice, {
				state: rankingsState,
				subject: `el ranking de ${activeTab === "turnover" ? "rotacion" : "criticidad"}`,
				description: rankingsState === "partial" ? "El ranking tiene datos utiles, pero la cobertura disponible no llena toda la ventana ideal." : "El ranking se ha calculado con datos antiguos y puede no reflejar el estado actual.",
				href: appRoutes.status(),
				actionLabel: "Ver estado",
				className: "mb-3",
				compact: true
			}) : null,
			!canRenderRows ? /* @__PURE__ */ jsx(DataStateNotice, {
				state: rankingsState,
				subject: `el ranking de ${activeTab === "turnover" ? "rotacion" : "criticidad"}`,
				description: search.trim() ? "No hay estaciones que coincidan con la busqueda actual." : "Todavia no hay datos suficientes para calcular este ranking.",
				href: appRoutes.status(),
				actionLabel: "Ver estado",
				compact: true
			}) : /* @__PURE__ */ jsx("ul", {
				className: "space-y-2",
				children: visibleRows.map((row) => {
					const barWidth = activeTab === "turnover" ? row.turnoverScore / maxTurnover * 100 : row.problemRate / maxProblemRate * 100;
					return /* @__PURE__ */ jsxs("li", {
						className: itemClass,
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "mb-1 flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: row.stationName
								}), /* @__PURE__ */ jsx("p", {
									className: "text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]",
									children: row.stationId
								})] }), activeTab === "turnover" ? /* @__PURE__ */ jsxs("p", {
									className: "text-xs font-bold text-[var(--foreground)]",
									children: [row.turnoverScore.toFixed(1), "x"]
								}) : /* @__PURE__ */ jsxs("p", {
									className: "text-xs font-bold text-[var(--foreground)]",
									children: [
										row.problemHours,
										"h · ",
										formatPercent(row.problemRate)
									]
								})]
							}),
							/* @__PURE__ */ jsx(Progress, {
								className: "bg-black/25",
								value: Math.max(8, Math.min(100, barWidth)),
								indicatorClassName: activeTab === "turnover" ? "bg-[var(--primary)]" : "bg-amber-400"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 text-[11px] text-[var(--muted)]",
								children: activeTab === "turnover" ? `Movimiento relativo frente al resto de estaciones. Capacidad ${row.stationCapacity}.` : `Friccion = horas vacia + horas llena sobre ${row.totalHours}h observadas.`
							})
						]
					}, `${row.id}-${activeTab}`);
				})
			}),
			rows.length > 8 ? /* @__PURE__ */ jsx(Button, {
				variant: "cta",
				onClick: () => {
					updateQuery({ showAll: !showAll });
				},
				className: "h-auto min-h-0 rounded-lg px-3 py-1.5 text-xs font-bold",
				children: showAll ? "Mostrar menos" : "Ver mas"
			}) : null
		]
	});
}
function RankingsTable(props) {
	return /* @__PURE__ */ jsx(Suspense, {
		fallback: /* @__PURE__ */ jsx("div", {
			className: "ui-section-card h-full",
			children: /* @__PURE__ */ jsx(Skeleton, { className: "h-24 w-full" })
		}),
		children: /* @__PURE__ */ jsx(RankingsTableContent, { ...props })
	});
}
//#endregion
//#region src/components/ui/command.tsx
var Command = Combobox.Root;
var CommandInput = React.forwardRef(function CommandInput({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx(Combobox.Input, {
		ref,
		className: (state) => cn("min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]/45", typeof className === "function" ? className(state) : className),
		...props
	});
});
var CommandList = React.forwardRef(function CommandList({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx(Combobox.List, {
		ref,
		className: (state) => cn("mt-2 max-h-72 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-1", typeof className === "function" ? className(state) : className),
		...props
	});
});
var CommandItem = React.forwardRef(function CommandItem({ className, children, ...props }, ref) {
	return /* @__PURE__ */ jsx(Combobox.Item, {
		ref,
		className: (state) => cn("flex cursor-default items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none", state.highlighted && "bg-[var(--primary)]/10 text-[var(--primary)]", state.selected && "font-semibold", typeof className === "function" ? className(state) : className),
		...props,
		children
	});
});
var CommandEmpty = React.forwardRef(function CommandEmpty({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx(Combobox.Empty, {
		ref,
		className: (state) => cn("px-3 py-3 text-sm text-[var(--muted)]", typeof className === "function" ? className(state) : className),
		...props
	});
});
var CommandGroup = React.forwardRef(function CommandGroup({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("div", {
		ref,
		className: cn("space-y-1", className),
		...props
	});
});
//#endregion
//#region src/components/ui/popover.tsx
var Popover$1 = Popover.Root;
var PopoverTrigger = Popover.Trigger;
Popover.Close;
var PopoverPortal = Popover.Portal;
var PopoverContent = React.forwardRef(function PopoverContent({ className, children, ...props }, ref) {
	return /* @__PURE__ */ jsx(PopoverPortal, { children: /* @__PURE__ */ jsx(Popover.Positioner, {
		sideOffset: 8,
		children: /* @__PURE__ */ jsx(Popover.Popup, {
			ref,
			className: (state) => cn("z-50 min-w-[16rem] rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow-soft)] outline-none backdrop-blur-md", typeof className === "function" ? className(state) : className),
			...props,
			children
		})
	}) });
});
//#endregion
//#region src/app/dashboard/_components/StationPicker.tsx
function normalizeText$1(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function isSubsequence(query, target) {
	if (!query) return true;
	let queryIndex = 0;
	for (let i = 0; i < target.length; i += 1) if (target[i] === query[queryIndex]) {
		queryIndex += 1;
		if (queryIndex === query.length) return true;
	}
	return false;
}
function levenshteinDistance(a, b) {
	if (a === b) return 0;
	if (!a) return b.length;
	if (!b) return a.length;
	const previousRow = Array.from({ length: b.length + 1 }, (_, idx) => idx);
	const currentRow = new Array(b.length + 1);
	for (let i = 1; i <= a.length; i += 1) {
		currentRow[0] = i;
		for (let j = 1; j <= b.length; j += 1) {
			const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
			currentRow[j] = Math.min(currentRow[j - 1] + 1, previousRow[j] + 1, previousRow[j - 1] + substitutionCost);
		}
		for (let j = 0; j < currentRow.length; j += 1) previousRow[j] = currentRow[j];
	}
	return previousRow[b.length] ?? Math.max(a.length, b.length);
}
function scoreCandidate(query, target) {
	if (!target) return Number.NEGATIVE_INFINITY;
	if (target === query) return 500;
	if (target.startsWith(query)) return 360 - (target.length - query.length) * .2;
	const includeIndex = target.indexOf(query);
	if (includeIndex >= 0) return 290 - includeIndex * .5;
	if (isSubsequence(query, target)) return 220 - (target.length - query.length) * .35;
	return 160 - levenshteinDistance(query, target) * 8;
}
function scoreStations(stations, rawQuery, favoriteStationSet) {
	const query = normalizeText$1(rawQuery);
	if (!query) return [...stations].sort((left, right) => {
		const leftFavorite = favoriteStationSet.has(left.id) ? 1 : 0;
		const rightFavorite = favoriteStationSet.has(right.id) ? 1 : 0;
		if (leftFavorite !== rightFavorite) return rightFavorite - leftFavorite;
		return left.name.localeCompare(right.name, "es-ES");
	}).slice(0, 8).map((station) => ({
		station,
		score: 0
	}));
	const isNumericQuery = /^\d+$/.test(query);
	return stations.map((station) => {
		const normalizedName = normalizeText$1(station.name);
		const normalizedId = normalizeText$1(station.id);
		const nameScore = scoreCandidate(query, normalizedName);
		const idScore = scoreCandidate(query, normalizedId);
		const numericBonus = isNumericQuery && normalizedId.includes(query) ? 80 : 0;
		return {
			station,
			score: Math.max(nameScore, idScore) + numericBonus + (favoriteStationSet.has(station.id) ? 12 : 0)
		};
	}).sort((left, right) => right.score - left.score).slice(0, 8);
}
function StationPicker({ stations, selectedStationId, onSelectStation, favoriteStationIds, onToggleFavorite, trendByStationId, nearestStationId }) {
	const [query, setQuery] = useState("");
	const [pickerOpen, setPickerOpen] = useState(false);
	const favoriteStationSet = useMemo(() => new Set(favoriteStationIds), [favoriteStationIds]);
	const orderedStations = useMemo(() => {
		return [...stations].sort((left, right) => {
			const leftFavorite = favoriteStationSet.has(left.id) ? 1 : 0;
			const rightFavorite = favoriteStationSet.has(right.id) ? 1 : 0;
			if (leftFavorite !== rightFavorite) return rightFavorite - leftFavorite;
			return left.name.localeCompare(right.name, "es-ES");
		});
	}, [favoriteStationSet, stations]);
	const favoriteStations = useMemo(() => {
		return orderedStations.filter((station) => favoriteStationSet.has(station.id));
	}, [favoriteStationSet, orderedStations]);
	const selectedStation = useMemo(() => {
		return stations.find((station) => station.id === selectedStationId) ?? null;
	}, [selectedStationId, stations]);
	const stationNameById = useMemo(() => {
		return new Map(stations.map((station) => [station.id, station.name]));
	}, [stations]);
	const stationSuggestions = useMemo(() => {
		return scoreStations(orderedStations, query, favoriteStationSet);
	}, [
		favoriteStationSet,
		orderedStations,
		query
	]);
	const commandStations = query.trim() ? stationSuggestions.map(({ station }) => station) : orderedStations;
	const bestMatch = stationSuggestions[0]?.station ?? null;
	const stationDetailUrl = selectedStation ? appRoutes.dashboardStation(selectedStation.id) : null;
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card overflow-x-hidden",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
					children: "Selector de estacion"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: "Cambia estacion para sincronizar mapa, patrones y heatmap."
				})] }), /* @__PURE__ */ jsxs("span", {
					className: "ui-chip",
					children: [
						stations.length,
						" estaciones · ",
						favoriteStations.length,
						" favoritas"
					]
				})]
			}),
			favoriteStations.length > 0 ? /* @__PURE__ */ jsxs("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
					children: "Favoritas"
				}), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap gap-2",
					children: favoriteStations.slice(0, 8).map((station) => /* @__PURE__ */ jsxs(Button, {
						onClick: () => onSelectStation(station.id),
						className: `max-w-full truncate rounded-full ${station.id === selectedStationId ? "border-amber-500 bg-amber-500 text-[#111827]" : "border-amber-500/40 bg-amber-500/15 text-[var(--foreground)] hover:border-amber-500"}`,
						variant: "outline",
						size: "sm",
						children: ["★ ", station.name]
					}, `favorite-${station.id}`))
				})]
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "grid min-w-0 gap-3 lg:grid-cols-[1.4fr_1fr]",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ jsx("label", {
						htmlFor: "station-search",
						className: "sr-only",
						children: "Buscar por nombre o ID"
					}), /* @__PURE__ */ jsx(Input, {
						id: "station-search",
						className: "min-h-11 border-[var(--border)] bg-[var(--secondary)]",
						placeholder: "Buscar por nombre o ID",
						value: query,
						onChange: (event) => {
							const nextValue = event.target.value;
							setQuery(nextValue);
							const nextMatch = scoreStations(orderedStations, nextValue, favoriteStationSet)[0]?.station;
							if (nextMatch && nextMatch.id !== selectedStationId) onSelectStation(nextMatch.id);
						},
						autoComplete: "off"
					})]
				}), /* @__PURE__ */ jsxs(Popover$1, {
					open: pickerOpen,
					onOpenChange: setPickerOpen,
					children: [/* @__PURE__ */ jsxs(PopoverTrigger, {
						id: "station-picker",
						"aria-label": "Seleccionar estacion",
						className: cn("inline-flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none transition", pickerOpen && "border-[var(--primary)]"),
						disabled: stations.length === 0,
						children: [/* @__PURE__ */ jsx("span", {
							className: "truncate text-left",
							children: selectedStation ? selectedStation.name : "Sin estaciones disponibles"
						}), /* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							className: "text-xs text-[var(--muted)]",
							children: "▾"
						})]
					}), stations.length > 0 ? /* @__PURE__ */ jsx(PopoverContent, {
						className: "w-[min(100vw-2.5rem,28rem)] p-2",
						children: /* @__PURE__ */ jsxs(Command, {
							value: selectedStationId || null,
							onValueChange: (value) => {
								if (typeof value === "string" && value) {
									onSelectStation(value);
									setPickerOpen(false);
								}
							},
							onInputValueChange: (nextValue) => {
								setQuery(nextValue);
								const nextMatch = scoreStations(orderedStations, nextValue, favoriteStationSet)[0]?.station;
								if (nextMatch && nextMatch.id !== selectedStationId) onSelectStation(nextMatch.id);
							},
							itemToStringLabel: (value) => stationNameById.get(String(value)) ?? String(value),
							children: [/* @__PURE__ */ jsx(CommandInput, {
								placeholder: "Buscar por nombre o ID",
								autoFocus: true
							}), /* @__PURE__ */ jsxs(CommandList, {
								className: "mt-2 max-h-72",
								children: [/* @__PURE__ */ jsx(CommandGroup, { children: commandStations.map((station) => /* @__PURE__ */ jsxs(CommandItem, {
									value: station.id,
									children: [/* @__PURE__ */ jsx("span", {
										className: "truncate",
										children: favoriteStationSet.has(station.id) ? `★ ${station.name}` : station.name
									}), station.id === selectedStationId ? /* @__PURE__ */ jsx("span", {
										className: "ml-2 text-xs text-[var(--primary)]",
										children: "✓"
									}) : null]
								}, station.id)) }), /* @__PURE__ */ jsx(CommandEmpty, { children: "Sin coincidencias." })]
							})]
						})
					}) : null]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap gap-2",
				children: stationSuggestions.slice(0, 5).map(({ station }) => /* @__PURE__ */ jsxs(Button, {
					className: `max-w-full truncate rounded-full border px-3 py-1 text-xs transition ${station.id === selectedStationId ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary-soft)] hover:text-[var(--foreground)]"}`,
					onClick: () => onSelectStation(station.id),
					variant: "ghost",
					size: "sm",
					children: [
						favoriteStationSet.has(station.id) ? "★ " : "",
						station.name,
						nearestStationId === station.id ? " · cerca" : "",
						trendByStationId?.[station.id] === "up" ? " ↑" : "",
						trendByStationId?.[station.id] === "down" ? " ↓" : ""
					]
				}, station.id))
			}),
			selectedStation ? /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]",
				children: [/* @__PURE__ */ jsxs("span", { children: [
					"Tendencia seleccionada:",
					" ",
					trendByStationId?.[selectedStation.id] === "up" ? "↑ suben bicis" : trendByStationId?.[selectedStation.id] === "down" ? "↓ bajan bicis" : "→ sin cambios"
				] }), /* @__PURE__ */ jsx(Button, {
					onClick: () => onToggleFavorite(selectedStation.id),
					"aria-pressed": favoriteStationSet.has(selectedStation.id),
					className: `rounded-full border px-2 py-1 text-[11px] font-bold ${favoriteStationSet.has(selectedStation.id) ? "border-amber-500 bg-amber-500/20 text-amber-500" : "border-[var(--border)] text-[var(--foreground)]"}`,
					variant: "ghost",
					size: "sm",
					children: favoriteStationSet.has(selectedStation.id) ? "★ Quitar favorita" : "☆ Marcar favorita"
				})]
			}) : null,
			query.trim() ? /* @__PURE__ */ jsxs("p", {
				className: "text-[11px] text-[var(--muted)]",
				children: [
					"Mejor coincidencia:",
					" ",
					/* @__PURE__ */ jsx("span", {
						className: "font-semibold text-[var(--foreground)]",
						children: bestMatch?.name ?? "Sin coincidencias"
					})
				]
			}) : /* @__PURE__ */ jsx("p", {
				className: "text-[11px] text-[var(--muted)]",
				children: selectedStation ? `Seleccionada: ${selectedStation.name}` : "Sin seleccion"
			}),
			stationDetailUrl ? /* @__PURE__ */ jsx("div", {
				className: "flex justify-end",
				children: /* @__PURE__ */ jsx(Button, {
					asChild: true,
					children: /* @__PURE__ */ jsx(Link, {
						href: stationDetailUrl,
						className: "rounded-lg border border-[var(--primary)] bg-[var(--primary)]/15 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
						children: "Abrir detalle completo"
					})
				})
			}) : null
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/OperationsModeView.tsx
function OperationsModeView(props) {
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "grid gap-6 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ jsx(BalanceIndexCard, {
					balanceIndex: props.balanceIndex,
					criticalStationsCount: props.criticalStationsCount,
					density: "compact"
				}),
				/* @__PURE__ */ jsx(DailyInsightsCard, {
					insight: props.dailyInsight,
					topFrictionStationName: props.topFrictionStationName,
					activeAlertsCount: props.activeAlertsCount
				}),
				/* @__PURE__ */ jsx(CriticalStationsPanel, {
					stations: props.stations,
					density: "compact"
				})
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-stretch",
			children: [/* @__PURE__ */ jsx("div", {
				className: "min-w-0 lg:col-span-3",
				children: /* @__PURE__ */ jsx(MapPanel, {
					stations: props.filteredStations,
					totalStations: props.totalStations,
					viewMode: "operations",
					initialViewState: props.mapViewState,
					frictionByStationId: props.frictionByStationId,
					selectedStationId: props.selectedStationId,
					onSelectStation: props.onSelectStation,
					favoriteStationIds: props.favoriteStationIds,
					onToggleFavorite: props.onToggleFavorite,
					trendByStationId: props.trendByStationId,
					nearestStationId: props.nearestStationId,
					nearestDistanceMeters: props.nearestDistanceMeters,
					userLocation: props.userLocation,
					onViewStateCommit: props.onViewStateCommit
				})
			}), /* @__PURE__ */ jsx("div", {
				className: "min-w-0 lg:col-span-1",
				children: /* @__PURE__ */ jsx(AlertsPanel, {
					alerts: props.alerts,
					stations: props.stations,
					density: "compact"
				})
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3",
			children: [/* @__PURE__ */ jsx(RankingsTable, {
				rankings: props.rankings,
				stations: props.stations,
				density: "compact"
			}), /* @__PURE__ */ jsx(StationPicker, {
				stations: props.filteredStations,
				selectedStationId: props.selectedStationId,
				onSelectStation: props.onSelectStation,
				favoriteStationIds: props.favoriteStationIds,
				onToggleFavorite: props.onToggleFavorite,
				trendByStationId: props.trendByStationId,
				nearestStationId: props.nearestStationId
			})]
		})
	] });
}
//#endregion
//#region src/app/dashboard/_components/ResearchSummaryCard.tsx
function ResearchSummaryCard({ dailyDemand, systemHourlyProfile, recentSnapshots, stations }) {
	const topDemandDay = dailyDemand.reduce((best, row) => {
		if (!best || row.demandScore > best.demandScore) return row;
		return best;
	}, null);
	const topHour = systemHourlyProfile.reduce((best, row) => {
		if (!best || row.avgBikesAvailable > best.avgBikesAvailable) return row;
		return best;
	}, null);
	const recentSnapshotInsight = (() => {
		if (recentSnapshots.length < 2) return null;
		const first = recentSnapshots[0];
		const last = recentSnapshots[recentSnapshots.length - 1];
		const stationMap = new Map(stations.map((station) => [station.id, station.name]));
		let strongestChange = null;
		for (const [stationId, bikesNow] of Object.entries(last.snapshot)) {
			const bikesBefore = first.snapshot[stationId];
			if (!Number.isFinite(bikesBefore)) continue;
			const delta = bikesNow - bikesBefore;
			if (!strongestChange || Math.abs(delta) > Math.abs(strongestChange.delta)) strongestChange = {
				stationName: stationMap.get(stationId) ?? stationId,
				delta
			};
		}
		return strongestChange;
	})();
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card h-full",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Analisis"
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "mt-1 text-lg font-bold text-[var(--foreground)]",
						children: "Lectura temporal rapida"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "Resume cuando se concentra mas actividad y en que momento del dia se ve mas bici disponible."
					})
				] }), /* @__PURE__ */ jsx(Button, {
					asChild: true,
					variant: "cta",
					size: "sm",
					children: /* @__PURE__ */ jsx(Link, {
						to: appRoutes.dashboardHelp("demanda-no-viajes-reales"),
						children: "Entender metrica"
					})
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: [/* @__PURE__ */ jsx(MetricCard, {
					label: "Dia mas intenso",
					value: /* @__PURE__ */ jsx("span", {
						className: "text-lg font-bold text-[var(--foreground)]",
						children: topDemandDay?.day ?? "Sin datos"
					}),
					detail: topDemandDay ? `${topDemandDay.demandScore.toFixed(1)} puntos de demanda agregada` : "Todavia no hay historico suficiente."
				}), /* @__PURE__ */ jsx(MetricCard, {
					label: "Hora con mas bicis",
					value: /* @__PURE__ */ jsx("span", {
						className: "text-lg font-bold text-[var(--foreground)]",
						children: topHour ? `${String(topHour.hour).padStart(2, "0")}:00` : "Sin datos"
					}),
					detail: topHour ? `${topHour.avgBikesAvailable.toFixed(1)} bicis medias por estacion` : "Todavia no hay perfil horario suficiente."
				})]
			}),
			/* @__PURE__ */ jsx(MetricCard, {
				className: "mt-3",
				label: "Cambio mas visible en memoria",
				value: /* @__PURE__ */ jsx("span", {
					className: "text-sm font-semibold text-[var(--foreground)]",
					children: recentSnapshotInsight ? `${recentSnapshotInsight.stationName}: ${recentSnapshotInsight.delta >= 0 ? "+" : ""}${recentSnapshotInsight.delta} bicis frente al primer snapshot guardado.` : "Todavia no hay suficientes snapshots recientes para comparar tendencia inmediata."
				})
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/ResearchVolatilityCard.tsx
function ResearchVolatilityCard({ rankings }) {
	const rows = rankings.rankings.map((row) => {
		const problemRatio = row.totalHours > 0 ? (row.emptyHours + row.fullHours) / row.totalHours : 0;
		const volatility = Math.max(0, Math.min(1, problemRatio));
		return {
			stationId: row.stationId,
			volatility
		};
	}).sort((left, right) => right.volatility - left.volatility);
	const averageVolatility = rows.length > 0 ? rows.reduce((sum, row) => sum + row.volatility, 0) / rows.length : 0;
	const topQuartile = rows.slice(0, Math.max(1, Math.floor(rows.length / 4)));
	const topQuartileAverage = topQuartile.length > 0 ? topQuartile.reduce((sum, row) => sum + row.volatility, 0) / topQuartile.length : 0;
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card h-full",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Analisis"
				}),
				/* @__PURE__ */ jsx("h3", {
					className: "mt-1 text-lg font-bold text-[var(--foreground)]",
					children: "Volatilidad operativa"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: "Resume cuanta inestabilidad acumula la red cuando una parte importante de estaciones pasa demasiadas horas vacia o llena."
				})
			] }), /* @__PURE__ */ jsx(Link, {
				to: appRoutes.dashboardHelp("estabilidad-estacion"),
				className: "text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
				children: "Como leerlo"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "mt-4 grid gap-3 md:grid-cols-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Media global"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-2xl font-black text-[var(--foreground)]",
						children: formatPercent(averageVolatility)
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-xs text-[var(--muted)]",
						children: "Proporcion media de horas problema sobre la ventana observada."
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Cuartil mas inestable"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-2xl font-black text-[var(--foreground)]",
						children: formatPercent(topQuartileAverage)
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-xs text-[var(--muted)]",
						children: "Ayuda a ver si la tension esta concentrada en unas pocas estaciones."
					})
				]
			})]
		})]
	});
}
//#endregion
//#region src/app/dashboard/_components/StationStabilityCard.tsx
function StationStabilityCard({ rankings, stations }) {
	const stationMap = new Map(stations.map((station) => [station.id, station.name]));
	const leastStable = rankings.rankings.map((row) => {
		const frictionRatio = row.totalHours > 0 ? (row.emptyHours + row.fullHours) / row.totalHours : 0;
		const stabilityScore = Math.max(0, 1 - frictionRatio);
		return {
			stationId: row.stationId,
			stationName: stationMap.get(row.stationId) ?? row.stationId,
			stabilityScore,
			frictionRatio,
			problemHours: calculateFrictionScore(row.emptyHours, row.fullHours)
		};
	}).sort((left, right) => left.stabilityScore - right.stabilityScore).slice(0, 8);
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card h-full",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Analisis"
				}),
				/* @__PURE__ */ jsx("h3", {
					className: "mt-1 text-lg font-bold text-[var(--foreground)]",
					children: "Estabilidad por estacion"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: "Una estacion es menos estable cuando pasa muchas horas vacia o llena respecto a su ventana observada."
				})
			] }), /* @__PURE__ */ jsx(Link, {
				to: appRoutes.dashboardHelp("horas-problema"),
				className: "text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
				children: "Como leerlo"
			})]
		}), leastStable.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "mt-4 text-sm text-[var(--muted)]",
			children: "Sin datos suficientes para estimar estabilidad."
		}) : /* @__PURE__ */ jsx("div", {
			className: "mt-4 space-y-3",
			children: leastStable.map((row) => /* @__PURE__ */ jsxs(Link, {
				href: appRoutes.dashboardStation(row.stationId),
				className: "block rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:border-[var(--primary)]/40 hover:bg-[var(--card)]",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ jsx("p", {
							className: "truncate text-sm font-semibold text-[var(--foreground)]",
							children: row.stationName
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-[11px] text-[var(--muted)]",
							children: [
								"#",
								row.stationId,
								" · ",
								row.problemHours,
								"h problema"
							]
						})]
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xs font-bold text-[var(--foreground)]",
						children: formatPercent(row.stabilityScore)
					})]
				}), /* @__PURE__ */ jsx(Progress, {
					className: "mt-2 bg-black/15",
					value: Math.max(6, row.stabilityScore * 100),
					indicatorClassName: "bg-[var(--primary)]"
				})]
			}, row.stationId))
		})]
	});
}
//#endregion
//#region src/app/dashboard/_components/ResearchModeView.tsx
function ResearchModeView(props) {
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3",
			children: [
				/* @__PURE__ */ jsx(DemandFlowCard, {
					dailyDemand: props.dailyDemand,
					windowLabel: props.windowLabel,
					requestedDays: props.requestedDays
				}),
				/* @__PURE__ */ jsx(SystemIntradayCard, {
					rows: props.systemHourlyProfile,
					windowLabel: props.windowLabel
				}),
				/* @__PURE__ */ jsx(NeighborhoodLoadCard, { stations: props.stations }),
				/* @__PURE__ */ jsx(StationStabilityCard, {
					rankings: props.rankings.availability,
					stations: props.stations
				}),
				/* @__PURE__ */ jsx(ResearchSummaryCard, {
					dailyDemand: props.dailyDemand,
					systemHourlyProfile: props.systemHourlyProfile,
					recentSnapshots: props.recentSnapshots,
					stations: props.stations
				}),
				/* @__PURE__ */ jsx(ResearchVolatilityCard, { rankings: props.rankings.availability })
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3",
			children: [/* @__PURE__ */ jsx(RankingsTable, {
				rankings: props.rankings,
				stations: props.stations,
				density: "normal"
			}), /* @__PURE__ */ jsx(StationPicker, {
				stations: props.filteredStations,
				selectedStationId: props.selectedStationId,
				onSelectStation: props.onSelectStation,
				favoriteStationIds: props.favoriteStationIds,
				onToggleFavorite: props.onToggleFavorite,
				trendByStationId: props.trendByStationId,
				nearestStationId: props.nearestStationId
			})]
		}),
		/* @__PURE__ */ jsxs(Card, {
			variant: "panel",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--primary)]/8 px-4 py-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-bold leading-tight text-[var(--foreground)]",
					children: "Analisis de flujo y corredores populares"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: "Movimiento entre barrios en tiempo real."
				})] }), /* @__PURE__ */ jsx(Link, {
					href: appRoutes.dashboardFlow(),
					className: buttonVariants({
						variant: "outline",
						size: "sm",
						className: "min-h-0 border-[var(--primary)] bg-[var(--primary)]/12 px-3 py-2 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
					}),
					children: "Vista completa"
				})]
			}), /* @__PURE__ */ jsx(FlowPreviewPanel, {
				stations: props.stations,
				hourlySignals: props.hourlySignals
			})]
		})
	] });
}
//#endregion
//#region src/app/dashboard/_components/ApiCatalogCard.tsx
function ApiCatalogCard({ items }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
				className: "text-lg font-bold text-[var(--foreground)]",
				children: "Catalogo de endpoints"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "Resumen rapido de las rutas utiles para integrar datos del dashboard desde otras herramientas."
			})] }), /* @__PURE__ */ jsx(TrackedLink, {
				href: appRoutes.dashboardHelp("api-documentacion"),
				trackingEvent: buildPanelOpenEvent({
					surface: "dashboard",
					routeKey: "dashboard_home",
					module: "api_documentation",
					source: "api_catalog"
				}),
				className: "text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
				children: "Ver ayuda"
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-4 grid gap-3 lg:grid-cols-2",
			children: items.map((item) => /* @__PURE__ */ jsxs("article", {
				className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: item.label
						}), /* @__PURE__ */ jsx(Badge, {
							variant: "muted",
							children: item.format
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 break-all font-mono text-[11px] text-[var(--foreground)]",
						children: item.path
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-xs text-[var(--muted)]",
						children: item.description
					})
				]
			}, `${item.label}-${item.path}`))
		})]
	});
}
//#endregion
//#region src/app/dashboard/_components/DataHistoryCard.tsx
function formatDayLabel(value) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return value;
	return parsed.toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "2-digit"
	});
}
function DataHistoryCard() {
	const [rows, setRows] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [responseState, setResponseState] = useState(null);
	useAbortableAsyncEffect(async (signal, isActive) => {
		try {
			const payload = await fetchJson(appRoutes.api.history(), {
				signal,
				errorMessage: "No se pudo cargar el historico agregado."
			});
			if (!isActive()) return;
			setRows(Array.isArray(payload.history) ? payload.history.slice(-30) : []);
			setResponseState(payload.dataState ?? null);
		} catch {
			if (!isActive()) return;
			setError("No se pudo cargar el historico de balance.");
			setRows([]);
			setResponseState("error");
		}
	}, [], {
		onStart: () => {
			setIsLoading(true);
			setError(null);
			setResponseState(null);
		},
		onSettled: () => {
			setIsLoading(false);
		}
	});
	const chartData = useMemo(() => rows.map((row) => ({
		...row,
		label: formatDayLabel(row.day)
	})), [rows]);
	const historyDataState = resolveDataState({
		isLoading,
		error: error ?? (responseState === "error" ? "error" : null),
		hasCoverage: responseState === "no_coverage" ? false : rows.length > 0,
		hasData: chartData.length > 0,
		isPartial: responseState === "partial",
		isStale: responseState === "stale"
	});
	const showChart = historyDataState === "ok" || historyDataState === "partial" || historyDataState === "stale";
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
					className: "text-lg font-bold text-[var(--foreground)]",
					children: "Historico de equilibrio y demanda"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: "Compara como cambia el balance del sistema junto con la demanda agregada reciente."
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "text-right text-xs text-[var(--muted)]",
					children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.dashboardHelp("balance-index"),
						trackingEvent: buildPanelOpenEvent({
							surface: "dashboard",
							routeKey: "dashboard_home",
							module: "balance_help",
							source: "data_history"
						}),
						className: "font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
						children: "Entender balance"
					}) }), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(TrackedAnchor, {
						href: appRoutes.api.historyCsv(),
						trackingEvent: buildExportClickEvent({
							surface: "dashboard",
							routeKey: "dashboard_home",
							source: "data_history",
							ctaId: "history_csv",
							entityType: "api",
							module: "data_history"
						}),
						className: "font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
						rel: "noopener noreferrer",
						children: "Descargar CSV"
					}) })]
				})]
			}),
			shouldShowDataStateNotice(historyDataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
				state: historyDataState,
				subject: "el historico agregado",
				description: error ?? (isLoading ? "Estamos cargando la serie agregada de balance y demanda." : historyDataState === "partial" ? "La serie historica existe, pero no cubre toda la ventana ideal todavia." : historyDataState === "stale" ? "La serie historica esta disponible, pero el dataset no esta fresco." : "Todavia no hay historico suficiente para pintar esta serie."),
				href: appRoutes.status(),
				actionLabel: "Ver estado",
				className: "mt-4",
				compact: true
			}) : null,
			showChart ? /* @__PURE__ */ jsxs("div", {
				className: "mt-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3",
				children: [/* @__PURE__ */ jsx(ChartWrapper, {
					height: "h-[280px]",
					children: /* @__PURE__ */ jsx("div", {
						className: "h-[280px]",
						children: /* @__PURE__ */ jsx(MeasuredResponsiveContainer, { children: /* @__PURE__ */ jsxs(AreaChart, {
							data: chartData,
							margin: {
								top: 8,
								right: 10,
								left: 0,
								bottom: 0
							},
							children: [
								/* @__PURE__ */ jsx(CartesianGrid, {
									stroke: "var(--border)",
									vertical: false
								}),
								/* @__PURE__ */ jsx(XAxis, {
									dataKey: "label",
									tick: { fontSize: 11 },
									minTickGap: 12
								}),
								/* @__PURE__ */ jsx(YAxis, {
									yAxisId: "demand",
									tick: { fontSize: 11 },
									width: 46
								}),
								/* @__PURE__ */ jsx(YAxis, {
									yAxisId: "balance",
									orientation: "right",
									tick: { fontSize: 11 },
									width: 42,
									tickFormatter: (value) => formatPercent(Number(value))
								}),
								/* @__PURE__ */ jsx(Tooltip$1, { formatter: (value, name) => name === "Balance index" ? [formatPercent(Number(value)), "Balance index"] : [Number(value).toFixed(1), "Demanda"] }),
								/* @__PURE__ */ jsx(Area, {
									yAxisId: "demand",
									type: "monotone",
									dataKey: "demandScore",
									name: "Demanda",
									stroke: "#ea0615",
									fill: "rgba(234, 6, 21, 0.2)",
									strokeWidth: 2
								}),
								/* @__PURE__ */ jsx(Area, {
									yAxisId: "balance",
									type: "monotone",
									dataKey: "balanceIndex",
									name: "Balance index",
									stroke: "#0f766e",
									fill: "rgba(15, 118, 110, 0.16)",
									strokeWidth: 2
								})
							]
						}) })
					})
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-3 text-[11px] text-[var(--muted)]",
					children: "Balance index cerca de 1 significa una red mas equilibrada. Cerca de 0 indica muchas estaciones alejadas del 50% de ocupacion."
				})]
			}) : null
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/DataModeCard.tsx
function DataModeCard({ stationsCsvUrl, frictionCsvUrl, historyJsonUrl, historyCsvUrl, alertsCsvUrl, statusCsvUrl }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "grid gap-4 lg:grid-cols-3 xl:grid-cols-5",
		children: [
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Estado actual de estaciones"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Descarga una foto actual del sistema con bicis, anclajes, capacidad y marca temporal."
					}),
					/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(TrackedAnchor, {
							href: stationsCsvUrl,
							trackingEvent: buildExportClickEvent({
								surface: "dashboard",
								routeKey: "dashboard_home",
								source: "data_mode",
								ctaId: "stations_csv",
								entityType: "api",
								module: "data_mode_card"
							}),
							children: "Exportar CSV"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Ranking de friccion"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Exporta las estaciones con mas horas problema para revisar vacios, llenos y cuellos de botella."
					}),
					/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(TrackedAnchor, {
							href: frictionCsvUrl,
							trackingEvent: buildExportClickEvent({
								surface: "dashboard",
								routeKey: "dashboard_home",
								source: "data_mode",
								ctaId: "friction_csv",
								entityType: "api",
								module: "data_mode_card"
							}),
							children: "Exportar CSV"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Historico agregado"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Accede al historico agregado de demanda, ocupacion y balance para analisis externo o auditoria."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-auto flex flex-wrap gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							asChild: true,
							variant: "cta",
							size: "sm",
							children: /* @__PURE__ */ jsx(TrackedAnchor, {
								href: historyJsonUrl,
								trackingEvent: buildExportClickEvent({
									surface: "dashboard",
									routeKey: "dashboard_home",
									source: "data_mode",
									ctaId: "history_json",
									entityType: "api",
									module: "data_mode_card"
								}),
								children: "Abrir JSON"
							})
						}), /* @__PURE__ */ jsx(Button, {
							asChild: true,
							variant: "outline",
							size: "sm",
							children: /* @__PURE__ */ jsx(TrackedAnchor, {
								href: historyCsvUrl,
								trackingEvent: buildExportClickEvent({
									surface: "dashboard",
									routeKey: "dashboard_home",
									source: "data_mode",
									ctaId: "history_csv",
									entityType: "api",
									module: "data_mode_card"
								}),
								children: "Descargar CSV"
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Alertas historicas"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Exporta alertas activas y resueltas para revisar incidencia, severidad y ventana temporal."
					}),
					/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(TrackedAnchor, {
							href: alertsCsvUrl,
							trackingEvent: buildExportClickEvent({
								surface: "dashboard",
								routeKey: "dashboard_home",
								source: "data_mode",
								ctaId: "alerts_csv",
								entityType: "api",
								module: "data_mode_card"
							}),
							children: "Exportar CSV"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
						children: "Resumen del sistema"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-[var(--muted)]",
						children: "Descarga el estado del pipeline, la frescura de datos y la salud general del sistema en un CSV simple."
					}),
					/* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "cta",
						size: "sm",
						className: "mt-auto",
						children: /* @__PURE__ */ jsx(TrackedAnchor, {
							href: statusCsvUrl,
							trackingEvent: buildExportClickEvent({
								surface: "dashboard",
								routeKey: "dashboard_home",
								source: "data_mode",
								ctaId: "status_csv",
								entityType: "api",
								module: "data_mode_card"
							}),
							children: "Exportar CSV"
						})
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/MethodologyPanel.tsx
var QUICK_FAQ = [
	{
		question: "Como se detecta una alerta activa?",
		answer: `Miramos las ultimas ${ANALYTICS_WINDOWS.alertWindowHours} horas. Si la media de bicis baja de ${ALERT_THRESHOLDS.lowBikes} o la media de anclajes libres baja de ${ALERT_THRESHOLDS.lowAnchors}, entra en alerta.`
	},
	{
		question: "Que significa horas problema?",
		answer: "Es el tiempo acumulado con riesgo operativo: pocas bicis o pocos anclajes. Mas horas problema = mas necesidad de actuar."
	},
	{
		question: "Como se estima la matriz O-D?",
		answer: "Se estima con cambios de disponibilidad por hora y se agrupa por distritos. Sirve para ver tendencias, no viajes individuales exactos."
	},
	{
		question: "Como se calculan las rutas destacadas?",
		answer: "Se reparte el flujo saliente de cada distrito entre destinos segun su peso de entradas en esa franja. Son rutas probables, no trazas GPS."
	},
	{
		question: "Que significa prediccion en el dashboard?",
		answer: "Las predicciones (+30/+60 min) anticipan disponibilidad con historico + estado reciente. Ayudan a prevenir, pero no garantizan el valor final."
	}
];
function MethodologyPanel() {
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold text-[var(--foreground)]",
					children: "Centro de ayuda rapido"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: "Metodologia, interpretacion de metricas y preguntas frecuentes."
				})] }), /* @__PURE__ */ jsx(Button, {
					asChild: true,
					variant: "cta",
					size: "sm",
					className: "rounded-full",
					children: /* @__PURE__ */ jsx(Link, {
						to: appRoutes.dashboardHelp(),
						children: "Ir a la ayuda completa"
					})
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid gap-3",
				children: QUICK_FAQ.map((item) => /* @__PURE__ */ jsxs("article", {
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: item.question
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-xs text-[var(--muted)]",
						children: item.answer
					})]
				}, item.question))
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-4 text-xs text-[var(--muted)]",
				children: "Si una seccion todavia no tiene historico suficiente o una capacidad avanzada activa, el dashboard muestra el bloque igualmente y explica por que falta ese dato."
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/PredictionHooksCard.tsx
function PredictionHooksCard() {
	const predictionExamplePath = `${String(appRoutes.api.predictions()).replace("101", "")}...`;
	return /* @__PURE__ */ jsxs("article", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsx("h3", {
				className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
				children: "Predicciones futuras"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-sm text-[var(--muted)]",
				children: "El endpoint de predicciones ya combina el estado actual con patrones historicos por franja horaria para estimar ocupacion en +30 y +60 minutos."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 text-xs text-[var(--muted)]",
				children: [
					/* @__PURE__ */ jsxs("p", { children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-semibold text-[var(--foreground)]",
							children: "Endpoint activo:"
						}),
						" ",
						/* @__PURE__ */ jsx("code", { children: predictionExamplePath })
					] }),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-1",
						children: [/* @__PURE__ */ jsx("span", {
							className: "font-semibold text-[var(--foreground)]",
							children: "Horizontes:"
						}), " T+30 min y T+60 min"]
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-1",
						children: [/* @__PURE__ */ jsx("span", {
							className: "font-semibold text-[var(--foreground)]",
							children: "Modelo:"
						}), " baseline historico con confianza por cobertura muestral"]
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-1",
						children: [/* @__PURE__ */ jsx("span", {
							className: "font-semibold text-[var(--foreground)]",
							children: "Campos:"
						}), " bicis, anclajes y confianza"]
					})
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-xs text-[var(--muted)]",
				children: "Es un primer modelo interpretable pensado para exponer una senal util sin introducir infraestructura extra de ML en esta fase."
			}),
			/* @__PURE__ */ jsx(Button, {
				asChild: true,
				variant: "cta",
				size: "sm",
				className: "mt-auto",
				children: /* @__PURE__ */ jsx(TrackedLink, {
					href: appRoutes.dashboardHelp("prediccion-dashboard"),
					trackingEvent: buildPanelOpenEvent({
						surface: "dashboard",
						routeKey: "dashboard_home",
						module: "prediction_help",
						source: "prediction_hooks"
					}),
					children: "Ver contexto metodologico"
				})
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/DataModeView.tsx
function DataModeView({ stationsCsvUrl, frictionCsvUrl, historyJsonUrl, historyCsvUrl, alertsCsvUrl, statusCsvUrl }) {
	const apiItems = [
		{
			label: "Estado actual de estaciones",
			path: appRoutes.api.stations(),
			format: "JSON / CSV",
			description: "Devuelve el estado actual de las estaciones con bicis, anclajes, capacidad y timestamp."
		},
		{
			label: "Salud del sistema",
			path: appRoutes.api.status(),
			format: "JSON / CSV",
			description: "Resume la salud del pipeline, la frescura de los datos y el volumen reciente."
		},
		{
			label: "Movilidad agregada",
			path: appRoutes.api.mobility(),
			format: "JSON",
			description: "Entrega curvas de demanda, señales horarias y, si existe, impacto del transporte publico."
		},
		{
			label: "Historico agregado",
			path: appRoutes.api.history(),
			format: "JSON / CSV",
			description: "Ofrece demanda, ocupacion y balance diario para analisis y auditoria."
		},
		{
			label: "Alertas historicas",
			path: appRoutes.api.alertsHistory(),
			format: "JSON / CSV",
			description: "Sirve para estudiar incidencias activas y resueltas con filtros por estado y limite."
		},
		{
			label: "Predicciones por estacion",
			path: appRoutes.api.predictions(),
			format: "JSON",
			description: "Estima bicis y anclajes a corto plazo mezclando estado actual y patrones historicos por hora."
		}
	];
	return /* @__PURE__ */ jsxs("section", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsx(DataModeCard, {
				stationsCsvUrl,
				frictionCsvUrl,
				historyJsonUrl,
				historyCsvUrl,
				alertsCsvUrl,
				statusCsvUrl
			}),
			/* @__PURE__ */ jsx(DataHistoryCard, {}),
			/* @__PURE__ */ jsx(ApiCatalogCard, { items: apiItems }),
			/* @__PURE__ */ jsx(MethodologyPanel, {}),
			/* @__PURE__ */ jsxs("section", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]",
							children: "Metodologia y origen"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-[var(--muted)]",
							children: "Los datos proceden del sistema GBFS de Bizi Zaragoza y del pipeline interno de agregacion para rankings, patrones y conclusiones."
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
									source: "data_mode"
								}),
								children: "Revisar metodologia"
							})
						})
					]
				}), /* @__PURE__ */ jsx(PredictionHooksCard, {})]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow-soft)]",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Estado del modo datos"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-[var(--foreground)]",
					children: "Esta vista ya centraliza exportaciones, metodologia, trazabilidad y una primera capa predictiva. El siguiente paso pendiente sigue siendo medir rendimiento real en produccion tras despliegue."
				})]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/DashboardClient.tsx
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
	if (!value) return TIME_WINDOWS[2]?.id ?? "30d";
	return TIME_WINDOWS.some((window) => window.id === value) ? value : TIME_WINDOWS[2]?.id ?? "30d";
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
function parseFavoriteIds(rawValue) {
	const parsed = parseJsonValue(rawValue);
	if (!Array.isArray(parsed)) return [];
	return parsed.filter((value) => typeof value === "string").map((value) => value.trim()).filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
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
function resolveNextRefreshAt(dataset, stations, status, now) {
	if (stations.stations.length === 0) return new Date(now + MIN_REFRESH_FALLBACK_MS);
	const latestUpdate = resolveLatestDataUpdatedAt(dataset, stations, status);
	return new Date(Math.max(latestUpdate.getTime() + REFRESH_AFTER_LAST_DATA_MS, now + MIN_REFRESH_FALLBACK_MS));
}
function resolveHydrationNow(initialData) {
	if (typeof window === "undefined") return toTimestamp(initialData.status.timestamp) ?? Date.now();
	return Date.now();
}
function formatCountdown(valueMs) {
	const safeMs = Math.max(0, valueMs);
	if (safeMs < 6e4) return `${Math.ceil(safeMs / 1e3)}s`;
	return `${Math.ceil(safeMs / 6e4)} min`;
}
function DashboardClient({ initialData }) {
	const dashboardRouteKey = "dashboard_home";
	const location = useLocation();
	const pathname = location.pathname;
	const router = useRouter();
	const searchParams = useMemo(() => new URLSearchParams(location.searchStr ?? ""), [location]);
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
	const [nextRefreshAt, setNextRefreshAt] = useState(() => resolveNextRefreshAt(initialData.dataset, initialData.stations, initialData.status, resolveHydrationNow(initialData)));
	const [refreshCountdownMs, setRefreshCountdownMs] = useState(() => {
		if (typeof window === "undefined") return 0;
		const initialRefreshAt = resolveNextRefreshAt(initialData.dataset, initialData.stations, initialData.status, Date.now());
		return Math.max(0, initialRefreshAt.getTime() - Date.now());
	});
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
		setFavoriteStationIds(parseFavoriteIds(window.localStorage.getItem(FAVORITES_STORAGE_KEY)));
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
		router.navigate({
			to: nextUrl,
			replace: true
		});
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
		if (isRefreshingData) return;
		const fetchJson = async (url) => {
			try {
				const response = await fetch(url, { cache: "no-store" });
				if (!response.ok) {
					const retryAfter = response.headers.get("Retry-After");
					throw new Error(`HTTP ${response.status}`, { cause: retryAfter ? { retryAfterSeconds: parseInt(retryAfter, 10) } : void 0 });
				}
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
				return {
					ok: false,
					retryAfterSeconds: error.cause?.retryAfterSeconds
				};
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
			let nextRefresh = resolveNextRefreshAt(initialData.dataset, latestStations, latestStatus);
			const rateLimitSeconds = [
				stationsResult,
				alertsResult,
				turnoverResult,
				availabilityResult,
				statusResult
			].map((r) => !r.ok ? r.retryAfterSeconds ?? 0 : 0).reduce((max, val) => Math.max(max, val), 0);
			if (rateLimitSeconds > 0) {
				const rateLimitNext = new Date(Date.now() + rateLimitSeconds * 1e3);
				if (rateLimitNext > nextRefresh) nextRefresh = rateLimitNext;
			}
			setNextRefreshAt(nextRefresh);
		} finally {
			setIsRefreshingData(false);
		}
	}, [
		initialData.dataset,
		stationsData,
		statusData,
		isRefreshingData
	]);
	useEffect(() => {
		const delayMs = nextRefreshAt.getTime() - Date.now();
		if (isRefreshingData) return;
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
	}, [
		nextRefreshAt,
		refreshDashboardData,
		isRefreshingData
	]);
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
	const updatedText = statusData.quality.freshness.lastUpdated ? new Date(statusData.quality.freshness.lastUpdated).toLocaleString("es-ES", { timeZone: TIMEZONE }) : "sin datos";
	const sharedDatasetUpdatedText = datasetLastSampleAt ? new Date(datasetLastSampleAt).toLocaleString("es-ES", { timeZone: TIMEZONE }) : "sin datos";
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
//#region src/app/dashboard/index.tsx?tsr-split=component
function DashboardPage() {
	const { breadcrumbs, initialData, isSchemaMissing, loadErrors, structuredData } = Route.useLoaderData();
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
			loadErrors.length > 0 ? /* @__PURE__ */ jsxs(Alert, {
				variant: "warning",
				className: "mx-auto mb-6 w-full max-w-[1280px] text-amber-100",
				children: [/* @__PURE__ */ jsxs(AlertTitle, {
					className: "font-semibold",
					children: [
						"No se pudieron cargar algunos paneles: ",
						loadErrors.join(", "),
						"."
					]
				}), /* @__PURE__ */ jsx(AlertDescription, {
					className: "text-amber-200/80",
					children: isSchemaMissing ? "La base de datos parece no estar inicializada. Ejecuta `bun prisma migrate deploy` con la misma DATABASE_URL del servidor." : "Revisa los logs del servidor para mas detalles."
				})]
			}) : null,
			/* @__PURE__ */ jsx(DashboardClient, { initialData })
		]
	});
}
//#endregion
export { DashboardPage as component };

//# sourceMappingURL=dashboard-BaP8ncl1.js.map