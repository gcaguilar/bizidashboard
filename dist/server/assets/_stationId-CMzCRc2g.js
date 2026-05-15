import { t as PageShell } from "./page-shell-DP1spWfk.js";
import { f as getSiteUrl, r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as PublicSectionNav } from "./PublicSectionNav-Yd_6xRYh.js";
import { n as SiteBreadcrumbs } from "./createSsrRpc-BFE1gq-C.js";
import { n as createRootBreadcrumbs } from "./breadcrumbs-tXG_cMah.js";
import { i as formatHourRange, o as formatPercent } from "./format-DRxgyIYB.js";
import { t as Route } from "./_stationId-dUmtbzTy.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/estaciones/$stationId.tsx?tsr-split=component
function formatDayTypeLabel(dayType) {
	return dayType === "WEEKEND" ? "Fin de semana" : "Laborable";
}
function describeOccupancyDelta(delta) {
	if (Math.abs(delta) < .05) return "muy cerca de la media de la ciudad";
	return delta > 0 ? "por encima de la media de Zaragoza" : "por debajo de la media de Zaragoza";
}
function formatPredictionLabel(value, capacity) {
	if (value === null || !Number.isFinite(value) || capacity <= 0) return "Sin prediccion suficiente";
	return `${Math.round(value)} bicis (${formatPercent(value / capacity)})`;
}
function StationPage() {
	const data = Route.useLoaderData();
	const { stationId } = Route.useParams();
	if (!data) return /* @__PURE__ */ jsxs(PageShell, { children: [/* @__PURE__ */ jsx(PublicSectionNav, {
		activeItemId: "dashboard",
		className: "mt-1"
	}), /* @__PURE__ */ jsxs("section", {
		className: "ui-page-hero",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
				children: "Ficha de estacion"
			}),
			/* @__PURE__ */ jsxs("h1", {
				className: "mt-2 text-3xl font-black text-[var(--foreground)]",
				children: ["Estacion ", stationId]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm text-[var(--muted)]",
				children: "No hay cobertura suficiente para esta ficha publica."
			}),
			/* @__PURE__ */ jsx("a", {
				className: "ui-inline-action mt-4",
				href: appRoutes.seoPage("uso-bizi-por-estacion"),
				children: "Ver hub de estaciones"
			})
		]
	})] });
	const { summary, relatedStations } = data;
	const station = summary.station;
	const siteUrl = getSiteUrl();
	const occupancyDelta = summary.currentOccupancy - summary.cityAverageOccupancy;
	const faqItems = [
		{
			question: "Cuando suele ser mas facil encontrar bici?",
			answer: data.highOccupancySlots[0] ? `${formatDayTypeLabel(String(data.highOccupancySlots[0].dayType))} sobre ${formatHourRange(data.highOccupancySlots[0].hour)}, con una ocupacion media del ${formatPercent(data.highOccupancySlots[0].occupancyAvg)}.` : "Todavia no hay un patron historico suficientemente estable para responderlo con precision."
		},
		{
			question: "Cuando suele haber mas huecos para devolver?",
			answer: data.lowOccupancySlots[0] ? `${formatDayTypeLabel(String(data.lowOccupancySlots[0].dayType))} sobre ${formatHourRange(data.lowOccupancySlots[0].hour)}, cuando la ocupacion media baja a ${formatPercent(data.lowOccupancySlots[0].occupancyAvg)}.` : "La serie disponible todavia no permite marcar una franja clara con mas anclajes libres."
		},
		{
			question: "Esta por encima o por debajo de la media de Zaragoza?",
			answer: `La ocupacion actual esta ${describeOccupancyDelta(occupancyDelta)}: ${formatPercent(summary.currentOccupancy)} frente a ${formatPercent(summary.cityAverageOccupancy)} en la ciudad.`
		}
	];
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [{
			"@type": "WebPage",
			name: `${station.name} | DatosBizi`,
			description: `Ficha publica de ${station.name} con disponibilidad actual y patrones de uso.`,
			url: `${siteUrl}${appRoutes.stationDetail(station.id)}`,
			inLanguage: "es"
		}, {
			"@type": "FAQPage",
			mainEntity: faqItems.map((item) => ({
				"@type": "Question",
				name: item.question,
				acceptedAnswer: {
					"@type": "Answer",
					text: item.answer
				}
			}))
		}]
	};
	const breadcrumbs = createRootBreadcrumbs({
		label: "Estaciones",
		href: appRoutes.seoPage("uso-bizi-por-estacion")
	}, {
		label: station.name,
		href: appRoutes.stationDetail(station.id)
	});
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mx-auto mb-4 w-full max-w-[1280px]",
			children: /* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs })
		}),
		/* @__PURE__ */ jsx(PublicSectionNav, {
			activeItemId: "dashboard",
			className: "mt-1"
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
					children: "Ficha publica de estacion"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
					children: station.name
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-3 text-sm text-[var(--muted)] md:text-base",
					children: [
						"Disponibilidad actual, ocupacion y contexto de uso de la estacion Bizi ",
						station.id,
						"."
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-5 flex flex-wrap gap-3",
					children: [/* @__PURE__ */ jsx("a", {
						className: "ui-inline-action",
						href: appRoutes.dashboardStation(station.id),
						children: "Abrir detalle operativo"
					}), summary.districtSlug ? /* @__PURE__ */ jsx("a", {
						className: "ui-inline-action",
						href: appRoutes.districtDetail(summary.districtSlug),
						children: "Ver barrio"
					}) : null]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Bicis"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: station.bikesAvailable
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Huecos"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: station.anchorsFree
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Capacidad"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: station.capacity
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Ocupacion"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: formatPercent(summary.currentOccupancy)
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 lg:grid-cols-3",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card lg:col-span-2",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Lectura rapida de la estacion"
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]",
					children: [/* @__PURE__ */ jsxs("p", { children: [
						station.name,
						" tiene ahora ",
						station.bikesAvailable,
						" bicis y ",
						station.anchorsFree,
						" anclajes libres sobre una capacidad de ",
						station.capacity,
						"."
					] }), /* @__PURE__ */ jsxs("p", { children: [
						"Su ocupacion actual esta ",
						describeOccupancyDelta(occupancyDelta),
						". Usa esta ficha como capa publica y baja al dashboard si necesitas mapa, alertas y detalle operativo."
					] })]
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Prediccion"
				}), /* @__PURE__ */ jsxs("dl", {
					className: "mt-4 space-y-3 text-sm",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "stat-label",
						children: "30 min"
					}), /* @__PURE__ */ jsx("dd", {
						className: "font-semibold text-[var(--foreground)]",
						children: formatPredictionLabel(data.predictions.next30Minutes, station.capacity)
					})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
						className: "stat-label",
						children: "60 min"
					}), /* @__PURE__ */ jsx("dd", {
						className: "font-semibold text-[var(--foreground)]",
						children: formatPredictionLabel(data.predictions.next60Minutes, station.capacity)
					})] })]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Preguntas frecuentes"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-4 grid gap-3 md:grid-cols-3",
				children: faqItems.map((item) => /* @__PURE__ */ jsxs("article", {
					className: "ui-surface-block",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: item.question
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-[11px] text-[var(--muted)]",
						children: item.answer
					})]
				}, item.question))
			})]
		}),
		data.highOccupancySlots.length > 0 || data.lowOccupancySlots.length > 0 ? /* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Patrones horarios"
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "ui-surface-block",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: "Mas facil encontrar bici"
					}), data.highOccupancySlots.map((slot) => /* @__PURE__ */ jsxs("p", {
						className: "mt-1 text-[11px] text-[var(--muted)]",
						children: [
							formatDayTypeLabel(String(slot.dayType)),
							" · ",
							formatHourRange(slot.hour),
							" · ",
							formatPercent(slot.occupancyAvg)
						]
					}, `h-${slot.dayType}-${slot.hour}`))]
				}), /* @__PURE__ */ jsxs("div", {
					className: "ui-surface-block",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: "Mas facil devolver"
					}), data.lowOccupancySlots.map((slot) => /* @__PURE__ */ jsxs("p", {
						className: "mt-1 text-[11px] text-[var(--muted)]",
						children: [
							formatDayTypeLabel(String(slot.dayType)),
							" · ",
							formatHourRange(slot.hour),
							" · ",
							formatPercent(slot.occupancyAvg)
						]
					}, `l-${slot.dayType}-${slot.hour}`))]
				})]
			})]
		}) : null,
		relatedStations.length > 0 ? /* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Estaciones relacionadas"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: relatedStations.map((related) => /* @__PURE__ */ jsxs("a", {
					className: "ui-metric-card block",
					href: appRoutes.stationDetail(related.station.id),
					children: [/* @__PURE__ */ jsx("p", {
						className: "font-semibold text-[var(--foreground)]",
						children: related.station.name
					}), /* @__PURE__ */ jsxs("p", {
						className: "mt-1 text-xs text-[var(--muted)]",
						children: [
							related.station.bikesAvailable,
							" bicis · ",
							related.station.anchorsFree,
							" huecos"
						]
					})]
				}, related.station.id))
			})]
		}) : null
	] });
}
//#endregion
export { StationPage as component };

//# sourceMappingURL=_stationId-CMzCRc2g.js.map