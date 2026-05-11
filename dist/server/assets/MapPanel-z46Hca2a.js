import { n as init_card, t as Card } from "./card-BqIrN6Ld.js";
import { r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { t as formatDistanceMeters } from "./geo-C-dxtd4-.js";
import { t as Progress } from "./progress-DkkST3KE.js";
import { t as InfoHint } from "./InfoHint-DEg1te5W.js";
/* empty css                     */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Layer, Map, Marker, Popup, Source } from "react-map-gl/maplibre";
//#region src/app/dashboard/_components/BalanceIndexCard.tsx
init_routes();
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
//#region src/lib/map-features.ts
init_card();
init_button();
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
	}), /* @__PURE__ */ jsxs(Map, {
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
export { DailyInsightsCard as n, BalanceIndexCard as r, MapPanel as t };
