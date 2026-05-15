import { t as PageShell } from "./page-shell-DP1spWfk.js";
import { f as getSiteUrl, r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as PublicSectionNav } from "./PublicSectionNav-Yd_6xRYh.js";
import { n as SiteBreadcrumbs } from "./createSsrRpc-BFE1gq-C.js";
import { n as createRootBreadcrumbs } from "./breadcrumbs-tXG_cMah.js";
import { t as buildItemListStructuredData } from "./structured-data-Dle5VHpv.js";
import { r as formatDecimal } from "./format-DRxgyIYB.js";
import { t as formatMonthLabel } from "./months-CotCm8RF.js";
import { t as Route } from "./estadisticas-bizi-zaragoza-CqBFCxVo.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/estadisticas-bizi-zaragoza.tsx?tsr-split=component
function InsightsLandingPage() {
	const landingData = Route.useLoaderData();
	const topDistrict = landingData.districtRows[0] ?? null;
	const siteUrl = getSiteUrl();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Estadisticas Bizi Zaragoza",
		href: appRoutes.insightsLanding()
	});
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [{
			"@type": "CollectionPage",
			name: "Estadisticas y ranking de Bizi Zaragoza",
			description: "Landing de descubrimiento con rankings, barrios, informes y rutas relacionadas de Bizi Zaragoza.",
			url: `${siteUrl}${appRoutes.insightsLanding()}`,
			inLanguage: "es"
		}, buildItemListStructuredData("Empieza por aqui", [
			...landingData.latestMonth ? [{
				name: `Ultimo informe ${formatMonthLabel(landingData.latestMonth)}`,
				url: `${siteUrl}${appRoutes.reportMonth(landingData.latestMonth)}`
			}] : [],
			{
				name: "Barrios",
				url: `${siteUrl}${appRoutes.districtLanding()}`
			},
			{
				name: "Horas punta",
				url: `${siteUrl}${appRoutes.seoPage("uso-bizi-por-hora")}`
			},
			{
				name: "API y datos abiertos",
				url: `${siteUrl}${appRoutes.developers()}`
			}
		])]
	};
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
				/* @__PURE__ */ jsx(PublicSectionNav, {
					activeItemId: "explore",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Landing de descubrimiento"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Estadisticas y ranking de Bizi Zaragoza"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Rankings, barrios, informes mensuales y fichas publicas de estacion para entender mejor el sistema."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [landingData.stationRows.length, " estaciones indexables"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [landingData.districtRows.length, " barrios con cobertura"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [landingData.publishedMonths.length, " meses publicados"]
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3",
					children: [landingData.latestMonth ? /* @__PURE__ */ jsx("a", {
						className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
						href: appRoutes.reportMonth(landingData.latestMonth),
						children: "Abrir ultimo informe mensual"
					}) : null, /* @__PURE__ */ jsx("a", {
						className: "ui-inline-action",
						href: appRoutes.seoPage("ranking-estaciones-bizi"),
						children: "Ver ranking de estaciones"
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-3",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Ultimo mes publicado"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: landingData.latestMonth ? formatMonthLabel(landingData.latestMonth) : "Sin datos"
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Barrio destacado"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: topDistrict?.name ?? "Sin datos"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: topDistrict ? `${formatDecimal(topDistrict.avgTurnover)} pts medios en ${topDistrict.stationCount} estaciones.` : "Esperando cobertura territorial suficiente."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Bicis visibles"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: landingData.bikesAvailable
					})]
				})
			]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "ui-section-card",
			children: /* @__PURE__ */ jsxs("div", {
				className: "max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Que puedes descubrir aqui"
					}), /* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black leading-tight text-[var(--foreground)]",
						children: "Una ruta de entrada para entender el sistema sin perderte"
					})] }),
					/* @__PURE__ */ jsx("p", { children: "Si buscas una lectura rapida de como se mueve Bizi Zaragoza, aqui tienes el hilo logico: empezar por el ultimo informe o el ranking de estaciones, bajar despues a los barrios con mas actividad y terminar en las fichas publicas de estacion." }),
					/* @__PURE__ */ jsx("p", { children: "Esta estructura evita crear paginas debiles y concentra autoridad en pocos hubs utiles. Tambien deja un recorrido claro para campanas: trafico frio a esta landing, CTA al informe o al ranking y navegacion interna hacia barrios y estaciones." })
				]
			})
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Empieza por aqui"
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx("a", {
						className: "ui-metric-card block",
						href: appRoutes.districtLanding(),
						children: "Barrios de Zaragoza"
					}),
					/* @__PURE__ */ jsx("a", {
						className: "ui-metric-card block",
						href: appRoutes.seoPage("uso-bizi-por-hora"),
						children: "Horas punta"
					}),
					/* @__PURE__ */ jsx("a", {
						className: "ui-metric-card block",
						href: appRoutes.developers(),
						children: "API y datos abiertos"
					}),
					landingData.latestMonth ? /* @__PURE__ */ jsxs("a", {
						className: "ui-metric-card block",
						href: appRoutes.reportMonth(landingData.latestMonth),
						children: ["Ultimo informe ", formatMonthLabel(landingData.latestMonth)]
					}) : null
				]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Estaciones para seguir"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4",
				children: landingData.featuredStations.map((station) => /* @__PURE__ */ jsxs("a", {
					className: "ui-surface-block ui-surface-block-interactive",
					href: appRoutes.stationDetail(station.station.id),
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: station.station.name
					}), /* @__PURE__ */ jsxs("p", {
						className: "mt-1 text-[11px] text-[var(--muted)]",
						children: [
							station.districtName ?? "Zaragoza",
							" · rotacion ",
							formatDecimal(station.turnover?.turnoverScore ?? null)
						]
					})]
				}, station.station.id))
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Siguiente paso segun tu objetivo"
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2",
				children: [/* @__PURE__ */ jsxs("a", {
					className: "ui-surface-block ui-surface-block-interactive",
					href: appRoutes.utilityLanding(),
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: "Quiero resolver algo practico"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-[11px] text-[var(--muted)]",
						children: "Pasa a la landing de utilidad inmediata para ver mapa, disponibilidad y accesos rapidos."
					})]
				}), /* @__PURE__ */ jsxs("a", {
					className: "ui-surface-block ui-surface-block-interactive",
					href: appRoutes.dashboardConclusions(),
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: "Quiero ir al detalle operativo"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-[11px] text-[var(--muted)]",
						children: "Abre conclusiones del dashboard si ya necesitas metricas y lectura tactica."
					})]
				})]
			})]
		})
	] });
}
//#endregion
export { InsightsLandingPage as component };

//# sourceMappingURL=estadisticas-bizi-zaragoza-CXiTYzR1.js.map