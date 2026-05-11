import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { t as Progress } from "./progress-DkkST3KE.js";
import { r as formatPercent, t as formatAlertType } from "./format-gBHZi2QJ.js";
import { n as init_scroll_area, t as ScrollArea } from "./scroll-area-BqieZcZp.js";
import { n as DailyInsightsCard, r as BalanceIndexCard, t as MapPanel } from "./MapPanel-z46Hca2a.js";
import { n as RankingsTable, t as StationPicker } from "./StationPicker-Bi5POF77.js";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/app/dashboard/_components/AlertsPanel.tsx
init_scroll_area();
init_routes();
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
				children: [/* @__PURE__ */ jsxs("span", {
					className: "rounded-full bg-[var(--primary)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white",
					children: [activeAlerts.length, " accion requerida"]
				}), /* @__PURE__ */ jsx(Link, {
					href: appRoutes.dashboardAlerts(),
					className: "rounded-full border border-[var(--primary)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
					children: "Historial"
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
init_routes();
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
//#region src/app/dashboard/_components/OperationsModeView.tsx
function OperationsModeView(props) {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
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
export { OperationsModeView };
