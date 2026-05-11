import { o as resolveDataState, p as shouldShowDataStateNotice, r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { t as DataStateNotice } from "./DataStateNotice-BAkqjtQM.js";
import { o as buildExportClickEvent, p as init_umami, t as TrackedLink, u as buildPanelOpenEvent } from "./TrackedLink-BHId783N.js";
import { n as init_TrackedAnchor, t as TrackedAnchor } from "./TrackedAnchor-CfqtzgOH.js";
import { r as formatPercent } from "./format-gBHZi2QJ.js";
import { i as ChartWrapper, n as useAbortableAsyncEffect, r as MeasuredResponsiveContainer, t as fetchJson } from "./useAbortableAsyncEffect-B-OZ9T1s.js";
import { t as MethodologyPanel } from "./MethodologyPanel-C_A0ER07.js";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
//#region src/app/dashboard/_components/ApiCatalogCard.tsx
init_routes();
init_umami();
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
						}), /* @__PURE__ */ jsx("span", {
							className: "rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]",
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
init_button();
init_TrackedAnchor();
init_routes();
init_umami();
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
								/* @__PURE__ */ jsx(Tooltip, { formatter: (value, name) => name === "Balance index" ? [formatPercent(Number(value)), "Balance index"] : [Number(value).toFixed(1), "Demanda"] }),
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
init_TrackedAnchor();
init_umami();
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
//#region src/app/dashboard/_components/PredictionHooksCard.tsx
init_button();
init_routes();
init_umami();
function PredictionHooksCard() {
	const predictionExamplePath = `${appRoutes.api.predictions().replace("101", "")}...`;
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
init_button();
init_routes();
init_umami();
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
export { DataModeView };
