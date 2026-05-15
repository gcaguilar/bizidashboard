import { t as PageShell } from "./page-shell-DP1spWfk.js";
import { t as TrackedLink } from "./TrackedLink-dteSAIPr.js";
import { f as getSiteUrl, i as toAbsoluteRouteUrl, r as appRoutes, s as SITE_NAME } from "./routes-CFkMZBCM.js";
import { t as PublicSectionNav } from "./PublicSectionNav-Yd_6xRYh.js";
import { n as PublicPageViewTracker } from "./seo-landing-B2aSZAh2.js";
import { n as SiteBreadcrumbs } from "./createSsrRpc-BFE1gq-C.js";
import { n as createRootBreadcrumbs, t as buildBreadcrumbStructuredData } from "./breadcrumbs-tXG_cMah.js";
import { t as buildItemListStructuredData } from "./structured-data-Dle5VHpv.js";
import { a as Badge, t as Card } from "./card-BX20N-Ev.js";
import { n as PRIMARY_SEO_PAGE_SLUGS, r as getSeoPageConfig } from "./seo-pages-CSbrZ8Z4.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/app/_seo/SeoLandingPageComponent.tsx
function buildSeoFaqStructuredData(config) {
	return {
		"@type": "FAQPage",
		mainEntity: [
			{
				"@type": "Question",
				name: `Que ofrece la pagina ${config.title}?`,
				acceptedAnswer: {
					"@type": "Answer",
					text: config.description
				}
			},
			{
				"@type": "Question",
				name: "Cada cuanto se actualiza esta informacion?",
				acceptedAnswer: {
					"@type": "Answer",
					text: `${config.cadenceLabel}. La fecha visible en la pagina indica la ultima actualizacion publicada.`
				}
			},
			{
				"@type": "Question",
				name: "Donde puedo ver el detalle operativo completo?",
				acceptedAnswer: {
					"@type": "Answer",
					text: `Desde esta landing puedes abrir ${config.primaryCta.label.toLowerCase()} para consultar el detalle en tiempo real.`
				}
			}
		]
	};
}
function resolveSeoLandingDestinationRole(href) {
	if (href.startsWith("/dashboard")) return "dashboard";
	if (href === appRoutes.developers() || href === appRoutes.methodology() || href === appRoutes.status()) return "utility";
	return "hub";
}
function resolveSeoLandingDestination(href) {
	if (href.startsWith("/dashboard")) return "dashboard_view";
	if (href.startsWith("/estaciones/")) return "station_detail";
	if (href.startsWith("/barrios/")) return "district_detail";
	if (href.startsWith("/informes/")) return "monthly_report";
	return href === appRoutes.reports() ? "report_archive" : "seo_or_hub";
}
function resolveSeoLandingTransitionKind(href) {
	return href.startsWith("/dashboard") ? "to_dashboard" : "within_public";
}
function SeoLandingPageComponent({ slug, config, content, indexability }) {
	const siteUrl = getSiteUrl();
	const canonicalPath = indexability.canonicalPath;
	const breadcrumbs = createRootBreadcrumbs({
		label: config.title,
		href: canonicalPath
	});
	const relatedPages = PRIMARY_SEO_PAGE_SLUGS.filter((pageSlug) => pageSlug !== slug).slice(0, 4).map((pageSlug) => getSeoPageConfig(pageSlug));
	const itemListEntries = content.sectionItems.filter((item) => typeof item.href === "string").map((item) => ({
		name: item.title,
		url: toAbsoluteRouteUrl(item.href)
	}));
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			buildBreadcrumbStructuredData(breadcrumbs),
			{
				"@type": "CollectionPage",
				name: config.title,
				description: config.description,
				inLanguage: "es",
				url: toAbsoluteRouteUrl(canonicalPath),
				dateModified: content.generatedAt,
				publisher: {
					"@type": "Organization",
					name: SITE_NAME,
					url: siteUrl
				}
			},
			...itemListEntries.length > 0 ? [buildItemListStructuredData(content.sectionTitle, itemListEntries)] : [],
			buildSeoFaqStructuredData(config)
		]
	};
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(PublicPageViewTracker, {
			pageType: "seo_hub",
			template: "seo_landing",
			pageSlug: slug
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
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
								children: config.heroKicker
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: config.title
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: content.summary
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [/* @__PURE__ */ jsx("span", {
							className: "ui-chip",
							children: config.cadenceLabel
						}), /* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: ["Actualizado ", new Date(content.generatedAt).toLocaleDateString("es-ES")]
						})]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3",
					children: [/* @__PURE__ */ jsx(TrackedLink, {
						href: config.primaryCta.href,
						ctaEvent: {
							source: "seo_landing_hero",
							ctaId: "seo_primary",
							destination: config.primaryCta.destination,
							sourceRole: config.pageRole === "HUB" ? "hub" : "entry_seo",
							destinationRole: config.primaryCta.destination.startsWith("dashboard_") ? "dashboard" : "hub",
							transitionKind: config.primaryCta.destination.startsWith("dashboard_") ? "to_dashboard" : "within_public"
						},
						className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
						children: config.primaryCta.label
					}), /* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.reports(),
						ctaEvent: {
							source: "seo_landing_hero",
							ctaId: "report_open",
							destination: "report_archive",
							entityType: "report",
							sourceRole: config.pageRole === "HUB" ? "hub" : "entry_seo",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "ui-inline-action",
						children: "Abrir archivo mensual"
					})]
				})
			]
		}),
		content.emptyReason ? /* @__PURE__ */ jsxs("section", {
			className: "rounded-2xl border border-amber-500/30 bg-amber-500/12 px-4 py-3 text-sm text-amber-100 shadow-[var(--shadow-soft)]",
			children: [/* @__PURE__ */ jsx("p", {
				className: "font-semibold",
				children: "Cobertura parcial"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-xs text-amber-100/80",
				children: content.emptyReason
			})]
		}) : null,
		/* @__PURE__ */ jsx("section", {
			className: "grid gap-4 md:grid-cols-3",
			children: content.stats.map((stat) => /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: stat.label
					}),
					/* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: stat.value
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--muted)]",
						children: stat.detail
					})
				]
			}, stat.label))
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: content.sectionTitle
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: "Vista enlazable con acceso rapido al dashboard y a las fichas publicas relacionadas."
				})] })
			}), content.sectionItems.length > 0 ? /* @__PURE__ */ jsx("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2",
				children: content.sectionItems.map((item) => {
					const body = /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: item.title
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: item.detail
						})]
					}), item.badge ? /* @__PURE__ */ jsx(Badge, {
						className: "px-3 py-1 text-xs font-bold normal-case tracking-normal",
						children: item.badge
					}) : null] });
					if (!item.href) return /* @__PURE__ */ jsx(Card, {
						variant: "stat",
						className: "flex-row items-center justify-between gap-3 px-4 py-3",
						children: body
					}, `${item.title}-${item.badge ?? "static"}`);
					return /* @__PURE__ */ jsx(TrackedLink, {
						href: item.href,
						navigationEvent: {
							source: "seo_landing_items",
							destination: resolveSeoLandingDestination(item.href),
							sourceRole: config.pageRole === "HUB" ? "hub" : "entry_seo",
							destinationRole: resolveSeoLandingDestinationRole(item.href),
							transitionKind: resolveSeoLandingTransitionKind(item.href)
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsx(Card, {
							variant: "stat",
							className: "flex-row items-center justify-between gap-3 px-4 py-3 transition-colors group-hover:border-[var(--primary)]/40",
							children: body
						})
					}, `${item.title}-${item.href}`);
				})
			}) : /* @__PURE__ */ jsx("p", {
				className: "mt-2 text-sm text-[var(--muted)]",
				children: "Esta landing quedara automaticamente poblada cuando el dataset tenga cobertura suficiente."
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Rutas relacionadas"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4",
				children: relatedPages.map((page) => /* @__PURE__ */ jsx(TrackedLink, {
					href: appRoutes.seoPage(page.slug),
					navigationEvent: {
						source: "seo_landing_related",
						destination: page.slug,
						sourceRole: config.pageRole === "HUB" ? "hub" : "entry_seo",
						destinationRole: page.pageRole === "HUB" ? "hub" : "entry_seo",
						transitionKind: "within_public"
					},
					className: "group block transition hover:-translate-y-0.5",
					children: /* @__PURE__ */ jsxs(Card, {
						variant: "stat",
						className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: page.title
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: page.description
						})]
					})
				}, page.slug))
			})]
		})
	] });
}
//#endregion
export { SeoLandingPageComponent as t };

//# sourceMappingURL=SeoLandingPageComponent-DMG_PIqe.js.map