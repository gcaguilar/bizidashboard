import { t as PageShell } from "./page-shell-DP1spWfk.js";
import { f as getSiteUrl, r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as PublicSectionNav } from "./PublicSectionNav-Yd_6xRYh.js";
import { n as SiteBreadcrumbs } from "./createSsrRpc-BFE1gq-C.js";
import { n as createRootBreadcrumbs } from "./breadcrumbs-tXG_cMah.js";
import { t as buildItemListStructuredData } from "./structured-data-Dle5VHpv.js";
import { r as formatDecimal } from "./format-DRxgyIYB.js";
import { t as Route } from "./_districtSlug-C5C-C-D2.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/barrios/$districtSlug.tsx?tsr-split=component
function DistrictPage() {
	const { district, districts } = Route.useLoaderData();
	const { districtSlug } = Route.useParams();
	if (!district) {
		const label = districtSlug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
		return /* @__PURE__ */ jsxs(PageShell, { children: [/* @__PURE__ */ jsx(PublicSectionNav, {
			activeItemId: "explore",
			className: "mt-1"
		}), /* @__PURE__ */ jsxs("section", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
					children: "Ficha de barrio"
				}),
				/* @__PURE__ */ jsxs("h1", {
					className: "mt-2 text-3xl font-black text-[var(--foreground)]",
					children: ["Bizi en ", label]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-[var(--muted)]",
					children: "No hay cobertura suficiente para esta ficha publica."
				}),
				/* @__PURE__ */ jsx("a", {
					className: "ui-inline-action mt-4",
					href: appRoutes.districtLanding(),
					children: "Ver comparativa de barrios"
				})
			]
		})] });
	}
	const siblings = districts.filter((row) => row.slug !== district.slug).slice(0, 4);
	const cityAverageTurnover = districts.length > 0 ? districts.reduce((sum, row) => sum + row.avgTurnover, 0) / districts.length : 0;
	const cityAverageAvailabilityRisk = districts.length > 0 ? districts.reduce((sum, row) => sum + row.avgAvailabilityRisk, 0) / districts.length : 0;
	const siteUrl = getSiteUrl();
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [{
			"@type": "WebPage",
			name: `${district.name}: uso de Bizi, estaciones y actividad en Zaragoza`,
			description: `Analiza el uso de Bizi en ${district.name}, descubre sus estaciones mas activas y compara la actividad del barrio con Zaragoza.`,
			url: `${siteUrl}${appRoutes.districtDetail(district.slug)}`,
			inLanguage: "es"
		}, buildItemListStructuredData("Estaciones destacadas", district.topStations.map((station) => ({
			name: station.stationName,
			url: `${siteUrl}${appRoutes.stationDetail(station.stationId)}`
		})))]
	};
	const breadcrumbs = createRootBreadcrumbs({
		label: "Barrios",
		href: appRoutes.districtLanding()
	}, {
		label: district.name,
		href: appRoutes.districtDetail(district.slug)
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
			activeItemId: "explore",
			className: "mt-1"
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
					children: "Ficha publica de barrio"
				}),
				/* @__PURE__ */ jsxs("h1", {
					className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
					children: ["Bizi en ", district.name]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-[var(--muted)] md:text-base",
					children: "Estaciones, bicis visibles y actividad agregada del barrio."
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
						children: "Estaciones"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: district.stationCount
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Bicis"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: district.bikesAvailable
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Huecos"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: district.anchorsFree
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Rotacion media"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: formatDecimal(district.avgTurnover)
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
					children: "Lectura del barrio"
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]",
					children: [/* @__PURE__ */ jsxs("p", { children: [
						district.name,
						" concentra ",
						district.stationCount,
						" estaciones Bizi con ",
						district.bikesAvailable,
						" bicis visibles y ",
						district.anchorsFree,
						" anclajes libres en este momento."
					] }), /* @__PURE__ */ jsxs("p", { children: [
						"Su rotacion media es ",
						formatDecimal(district.avgTurnover),
						" frente a ",
						formatDecimal(cityAverageTurnover),
						" de media en los barrios con cobertura. El riesgo medio de disponibilidad es ",
						formatDecimal(district.avgAvailabilityRisk),
						" frente a ",
						formatDecimal(cityAverageAvailabilityRisk),
						"."
					] })]
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black text-[var(--foreground)]",
						children: "Como usar esta ficha"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-4 text-sm leading-6 text-[var(--muted)]",
						children: "Empieza por las estaciones destacadas si necesitas disponibilidad concreta. Usa la comparativa de barrios si quieres entender zonas con mas actividad o posibles cuellos de botella."
					}),
					/* @__PURE__ */ jsx("a", {
						className: "ui-inline-action mt-4",
						href: appRoutes.dashboardView("research"),
						children: "Abrir analisis del dashboard"
					})
				]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Estaciones destacadas"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: district.topStations.map((station) => /* @__PURE__ */ jsxs("a", {
					className: "ui-metric-card block",
					href: appRoutes.stationDetail(station.stationId),
					children: [/* @__PURE__ */ jsx("p", {
						className: "font-semibold text-[var(--foreground)]",
						children: station.stationName
					}), /* @__PURE__ */ jsxs("p", {
						className: "mt-1 text-xs text-[var(--muted)]",
						children: [
							station.bikesAvailable,
							" bicis · ",
							station.anchorsFree,
							" huecos"
						]
					})]
				}, station.stationId))
			})]
		}),
		siblings.length > 0 ? /* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Otros barrios"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: siblings.map((sibling) => /* @__PURE__ */ jsx("a", {
					className: "ui-inline-action",
					href: appRoutes.districtDetail(sibling.slug),
					children: sibling.name
				}, sibling.slug))
			})]
		}) : null,
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Rutas relacionadas"
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-3 md:grid-cols-3",
				children: [
					/* @__PURE__ */ jsxs("a", {
						className: "ui-surface-block ui-surface-block-interactive",
						href: appRoutes.districtLanding(),
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Comparativa de barrios"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Vuelve al hub territorial para comparar zonas."
						})]
					}),
					/* @__PURE__ */ jsxs("a", {
						className: "ui-surface-block ui-surface-block-interactive",
						href: appRoutes.utilityLanding(),
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Mapa y estaciones"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Salta a una lectura mas practica de disponibilidad."
						})]
					}),
					/* @__PURE__ */ jsxs("a", {
						className: "ui-surface-block ui-surface-block-interactive",
						href: appRoutes.insightsLanding(),
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Estadisticas"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Continua con rankings e informes mensuales."
						})]
					})
				]
			})]
		})
	] });
}
//#endregion
export { DistrictPage as component };

//# sourceMappingURL=_districtSlug-6YJAlEz2.js.map