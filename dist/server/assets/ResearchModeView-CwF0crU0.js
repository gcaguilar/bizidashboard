import { n as init_card, t as Card } from "./card-BqIrN6Ld.js";
import { n as buttonVariants, r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { t as Progress } from "./progress-DkkST3KE.js";
import { t as calculateFrictionScore } from "./useSystemMetrics-D1dA0yxm.js";
import { r as formatPercent } from "./format-gBHZi2QJ.js";
import { n as RankingsTable, t as StationPicker } from "./StationPicker-Bi5POF77.js";
import { i as DemandFlowCard, n as NeighborhoodLoadCard, r as FlowPreviewPanel, t as SystemIntradayCard } from "./SystemIntradayCard-CZh2dOuw.js";
import { t as MetricCard } from "./metric-card-pE1Abaj6.js";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/app/dashboard/_components/ResearchSummaryCard.tsx
init_card();
init_button();
init_routes();
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
init_routes();
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
init_routes();
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
init_button();
init_routes();
function ResearchModeView(props) {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
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
export { ResearchModeView };
