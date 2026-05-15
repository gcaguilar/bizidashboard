import { t as PageShell } from "./page-shell-DP1spWfk.js";
import { f as getSiteUrl, r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as PublicSectionNav } from "./PublicSectionNav-Yd_6xRYh.js";
import { n as SiteBreadcrumbs } from "./createSsrRpc-BFE1gq-C.js";
import { n as createRootBreadcrumbs } from "./breadcrumbs-tXG_cMah.js";
import { t as buildItemListStructuredData } from "./structured-data-Dle5VHpv.js";
import { o as formatPercent } from "./format-DRxgyIYB.js";
import { t as Route } from "./mapa-estaciones-bizi-zaragoza-NnNO1bIa.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/mapa-estaciones-bizi-zaragoza.tsx?tsr-split=component
var FAQ_ITEMS = [
	{
		question: "Donde ver que estacion tiene bicis ahora mismo?",
		answer: "En esta landing tienes accesos al mapa en vivo y a fichas publicas de estacion con disponibilidad actual, ocupacion y contexto historico reciente."
	},
	{
		question: "Puedo encontrar una estacion cercana antes de abrir el dashboard?",
		answer: "Si. Las estaciones destacadas enlazan a su ficha publica y desde ahi puedes bajar al detalle operativo completo o seguir navegando por barrio."
	},
	{
		question: "Que hago si busco una lectura rapida y no un analisis completo?",
		answer: "Lo mas util es abrir el dashboard en vista resumen o la ficha publica de una estacion concreta. Si buscas contexto adicional, usa despues el hub de barrios o el archivo mensual."
	}
];
function UtilityLandingPage() {
	const landingData = Route.useLoaderData();
	const siteUrl = getSiteUrl();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Mapa y estaciones Bizi Zaragoza",
		href: appRoutes.utilityLanding()
	});
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "CollectionPage",
				name: "Mapa y estaciones Bizi Zaragoza en tiempo real",
				description: "Landing de utilidad inmediata para encontrar estaciones, revisar disponibilidad y saltar al dashboard en vivo.",
				url: `${siteUrl}${appRoutes.utilityLanding()}`,
				inLanguage: "es"
			},
			{
				"@type": "FAQPage",
				mainEntity: FAQ_ITEMS.map((item) => ({
					"@type": "Question",
					name: item.question,
					acceptedAnswer: {
						"@type": "Answer",
						text: item.answer
					}
				}))
			},
			buildItemListStructuredData("Estaciones destacadas para empezar", landingData.featuredStations.map((station) => ({
				name: station.station.name,
				url: `${siteUrl}${appRoutes.stationDetail(station.station.id)}`
			})))
		]
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
								children: "Landing de utilidad inmediata"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Mapa y estaciones Bizi Zaragoza en tiempo real"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Encuentra estaciones, comprueba bicis o anclajes libres y salta al dashboard en vivo o a fichas publicas por estacion."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [landingData.stationRows.length, " estaciones publicas"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [landingData.bikesAvailable, " bicis visibles"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [landingData.districtRows.length, " barrios conectados"]
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3",
					children: [/* @__PURE__ */ jsx("a", {
						className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
						href: appRoutes.dashboardView("overview"),
						children: "Abrir dashboard en vista resumen"
					}), /* @__PURE__ */ jsx("a", {
						className: "ui-inline-action",
						href: appRoutes.seoPage("uso-bizi-por-estacion"),
						children: "Explorar estaciones"
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 xl:grid-cols-3",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Paso 1"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Localiza la zona"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Usa el mapa o entra por barrio si ya sabes en que parte de Zaragoza te vas a mover."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Paso 2"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Revisa disponibilidad"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Cada ficha publica muestra bicis, anclajes libres, ocupacion y comparacion frente a la media."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Paso 3"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Baja al detalle operativo"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Salta al dashboard para ver alertas, mapas y patrones completos."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Estaciones destacadas para empezar"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: landingData.featuredStations.map((row) => /* @__PURE__ */ jsxs("a", {
					className: "ui-metric-card block",
					href: appRoutes.stationDetail(row.station.id),
					children: [/* @__PURE__ */ jsx("p", {
						className: "font-semibold text-[var(--foreground)]",
						children: row.station.name
					}), /* @__PURE__ */ jsxs("p", {
						className: "mt-1 text-xs text-[var(--muted)]",
						children: [
							row.station.bikesAvailable,
							" bicis · ocupacion ",
							formatPercent(row.currentOccupancy)
						]
					})]
				}, row.station.id))
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Preguntas habituales"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-2 grid gap-3 md:grid-cols-3",
				children: FAQ_ITEMS.map((item) => /* @__PURE__ */ jsxs("article", {
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
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Mas rutas utiles"
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ jsxs("a", {
						className: "ui-surface-block ui-surface-block-interactive",
						href: appRoutes.districtLanding(),
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Barrios de Zaragoza"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Entra por zona si tu decision depende mas del barrio que de una estacion concreta."
						})]
					}),
					/* @__PURE__ */ jsxs("a", {
						className: "ui-surface-block ui-surface-block-interactive",
						href: appRoutes.status(),
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Estado del sistema"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Verifica cobertura y frescura del dato si notas huecos o lecturas parciales."
						})]
					}),
					/* @__PURE__ */ jsxs("a", {
						className: "ui-surface-block ui-surface-block-interactive",
						href: appRoutes.biciradar(),
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "BiciRadar"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "App movil para seguir disponibilidad y accesos desde el telefono."
						})]
					}),
					/* @__PURE__ */ jsxs("a", {
						className: "ui-surface-block ui-surface-block-interactive",
						href: appRoutes.insightsLanding(),
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Ir a estadisticas"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Cambia a una lectura de ranking, barrios e informes."
						})]
					})
				]
			})]
		})
	] });
}
//#endregion
export { UtilityLandingPage as component };

//# sourceMappingURL=mapa-estaciones-bizi-zaragoza-wTFFGojo.js.map