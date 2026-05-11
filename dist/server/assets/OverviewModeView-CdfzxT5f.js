import { r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { r as formatPercent } from "./format-gBHZi2QJ.js";
import { n as DailyInsightsCard, r as BalanceIndexCard, t as MapPanel } from "./MapPanel-z46Hca2a.js";
import { i as DemandFlowCard, n as NeighborhoodLoadCard, r as FlowPreviewPanel, t as SystemIntradayCard } from "./SystemIntradayCard-CZh2dOuw.js";
import { n as MetricGrid, t as MetricCard } from "./metric-card-pE1Abaj6.js";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/app/dashboard/_components/SystemHealthCard.tsx
init_routes();
init_button();
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
//#region src/app/dashboard/_components/OverviewModeView.tsx
function OverviewModeView({ status, totalStations, stations, filteredStations, selectedStationId, onSelectStation, favoriteStationIds, onToggleFavorite, trendByStationId, nearestStationId, nearestDistanceMeters, userLocation, mapViewState, onViewStateCommit, frictionByStationId, systemMetrics, updatedText, topFrictionStationName, mobilityPreview, activeWindowLabel, activeWindowDemandDays }) {
	const statusLabel = status.pipeline.healthStatus === "healthy" ? "saludable" : status.pipeline.healthStatus === "degraded" ? "degradado" : status.pipeline.healthStatus === "down" ? "caido" : "desconocido";
	return /* @__PURE__ */ jsxs(Fragment, { children: [
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
export { OverviewModeView };
