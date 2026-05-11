import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import { o as resolveDataState, r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { t as DataStateNotice } from "./DataStateNotice-BAkqjtQM.js";
import { n as init_input, t as Input } from "./input-CNtnRSUp.js";
import { t as Progress } from "./progress-DkkST3KE.js";
import { t as calculateFrictionScore } from "./useSystemMetrics-D1dA0yxm.js";
import { r as formatPercent } from "./format-gBHZi2QJ.js";
import { t as InfoHint } from "./InfoHint-DEg1te5W.js";
import * as React from "react";
import { Suspense, useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { Combobox } from "@base-ui/react/combobox";
import { Popover } from "@base-ui/react/popover";
//#region src/app/dashboard/_components/RankingsTable.tsx
init_button();
init_input();
init_routes();
function RankingsTableContent({ rankings, stations, density = "normal" }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
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
		router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
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
						variant: "ghost",
						className: `rounded-full border px-3 py-1 text-xs font-semibold transition ${activeTab === "availability" ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)]"} h-auto min-h-0`,
						onClick: () => {
							updateQuery({
								tab: "availability",
								showAll: false
							});
						},
						children: "Criticas"
					}), /* @__PURE__ */ jsx(Button, {
						variant: "ghost",
						className: `rounded-full border px-3 py-1 text-xs font-semibold transition ${activeTab === "turnover" ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)]"} h-auto min-h-0`,
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
				variant: "ghost",
				onClick: () => {
					updateQuery({ showAll: !showAll });
				},
				className: "h-auto min-h-0 rounded-lg border border-[var(--primary)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
				children: showAll ? "Mostrar menos" : "Ver mas"
			}) : null
		]
	});
}
function RankingsTable(props) {
	return /* @__PURE__ */ jsx(Suspense, {
		fallback: /* @__PURE__ */ jsx("div", { className: "ui-section-card h-full animate-pulse" }),
		children: /* @__PURE__ */ jsx(RankingsTableContent, { ...props })
	});
}
//#endregion
//#region src/components/ui/command.tsx
init_utils();
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
init_utils();
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
init_button();
init_input();
init_routes();
init_utils();
function normalizeText(value) {
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
	const query = normalizeText(rawQuery);
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
		const normalizedName = normalizeText(station.name);
		const normalizedId = normalizeText(station.id);
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
						className: `max-w-full truncate rounded-full border px-3 py-1 text-xs font-semibold transition ${station.id === selectedStationId ? "border-amber-500 bg-amber-500 text-[#111827]" : "border-amber-500/40 bg-amber-500/15 text-[var(--foreground)] hover:border-amber-500"}`,
						variant: "ghost",
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
				children: /* @__PURE__ */ jsx(Link, {
					href: stationDetailUrl,
					className: "rounded-lg border border-[var(--primary)] bg-[var(--primary)]/15 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
					children: "Abrir detalle completo"
				})
			}) : null
		]
	});
}
//#endregion
export { RankingsTable as n, StationPicker as t };
