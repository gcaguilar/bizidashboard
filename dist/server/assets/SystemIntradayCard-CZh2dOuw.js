import { a as cn, n as init_card, o as init_utils, t as Card } from "./card-BqIrN6Ld.js";
import { r as init_sentry_reporting, t as captureExceptionWithContext } from "./sentry-reporting-CvzcSweH.js";
import { n as buttonVariants, o as resolveDataState, r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { n as buildStationDistrictMap, r as fetchDistrictCollection } from "./districts-e09LFoic.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { t as DataStateNotice } from "./DataStateNotice-BAkqjtQM.js";
import { t as Progress } from "./progress-DkkST3KE.js";
import { r as formatPercent } from "./format-gBHZi2QJ.js";
import { i as ChartWrapper, n as useAbortableAsyncEffect, r as MeasuredResponsiveContainer } from "./useAbortableAsyncEffect-B-OZ9T1s.js";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Area, AreaChart, CartesianGrid, Legend, Line, Tooltip, XAxis, YAxis } from "recharts";
//#region src/components/ui/empty-state-card.tsx
init_routes();
init_button();
init_utils();
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
function formatDayLabel(day) {
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
								title: `${formatDayLabel(row.day)} · ${score.toFixed(1)}`
							})
						}, `${row.day}-${index}`);
					})]
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-2 flex justify-between text-[10px] font-bold uppercase text-[var(--muted)]",
				children: [
					/* @__PURE__ */ jsx("span", { children: formatDayLabel(rows[0]?.day ?? "") }),
					/* @__PURE__ */ jsx("span", { children: formatDayLabel(rows[Math.floor(rows.length / 2)]?.day ?? "") }),
					/* @__PURE__ */ jsx("span", { children: formatDayLabel(rows[rows.length - 1]?.day ?? "") })
				]
			})] })
		]
	});
}
//#endregion
//#region src/app/dashboard/_components/FlowPreviewPanel.tsx
init_button();
init_card();
init_routes();
init_sentry_reporting();
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
//#region src/app/dashboard/_components/NeighborhoodLoadCard.tsx
init_routes();
init_sentry_reporting();
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
			}), /* @__PURE__ */ jsxs("div", {
				className: "max-h-44 space-y-2 overflow-y-auto pr-1 text-[11px]",
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
//#region src/app/dashboard/_components/SystemIntradayCard.tsx
init_routes();
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
							/* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(SystemTooltip, {}) }),
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
export { DemandFlowCard as i, NeighborhoodLoadCard as n, FlowPreviewPanel as r, SystemIntradayCard as t };
