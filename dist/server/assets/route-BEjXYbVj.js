import { n as init_page_shell, t as PageShell } from "./page-shell-CC8M_45q.js";
import { _ as SiteBreadcrumbs, o as createRootBreadcrumbs } from "./shared-data-fallbacks-BSFw5LEs.js";
import { r as init_sentry_reporting, t as captureExceptionWithContext } from "./sentry-reporting-CvzcSweH.js";
import { r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { a as isDistrictCollection, n as buildStationDistrictMap, r as fetchDistrictCollection } from "./districts-e09LFoic.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { n as init_DashboardPageViewTracker } from "./DashboardPageViewTracker-SrI8-Aae.js";
import { n as haversineDistanceMeters, t as formatDistanceMeters } from "./geo-C-dxtd4-.js";
import { r as formatPercent } from "./format-gBHZi2QJ.js";
import { n as useAbortableAsyncEffect, t as fetchJson } from "./useAbortableAsyncEffect-B-OZ9T1s.js";
import "./MethodologyPanel-C_A0ER07.js";
import { t as Route } from "./route-DGe9079t.js";
import { useEffect, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/dashboard/_components/StationDetailPanel.tsx
init_DashboardPageViewTracker();
init_button();
init_routes();
init_sentry_reporting();
function toOccupancy(station) {
	if (!station || !Number.isFinite(station.capacity) || station.capacity <= 0) return 0;
	return station.bikesAvailable / station.capacity;
}
function getDayTypeForToday() {
	const day = (/* @__PURE__ */ new Date()).getDay();
	return day === 0 || day === 6 ? "WEEKEND" : "WEEKDAY";
}
function getAverageOccupancy(rows, fallback) {
	if (rows.length === 0) return fallback;
	return rows.reduce((sum, row) => sum + (Number.isFinite(row.occupancyAvg) ? row.occupancyAvg : 0), 0) / rows.length;
}
function StationDetailPanel({ station, stations, rankings, alerts, patterns, heatmap, mobilityDays = 14, demandDays = 30, selectedMonth = null }) {
	const [districts, setDistricts] = useState(null);
	const [mobility, setMobility] = useState(null);
	const [userLocation, setUserLocation] = useState(null);
	const [isGeolocationEnabled, setIsGeolocationEnabled] = useState(false);
	useAbortableAsyncEffect(async (signal, isActive) => {
		const params = new URLSearchParams({
			mobilityDays: String(mobilityDays),
			demandDays: String(demandDays)
		});
		if (selectedMonth) params.set("month", selectedMonth);
		const [districtPayload, mobilityPayload] = await Promise.all([fetchDistrictCollection(signal), fetchJson(`${appRoutes.api.mobility()}?${params.toString()}`, { signal })]);
		if (!districtPayload || !Array.isArray(mobilityPayload.hourlySignals)) throw new Error("No se pudieron cargar datos auxiliares de estacion.");
		if (!isActive()) return;
		if (isDistrictCollection(districtPayload)) setDistricts(districtPayload);
		setMobility(mobilityPayload);
	}, [
		demandDays,
		mobilityDays,
		selectedMonth
	], { onError: (error) => {
		captureExceptionWithContext(error, {
			area: "dashboard.station-detail",
			operation: "loadExtraData",
			extra: {
				mobilityDays,
				demandDays,
				selectedMonth
			}
		});
		console.error("[Dashboard] Error cargando detalle de estacion", error);
	} });
	useEffect(() => {
		if (!isGeolocationEnabled) return;
		if (typeof navigator === "undefined" || !navigator.geolocation) return;
		const watcherId = navigator.geolocation.watchPosition((position) => {
			setUserLocation({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude
			});
		}, () => {
			setUserLocation(null);
		}, {
			enableHighAccuracy: true,
			timeout: 12e3,
			maximumAge: 12e4
		});
		return () => {
			navigator.geolocation.clearWatch(watcherId);
		};
	}, [isGeolocationEnabled]);
	const stationDistrictMap = useMemo(() => {
		if (!districts) return /* @__PURE__ */ new Map();
		return buildStationDistrictMap(stations, districts);
	}, [districts, stations]);
	const selectedDistrict = station ? stationDistrictMap.get(station.id) ?? null : null;
	const cityAverage = useMemo(() => {
		const occupancies = stations.map((row) => toOccupancy(row)).filter((value) => Number.isFinite(value));
		if (occupancies.length === 0) return 0;
		return occupancies.reduce((sum, value) => sum + value, 0) / occupancies.length;
	}, [stations]);
	const districtAverage = useMemo(() => {
		if (!selectedDistrict) return null;
		const districtStations = stations.filter((stationRow) => stationDistrictMap.get(stationRow.id) === selectedDistrict);
		if (districtStations.length === 0) return null;
		const values = districtStations.map((districtStation) => toOccupancy(districtStation));
		return values.reduce((sum, value) => sum + value, 0) / values.length;
	}, [
		selectedDistrict,
		stationDistrictMap,
		stations
	]);
	const districtSnapshot = useMemo(() => {
		if (!selectedDistrict) return null;
		const districtStations = stations.filter((stationRow) => stationDistrictMap.get(stationRow.id) === selectedDistrict);
		if (districtStations.length === 0) return null;
		return {
			bikesAvg: districtStations.reduce((sum, row) => sum + Math.max(0, row.bikesAvailable), 0) / districtStations.length,
			anchorsAvg: districtStations.reduce((sum, row) => sum + Math.max(0, row.anchorsFree), 0) / districtStations.length
		};
	}, [
		selectedDistrict,
		stationDistrictMap,
		stations
	]);
	const turnoverRow = useMemo(() => {
		if (!station) return null;
		return rankings.turnover.rankings.find((row) => row.stationId === station.id) ?? rankings.availability.rankings.find((row) => row.stationId === station.id) ?? null;
	}, [
		rankings.availability.rankings,
		rankings.turnover.rankings,
		station
	]);
	const availabilityRow = useMemo(() => {
		if (!station) return null;
		return rankings.availability.rankings.find((row) => row.stationId === station.id) ?? rankings.turnover.rankings.find((row) => row.stationId === station.id) ?? null;
	}, [
		rankings.availability.rankings,
		rankings.turnover.rankings,
		station
	]);
	const stationAlerts = station ? alerts.alerts.filter((alert) => alert.stationId === station.id && alert.isActive) : [];
	const projection = useMemo(() => {
		const currentOccupancy = toOccupancy(station);
		const dayType = getDayTypeForToday();
		const now = /* @__PURE__ */ new Date();
		const nextHour = (now.getHours() + 1) % 24;
		const nextTwoHours = (now.getHours() + 2) % 24;
		const nextHourRow = patterns.find((row) => String(row.dayType) === dayType && Number(row.hour) === nextHour);
		const nextTwoHoursRow = patterns.find((row) => String(row.dayType) === dayType && Number(row.hour) === nextTwoHours);
		const patternFallback = getAverageOccupancy(patterns, currentOccupancy);
		const heatmapFallback = getAverageOccupancy(heatmap, patternFallback);
		const next30 = nextHourRow?.occupancyAvg ?? patternFallback;
		const next60 = nextTwoHoursRow?.occupancyAvg ?? heatmapFallback;
		const sampleBase = (nextHourRow?.sampleCount ?? 0) + (nextTwoHoursRow?.sampleCount ?? 0);
		return {
			next30,
			next60,
			confidence: Math.max(30, Math.min(94, 35 + sampleBase * 4))
		};
	}, [
		heatmap,
		patterns,
		station
	]);
	const estimatedDestinations = useMemo(() => {
		if (!mobility || !selectedDistrict || !station) return [];
		const districtTotals = /* @__PURE__ */ new Map();
		for (const row of mobility.hourlySignals) {
			const district = stationDistrictMap.get(row.stationId);
			if (!district) continue;
			const current = districtTotals.get(district) ?? {
				inbound: 0,
				outbound: 0
			};
			current.inbound += Math.max(0, Number(row.arrivals));
			current.outbound += Math.max(0, Number(row.departures));
			districtTotals.set(district, current);
		}
		const stationOutbound = mobility.hourlySignals.filter((row) => row.stationId === station.id).reduce((sum, row) => sum + Math.max(0, Number(row.departures)), 0);
		const districtOutbound = districtTotals.get(selectedDistrict)?.outbound ?? 0;
		const outboundBasis = stationOutbound > 0 ? stationOutbound : districtOutbound > 0 ? districtOutbound : 0;
		if (outboundBasis <= 0) return [];
		const totalInbound = Array.from(districtTotals.values()).reduce((sum, districtRow) => sum + districtRow.inbound, 0);
		if (totalInbound <= 0) return [];
		return Array.from(districtTotals.entries()).filter(([district]) => district !== selectedDistrict).map(([district, districtRow]) => ({
			district,
			flow: outboundBasis * (districtRow.inbound / totalInbound)
		})).sort((left, right) => right.flow - left.flow).slice(0, 4);
	}, [
		mobility,
		selectedDistrict,
		station,
		stationDistrictMap
	]);
	const selectedDistrictNet = useMemo(() => {
		if (!mobility || !selectedDistrict) return null;
		let inbound = 0;
		let outbound = 0;
		for (const row of mobility.hourlySignals) {
			if (stationDistrictMap.get(row.stationId) !== selectedDistrict) continue;
			inbound += Math.max(0, Number(row.arrivals));
			outbound += Math.max(0, Number(row.departures));
		}
		return inbound - outbound;
	}, [
		mobility,
		selectedDistrict,
		stationDistrictMap
	]);
	const nearestDistanceMeters = useMemo(() => {
		if (!station || !userLocation) return null;
		if (!Number.isFinite(station.lat) || !Number.isFinite(station.lon)) return null;
		return haversineDistanceMeters(userLocation, {
			latitude: station.lat,
			longitude: station.lon
		});
	}, [station, userLocation]);
	const isNearestStation = useMemo(() => {
		if (!station || !userLocation || stations.length === 0) return false;
		let nearestStationId = null;
		let nearestDistance = Number.POSITIVE_INFINITY;
		for (const row of stations) {
			if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) continue;
			const distance = haversineDistanceMeters(userLocation, {
				latitude: row.lat,
				longitude: row.lon
			});
			if (distance < nearestDistance) {
				nearestDistance = distance;
				nearestStationId = row.id;
			}
		}
		return nearestStationId === station.id;
	}, [
		station,
		stations,
		userLocation
	]);
	if (!station) return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card",
		children: [/* @__PURE__ */ jsx("h2", {
			className: "text-lg font-semibold text-[var(--foreground)]",
			children: "Detalle de estacion"
		}), /* @__PURE__ */ jsx("p", {
			className: "text-sm text-[var(--muted)]",
			children: "Selecciona una estacion para ver KPIs, benchmarking y proyecciones."
		})]
	});
	const currentOccupancy = toOccupancy(station);
	const isCritical = station.bikesAvailable === 0 || station.anchorsFree === 0 || stationAlerts.length > 0;
	const statusLabel = isCritical ? station.bikesAvailable === 0 ? "Critica - vacia" : station.anchorsFree === 0 ? "Critica - llena" : "Critica - accion requerida" : "Operativa";
	const problemHours = (availabilityRow?.emptyHours ?? turnoverRow?.emptyHours ?? 0) + (availabilityRow?.fullHours ?? turnoverRow?.fullHours ?? 0);
	const totalDestinationFlow = estimatedDestinations.reduce((sum, destination) => sum + destination.flow, 0);
	return /* @__PURE__ */ jsxs("section", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsx("header", {
				className: "rounded-xl border border-[var(--border)] bg-[var(--primary)]/8 p-6",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-6",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex h-24 w-24 items-center justify-center rounded-lg border-2 border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/35 to-[var(--secondary)] text-xs font-black uppercase tracking-[0.14em] text-[var(--foreground)]",
							children: ["#", station.id]
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex flex-col",
							children: [
								/* @__PURE__ */ jsx("h2", {
									className: "text-3xl font-bold tracking-tight text-[var(--foreground)]",
									children: station.name
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-1 text-sm text-[var(--muted)]",
									children: [
										"ID: #",
										station.id,
										selectedDistrict ? ` · ${selectedDistrict}` : ""
									]
								}),
								nearestDistanceMeters !== null ? /* @__PURE__ */ jsxs("p", {
									className: "mt-2 text-xs font-semibold text-[var(--primary)]",
									children: [
										"📍 A ",
										formatDistanceMeters(nearestDistanceMeters),
										" de ti",
										isNearestStation ? " · Es la mas cercana" : ""
									]
								}) : !isGeolocationEnabled ? /* @__PURE__ */ jsx(Button, {
									variant: "ghost",
									onClick: () => setIsGeolocationEnabled(true),
									className: "mt-2 h-auto min-h-0 rounded-lg border border-[var(--primary)] px-2 py-1 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
									children: "Usar mi ubicacion para calcular distancia"
								}) : null,
								/* @__PURE__ */ jsxs("div", {
									className: `mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${isCritical ? "border-[var(--primary)] bg-[var(--primary)]/20 text-[var(--primary)]" : "border-emerald-500/35 bg-emerald-500/10 text-emerald-500"}`,
									children: [/* @__PURE__ */ jsxs("span", {
										className: "relative flex h-2 w-2",
										children: [/* @__PURE__ */ jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" }), /* @__PURE__ */ jsx("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-current" })]
									}), statusLabel]
								})
							]
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "flex flex-col items-start md:items-end",
						children: /* @__PURE__ */ jsxs("div", {
							className: "text-right",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]",
								children: "Ultima actualizacion"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-medium text-[var(--foreground)]",
								children: new Date(station.recordedAt).toLocaleString("es-ES")
							})]
						})
					})]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ jsxs("article", {
						className: "rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/12 p-5",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Bicis disponibles"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 text-4xl font-bold text-[var(--foreground)]",
								children: station.bikesAvailable
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "mt-1 text-xs text-[var(--muted)]",
								children: ["Media distrito: ", districtSnapshot ? districtSnapshot.bikesAvg.toFixed(1) : "N/D"]
							})
						]
					}),
					/* @__PURE__ */ jsxs("article", {
						className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-5",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Anclajes libres"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 text-4xl font-bold text-[var(--foreground)]",
								children: station.anchorsFree
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "mt-1 text-xs text-[var(--muted)]",
								children: ["Media distrito: ", districtSnapshot ? districtSnapshot.anchorsAvg.toFixed(1) : "N/D"]
							})
						]
					}),
					/* @__PURE__ */ jsxs("article", {
						className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-5",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Rotacion 14d"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 text-4xl font-bold text-[var(--foreground)]",
								children: turnoverRow ? turnoverRow.turnoverScore.toFixed(1) : "0.0"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-1 text-xs text-[var(--muted)]",
								children: "Puntuacion del ranking operativo."
							})
						]
					}),
					/* @__PURE__ */ jsxs("article", {
						className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-5",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Horas problema 14d"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 text-4xl font-bold text-[var(--foreground)]",
								children: problemHours
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "mt-1 text-xs text-[var(--muted)]",
								children: ["Alertas activas: ", stationAlerts.length]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-6 lg:grid-cols-3",
				children: [/* @__PURE__ */ jsxs("article", {
					className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-5 lg:col-span-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-lg font-bold text-[var(--foreground)]",
							children: "Benchmark de barrio"
						}), selectedDistrict ? /* @__PURE__ */ jsx("span", {
							className: "rounded bg-[var(--primary)]/10 px-2 py-1 text-[10px] font-bold uppercase text-[var(--primary)]",
							children: selectedDistrict
						}) : null]
					}), /* @__PURE__ */ jsxs("div", {
						className: "mt-4 space-y-2",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-3 border-b border-[var(--border)] pb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]",
								children: [
									/* @__PURE__ */ jsx("span", { children: "Metrica" }),
									/* @__PURE__ */ jsx("span", {
										className: "text-center",
										children: "Estacion"
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-right",
										children: "Distrito/Ciudad"
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-3 py-1 text-sm",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-[var(--muted)]",
										children: "Ocupacion media"
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-center font-semibold text-[var(--foreground)]",
										children: formatPercent(currentOccupancy)
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-right text-[var(--muted)]",
										children: districtAverage === null ? formatPercent(cityAverage) : formatPercent(districtAverage)
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-3 py-1 text-sm",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-[var(--muted)]",
										children: "Horas problema"
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-center font-semibold text-[var(--foreground)]",
										children: problemHours
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-right text-[var(--muted)]",
										children: availabilityRow ? `${availabilityRow.totalHours}h muestra` : "N/D"
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-xs text-[var(--muted)]",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "font-bold text-[var(--primary)]",
										children: "Conclusión:"
									}),
									" ",
									districtAverage === null ? "Sin datos de distrito para comparar." : `Esta estacion esta ${currentOccupancy >= districtAverage ? "por encima" : "por debajo"} de la media distrital en ${formatPercent(Math.abs(currentOccupancy - districtAverage))}.`
								]
							})
						]
					})]
				}), /* @__PURE__ */ jsxs("article", {
					className: "rounded-xl border-2 border-[var(--primary)] bg-[var(--primary)] p-5 text-white",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "text-lg font-bold",
							children: "Prediccion de disponibilidad"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1 text-sm text-white/80",
							children: "Estimacion de disponibilidad para 60 minutos."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 space-y-3",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "rounded-lg border border-white/25 bg-white/10 px-3 py-2",
									children: [/* @__PURE__ */ jsx("p", {
										className: "text-[10px] font-bold uppercase tracking-[0.12em] text-white/70",
										children: "En 30 min"
									}), /* @__PURE__ */ jsx("p", {
										className: "text-base font-bold",
										children: formatPercent(projection.next30)
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "rounded-lg border border-white/25 bg-white/10 px-3 py-2",
									children: [/* @__PURE__ */ jsx("p", {
										className: "text-[10px] font-bold uppercase tracking-[0.12em] text-white/70",
										children: "En 60 min"
									}), /* @__PURE__ */ jsx("p", {
										className: "text-base font-bold",
										children: formatPercent(projection.next60)
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "pt-1 text-[11px] text-white/80",
									children: [
										"Confianza: ",
										Math.round(projection.confidence),
										"%"
									]
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-5",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-lg font-bold text-[var(--foreground)]",
						children: "Destinos principales"
					}), /* @__PURE__ */ jsxs("span", {
						className: "ui-chip",
						children: ["Balance neto ", selectedDistrictNet?.toFixed(1) ?? "N/D"]
					})]
				}), estimatedDestinations.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-[var(--muted)]",
					children: "Sin datos suficientes para estimar destinos desde el distrito actual."
				}) : /* @__PURE__ */ jsx("div", {
					className: "mt-4 space-y-3",
					children: estimatedDestinations.map((destination, index) => {
						const share = totalDestinationFlow > 0 ? Math.round(destination.flow / totalDestinationFlow * 100) : 0;
						return /* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/12 text-sm font-bold text-[var(--primary)]",
									children: index + 1
								}), /* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: destination.district
								})]
							}), /* @__PURE__ */ jsxs("p", {
								className: "text-xs font-bold text-[var(--muted)]",
								children: [share, "% flujo"]
							})]
						}, destination.district);
					})
				})]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/estaciones/[stationId]/route.tsx?tsr-split=component
init_routes();
init_page_shell();
function StationDetailRoute() {
	const { stationId } = Route.useParams();
	return /* @__PURE__ */ jsxs(PageShell, { children: [/* @__PURE__ */ jsx("div", {
		className: "mx-auto mb-4 w-full max-w-[1280px]",
		children: /* @__PURE__ */ jsx(SiteBreadcrumbs, { items: createRootBreadcrumbs({
			label: "Estaciones",
			href: appRoutes.dashboardStations()
		}) })
	}), /* @__PURE__ */ jsx(StationDetailPanel, { stationId })] });
}
//#endregion
export { StationDetailRoute as component };
