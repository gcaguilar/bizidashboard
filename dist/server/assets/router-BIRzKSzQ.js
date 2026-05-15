import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { t as PageShell } from "./page-shell-DP1spWfk.js";
import { a as buildExportClickEvent, d as buildSearchSubmitEvent, f as resolveRouteKeyFromPathname, i as buildEntitySelectEvent, l as buildPanelOpenEvent, o as buildFilterChangeEvent, p as trackUmamiEvent, t as buildCtaClickEvent } from "./umami-BYNhNb0r.js";
import { t as TrackedLink } from "./TrackedLink-dteSAIPr.js";
import { i as AccordionTrigger, n as AccordionContent, r as AccordionItem, t as Accordion } from "./accordion-Cl6-ndDy.js";
import { a as SEO_SITE_DESCRIPTION, d as getRobotsSitemapUrl, f as getSiteUrl, l as getCityName, n as INDEXABLE_PUBLIC_ROUTE_REGISTRY, o as SEO_SITE_TITLE, p as isFallbackSiteUrl, r as appRoutes, s as SITE_NAME, u as getRobotsBaseUrl } from "./routes-CFkMZBCM.js";
import "./public-navigation-7kjot5UZ.js";
import { t as PublicSectionNav } from "./PublicSectionNav-Yd_6xRYh.js";
import { n as PublicPageViewTracker } from "./seo-landing-B2aSZAh2.js";
import { n as SiteBreadcrumbs, t as createSsrRpc } from "./createSsrRpc-BFE1gq-C.js";
import { n as createRootBreadcrumbs, t as buildBreadcrumbStructuredData } from "./breadcrumbs-tXG_cMah.js";
import { t as buildItemListStructuredData } from "./structured-data-Dle5VHpv.js";
import { a as Badge, i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-BX20N-Ev.js";
import { n as PRIMARY_SEO_PAGE_SLUGS, r as getSeoPageConfig, t as EXPLORE_PAGE_NAV_CONFIG } from "./seo-pages-CSbrZ8Z4.js";
import { t as Route$46 } from "./barrios-bizi-zaragoza-DrmqW1sH.js";
import { a as formatInteger, n as formatAlertType, o as formatPercent } from "./format-DRxgyIYB.js";
import { t as Route$47 } from "./_districtSlug-C5C-C-D2.js";
import { n as buttonVariants, t as Button } from "./button-Bgvi3bSh.js";
import { a as isRecord, c as tryParseJson, i as isDistrictCollection, n as buildStationDistrictMap, r as fetchDistrictCollection } from "./districts-DMcc_jOx.js";
import { i as updateExecutionContext, n as resolveRequestId, r as runWithExecutionContext, t as getExecutionContext } from "./request-context-Dvwx1ba4.js";
import { n as captureWarningWithContext, t as captureExceptionWithContext } from "./sentry-reporting-6fzVQr1k.js";
import { a as getApiVersionLabel, c as getHealthLabel, d as getPipelineLagLabel, f as openApiDocument, i as formatStatusNumber, l as getHealthToneClasses, o as getCoverageLabel, r as formatStatusDateTime, s as getDatasetVersionLabel, u as getObservedCadenceLabel } from "./system-status-BnLkTU-r.js";
import { t as TIMEZONE } from "./timezone-DIvdn6H4.js";
import { n as useAbortableAsyncEffect, t as fetchJson } from "./useAbortableAsyncEffect-afF5quzV.js";
import { n as getStationsDirectoryPageData, t as Route$48 } from "./_stationId-CsnBvrKI.js";
import { a as resolveHistoryDataState, c as resolveStationsDataState, l as resolveStatusDataState, o as resolveMobilityDataState, r as resolveDataState, s as resolveRankingsDataState, u as shouldShowDataStateNotice } from "./data-state-UX6jPIR_.js";
import { t as DataStateNotice } from "./DataStateNotice-Dzz1drH7.js";
import { c as GitHubRepoButton, d as Progress, f as FeedbackCta, i as MetricCard, l as DashboardRouteLinks, n as MeasuredResponsiveContainer, o as Skeleton, r as ChartWrapper, s as ThemeToggleButton, t as Route$49, u as PageHeaderCard } from "./dashboard-DxMM1V45.js";
import { a as ScrollArea, i as TrackedAnchor, o as DashboardPageViewTracker, s as Input, t as Alert } from "./alert-BmvSL5Kt.js";
import { a as TableHeader, c as SelectContent, d as SelectTrigger, f as SelectValue, i as TableHead, l as SelectIcon, n as TableBody, o as TableRow, r as TableCell, s as Select, t as Table, u as SelectItem } from "./table-Fvifybs5.js";
import { t as Route$50 } from "./_mode-B0gcr2RF.js";
import { t as Route$51 } from "./estaciones-con-mas-bicis-gE_V5IAc.js";
import { t as Route$52 } from "./estaciones-mas-usadas-zaragoza-DDPLWAHn.js";
import { t as Route$53 } from "./_stationId-dUmtbzTy.js";
import { o as toMonthOptions, r as isValidMonthKey, t as formatMonthLabel } from "./months-CotCm8RF.js";
import { t as Route$54 } from "./estadisticas-bizi-zaragoza-CqBFCxVo.js";
import { t as Route$55 } from "./informes-mensuales-bizi-zaragoza-6EsSiRvQ.js";
import { t as Route$56 } from "./informes._month-Dwp8Qz03.js";
import { t as Route$57 } from "./mapa-estaciones-bizi-zaragoza-NnNO1bIa.js";
import { t as Route$58 } from "./ranking-estaciones-bizi-B78zxsvX.js";
import { t as Route$59 } from "./redistribucion-bizi-zaragoza-B7Mwg6Qh.js";
import { t as Route$60 } from "./uso-bizi-por-estacion-DXLxILJC.js";
import { t as Route$61 } from "./uso-bizi-por-hora-oEKqxzeC.js";
import { t as Route$62 } from "./viajes-por-dia-zaragoza-CNizEBSd.js";
import { t as Route$63 } from "./viajes-por-mes-zaragoza-B0AasQh_.js";
import { f as sql, i as getRedisClient, l as empty, n as setCachedJson, o as getCity, r as withCache, s as prisma, t as getCachedJson, u as join } from "./cache-CQ9JHJ0b.js";
import { i as getHeatmap, l as getStationRankings, s as getStationPatterns, t as getActiveAlerts, u as getStationsWithLatestStatus } from "./read-BIJZag-j.js";
import { t as logger } from "./logger-9X1Y5g6X.js";
import { t as fetchDistrictCollection$1 } from "./districts.server-Qiyl6lhv.js";
import { d as attachPeakFullHours, f as buildDistrictSpotlight, m as enrichRankingRows, n as fetchAvailableDataMonths, p as buildPeakFullHoursByStation } from "./api-rZCrrrVI.js";
import { a as isApiKeyValid, c as rejectDisallowedMobileOrigin, d as getPublicApiKey, f as shouldRequireSignedMobileRequests, g as updateCollectionRun, h as createCollectionRun, i as buildMobileCorsHeaders, l as withApiRequest, m as recordCollection, n as getPipelineStatusSummary, o as readOpsApiKey, p as incrementValidationErrors, r as recordSecurityEvent, s as readPublicApiKey, t as getSharedDatasetSnapshot, u as getOpsApiKey, v as getHistoryMetadata } from "./shared-data-DRRoN2Of.js";
import { r as fetchCachedMonthlyDemandCurve } from "./analytics-series-CQItUK0n.js";
import { r as getDistrictSeoRows } from "./seo-districts-DZRBlyA9.js";
import { r as getStationPredictions } from "./predictions-Bb_NDCaZ.js";
import { n as getStationSeoRows } from "./seo-stations-DPR_2iTQ.js";
import { t as buildRebalancingReport } from "./rebalancing-report-BZDw2F4y.js";
import "./social-images-2AqYKdpA.js";
import { n as FAQ_ITEMS, r as FAQ_PRIORITY_IDS, t as CATEGORY_PRIORITY } from "./help-center-content-YBMHH1Sc.js";
import { n as fetchStationInformation, r as fetchStationStatus, t as fetchDiscovery } from "./gbfs-client-6LCuVJKJ.js";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeadContent, Link, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, notFound, redirect, useLocation, useRouter, useSearch } from "@tanstack/react-router";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import * as Sentry from "@sentry/tanstackstart-react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { TextEncoder as TextEncoder$1 } from "node:util";
import "node-cron";
import { createHmac, randomUUID as randomUUID$1, timingSafeEqual as timingSafeEqual$1 } from "crypto";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
//#region src/components/Footer.tsx
function Footer() {
	return /* @__PURE__ */ jsx("footer", {
		className: "border-t border-[var(--border)] bg-[var(--background)] py-6",
		children: /* @__PURE__ */ jsx("div", {
			className: "mx-auto max-w-7xl px-4 text-center text-sm text-[var(--muted)]",
			children: /* @__PURE__ */ jsx("p", { children: "DatosBizi - Panel de movilidad para sistemas de bicicletas publicas. Migrado a TanStack Start." })
		})
	});
}
//#endregion
//#region src/components/Header.tsx
function Header() {
	return /* @__PURE__ */ jsx("header", {
		className: "border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50",
		children: /* @__PURE__ */ jsx("div", {
			className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-3",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-6",
				children: [/* @__PURE__ */ jsx("a", {
					href: "/",
					className: "text-lg font-bold text-[var(--foreground)]",
					children: "DatosBizi"
				}), /* @__PURE__ */ jsxs("nav", {
					className: "hidden gap-4 text-sm md:flex",
					children: [
						/* @__PURE__ */ jsx("a", {
							href: "/dashboard",
							className: "text-[var(--muted)] hover:text-[var(--foreground)] transition",
							children: "Dashboard"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "/estado",
							className: "text-[var(--muted)] hover:text-[var(--foreground)] transition",
							children: "Estado"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "/developers",
							className: "text-[var(--muted)] hover:text-[var(--foreground)] transition",
							children: "Developers"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "/informes",
							className: "text-[var(--muted)] hover:text-[var(--foreground)] transition",
							children: "Informes"
						})
					]
				})]
			})
		})
	});
}
//#endregion
//#region src/styles.css?url
var styles_default = "/assets/styles-TfBHxrgl.css";
//#endregion
//#region src/app/__root.tsx
var THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;
var Route$45 = createRootRouteWithContext()({
	head: () => ({
		meta: [{ charSet: "utf-8" }, {
			name: "viewport",
			content: "width=device-width, initial-scale=1"
		}],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}],
		title: "DatosBizi"
	}),
	shellComponent: RootDocument
});
function RootDocument({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "es",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ jsxs("head", { children: [/* @__PURE__ */ jsx("script", { dangerouslySetInnerHTML: { __html: THEME_INIT_SCRIPT } }), /* @__PURE__ */ jsx(HeadContent, {})] }), /* @__PURE__ */ jsxs("body", {
			className: "font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]",
			children: [
				/* @__PURE__ */ jsx(Header, {}),
				children,
				/* @__PURE__ */ jsx(Footer, {}),
				/* @__PURE__ */ jsx(Scripts, {})
			]
		})]
	});
}
//#endregion
//#region src/app/sitemap[.]xml.ts
function escapeXml(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function dedupeEntries(entries) {
	const seen = /* @__PURE__ */ new Set();
	const uniqueEntries = [];
	for (const entry of entries) {
		if (seen.has(entry.href)) continue;
		seen.add(entry.href);
		uniqueEntries.push(entry);
	}
	return uniqueEntries;
}
async function buildSitemapXml() {
	const siteUrl = getRobotsBaseUrl();
	const lastModified = (/* @__PURE__ */ new Date()).toISOString();
	const [monthsResponse, monthlySeries, districts, stations] = await Promise.all([
		fetchAvailableDataMonths().catch(() => ({ months: [] })),
		fetchCachedMonthlyDemandCurve(36).catch(() => []),
		getDistrictSeoRows().catch(() => []),
		getStationSeoRows().catch(() => [])
	]);
	const validMonths = Array.from(new Set([...monthsResponse.months ?? [], ...monthlySeries.map((row) => row.monthKey)].filter(isValidMonthKey))).sort((left, right) => right.localeCompare(left, "es"));
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${dedupeEntries([
		...INDEXABLE_PUBLIC_ROUTE_REGISTRY.map((entry) => ({
			href: entry.href,
			lastModified,
			changeFrequency: entry.sitemap.changeFrequency,
			priority: entry.sitemap.priority
		})),
		{
			href: appRoutes.llms(),
			lastModified,
			changeFrequency: "daily",
			priority: .6
		},
		{
			href: appRoutes.llmsFull(),
			lastModified,
			changeFrequency: "daily",
			priority: .58
		},
		...PRIMARY_SEO_PAGE_SLUGS.map((slug) => ({
			href: appRoutes.seoPage(slug),
			lastModified,
			changeFrequency: slug === "estaciones-con-mas-bicis" ? "hourly" : "daily",
			priority: .72
		})),
		...validMonths.map((month) => ({
			href: appRoutes.reportMonth(month),
			lastModified,
			changeFrequency: "monthly",
			priority: .74
		})),
		...districts.filter((district) => district.stationCount > 0 && district.topStations.length > 0).map((district) => ({
			href: appRoutes.districtDetail(district.slug),
			lastModified,
			changeFrequency: "daily",
			priority: .68
		})),
		...stations.filter((station) => station.indexability.includeInSitemap).map((station) => ({
			href: appRoutes.stationDetail(station.station.id),
			lastModified: station.station.recordedAt ?? lastModified,
			changeFrequency: "hourly",
			priority: .66
		}))
	]).map((entry) => `  <url>
    <loc>${escapeXml(`${siteUrl}${entry.href}`)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
}
var Route$44 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async () => {
	try {
		const xml = await buildSitemapXml();
		return new Response(xml, {
			status: 200,
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
				"Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600"
			}
		});
	} catch (error) {
		console.error("[sitemap.xml] Error building sitemap:", error);
		return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`, {
			status: 200,
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
				"Cache-Control": "public, max-age=300"
			}
		});
	}
} } } });
//#endregion
//#region src/lib/robots-txt.ts
var CONTENT_SIGNAL_VALUE = "ai-train=no, search=yes, ai-input=no";
function buildRobotsTxt() {
	const host = getRobotsBaseUrl();
	const hasPublicHost = !isFallbackSiteUrl(host);
	const lines = [
		"User-agent: *",
		"Allow: /",
		"Disallow: /api/",
		`Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
		"",
		"User-agent: GPTBot",
		"Allow: /",
		"Disallow: /api/",
		`Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
		"",
		"User-agent: ChatGPT-User",
		"Allow: /",
		"Disallow: /api/",
		`Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
		"",
		"User-agent: ClaudeBot",
		"Allow: /",
		"Disallow: /api/",
		`Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
		"",
		"User-agent: PerplexityBot",
		"Allow: /",
		"Disallow: /api/",
		`Content-Signal: ${CONTENT_SIGNAL_VALUE}`
	];
	if (hasPublicHost) lines.push("", `Host: ${host}`, `Sitemap: ${getRobotsSitemapUrl()}`);
	return `${lines.join("\n")}\n`;
}
//#endregion
//#region src/app/robots[.]txt.ts
var Route$43 = createFileRoute("/robots.txt")({ server: { handlers: { GET: () => new Response(buildRobotsTxt(), {
	status: 200,
	headers: {
		"Content-Type": "text/plain; charset=utf-8",
		"Cache-Control": "public, max-age=3600, s-maxage=3600"
	}
}) } } });
//#endregion
//#region src/app/_components/PublicSearchForm.tsx
function PublicSearchForm({ className, placeholder = "Busca estaciones, barrios, informes o endpoints API", defaultQuery = "", buttonLabel = "Buscar", eventSource = "public_search" }) {
	const pathname = useLocation().pathname;
	return /* @__PURE__ */ jsxs("form", {
		action: appRoutes.explore(),
		method: "get",
		onSubmit: (event) => {
			const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
			trackUmamiEvent(buildSearchSubmitEvent({
				surface: "public",
				routeKey: resolveRouteKeyFromPathname(pathname),
				source: eventSource,
				queryLength: query.length
			}));
		},
		className: `flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3 ${className ?? ""}`.trim(),
		children: [/* @__PURE__ */ jsx("label", {
			htmlFor: "public-search",
			className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
			children: "Buscador global"
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap gap-2",
			children: [/* @__PURE__ */ jsx(Input, {
				id: "public-search",
				name: "q",
				type: "search",
				defaultValue: defaultQuery,
				placeholder,
				className: "min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
			}), /* @__PURE__ */ jsx(Button, {
				type: "submit",
				className: "inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
				children: buttonLabel
			})]
		})]
	});
}
//#endregion
//#region src/server-functions/metodologia.ts
var getMethodologyPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("c0c5da713c439bcbb02ef22c145b5ad04b5547afe2bc5c7f7abdfb47c772240c"));
//#endregion
//#region src/app/metodologia.tsx
var Route$42 = createFileRoute("/metodologia")({
	head: () => {
		const siteUrl = getSiteUrl();
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: "Entiende de donde salen los datos de Bizi Zaragoza, como se actualizan, que significan las metricas publicas y que limites conviene tener en cuenta al interpretar estaciones, barrios e informes."
				},
				{
					property: "og:title",
					content: "Metodologia y calidad de datos de Bizi Zaragoza"
				},
				{
					property: "og:description",
					content: "Entiende de donde salen los datos de Bizi Zaragoza, como se actualizan, que significan las metricas publicas y que limites conviene tener en cuenta al interpretar estaciones, barrios e informes."
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/metodologia`
				},
				{
					name: "robots",
					content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: "Metodologia y calidad de datos de Bizi Zaragoza"
				},
				{
					name: "twitter:description",
					content: "Entiende de donde salen los datos de Bizi Zaragoza, como se actualizan, que significan las metricas publicas y que limites conviene tener en cuenta al interpretar estaciones, barrios e informes."
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/metodologia`
			}],
			title: "Metodologia y calidad de datos de Bizi Zaragoza"
		};
	},
	loader: () => getMethodologyPageData(),
	component: MethodologyPage
});
function MethodologyPage() {
	const { historyMeta, dataset, status, months, latestMonth, breadcrumbs, faqItems, structuredData } = Route$42.useLoaderData();
	const cityName = getCityName();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(PublicPageViewTracker, {
			pageType: "methodology",
			template: "methodology_hub",
			pageSlug: "metodologia"
		}),
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
					activeItemId: "help",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Guia publica de confianza"
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: ["Metodologia y calidad de datos de Bizi ", cityName]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Esta pagina explica como se construyen las lecturas publicas de DatosBizi: de donde sale el dato base, con que frescura se actualiza, que metricas son estimadas y que limites conviene tener presentes antes de interpretar estaciones, barrios, rankings e informes."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [historyMeta.coverage.totalDays, " dias de cobertura"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [historyMeta.coverage.totalStations, " estaciones con historico"]
							}),
							/* @__PURE__ */ jsx("span", {
								className: `inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`,
								children: getHealthLabel(status.pipeline.healthStatus)
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [
							/* @__PURE__ */ jsx(TrackedAnchor, {
								href: historyMeta.source.gbfsDiscoveryUrl,
								target: "_blank",
								rel: "noopener noreferrer",
								ctaEvent: {
									source: "methodology_hero",
									ctaId: "dataset_source_open",
									destination: "gbfs_discovery",
									isExternal: true,
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
								children: "Ver feed GBFS oficial"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.developers(),
								ctaEvent: {
									source: "methodology_hero",
									ctaId: "api_open",
									destination: "developers",
									entityType: "api",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Abrir API y datos abiertos"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.status(),
								navigationEvent: {
									source: "methodology_hero",
									destination: "status",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver estado del sistema"
							})
						]
					}), /* @__PURE__ */ jsx(PublicSearchForm, { eventSource: "methodology" })]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Fuente primaria"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: historyMeta.source.provider
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Discovery GBFS consultado y validado de forma periodica."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura visible"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: getCoverageLabel(dataset)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Base compartida por informes, rankings y fichas publicas."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cadencia observada"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: getObservedCadenceLabel(status)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Lectura reciente del pipeline y de la frescura del sistema."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Versiones activas"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: [
								getDatasetVersionLabel(dataset),
								" · API v",
								getApiVersionLabel()
							]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: latestMonth ? `Ultimo informe publicado: ${formatMonthLabel(latestMonth)}.` : "Sin informe mensual publicado."
						})
					]
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
						children: "Como se construye la capa publica"
					}), /* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black leading-tight text-[var(--foreground)]",
						children: "Del feed oficial a paginas utiles y comparables"
					})] }),
					/* @__PURE__ */ jsxs("p", { children: [
						"El dato base llega desde el feed oficial GBFS de Bizi ",
						cityName,
						". A partir de ese origen se capturan snapshots de estaciones, se validan, se agregan y se reutilizan en varias capas: disponibilidad actual, historico agregado, rankings, hubs territoriales, informes mensuales y endpoints API."
					] }),
					/* @__PURE__ */ jsxs("p", { children: [
						"La ultima muestra util hoy es ",
						formatStatusDateTime(dataset.lastUpdated.lastSampleAt),
						" y el lag visible del pipeline es ",
						getPipelineLagLabel(status),
						". Cuando falta cobertura o la serie es parcial, la policy SEO desindexa las plantillas debiles en lugar de forzar contenido pobre. Ese criterio se aplica igual a estaciones, barrios, informes y landings."
					] })
				]
			})
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Snapshot actual"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Lo que ves ahora mismo"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Bicis disponibles, anclajes libres y capacidad describen el estado reciente de una estacion, no una media historica."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Historico agregado"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Lo que suele pasar"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Rotacion, horas problema, perfiles horarios y comparativas por barrio usan series acumuladas, no una sola foto puntual."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Demanda y movilidad"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Lecturas estimadas"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "La demanda publica es un indice de actividad y la movilidad es una estimacion agregada por zonas; ninguna de las dos equivale a viajes oficiales uno a uno."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Prediccion"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: "Orientacion, no garantia"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Las predicciones combinan patrones historicos y estado reciente para anticipar tensiones a corto plazo, pero no sustituyen la lectura real final."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "FAQs visibles"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Preguntas que mas cambian la interpretacion"
			})] }), /* @__PURE__ */ jsx("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2",
				children: faqItems.map((item) => /* @__PURE__ */ jsxs("article", {
					className: "ui-surface-block",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: item.question
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-[11px] leading-relaxed text-[var(--muted)]",
						children: item.answer
					})]
				}, item.id))
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Siguiente paso segun tu necesidad"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Rutas relacionadas"
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3",
				children: [
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.developers(),
						ctaEvent: {
							source: "methodology_related",
							ctaId: "api_open",
							destination: "developers",
							entityType: "api",
							sourceRole: "utility",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "API y datos abiertos"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "OpenAPI, CSV, versiones y trazabilidad del mismo dataset explicado aqui."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.status(),
						navigationEvent: {
							source: "methodology_related",
							destination: "status",
							sourceRole: "utility",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Estado y cobertura"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Comprueba frescura, incidencias, lag del pipeline y salud operativa antes de interpretar."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.reports(),
						ctaEvent: {
							source: "methodology_related",
							ctaId: "report_open",
							destination: "report_archive",
							entityType: "report",
							sourceRole: "utility",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Archivo mensual"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Usa el contexto metodologico para leer mejor los informes y sus insights por mes."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.seoPage("uso-bizi-por-estacion"),
						navigationEvent: {
							source: "methodology_related",
							destination: "station_hub",
							sourceRole: "utility",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Fichas de estacion"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Baja al detalle publico de disponibilidad, horas activas y comparacion con la ciudad."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.districtLanding(),
						navigationEvent: {
							source: "methodology_related",
							destination: "district_hub",
							sourceRole: "utility",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Barrios y contexto territorial"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Interpreta comparativas por barrio sabiendo que metricas son snapshot y cuales son agregadas."
						})]
					}),
					/* @__PURE__ */ jsxs(TrackedLink, {
						href: appRoutes.dashboardHelp(),
						navigationEvent: {
							source: "methodology_related",
							destination: "dashboard_help",
							sourceRole: "utility",
							destinationRole: "dashboard",
							transitionKind: "to_dashboard"
						},
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Ayuda completa del dashboard"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Si necesitas mas detalle operativo o FAQ extensa, entra en la ayuda interna del producto."
						})]
					})
				]
			})]
		})
	] });
}
//#endregion
//#region src/app/llms[.]txt.ts
function buildLlmsTxt() {
	const siteUrl = getSiteUrl();
	return [
		"# BiziDashboard",
		"",
		"> Public analytics dashboard for Bizi bike-sharing operations in Zaragoza.",
		"",
		"## Canonical Site",
		`- ${siteUrl}`,
		"",
		"## Primary Public Pages",
		`- ${siteUrl}${appRoutes.home()}`,
		`- ${siteUrl}${appRoutes.dashboard()}`,
		`- ${siteUrl}${appRoutes.seoPage("uso-bizi-por-estacion")}`,
		`- ${siteUrl}${appRoutes.districtLanding()}`,
		`- ${siteUrl}${appRoutes.reports()}`,
		`- ${siteUrl}${appRoutes.status()}`,
		`- ${siteUrl}${appRoutes.developers()}`,
		`- ${siteUrl}${appRoutes.methodology()}`,
		`- ${siteUrl}${appRoutes.utilityLanding()}`,
		`- ${siteUrl}${appRoutes.insightsLanding()}`,
		"",
		"## Public Tool Surfaces",
		`- ${siteUrl}${appRoutes.explore()}`,
		`- ${siteUrl}${appRoutes.compare()}`,
		"",
		"## Structured Discovery",
		`- ${siteUrl}/sitemap.xml`,
		`- ${siteUrl}${appRoutes.llmsFull()}`,
		`- ${siteUrl}${appRoutes.api.openApi()}`,
		"",
		"## Public API Endpoints",
		`- ${siteUrl}${appRoutes.api.status()}`,
		`- ${siteUrl}${appRoutes.api.stations()}`,
		`- ${siteUrl}${appRoutes.api.rankings()}`,
		`- ${siteUrl}${appRoutes.api.mobility()}`,
		`- ${siteUrl}${appRoutes.api.history()}`,
		`- ${siteUrl}${appRoutes.api.alertsHistory()}`,
		"",
		"## Notes for AI Assistants",
		"- Prioritize canonical routes without city-prefixed aliases.",
		"- Prefer data-backed pages over deprecated aliases or redirects.",
		"- For API usage, rely on OpenAPI as source of truth.",
		""
	].join("\n");
}
var Route$41 = createFileRoute("/llms.txt")({ server: { handlers: { GET: () => new Response(buildLlmsTxt(), {
	status: 200,
	headers: {
		"Content-Type": "text/plain; charset=utf-8",
		"Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
	}
}) } } });
//#endregion
//#region src/app/llms-full[.]txt.ts
function buildEndpointLines(siteUrl) {
	return Object.entries(openApiDocument.paths).filter(([path]) => path.startsWith("/api/") && path !== "/api/docs").flatMap(([path, operations]) => Object.entries(operations).map(([method, operation]) => {
		const summary = operation.summary ?? "API operation";
		return `- ${method.toUpperCase()} ${siteUrl}${path} - ${summary}`;
	})).sort((left, right) => left.localeCompare(right, "en"));
}
function buildLlmsFullTxt() {
	const siteUrl = getSiteUrl();
	const seoLandingLines = PRIMARY_SEO_PAGE_SLUGS.map((slug) => {
		const page = getSeoPageConfig(slug);
		return `- ${siteUrl}${appRoutes.seoPage(slug)} - ${page.title}`;
	});
	const endpointLines = buildEndpointLines(siteUrl);
	return [
		"# BiziDashboard LLM Full Index",
		"",
		`- Canonical: ${siteUrl}`,
		`- Default language: es-ES`,
		"",
		"## Machine-readable discovery",
		`- ${siteUrl}/sitemap.xml`,
		`- ${siteUrl}${appRoutes.llms()}`,
		`- ${siteUrl}${appRoutes.api.openApi()}`,
		"",
		"## Core public pages",
		`- ${siteUrl}${appRoutes.home()} - Homepage`,
		`- ${siteUrl}${appRoutes.dashboard()} - Real-time operations dashboard`,
		`- ${siteUrl}${appRoutes.seoPage("uso-bizi-por-estacion")} - Public station hub`,
		`- ${siteUrl}${appRoutes.districtLanding()} - District and neighborhood hub`,
		`- ${siteUrl}${appRoutes.reports()} - Monthly reports`,
		`- ${siteUrl}${appRoutes.status()} - Data freshness and health`,
		`- ${siteUrl}${appRoutes.developers()} - API and integration docs`,
		`- ${siteUrl}${appRoutes.methodology()} - Methodology and data quality guide`,
		`- ${siteUrl}${appRoutes.utilityLanding()} - Utility landing for map and live station access`,
		`- ${siteUrl}${appRoutes.insightsLanding()} - Insight landing for rankings, districts and reports`,
		"",
		"## Public product tools",
		`- ${siteUrl}${appRoutes.explore()} - Public explore hub`,
		`- ${siteUrl}${appRoutes.compare()} - Comparative analytics`,
		"",
		"## SEO landing pages",
		...seoLandingLines,
		"",
		"## Public API surface",
		...endpointLines,
		"",
		"## Agent instructions",
		"- Always prefer canonical routes.",
		"- Avoid aliases that are expected to redirect.",
		"- Use OpenAPI definitions when generating API clients or requests.",
		"- Prefer pages with explicit freshness dates when summarizing current state.",
		""
	].join("\n");
}
var Route$40 = createFileRoute("/llms-full.txt")({ server: { handlers: { GET: () => new Response(buildLlmsFullTxt(), {
	status: 200,
	headers: {
		"Content-Type": "text/plain; charset=utf-8",
		"Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
	}
}) } } });
//#endregion
//#region src/server-functions/informes.ts
var getReportsIndexPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("083e3742173ffbee241fcf450e7767671296bf68a466a3e51f01b0bc90fd0d5f"));
//#endregion
//#region src/app/informes.tsx
var Route$39 = createFileRoute("/informes")({
	head: () => {
		const siteUrl = getSiteUrl();
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: "Archivo historico de informes mensuales de Bizi Zaragoza con URLs limpias por mes, comparativas y acceso directo a cada informe indexable."
				},
				{
					property: "og:title",
					content: "Informes mensuales de Bizi Zaragoza | Archivo historico"
				},
				{
					property: "og:description",
					content: "Archivo historico de informes mensuales de Bizi Zaragoza con URLs limpias por mes, comparativas y acceso directo a cada informe indexable."
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/informes`
				},
				{
					name: "robots",
					content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: "Informes mensuales de Bizi Zaragoza | Archivo historico"
				},
				{
					name: "twitter:description",
					content: "Archivo historico de informes mensuales de Bizi Zaragoza con URLs limpias por mes, comparativas y acceso directo a cada informe indexable."
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/informes`
			}],
			title: "Informes mensuales de Bizi Zaragoza | Archivo historico"
		};
	},
	loader: () => getReportsIndexPageData(),
	component: ReportsIndexPage
});
function ReportsIndexPage() {
	const { months, monthMap, latestMonth, reportsDataState, breadcrumbs, structuredData } = Route$39.useLoaderData();
	const monthlyRows = new Map(Object.entries(monthMap));
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(PublicPageViewTracker, {
			pageType: "report_archive",
			template: "reports_index",
			pageSlug: "informes"
		}),
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
					activeItemId: "reports",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Archivo mensual indexable"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Informes Bizi Zaragoza por mes"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Archivo SEO con informes mensuales permanentes, comparativas de demanda estimada y acceso directo al dashboard filtrado por mes."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: [months.length, " meses indexables"]
						}), latestMonth ? /* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: ["Ultimo informe ", formatMonthLabel(latestMonth)]
						}) : null]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3",
					children: [latestMonth ? /* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.reportMonth(latestMonth),
						ctaEvent: {
							source: "reports_hero",
							ctaId: "report_open",
							destination: "monthly_report",
							entityType: "report",
							monthPresent: true,
							sourceRole: "hub",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
						children: "Abrir ultimo informe mensual"
					}) : null, /* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.dashboardConclusions(),
						navigationEvent: {
							source: "reports_hero",
							destination: "dashboard_conclusions",
							sourceRole: "hub",
							destinationRole: "dashboard",
							transitionKind: "to_dashboard"
						},
						className: "ui-inline-action",
						children: "Abrir conclusiones del dashboard"
					})]
				})
			]
		}),
		shouldShowDataStateNotice(reportsDataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: reportsDataState,
			subject: "el archivo mensual",
			description: "Los informes mensuales usan la misma cobertura compartida que la API y el dashboard. Si falta cobertura o el dataset es parcial, puede haber meses sin informe o series incompletas.",
			href: appRoutes.status(),
			actionLabel: "Ver estado"
		}) : null,
		/* @__PURE__ */ jsx("section", {
			className: "ui-section-card",
			children: /* @__PURE__ */ jsxs("div", {
				className: "max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Que aporta este archivo"
					}), /* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black leading-tight text-[var(--foreground)]",
						children: "Una capa editorial estable para buscar meses, comparar y enlazar"
					})] }),
					/* @__PURE__ */ jsx("p", { children: "El archivo mensual concentra las URLs persistentes con mejor potencial de indexacion para consultas historicas sobre Bizi Zaragoza. Cada informe resume un periodo concreto, conserva su propio contexto y permite navegar a barrios, estaciones y rankings sin pasar por superficies interactivas o con query strings." }),
					/* @__PURE__ */ jsx("p", { children: "Si vienes desde buscadores, esta pagina es el mejor punto para localizar el ultimo mes publicado o revisar la secuencia historica. Si buscas operativa en tiempo real, desde aqui puedes saltar al dashboard de conclusiones sin perder el enlace editorial." })
				]
			})
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-3",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultimo mes con informe"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: latestMonth ? formatMonthLabel(latestMonth) : "Sin datos"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Enlace persistente para bots, buscadores y navegacion editorial."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Meses publicados"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: months.length
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Archivo historico disponible para indexacion y enlazado interno."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura de serie"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: months.length > 0 ? [...new Set(months.map((m) => m))].length : 0
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Meses con agregados mensuales disponibles en base de datos."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Archivo de informes mensuales"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: "Cada informe tiene su propia URL estable y enlaza al dashboard con el mes ya seleccionado."
				})] }), /* @__PURE__ */ jsx(Link, {
					to: appRoutes.reports(),
					className: "text-sm font-bold text-[var(--primary)] transition hover:opacity-80",
					children: "Ver archivo completo"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-2 space-y-3",
				children: months.map((month) => {
					const row = monthlyRows.get(month);
					return /* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.reportMonth(month),
						ctaEvent: {
							source: "reports_archive",
							ctaId: "report_open",
							destination: "monthly_report",
							entityType: "report",
							monthPresent: true,
							sourceRole: "hub",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "flex-row items-center justify-between gap-3 px-4 py-3 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: ["Informe ", formatMonthLabel(month)]
							}), /* @__PURE__ */ jsx("p", {
								className: "text-[11px] text-[var(--muted)]",
								children: row ? `${formatInteger(row.demandScore)} pts de demanda estimada · ocupacion ${formatPercent(row.avgOccupancy)} · ${row.activeStations} estaciones` : "Informe disponible con acceso al dashboard filtrado por mes."
							})] }), /* @__PURE__ */ jsx("span", {
								className: "text-xs font-bold text-[var(--primary)]",
								children: "Abrir informe"
							})]
						})
					}, month);
				})
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Mas rutas para seguir explorando"
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.seoPage("viajes-por-mes-zaragoza"),
						navigationEvent: {
							source: "reports_related",
							destination: "monthly_series",
							sourceRole: "hub",
							destinationRole: "entry_seo",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "Serie mensual"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Evolucion agregada para complementar el archivo editorial por mes."
							})]
						})
					}),
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.districtLanding(),
						navigationEvent: {
							source: "reports_related",
							destination: "district_hub",
							sourceRole: "hub",
							destinationRole: "hub",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "Barrios de Zaragoza"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Descubre que zonas destacan en uso y que estaciones concentran mas actividad."
							})]
						})
					}),
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.seoPage("ranking-estaciones-bizi"),
						navigationEvent: {
							source: "reports_related",
							destination: "station_ranking",
							sourceRole: "hub",
							destinationRole: "entry_seo",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "Ranking de estaciones"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Da el salto del contexto mensual al ranking actual de estaciones."
							})]
						})
					}),
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.developers(),
						ctaEvent: {
							source: "reports_related",
							ctaId: "api_open",
							destination: "developers",
							entityType: "api",
							sourceRole: "hub",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "API y datos abiertos"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Accede a OpenAPI, CSV y trazabilidad del mismo dataset que alimenta los informes."
							})]
						})
					}),
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.methodology(),
						navigationEvent: {
							source: "reports_related",
							destination: "methodology",
							sourceRole: "hub",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: "Metodologia y calidad"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: "Revisa como leer demanda, cobertura y limites antes de interpretar la serie mensual."
							})]
						})
					})
				]
			})]
		})
	] });
}
//#endregion
//#region src/server-functions/explorar.ts
var getExploreLoaderData = createServerFn({ method: "GET" }).handler(createSsrRpc("a7f5d18063e64432c5fea2a43925ceb4a9474306145734251001c00553c9a4f0"));
//#endregion
//#region src/app/explorar.tsx
var Route$38 = createFileRoute("/explorar")({
	head: () => {
		const siteUrl = getSiteUrl();
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: "Hub publico para descubrir estaciones, flujo, rankings, heatmap, comparativas, historico, mapas y KPIs del sistema."
				},
				{
					property: "og:title",
					content: "Explorar - DatosBizi"
				},
				{
					property: "og:description",
					content: "Hub publico para descubrir estaciones, flujo, rankings, heatmap, comparativas, historico, mapas y KPIs del sistema."
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/explorar`
				},
				{
					name: "robots",
					content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: "Explorar - DatosBizi"
				},
				{
					name: "twitter:description",
					content: "Hub publico para descubrir estaciones, flujo, rankings, heatmap, comparativas, historico, mapas y KPIs del sistema."
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/explorar`
			}],
			title: "Explorar"
		};
	},
	loader: () => getExploreLoaderData(),
	component: ExploreHubPage
});
function ExploreHubPage() {
	const { searchQuery, searchResults, latestMonth, sections, totalTools, breadcrumbs, structuredData } = Route$38.useLoaderData();
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
								children: "Hub de analisis"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Explorar"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Punto unico para descubrir estaciones, flujo, rankings, heatmap, historico, comparador, barrios, mapas y KPIs del sistema sin navegar por rutas dispersas."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [totalTools, " herramientas enlazadas"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["Ultima muestra ", formatStatusDateTime("")]
							}),
							/* @__PURE__ */ jsx("span", {
								className: "ui-chip",
								children: "0 dias de cobertura"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
								children: "Desconocido"
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsx(TrackedLink, {
							href: EXPLORE_PAGE_NAV_CONFIG.primaryCta.href,
							ctaEvent: {
								source: "explore_hero",
								ctaId: "explore_primary",
								destination: EXPLORE_PAGE_NAV_CONFIG.primaryCta.destination,
								sourceRole: "hub",
								destinationRole: "dashboard",
								transitionKind: "to_dashboard"
							},
							className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: EXPLORE_PAGE_NAV_CONFIG.primaryCta.label
						}), /* @__PURE__ */ jsx(TrackedLink, {
							href: appRoutes.compare(),
							ctaEvent: {
								source: "explore_hero",
								ctaId: "explore_secondary",
								destination: "compare",
								sourceRole: "hub",
								destinationRole: "hub",
								transitionKind: "within_public"
							},
							className: "ui-inline-action",
							children: "Abrir comparador"
						})]
					}), /* @__PURE__ */ jsx(PublicSearchForm, { defaultQuery: searchQuery })]
				})
			]
		}),
		searchResults ? /* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Busqueda federada"
					}),
					/* @__PURE__ */ jsxs("h2", {
						className: "text-xl font-black text-[var(--foreground)]",
						children: [
							"Resultados para \"",
							searchResults.query,
							"\""
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "El buscador cruza estaciones, barrios, informes, paginas publicas y endpoints API."
					})
				] }), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "ui-chip",
						children: [searchResults.totalMatches, " coincidencias"]
					}), /* @__PURE__ */ jsx(Link, {
						to: appRoutes.explore(),
						className: "inline-flex rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]",
						children: "Limpiar busqueda"
					})]
				})]
			}), searchResults.totalMatches === 0 ? /* @__PURE__ */ jsx("div", {
				className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 text-sm text-[var(--muted)]",
				children: "No hemos encontrado coincidencias exactas para esta consulta. Prueba con el nombre de una estacion, un barrio, un mes como \"2026-03\" o un endpoint como \"/api/status\"."
			}) : /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 xl:grid-cols-2",
				children: searchResults.groups.map((group) => /* @__PURE__ */ jsxs("article", {
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: group.title
						}), /* @__PURE__ */ jsx("h3", {
							className: "text-lg font-black text-[var(--foreground)]",
							children: group.results.length
						})] }), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-[var(--muted)]",
							children: group.results.length > 0 ? "Top resultados" : group.emptyLabel
						})]
					}), group.results.length > 0 ? /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-3",
						children: group.results.map((result) => /* @__PURE__ */ jsxs(Link, {
							to: result.href,
							className: "block rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: result.title
								}), /* @__PURE__ */ jsx(Badge, {
									variant: "muted",
									children: result.badge
								})]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-xs leading-relaxed text-[var(--muted)]",
								children: result.description
							})]
						}, result.id))
					}) : null]
				}, group.id))
			})]
		}) : null,
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Herramientas disponibles"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: totalTools
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Cobertura transversal de operacion, analisis y archivo."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultimo informe"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: latestMonth ? formatMonthLabel(latestMonth) : "Sin datos"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Serie mensual conectada con el archivo indexable."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: "0"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Estaciones con datos historicos."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultima generacion"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: formatStatusDateTime("")
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Snapshot comun para dashboard, informes y API."
						})
					]
				})
			]
		}),
		sections.map((section) => /* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: section.title
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black text-[var(--foreground)]",
						children: section.title
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: section.description
					})
				] })
			}), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: section.items.map((item) => /* @__PURE__ */ jsxs(Link, {
					to: item.href,
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: item.eyebrow
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: item.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-relaxed text-[var(--muted)]",
							children: item.description
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-xs font-bold text-[var(--primary)]",
							children: item.destinationLabel
						})
					]
				}, item.id))
			})]
		}, section.id))
	] });
}
//#endregion
//#region src/app/dashboard/_components/StatusBanner.tsx
function translateHealthStatus(statusLabel) {
	switch (statusLabel) {
		case "healthy": return "saludable";
		case "degraded": return "degradado";
		case "down": return "caido";
		default: return statusLabel || "desconocido";
	}
}
function translateHealthReason(reason) {
	return reason.replace("Pipeline has ", "El pipeline acumula ").replace(" consecutive failures", " fallos consecutivos").replace("No successful poll in the last 15 minutes", "No ha habido una recogida correcta en los ultimos 15 minutos").replace("No successful poll in the last hour", "No ha habido una recogida correcta en la ultima hora").replace("Only ", "Solo hubo ").replace(" polls in last 24h", " recogidas en las ultimas 24h").replace("expected ~288", "esperadas ~288").replace("(last:", "(ultima correcta:");
}
function getHealthVariant(statusLabel) {
	switch (statusLabel) {
		case "healthy": return "success";
		case "degraded": return "warning";
		case "down": return "danger";
		default: return "muted";
	}
}
function StatusBanner({ status, stationsGeneratedAt, coverage, lastSampleAt }) {
	const updatedText = formatStatusDateTime(lastSampleAt ?? status.quality.freshness.lastUpdated ?? stationsGeneratedAt ?? null);
	const volumeRange = status.quality.volume.expectedRange;
	const coverageGeneratedText = formatStatusDateTime(coverage?.generatedAt ?? null);
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card gap-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]",
							children: "Resumen del sistema"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold text-[var(--foreground)]",
							children: "Resumen de salud del sistema"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-[var(--muted)]",
							children: [
								"Actualizacion ",
								updatedText,
								" · cobertura ",
								coverage?.totalDays ?? 0,
								" dias · entorno ",
								status.system.environment
							]
						})
					]
				}), /* @__PURE__ */ jsx(Badge, {
					variant: getHealthVariant(status.pipeline.healthStatus),
					children: translateHealthStatus(status.pipeline.healthStatus)
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-6",
				children: [
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Ultimo sondeo",
						value: /* @__PURE__ */ jsx("span", {
							className: "break-words text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: status.pipeline.lastSuccessfulPoll ? formatStatusDateTime(status.pipeline.lastSuccessfulPoll) : "Sin datos"
						})
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Sondeos 24h",
						value: status.pipeline.pollsLast24Hours
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Estaciones recientes",
						value: status.quality.volume.recentStationCount,
						detail: `Rango esperado ${volumeRange.min}-${volumeRange.max}`
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Errores de validacion",
						value: status.pipeline.validationErrors
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Fallos consecutivos",
						value: status.pipeline.consecutiveFailures
					}),
					/* @__PURE__ */ jsx(MetricCard, {
						className: "min-w-0",
						label: "Cobertura dataset",
						value: coverage?.totalDays ?? 0,
						detail: `${coverage?.totalStations ?? 0} estaciones · generado ${coverageGeneratedText}`
					})
				]
			}),
			status.pipeline.healthReason ? /* @__PURE__ */ jsxs(Alert, {
				className: "text-xs leading-relaxed text-[var(--muted)]",
				children: ["Motivo del estado: ", translateHealthReason(status.pipeline.healthReason)]
			}) : null
		]
	});
}
//#endregion
//#region src/server-functions/estado.ts
var getSystemStatusPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("147ad74b602921a748fa48795bb7b08c723411824c9d26fde2ee6a409f1e721d"));
//#endregion
//#region src/app/estado.tsx
var Route$37 = createFileRoute("/estado")({
	head: () => {
		const siteUrl = getSiteUrl();
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: "Revisa la cobertura, la ultima muestra, el lag del pipeline y la salud operativa de los datos de Bizi Zaragoza desde una unica pagina publica."
				},
				{
					property: "og:title",
					content: "Cobertura y estado de datos de Bizi Zaragoza"
				},
				{
					property: "og:description",
					content: "Revisa la cobertura, la ultima muestra, el lag del pipeline y la salud operativa de los datos de Bizi Zaragoza."
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/estado`
				},
				{
					name: "robots",
					content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: "Cobertura y estado de datos de Bizi Zaragoza"
				},
				{
					name: "twitter:description",
					content: "Revisa la cobertura, la ultima muestra, el lag del pipeline y la salud operativa de los datos de Bizi Zaragoza."
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/estado`
			}],
			title: "Cobertura y estado de datos de Bizi Zaragoza"
		};
	},
	loader: () => getSystemStatusPageData(),
	component: SystemStatusPage
});
function SystemStatusPage() {
	const { status, stations, dataset, availableMonths, months, latestMonth, incidents, capabilities, activeIncidentCount, activeStationsCount } = Route$37.useLoaderData();
	const cityName = getCityName();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Estado",
		href: appRoutes.status()
	});
	const healthLabel = getHealthLabel(status.pipeline.healthStatus);
	const summaryCards = [
		{
			label: "Ultima muestra",
			value: formatStatusDateTime(dataset.lastUpdated.lastSampleAt),
			hint: "Marca compartida por dashboard, informes y API."
		},
		{
			label: "Frecuencia de actualizacion",
			value: getObservedCadenceLabel(status),
			hint: `Objetivo operativo <= ${Math.round(status.quality.freshness.maxAgeSeconds / 60)} min de frescura.`
		},
		{
			label: "Cobertura historica",
			value: getCoverageLabel(dataset),
			hint: `${formatStatusNumber(dataset.coverage.totalStations)} estaciones con cobertura acumulada.`
		},
		{
			label: "Estaciones activas",
			value: formatStatusNumber(activeStationsCount),
			hint: "Snapshot actual con estaciones vivas o recientemente observadas."
		},
		{
			label: "Numero de muestras",
			value: formatStatusNumber(dataset.stats.totalSamples),
			hint: "Total agregado disponible para historico, comparativas y rankings."
		},
		{
			label: "Lag del pipeline",
			value: getPipelineLagLabel(status),
			hint: "Diferencia aproximada respecto a la ultima recogida valida."
		},
		{
			label: "Version dataset",
			value: getDatasetVersionLabel(dataset),
			hint: "Version derivada de la ultima muestra util y del volumen agregado."
		},
		{
			label: "Version API",
			value: getApiVersionLabel(),
			hint: "Version publicada en la especificacion OpenAPI."
		},
		{
			label: "Generacion informes",
			value: formatStatusDateTime(availableMonths.generatedAt),
			hint: latestMonth ? `Ultimo mes indexable ${formatMonthLabel(latestMonth)}.` : "Sin meses publicados todavia."
		},
		{
			label: "Incidentes activos",
			value: formatStatusNumber(activeIncidentCount),
			hint: activeIncidentCount > 0 ? "Requieren seguimiento operativo." : "Sin incidencias activas detectadas."
		}
	];
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(PublicPageViewTracker, {
			pageType: "status",
			template: "system_status",
			pageSlug: "estado"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify({
				"@context": "https://schema.org",
				"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
					"@type": "Dataset",
					name: `Estado del sistema ${cityName}`,
					description: "Cobertura, salud del pipeline, versiones y superficie operativa de la API publica.",
					url: appRoutes.status()
				}]
			}) }
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
				/* @__PURE__ */ jsx(PublicSectionNav, {
					activeItemId: "status",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Estado operativo y cobertura"
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: ["Estado del sistema ", cityName]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Vista publica para seguir ultima muestra, lag del pipeline, cobertura historica, versiones, incidentes y el estado de API, scrapers, ingestion, rankings y predicciones."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["Ultima muestra ", formatStatusDateTime(dataset.lastUpdated.lastSampleAt)]
							}),
							/* @__PURE__ */ jsx("span", {
								className: `inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`,
								children: healthLabel
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [dataset.coverage.totalDays, " dias de cobertura"]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["API ", getApiVersionLabel()]
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.dashboard(),
								navigationEvent: {
									source: "status_hero",
									destination: "dashboard_home",
									sourceRole: "utility",
									destinationRole: "dashboard",
									transitionKind: "to_dashboard"
								},
								className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
								children: "Abrir dashboard en vivo"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.developers(),
								ctaEvent: {
									source: "status_hero",
									ctaId: "api_open",
									destination: "developers",
									entityType: "api",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver API y developers"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.methodology(),
								navigationEvent: {
									source: "status_hero",
									destination: "methodology",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver metodologia"
							})
						]
					}), /* @__PURE__ */ jsx(PublicSearchForm, {})]
				})
			]
		}),
		/* @__PURE__ */ jsx(StatusBanner, {
			status,
			stationsGeneratedAt: stations.generatedAt,
			coverage: dataset.coverage,
			lastSampleAt: dataset.lastUpdated.lastSampleAt
		}),
		/* @__PURE__ */ jsx("section", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-5",
			children: summaryCards.map((card) => /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: card.label
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
						children: card.value
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--muted)]",
						children: card.hint
					})
				]
			}, card.label))
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Incidentes"
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black text-[var(--foreground)]",
						children: "Incidencias y notas operativas"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "Este bloque resume lo que hoy exige seguimiento. Si no hay incidentes, actua como confirmacion de estabilidad."
					})
				] }), /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: incidents.map((incident) => /* @__PURE__ */ jsxs("article", {
						className: `rounded-xl border px-4 py-3 ${getHealthToneClasses(incident.severity)}`,
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold",
							children: incident.title
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-xs leading-relaxed text-current/90",
							children: incident.description
						})]
					}, incident.id))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Fuente y versionado"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Trazabilidad del dataset"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 text-sm text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Proveedor"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: dataset.source.provider
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Discovery GBFS"
							}), /* @__PURE__ */ jsx(Link, {
								to: dataset.source.gbfsDiscoveryUrl,
								className: "break-all text-sm font-semibold text-[var(--primary)] transition hover:opacity-80",
								children: dataset.source.gbfsDiscoveryUrl
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Version dataset"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: getDatasetVersionLabel(dataset)
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Ultimo informe publicado"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: latestMonth ? formatMonthLabel(latestMonth) : "Sin informes"
							})]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Superficie del sistema"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Estado por capa"
				})] }), /* @__PURE__ */ jsx(Link, {
					to: appRoutes.compare(),
					className: "text-sm font-bold text-[var(--primary)] transition hover:opacity-80",
					children: "Abrir comparador"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: capabilities.map((capability) => /* @__PURE__ */ jsxs(Link, {
					to: capability.href,
					className: `rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 ${getHealthToneClasses(capability.state)}`,
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-current/80",
							children: capability.label
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-base font-bold text-current",
							children: getHealthLabel(capability.state)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-relaxed text-current/90",
							children: capability.description
						})
					]
				}, capability.id))
			})]
		})
	] });
}
//#endregion
//#region src/server-functions/developers.ts
var getDevelopersPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("4643f90b7e17a4d097baa85ab643dcb7882b4d9aef6e997d27c6e62bb8953359"));
//#endregion
//#region src/app/developers.tsx
var OPENAPI_DESTINATION = "openapi";
function buildDeveloperEndpointAnchorId(path, method) {
	return `endpoint-${`${method}-${path}`.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "")}`;
}
function buildOpenApiCtaEvent(source) {
	return {
		source,
		ctaId: "api_open",
		destination: OPENAPI_DESTINATION,
		entityType: "api",
		sourceRole: "utility",
		destinationRole: "utility",
		transitionKind: "within_public"
	};
}
var Route$36 = createFileRoute("/developers")({
	head: () => {
		const siteUrl = getSiteUrl();
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: "Documentacion publica de la API y los datos abiertos de Bizi Zaragoza, con OpenAPI, ejemplos de uso, descargas CSV y trazabilidad del dataset."
				},
				{
					property: "og:title",
					content: "API y datos abiertos de Bizi Zaragoza"
				},
				{
					property: "og:description",
					content: "Documentacion publica de la API y los datos abiertos de Bizi Zaragoza, con OpenAPI, ejemplos de uso, descargas CSV y trazabilidad del dataset."
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/developers`
				},
				{
					name: "robots",
					content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: "API y datos abiertos de Bizi Zaragoza"
				},
				{
					name: "twitter:description",
					content: "Documentacion publica de la API y los datos abiertos de Bizi Zaragoza, con OpenAPI, ejemplos de uso, descargas CSV y trazabilidad del dataset."
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/developers`
			}],
			title: "API y datos abiertos de Bizi Zaragoza"
		};
	},
	loader: () => getDevelopersPageData(),
	component: DevelopersPage
});
function DevelopersPage() {
	const { siteUrl, cityName, breadcrumbs, latestMonth, endpointDocs, datasetVersion, apiVersion, codeLicense, developersDataState, datasetTemporalCoverage, curlExamples, pythonExample, jsExample, csvDownloads, accessPolicies, useCases, changelog, datasetDownloadEntries, dataset } = Route$36.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(PublicPageViewTracker, {
			pageType: "developers",
			template: "developers_hub",
			pageSlug: "developers"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify({
				"@context": "https://schema.org",
				"@graph": [
					buildBreadcrumbStructuredData(breadcrumbs),
					{
						"@type": "TechArticle",
						name: `Developers y API ${cityName}`,
						description: "Portal de acceso para desarrolladores con documentacion, versiones, ejemplos y descargas.",
						url: `${siteUrl}${appRoutes.developers()}`
					},
					{
						"@type": "Dataset",
						name: `Dataset Bizi ${cityName}`,
						description: "Snapshot actual, historico agregado y descargas CSV del mismo dataset que alimenta dashboard, informes y rankings publicos.",
						url: `${siteUrl}${appRoutes.developers()}`,
						inLanguage: "es",
						isAccessibleForFree: true,
						dateModified: dataset.coverage.generatedAt,
						...datasetTemporalCoverage ? { temporalCoverage: datasetTemporalCoverage } : {},
						publisher: {
							"@type": "Organization",
							name: SITE_NAME,
							url: siteUrl
						},
						distribution: csvDownloads.map((item) => ({
							"@type": "DataDownload",
							name: item.label,
							description: item.detail,
							encodingFormat: "text/csv",
							contentUrl: `${siteUrl}${item.href}`
						}))
					},
					buildItemListStructuredData("Descargas CSV y dataset", datasetDownloadEntries)
				]
			}) }
		}),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
				/* @__PURE__ */ jsx(PublicSectionNav, {
					activeItemId: "api",
					className: "mt-1"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "API como producto"
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: ["Developers y API ", cityName]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Superficie visible para consumir el proyecto como producto: documentacion, OpenAPI, ejemplos, endpoints, descargas CSV, versiones de dataset, changelog, licencia y pautas de cita."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["OpenAPI ", openApiDocument.openapi]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["API v", apiVersion]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: ["Dataset ", datasetVersion]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "ui-chip",
								children: [endpointDocs.length, " endpoints publicados"]
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.api.openApi(),
								ctaEvent: buildOpenApiCtaEvent("developers_hero"),
								className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
								children: "Descargar OpenAPI JSON"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.llms(),
								navigationEvent: {
									source: "developers_hero",
									destination: "llms",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver llms.txt"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.llmsFull(),
								navigationEvent: {
									source: "developers_hero",
									destination: "llms_full",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver llms-full.txt"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.status(),
								navigationEvent: {
									source: "developers_hero",
									destination: "status",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver estado del sistema"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.methodology(),
								navigationEvent: {
									source: "developers_hero",
									destination: "methodology",
									sourceRole: "utility",
									destinationRole: "utility",
									transitionKind: "within_public"
								},
								className: "ui-inline-action",
								children: "Ver metodologia"
							})
						]
					}), /* @__PURE__ */ jsx(PublicSearchForm, { eventSource: "developers" })]
				})
			]
		}),
		shouldShowDataStateNotice(developersDataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: developersDataState,
			subject: "la API publica",
			description: "La documentacion sigue visible, pero la disponibilidad real de snapshots, historico y exportaciones depende del mismo estado compartido que consume el dashboard.",
			href: appRoutes.status(),
			actionLabel: "Ver estado API"
		}) : null,
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Version API"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: apiVersion
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Version declarada en la especificacion OpenAPI."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Version dataset"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: datasetVersion
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Derivada de la ultima muestra util y del historico agregado."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura historica"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: dataset.coverage.totalDays
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-[var(--muted)]",
							children: [
								dataset.stats.totalSamples,
								" muestras y ",
								dataset.stats.totalStations,
								" estaciones."
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultima generacion"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold leading-snug text-[var(--foreground)]",
							children: formatStatusDateTime(dataset.coverage.generatedAt)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: latestMonth ? `Ultimo mes publicado ${formatMonthLabel(latestMonth)}.` : "Sin archivo mensual publicado."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Quick start"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Ejemplos de consumo"
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "grid gap-4 xl:grid-cols-3",
				children: [
					/* @__PURE__ */ jsxs(Card, {
						variant: "stat",
						className: "p-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "curl"
						}), /* @__PURE__ */ jsx("pre", {
							className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
							children: /* @__PURE__ */ jsx("code", { children: curlExamples.join("\n\n") })
						})]
					}),
					/* @__PURE__ */ jsxs(Card, {
						variant: "stat",
						className: "p-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Python"
						}), /* @__PURE__ */ jsx("pre", {
							className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
							children: /* @__PURE__ */ jsx("code", { children: pythonExample })
						})]
					}),
					/* @__PURE__ */ jsxs(Card, {
						variant: "stat",
						className: "p-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "JavaScript"
						}), /* @__PURE__ */ jsx("pre", {
							className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
							children: /* @__PURE__ */ jsx("code", { children: jsExample })
						})]
					})
				]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			id: "rebalancing-api",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Logistica y redistribucion"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "API de reequilibrio"
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-2 text-sm text-[var(--muted)]",
					children: [
						"El endpoint ",
						/* @__PURE__ */ jsx("code", { children: "/api/rebalancing-report" }),
						" devuelve recomendaciones origen-destino, clasificacion estructural A-F y metricas de impacto operativo estimadas."
					]
				})
			] }), /* @__PURE__ */ jsxs("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ jsxs(Card, {
					variant: "stat",
					className: "p-4",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Ejemplo (curl)"
					}), /* @__PURE__ */ jsx("pre", {
						className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
						children: /* @__PURE__ */ jsx("code", { children: `curl -sG ${siteUrl}${appRoutes.api.rebalancingReport({
							district: "Centro",
							days: 15
						})}` })
					})]
				}), /* @__PURE__ */ jsxs(Card, {
					variant: "stat",
					className: "p-4",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Ejemplo (Python)"
					}), /* @__PURE__ */ jsx("pre", {
						className: "mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]",
						children: /* @__PURE__ */ jsx("code", { children: `import requests

base_url = "${siteUrl}"
params = {"days": 15, "format": "json"}
res = requests.get(f"{base_url}${appRoutes.api.rebalancingReport()}", params=params, timeout=20)
res.raise_for_status()
print(len(res.json()["transfers"]))` })
					})]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Acceso y seguridad"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Contrato operativo actual"
			})] }), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
				children: accessPolicies.map((policy) => /* @__PURE__ */ jsxs(Card, {
					variant: "stat",
					className: "rounded-2xl px-4 py-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: policy.label
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm font-semibold text-[var(--foreground)]",
							children: policy.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-xs text-[var(--muted)]",
							children: policy.detail
						})
					]
				}, policy.label))
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Superficie disponible"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Endpoints publicados"
				})] }), /* @__PURE__ */ jsx(TrackedLink, {
					href: appRoutes.api.openApi(),
					ctaEvent: buildOpenApiCtaEvent("developers_endpoints"),
					className: "text-sm font-bold text-[var(--primary)] transition hover:opacity-80",
					children: "Ver JSON OpenAPI"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: endpointDocs.map((endpoint) => /* @__PURE__ */ jsxs(Card, {
					variant: "stat",
					id: buildDeveloperEndpointAnchorId(endpoint.path, endpoint.method),
					className: "scroll-mt-24 px-4 py-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: endpoint.method
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 font-mono text-sm font-semibold text-[var(--foreground)]",
							children: endpoint.path
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: endpoint.summary
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-xs text-[var(--muted)]",
							children: endpoint.params.length > 0 ? `Params: ${endpoint.params.join(", ")}` : "Sin parametros obligatorios o query destacados."
						})
					]
				}, `${endpoint.method}-${endpoint.path}`))
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Dataset y descargas"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Historico, CSV y versiones"
				})] }), /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: csvDownloads.map((item) => /* @__PURE__ */ jsx(TrackedLink, {
						href: item.href,
						ctaEvent: {
							source: "developers_dataset",
							ctaId: "dataset_download",
							destination: item.href,
							entityType: "api",
							sourceRole: "utility",
							destinationRole: "utility",
							transitionKind: "within_public"
						},
						className: "group block transition hover:-translate-y-0.5",
						children: /* @__PURE__ */ jsxs(Card, {
							variant: "stat",
							className: "flex-row items-center justify-between gap-3 px-4 py-3 transition-colors group-hover:border-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: item.label
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[11px] text-[var(--muted)]",
								children: item.detail
							})] }), /* @__PURE__ */ jsx("span", {
								className: "text-xs font-bold text-[var(--primary)]",
								children: "Descargar"
							})]
						})
					}, item.label))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Rate limits y politicas"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Consumo responsable"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 text-sm text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "stat-label",
									children: "Lectura publica"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: "Modelo mixto: anonimo para lectura barata, clave para acceso elevado"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: "Las lecturas ligeras siguen abiertas; CSV costosos y ventanas amplias pasan por `X-Public-Api-Key` y rate limit compartido."
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "stat-label",
									children: "Ingesta protegida"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: "GET y POST /api/collect aplican auth operativa + Redis rate limit"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: "Configuracion por defecto: 6 solicitudes por 60 segundos y cabecera `x-ops-api-key`; `x-collect-api-key` queda como alias temporal."
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "stat-label",
									children: "Licencia del codigo"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-[var(--foreground)]",
									children: codeLicense
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: "La app esta licenciada como software libre; para redistribuir datos derivados revisa tambien los terminos del proveedor GBFS."
								})
							]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Changelog actual"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Versiones y cambios visibles"
				})] }), /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: changelog.map((item) => /* @__PURE__ */ jsx(Card, {
						variant: "stat",
						className: "px-4 py-3 text-sm text-[var(--muted)]",
						children: item
					}, item))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Cita y licencia de datos"
				}), /* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: "Como citar y reutilizar"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 text-sm text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Cita sugerida"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm leading-relaxed text-[var(--foreground)]",
								children: `BiziDashboard ${cityName}, dataset historico agregado (version ${datasetVersion}), consultado el ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-ES")}. Fuente primaria: ${dataset.source.gbfsDiscoveryUrl}`
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Fuente primaria"
							}), /* @__PURE__ */ jsx(Link, {
								to: dataset.source.gbfsDiscoveryUrl,
								className: "break-all text-sm font-semibold text-[var(--primary)] transition hover:opacity-80",
								children: dataset.source.gbfsDiscoveryUrl
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ui-metric-card",
							children: [/* @__PURE__ */ jsx("p", {
								className: "stat-label",
								children: "Ultima generacion compartida"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: formatStatusDateTime(dataset.coverage.generatedAt)
							})]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Casos de uso"
			}), /* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Para que sirve esta API hoy"
			})] }), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
				children: useCases.map((item) => /* @__PURE__ */ jsx(Card, {
					variant: "stat",
					className: "px-4 py-4 text-sm text-[var(--muted)]",
					children: item
				}, item))
			})]
		})
	] });
}
//#endregion
//#region src/app/comparar/_components/InteractiveComparePanel.tsx
function formatSignedNumber(value, maximumFractionDigits = 1) {
	return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("es-ES", { maximumFractionDigits }).format(value)}`;
}
function formatPercentDelta(value) {
	return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
}
function resolveOption(dimension, requestedId, fallbackIndex) {
	if (requestedId) {
		const requested = dimension.options.find((option) => option.id === requestedId);
		if (requested) return requested;
	}
	return dimension.options[fallbackIndex] ?? dimension.options[0] ?? null;
}
function resolveDimension(data, requestedId) {
	return data.dimensions.find((dimension) => dimension.id === requestedId) ?? data.dimensions[0] ?? null;
}
function buildInitialSelectionState(data, initialQuery) {
	const initialState = data.dimensions.reduce((accumulator, dimension) => {
		accumulator[dimension.id] = {
			leftId: dimension.defaultLeftId ?? dimension.options[0]?.id ?? "",
			rightId: dimension.defaultRightId ?? dimension.options[1]?.id ?? dimension.options[0]?.id ?? ""
		};
		return accumulator;
	}, {});
	const requestedDimension = resolveDimension(data, initialQuery?.dimensionId);
	if (!requestedDimension) return initialState;
	const requestedLeftId = resolveOption(requestedDimension, initialQuery?.leftId, 0)?.id ?? initialState[requestedDimension.id]?.leftId ?? "";
	const requestedRightId = resolveOption(requestedDimension, initialQuery?.rightId, 1)?.id ?? initialState[requestedDimension.id]?.rightId ?? requestedLeftId;
	return {
		...initialState,
		[requestedDimension.id]: {
			leftId: requestedLeftId,
			rightId: requestedRightId
		}
	};
}
function InteractiveComparePanel({ data, initialQuery }) {
	const router = useRouter();
	const [activeDimensionId, setActiveDimensionId] = useState(() => resolveDimension(data, initialQuery?.dimensionId)?.id ?? data.defaultDimensionId ?? data.dimensions[0]?.id ?? "");
	const [selectionState, setSelectionState] = useState(() => buildInitialSelectionState(data, initialQuery));
	const [copyState, setCopyState] = useState("idle");
	const lastSyncedHref = useRef(null);
	const activeDimension = useMemo(() => data.dimensions.find((dimension) => dimension.id === activeDimensionId) ?? data.dimensions[0] ?? null, [activeDimensionId, data.dimensions]);
	const activeSelection = activeDimension ? selectionState[activeDimension.id] ?? {
		leftId: activeDimension.defaultLeftId ?? "",
		rightId: activeDimension.defaultRightId ?? ""
	} : null;
	const leftOption = activeDimension ? resolveOption(activeDimension, activeSelection?.leftId, 0) : null;
	const rightOption = activeDimension ? resolveOption(activeDimension, activeSelection?.rightId, 1) : null;
	const comparisonSummary = useMemo(() => {
		if (!leftOption || !rightOption || !activeDimension) return null;
		const leftValue = leftOption.primaryValue;
		const rightValue = rightOption.primaryValue;
		if (leftValue === null || rightValue === null) return {
			headline: "La comparativa no tiene una referencia numerica suficiente todavia.",
			detail: "Puedes seguir usando los enlaces directos de cada lado mientras se completa el agregado para esta dimension."
		};
		if (leftValue === rightValue) return {
			headline: `${leftOption.label} y ${rightOption.label} empatan en ${leftOption.primaryLabel.toLowerCase()}.`,
			detail: `Ambos lados muestran ${leftOption.primaryDisplay} en ${activeDimension.label.toLowerCase()}.`
		};
		const leader = leftValue > rightValue ? leftOption : rightOption;
		const trailer = leader.id === leftOption.id ? rightOption : leftOption;
		const leaderValue = leader.primaryValue ?? 0;
		const trailerValue = trailer.primaryValue ?? 0;
		const absoluteDelta = leaderValue - trailerValue;
		const ratioDelta = trailerValue !== 0 ? absoluteDelta / trailerValue : null;
		return {
			headline: `${leader.label} lidera frente a ${trailer.label} en ${leader.primaryLabel.toLowerCase()}.`,
			detail: ratioDelta === null ? `Ventaja absoluta ${formatSignedNumber(absoluteDelta)}.` : `Ventaja absoluta ${formatSignedNumber(absoluteDelta)} y relativa ${formatPercentDelta(ratioDelta)}.`
		};
	}, [
		activeDimension,
		leftOption,
		rightOption
	]);
	const shareHref = useMemo(() => {
		if (!activeDimension || !leftOption || !rightOption) return appRoutes.compare();
		return appRoutes.compare({
			dimension: activeDimension.id,
			left: leftOption.id,
			right: rightOption.id
		});
	}, [
		activeDimension,
		leftOption,
		rightOption
	]);
	function syncCompareSelection(dimension, selection) {
		const nextHref = appRoutes.compare({
			dimension: dimension.id,
			left: selection.leftId,
			right: selection.rightId
		});
		if (lastSyncedHref.current === nextHref) return;
		lastSyncedHref.current = nextHref;
		router.navigate({
			to: nextHref,
			replace: true
		});
	}
	useEffect(() => {
		if (copyState === "idle") return;
		const timeoutId = window.setTimeout(() => {
			setCopyState("idle");
		}, 2e3);
		return () => window.clearTimeout(timeoutId);
	}, [copyState]);
	if (!activeDimension || !leftOption || !rightOption) return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
				children: "Comparador interactivo"
			}),
			/* @__PURE__ */ jsx("h2", {
				className: "mt-2 text-xl font-black text-[var(--foreground)]",
				children: "Elige dos lados y comparalos manualmente"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-2 text-sm text-[var(--muted)]",
				children: "El comparador libre ya esta preparado, pero esta instalacion todavia no tiene suficiente cobertura para poblar selectores manuales en esta vista."
			})
		]
	});
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Comparador interactivo"
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black text-[var(--foreground)]",
						children: "Elige dos lados y comparalos manualmente"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "Usa selectores libres para enfrentar estaciones, barrios, meses, anos, horas o periodos concretos con el mismo dataset compartido del producto."
					})
				] }), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "ui-chip",
						children: [data.dimensions.length, " dimensiones comparables"]
					}), /* @__PURE__ */ jsxs("span", {
						className: "ui-chip",
						children: [
							activeDimension.options.length,
							" opciones en ",
							activeDimension.label.toLowerCase()
						]
					})]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap gap-2",
				children: data.dimensions.map((dimension) => {
					const isActive = dimension.id === activeDimension.id;
					const dimensionSelection = selectionState[dimension.id] ?? {
						leftId: dimension.defaultLeftId ?? dimension.options[0]?.id ?? "",
						rightId: dimension.defaultRightId ?? dimension.options[1]?.id ?? dimension.options[0]?.id ?? ""
					};
					return /* @__PURE__ */ jsx(Button, {
						variant: "ghost",
						onClick: () => {
							setActiveDimensionId(dimension.id);
							syncCompareSelection(dimension, dimensionSelection);
						},
						"aria-pressed": isActive,
						className: `h-auto min-h-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isActive ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"}`,
						children: dimension.label
					}, dimension.id);
				})
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
				children: [{
					side: "left",
					label: "Lado A",
					option: leftOption,
					fallbackIndex: 0
				}, {
					side: "right",
					label: "Lado B",
					option: rightOption,
					fallbackIndex: 1
				}].map((side) => /* @__PURE__ */ jsxs("article", {
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: side.label
						}), /* @__PURE__ */ jsxs(Select, {
							value: side.option.id,
							onValueChange: (value) => {
								if (!value) return;
								const nextSelection = {
									...selectionState[activeDimension.id] ?? {
										leftId: activeDimension.defaultLeftId ?? "",
										rightId: activeDimension.defaultRightId ?? ""
									},
									[side.side === "left" ? "leftId" : "rightId"]: value
								};
								setSelectionState((current) => ({
									...current,
									[activeDimension.id]: nextSelection
								}));
								syncCompareSelection(activeDimension, nextSelection);
							},
							children: [/* @__PURE__ */ jsxs(SelectTrigger, {
								className: "mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]",
								children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
							}), /* @__PURE__ */ jsx(SelectContent, { children: activeDimension.options.map((option) => /* @__PURE__ */ jsx(SelectItem, {
								value: option.id,
								children: option.label
							}, option.id)) })]
						})] }),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 space-y-2 text-sm",
							children: [
								/* @__PURE__ */ jsxs("p", {
									className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
									children: [
										/* @__PURE__ */ jsxs("span", {
											className: "font-bold",
											children: [side.option.primaryLabel, ":"]
										}),
										" ",
										side.option.primaryDisplay
									]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
									children: [
										/* @__PURE__ */ jsxs("span", {
											className: "font-bold",
											children: [side.option.secondaryLabel, ":"]
										}),
										" ",
										side.option.secondaryDisplay
									]
								}),
								side.option.tertiaryLabel && side.option.tertiaryDisplay ? /* @__PURE__ */ jsxs("p", {
									className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
									children: [
										/* @__PURE__ */ jsxs("span", {
											className: "font-bold",
											children: [side.option.tertiaryLabel, ":"]
										}),
										" ",
										side.option.tertiaryDisplay
									]
								}) : null
							]
						}),
						side.option.note ? /* @__PURE__ */ jsx("p", {
							className: "mt-3 text-xs leading-relaxed text-[var(--muted)]",
							children: side.option.note
						}) : null,
						/* @__PURE__ */ jsxs(Link, {
							href: side.option.href,
							className: "mt-4 inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-bold text-[var(--primary)] transition hover:border-[var(--primary)]/40",
							children: ["Abrir ", side.option.label]
						})
					]
				}, side.side))
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "URL compartible"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs text-[var(--foreground)]",
						children: shareHref
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							onClick: async () => {
								try {
									const absoluteUrl = typeof window === "undefined" ? shareHref : new URL(shareHref, window.location.origin).toString();
									await navigator.clipboard.writeText(absoluteUrl);
									setCopyState("copied");
								} catch {
									setCopyState("error");
								}
							},
							className: "h-auto min-h-0 rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: "Copiar enlace"
						}), /* @__PURE__ */ jsx(Link, {
							href: shareHref,
							className: "inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/40",
							children: "Abrir esta seleccion"
						})]
					}),
					copyState !== "idle" ? /* @__PURE__ */ jsx("p", {
						className: "mt-2 text-xs text-[var(--muted)]",
						children: copyState === "copied" ? "Enlace copiado al portapapeles." : "No se pudo copiar automaticamente el enlace."
					}) : null
				]
			}),
			/* @__PURE__ */ jsxs("article", {
				className: "rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 p-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Lectura comparativa"
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "mt-2 text-lg font-black text-[var(--foreground)]",
						children: comparisonSummary?.headline ?? "Sin comparativa disponible"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-sm text-[var(--muted)]",
						children: comparisonSummary?.detail ?? activeDimension.description
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-3 text-xs text-[var(--muted)]",
						children: activeDimension.description
					})
				]
			})
		]
	});
}
//#endregion
//#region src/server-functions/comparar.ts
var getCompareHubLoaderData = createServerFn({ method: "GET" }).handler(createSsrRpc("4cacafda8f5bee1f11533a32bcce837e053773389524fed5f8533a6fc360b145"));
//#endregion
//#region src/app/comparar.tsx
function getFirstSearchParam(value) {
	if (Array.isArray(value)) return value[0] ?? null;
	return value ?? null;
}
function CompareHubContent({ initialQuery, data }) {
	const comparisonCount = data.sections.reduce((count, section) => count + section.cards.length, 0);
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-3",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Comparativas activas"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: comparisonCount
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Lecturas listas para explorar ahora mismo."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Ultimo mes"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: data.latestMonth ? formatMonthLabel(data.latestMonth) : "Sin dato"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Referencia temporal mas reciente publicada."
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Generado"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: new Date(data.generatedAt).toLocaleDateString("es-ES")
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Snapshot compartido del comparador."
						})
					]
				})
			]
		}),
		shouldShowDataStateNotice(data.dataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: data.dataState,
			subject: "las comparativas del hub",
			description: "El comparador usa el mismo snapshot compartido que dashboard, informes y API. Si ves cobertura parcial o dataset antiguo, las lecturas comparativas pueden no estar completas.",
			href: appRoutes.status(),
			actionLabel: "Revisar estado"
		}) : null,
		/* @__PURE__ */ jsx(InteractiveComparePanel, {
			data: data.interactive,
			initialQuery
		}),
		data.sections.map((section) => /* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: section.title
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-black text-[var(--foreground)]",
					children: section.title
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: section.description
				})
			] }), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: section.cards.map((card) => /* @__PURE__ */ jsxs(Link, {
					to: card.href,
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
							children: card.eyebrow
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-2 text-lg font-black text-[var(--foreground)]",
							children: card.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-relaxed text-[var(--muted)]",
							children: card.summary
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 space-y-2 text-sm",
							children: [/* @__PURE__ */ jsx("p", {
								className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
								children: card.metricA
							}), /* @__PURE__ */ jsx("p", {
								className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]",
								children: card.metricB
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-sm font-bold text-[var(--primary)]",
							children: card.delta
						}),
						card.note ? /* @__PURE__ */ jsx("p", {
							className: "mt-2 text-xs leading-relaxed text-[var(--muted)]",
							children: card.note
						}) : null
					]
				}, card.id))
			})]
		}, section.id))
	] });
}
var Route$35 = createFileRoute("/comparar")({
	head: () => {
		const siteUrl = getSiteUrl();
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: "Hub comparativo para leer estacion vs estacion, barrio vs barrio, mes vs mes, ano vs ano y cambios de demanda, rankings y balance."
				},
				{
					property: "og:title",
					content: "Comparador - DatosBizi"
				},
				{
					property: "og:description",
					content: "Hub comparativo para leer estacion vs estacion, barrio vs barrio, mes vs mes, ano vs ano y cambios de demanda, rankings y balance."
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/comparar`
				},
				{
					name: "robots",
					content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: "Comparador - DatosBizi"
				},
				{
					name: "twitter:description",
					content: "Hub comparativo para leer estacion vs estacion, barrio vs barrio, mes vs mes, ano vs ano y cambios de demanda, rankings y balance."
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/comparar`
			}],
			title: "Comparador"
		};
	},
	loader: () => getCompareHubLoaderData(),
	component: ComparePage
});
function ComparePage() {
	const { breadcrumbs, structuredData, comparisonData } = Route$35.useLoaderData();
	const search = useSearch({ from: Route$35.fullPath });
	const initialQuery = {
		dimensionId: getFirstSearchParam(search.dimension),
		leftId: getFirstSearchParam(search.left),
		rightId: getFirstSearchParam(search.right)
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
				/* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: /* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Analisis comparativo"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Comparador"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Superficie publica para comparar estaciones, barrios, meses, anos, horas, periodos y cambios recientes de rankings, demanda y balance a partir del historico compartido."
							})
						]
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsx(Link, {
							to: appRoutes.dashboardView("research"),
							className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: "Abrir analisis del dashboard"
						}), /* @__PURE__ */ jsx(Link, {
							to: appRoutes.explore(),
							className: "ui-inline-action",
							children: "Volver al hub Explorar"
						})]
					}), /* @__PURE__ */ jsx(PublicSearchForm, {})]
				})
			]
		}),
		/* @__PURE__ */ jsx(CompareHubContent, {
			initialQuery,
			data: comparisonData
		})
	] });
}
//#endregion
//#region src/app/biciradar.tsx
var GOOGLE_GROUP_URL$1 = "https://groups.google.com/g/testers-biciradar";
var PLAY_STORE_URL$1 = "https://play.google.com/store/apps/details?id=com.gcaguilar.biciradar";
var APP_STORE_URL$1 = "https://apps.apple.com/es/app/biciradar/id6760931316";
var DOWNLOAD_CTA_BASE = {
	source: "biciradar_hero",
	ctaId: "app_external",
	isExternal: true,
	sourceRole: "utility",
	destinationRole: "utility",
	transitionKind: "within_public"
};
var DOWNLOAD_CTAS = [
	{
		href: APP_STORE_URL$1,
		label: "Descargar en App Store",
		destination: "app_store",
		className: "inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95",
		iconPath: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
	},
	{
		href: GOOGLE_GROUP_URL$1,
		label: "Android para testers",
		destination: "google_group",
		className: "inline-flex items-center gap-2 rounded-xl border border-[var(--primary)] bg-transparent px-5 py-2.5 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
		iconPath: "M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"
	},
	{
		href: PLAY_STORE_URL$1,
		label: "Abrir Google Play",
		destination: "google_play",
		className: "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/50",
		iconPath: "M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"
	}
];
var CITIES = [
	{
		name: "Zaragoza",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: true
	},
	{
		name: "Madrid",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: false
	},
	{
		name: "Barcelona",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: false
	},
	{
		name: "Valencia",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: false
	},
	{
		name: "Sevilla",
		flag: "🇪🇸",
		supportsEbikes: true,
		supportsUsagePatterns: false
	}
];
var FEATURES = [
	{
		icon: "📍",
		title: "Estaciones cercanas",
		description: "Encuentra las estaciones de bicicleta publica mas cercanas a tu posicion actual con distancia y direccion."
	},
	{
		icon: "🚲",
		title: "Bicis en tiempo real",
		description: "Consulta el numero de bicicletas disponibles en cada estacion, actualizado en tiempo real."
	},
	{
		icon: "🅿️",
		title: "Huecos libres",
		description: "Comprueba los anclajes libres antes de llegar para no quedarte sin sitio donde aparcar."
	},
	{
		icon: "⭐",
		title: "Estaciones favoritas",
		description: "Guarda tus estaciones mas usadas para acceder a su estado con un solo toque."
	},
	{
		icon: "📊",
		title: "Historico de uso",
		description: "Observa patrones de uso y disponibilidad historica para planificar mejor tus viajes."
	},
	{
		icon: "⚡",
		title: "Bicis electricas",
		description: "Identifica rapidamente estaciones con bicicletas electricas disponibles."
	},
	{
		icon: "🔔",
		title: "Alertas inteligentes",
		description: "Recibe notificaciones cuando una estacion muy utilizada se quede vacia o llena."
	},
	{
		icon: "🌙",
		title: "Modo offline",
		description: "Accede a tus estaciones favoritas y ultima posicion conocida sin conexion a internet."
	}
];
var Route$34 = createFileRoute("/biciradar")({
	head: () => {
		const siteUrl = getSiteUrl();
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: "La app definitiva para encontrar estaciones de bicis compartidas. Zaragoza, Madrid, Barcelona, Valencia y Sevilla. Bicis disponibles, huecos libres y estaciones favoritas."
				},
				{
					property: "og:title",
					content: "Bici Radar - App de bicis compartidas en tiempo real"
				},
				{
					property: "og:description",
					content: "La app definitiva para encontrar estaciones de bicis compartidas. Zaragoza, Madrid, Barcelona, Valencia y Sevilla. Bicis disponibles, huecos libres y estaciones favoritas."
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/biciradar`
				},
				{
					name: "robots",
					content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: "Bici Radar - App de bicis compartidas en tiempo real"
				},
				{
					name: "twitter:description",
					content: "La app definitiva para encontrar estaciones de bicis compartidas. Zaragoza, Madrid, Barcelona, Valencia y Sevilla. Bicis disponibles, huecos libres y estaciones favoritas."
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/biciradar`
			}],
			title: "Bici Radar - App de bicis compartidas en tiempo real"
		};
	},
	component: BiciRadarPage
});
function CityCard({ city }) {
	return /* @__PURE__ */ jsxs(Card, {
		variant: "stat",
		className: "flex-row items-center gap-3 px-4 py-3",
		children: [/* @__PURE__ */ jsx("span", {
			className: "text-2xl",
			children: city.flag
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex-1",
			children: [/* @__PURE__ */ jsx("h3", {
				className: "text-sm font-bold text-[var(--foreground)]",
				children: city.name
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-1 flex flex-wrap gap-1.5",
				children: [city.supportsEbikes && /* @__PURE__ */ jsx(Badge, {
					variant: "success",
					className: "px-2 py-0.5 text-[10px] normal-case tracking-normal",
					children: "Bicis electricas"
				}), city.supportsUsagePatterns && /* @__PURE__ */ jsx(Badge, {
					className: "px-2 py-0.5 text-[10px] normal-case tracking-normal",
					children: "Patrones de uso"
				})]
			})]
		})]
	});
}
function FeatureCard$1({ feature }) {
	return /* @__PURE__ */ jsxs(Card, {
		variant: "stat",
		className: "p-4",
		children: [/* @__PURE__ */ jsx("span", {
			className: "flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/12 text-lg",
			children: feature.icon
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
			className: "text-sm font-bold text-[var(--foreground)]",
			children: feature.title
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-xs text-[var(--muted)]",
			children: feature.description
		})] })]
	});
}
function DownloadCtas({ labels, classNameByDestination }) {
	return /* @__PURE__ */ jsx(Fragment$1, { children: DOWNLOAD_CTAS.map((cta) => /* @__PURE__ */ jsxs(TrackedAnchor, {
		href: cta.href,
		target: "_blank",
		rel: "noopener noreferrer",
		ctaEvent: {
			...DOWNLOAD_CTA_BASE,
			destination: cta.destination
		},
		className: classNameByDestination?.[cta.destination] ?? cta.className,
		children: [/* @__PURE__ */ jsx("svg", {
			className: "h-5 w-5",
			viewBox: "0 0 24 24",
			fill: "currentColor",
			"aria-hidden": "true",
			children: /* @__PURE__ */ jsx("path", { d: cta.iconPath })
		}), labels?.[cta.destination] ?? cta.label]
	}, cta.destination)) });
}
function BiciRadarPage() {
	const siteUrl = getSiteUrl();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Bici Radar",
		href: appRoutes.biciradar()
	});
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [buildBreadcrumbStructuredData(breadcrumbs), {
			"@type": "SoftwareApplication",
			name: "Bici Radar",
			description: "App para encontrar estaciones de bicis compartidas en Zaragoza, Madrid, Barcelona, Valencia y Sevilla. Bicis disponibles y huecos libres en tiempo real.",
			applicationCategory: "TravelApplication",
			operatingSystem: "Android, iOS",
			url: `${siteUrl}${appRoutes.biciradar()}`,
			offers: {
				"@type": "Offer",
				price: "0",
				priceCurrency: "EUR"
			},
			publisher: {
				"@type": "Organization",
				name: SITE_NAME,
				url: siteUrl
			}
		}]
	};
	return /* @__PURE__ */ jsxs(PageShell, {
		className: "gap-8 py-8 md:py-12",
		children: [
			/* @__PURE__ */ jsx(PublicPageViewTracker, {
				pageType: "product",
				template: "biciradar",
				pageSlug: "biciradar"
			}),
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
						activeItemId: "home",
						className: "mt-1"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col items-center text-center",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/60 text-4xl shadow-lg shadow-[var(--primary)]/25",
								children: "🚲"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl",
								children: "Bici Radar"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 max-w-xl text-base text-[var(--muted)] md:text-lg",
								children: "La app definitiva para encontrar bicis compartidas en tiempo real. Zaragoza, Madrid, Barcelona, Valencia y Sevilla."
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 max-w-2xl text-sm text-[var(--muted)]",
								children: "En iOS ya puedes descargar la version publica desde la App Store. En Android el acceso sigue siendo para testers: primero debes unirte al Google Group y despues abrir desde tu telefono el enlace de Google Play."
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-6 flex flex-wrap justify-center gap-3",
								children: /* @__PURE__ */ jsx(DownloadCtas, {})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsxs(Card, {
				variant: "stat",
				className: "rounded-2xl p-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mb-6 text-center",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-2xl font-black text-[var(--foreground)] md:text-3xl",
						children: "Ciudades disponibles"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-[var(--muted)]",
						children: "Bici Radar esta disponible en las principales ciudades de Espania"
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
					children: CITIES.map((city) => /* @__PURE__ */ jsx(CityCard, { city }, city.name))
				})]
			}) }),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsxs("div", {
				className: "mb-6 text-center",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-2xl font-black text-[var(--foreground)] md:text-3xl",
					children: "Caracteristicas"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-[var(--muted)]",
					children: "Todo lo que necesitas para moverte en bicicleta por la ciudad"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: FEATURES.map((feature) => /* @__PURE__ */ jsx(FeatureCard$1, { feature }, feature.title))
			})] }),
			/* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsxs(Card, {
				variant: "stat",
				className: "rounded-2xl p-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mb-6 text-center",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-black text-[var(--foreground)] md:text-3xl",
							children: "Descarga la app"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-sm text-[var(--muted)]",
							children: "iOS ya esta publicado · Android requiere acceso como tester"
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex flex-wrap justify-center gap-4",
						children: /* @__PURE__ */ jsx(DownloadCtas, {
							labels: {
								google_group: "1. Unirse al grupo (Android)",
								google_play: "2. Abrir Google Play en tu telefono",
								app_store: "App Store (iOS)"
							},
							classNameByDestination: {
								app_store: "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/50",
								google_group: "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/50",
								google_play: "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/50"
							}
						})
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-4 text-center text-xs text-[var(--muted)]",
						children: "En Android, el enlace de Google Play solo tiene sentido despues de unirte al grupo de testers y abrirlo desde tu telefono."
					})
				]
			}) })
		]
	});
}
//#endregion
//#region src/app/beta.tsx
var GOOGLE_GROUP_URL = "https://groups.google.com/g/testers-biciradar";
var PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.gcaguilar.biciradar";
var APP_STORE_URL = "https://apps.apple.com/es/app/biciradar/id6760931316";
var Route$33 = createFileRoute("/beta")({
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Bici Radar - iOS disponible y Android para testers";
		const description = "Bici Radar ya esta disponible en App Store para iPhone. En Android el acceso sigue para testers: unete al Google Group y abre desde tu telefono el enlace de Google Play.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/beta`
				},
				{
					name: "robots",
					content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/beta`
			}],
			title
		};
	},
	component: BetaPage
});
function FeatureCard({ icon, title, description }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "ui-section-card flex flex-col items-start gap-3",
		children: [/* @__PURE__ */ jsx("span", {
			className: "flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/12 text-lg",
			children: icon
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
			className: "text-sm font-bold text-[var(--foreground)]",
			children: title
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-xs text-[var(--muted)]",
			children: description
		})] })]
	});
}
function StepCard({ step, title, description }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
		children: [/* @__PURE__ */ jsx("span", {
			className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white",
			children: step
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
			className: "text-sm font-bold text-[var(--foreground)]",
			children: title
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-xs text-[var(--muted)]",
			children: description
		})] })]
	});
}
function FaqItem({ question, answer }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
		children: [/* @__PURE__ */ jsx("h3", {
			className: "text-sm font-bold text-[var(--foreground)]",
			children: question
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-2 text-xs leading-relaxed text-[var(--muted)]",
			children: answer
		})]
	});
}
function BetaPage() {
	const siteUrl = getSiteUrl();
	const breadcrumbs = createRootBreadcrumbs({
		label: "Bici Radar",
		href: appRoutes.beta()
	});
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			buildBreadcrumbStructuredData(breadcrumbs),
			{
				"@type": "MobileApplication",
				name: "Bici Radar - Estaciones y disponibilidad",
				description: "App para encontrar estaciones de Bizi Zaragoza cercanas, ver bicis y huecos libres en tiempo real y guardar favoritas. iOS disponible en App Store y Android en acceso para testers.",
				operatingSystem: "Android, iOS",
				applicationCategory: "TravelApplication",
				url: `${siteUrl}${appRoutes.beta()}`,
				installUrl: APP_STORE_URL,
				softwareVersion: "1.0",
				inLanguage: "es",
				offers: {
					"@type": "Offer",
					price: "0",
					priceCurrency: "EUR"
				},
				publisher: {
					"@type": "Organization",
					name: SITE_NAME,
					url: siteUrl
				},
				areaServed: {
					"@type": "City",
					name: "Zaragoza"
				}
			},
			{
				"@type": "FAQPage",
				mainEntity: [
					{
						"@type": "Question",
						name: "Que es la app de Bizi Zaragoza?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "Es una aplicacion movil que te permite encontrar estaciones de Bizi Zaragoza cercanas, ver en tiempo real cuantas bicicletas y huecos libres hay, y guardar tus estaciones favoritas para acceder a ellas rapidamente."
						}
					},
					{
						"@type": "Question",
						name: "Como puedo descargar la app?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "En iOS ya esta publicada en la App Store. En Android primero debes unirte al Google Group de testers y despues abrir desde tu telefono el enlace de Google Play para instalarla."
						}
					},
					{
						"@type": "Question",
						name: "La app es gratuita?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "Si, la app es completamente gratuita."
						}
					}
				]
			}
		]
	};
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsx(SiteBreadcrumbs, { items: breadcrumbs }),
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "max-w-3xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Disponibilidad por plataforma"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
								children: "Bici Radar en tu movil"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Encuentra estaciones cercanas, consulta bicis y huecos libres en tiempo real y guarda tus favoritas para tenerlas siempre a mano. En iOS ya puedes descargar la version publica desde la App Store. En Android el acceso sigue para testers: unete al Google Group y despues abre desde tu telefono el enlace de Google Play."
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "ui-chip",
								children: "Gratuita"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "ui-chip",
								children: "iOS publico"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "ui-chip",
								children: "Android testers"
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3",
					children: [
						/* @__PURE__ */ jsxs("a", {
							href: APP_STORE_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95",
							children: [/* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" })
							}), "Descargar en App Store"]
						}),
						/* @__PURE__ */ jsxs("a", {
							href: GOOGLE_GROUP_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex items-center gap-2 rounded-xl border border-[var(--primary)] bg-transparent px-5 py-2.5 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
							children: [/* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M17.523 2.237a.625.625 0 0 0-.857.228l-1.376 2.4A8.154 8.154 0 0 0 12 4.098c-1.153 0-2.254.264-3.29.767L7.334 2.465a.626.626 0 0 0-1.085.629l1.344 2.348A7.677 7.677 0 0 0 4 11.874h16a7.677 7.677 0 0 0-3.593-6.432l1.344-2.348a.625.625 0 0 0-.228-.857zM9 9.375a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zm6 0a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zM4 13.125v6.25A1.875 1.875 0 0 0 5.875 21.25h.75v2.375a1.375 1.375 0 1 0 2.75 0V21.25h1.25v2.375a1.375 1.375 0 1 0 2.75 0V21.25h.75A1.875 1.875 0 0 0 20 19.375v-6.25H4zM1.375 13.125a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5zm18.5 0a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5z" })
							}), "Unirse al grupo de testers"]
						}),
						/* @__PURE__ */ jsxs("a", {
							href: PLAY_STORE_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex items-center gap-2 rounded-xl border border-[var(--primary)] bg-transparent px-5 py-2.5 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
							children: [/* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z" })
							}), "Abrir Google Play"]
						})
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: "En Android abre el enlace de Google Play desde tu telefono despues de entrar en el grupo de testers."
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-4",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)] md:text-2xl",
				children: "Que puedes hacer con Bici Radar"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "Pensada para el dia a dia del usuario de BiziZaragoza."
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ jsx(FeatureCard, {
					icon: "📍",
					title: "Estaciones cercanas",
					description: "Localiza al instante las estaciones de Bizi mas cercanas a tu posicion actual con distancia y direccion."
				}),
				/* @__PURE__ */ jsx(FeatureCard, {
					icon: "🚲",
					title: "Bicis en tiempo real",
					description: "Consulta cuantas bicicletas hay disponibles en cada estacion, actualizado en tiempo real."
				}),
				/* @__PURE__ */ jsx(FeatureCard, {
					icon: "🅿️",
					title: "Huecos libres",
					description: "Comprueba los anclajes libres antes de llegar para no quedarte sin sitio donde aparcar."
				}),
				/* @__PURE__ */ jsx(FeatureCard, {
					icon: "⭐",
					title: "Estaciones favoritas",
					description: "Guarda las estaciones que mas usas para acceder a su estado con un solo toque."
				})
			]
		})] }),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)] md:text-2xl",
				children: "Como instalarla"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "El proceso cambia segun la plataforma."
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ jsxs("article", {
					className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
							children: "iOS"
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-2 text-base font-bold text-[var(--foreground)]",
							children: "Version publica en App Store"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "Si usas iPhone o iPad, ya puedes descargar Bici Radar como cualquier otra app publica. No hace falta TestFlight ni registro previo."
						}),
						/* @__PURE__ */ jsx("a", {
							href: APP_STORE_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "mt-4 inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: "Descargar en App Store"
						})
					]
				}), /* @__PURE__ */ jsxs("article", {
					className: "rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
							children: "Android"
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-2 text-base font-bold text-[var(--foreground)]",
							children: "Acceso para testers"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: "En Android todavia no esta abierto para todo el mundo. Primero tienes que entrar en el Google Group de testers y luego abrir desde tu telefono el enlace de Google Play."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 grid gap-3",
							children: [/* @__PURE__ */ jsx(StepCard, {
								step: 1,
								title: "Unete al Google Group",
								description: "Accede al grupo de testers para quedar habilitado como probador de la app en Android."
							}), /* @__PURE__ */ jsx(StepCard, {
								step: 2,
								title: "Abre Google Play desde tu telefono",
								description: "Cuando ya estes dentro del grupo, abre en tu movil el enlace de Google Play para instalar la app."
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ jsx("a", {
								href: GOOGLE_GROUP_URL,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "inline-flex rounded-xl border border-[var(--primary)] bg-transparent px-4 py-2 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
								children: "Unirse al grupo"
							}), /* @__PURE__ */ jsx("a", {
								href: PLAY_STORE_URL,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/40",
								children: "Abrir Google Play"
							})]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-2",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("span", {
							className: "flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/12 text-lg",
							children: /* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5 text-green-600 dark:text-green-400",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M17.523 2.237a.625.625 0 0 0-.857.228l-1.376 2.4A8.154 8.154 0 0 0 12 4.098c-1.153 0-2.254.264-3.29.767L7.334 2.465a.626.626 0 0 0-1.085.629l1.344 2.348A7.677 7.677 0 0 0 4 11.874h16a7.677 7.677 0 0 0-3.593-6.432l1.344-2.348a.625.625 0 0 0-.228-.857zM9 9.375a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zm6 0a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zM4 13.125v6.25A1.875 1.875 0 0 0 5.875 21.25h.75v2.375a1.375 1.375 0 1 0 2.75 0V21.25h1.25v2.375a1.375 1.375 0 1 0 2.75 0V21.25h.75A1.875 1.875 0 0 0 20 19.375v-6.25H4zM1.375 13.125a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5zm18.5 0a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5z" })
							})
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-bold text-[var(--foreground)]",
							children: "Android"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-amber-600 dark:text-amber-400",
							children: "Disponible para testers"
						})] })]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--muted)]",
						children: "Primero unete al Google Group y despues abre desde tu telefono el enlace de Google Play."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ jsx("a", {
							href: GOOGLE_GROUP_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex w-fit rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
							children: "Unirse al grupo"
						}), /* @__PURE__ */ jsx("a", {
							href: PLAY_STORE_URL,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex w-fit rounded-xl border border-[var(--primary)] bg-transparent px-4 py-2 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/8",
							children: "Abrir Google Play"
						})]
					})
				]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("span", {
							className: "flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)]/8 text-lg",
							children: /* @__PURE__ */ jsx("svg", {
								className: "h-5 w-5 text-[var(--muted)]",
								viewBox: "0 0 24 24",
								fill: "currentColor",
								"aria-hidden": "true",
								children: /* @__PURE__ */ jsx("path", { d: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" })
							})
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-bold text-[var(--foreground)]",
							children: "iOS"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-green-600 dark:text-green-400",
							children: "Version publica"
						})] })]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-[var(--muted)]",
						children: "La version publica ya esta disponible en la App Store para iPhone y iPad."
					}),
					/* @__PURE__ */ jsx("a", {
						href: APP_STORE_URL,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "inline-flex w-fit rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
						children: "Descargar en App Store"
					})
				]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)] md:text-2xl",
				children: "Preguntas frecuentes"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "Todo lo importante sobre la disponibilidad y la instalacion."
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "grid gap-3 md:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Que es Bici Radar?",
						answer: "Es una aplicacion movil que te permite encontrar estaciones de Bizi Zaragoza cercanas, ver en tiempo real cuantas bicicletas y huecos libres hay, y guardar tus estaciones favoritas para acceder a ellas rapidamente."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "La app es gratuita?",
						answer: "Si, la app es completamente gratuita. No tiene publicidad ni compras dentro de la app."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Como puedo descargar la app en Android?",
						answer: "Primero unete al Google Group de testers. Cuando ya estes dentro, abre desde tu telefono el enlace de Google Play para instalar la app."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Como puedo descargar la app en iOS?",
						answer: "Puedes descargar la app gratuitamente desde la App Store. Es la version publica y no necesitas invitacion ni TestFlight."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Que datos usa la app?",
						answer: "La app utiliza los datos publicos del sistema Bizi Zaragoza para mostrarte la disponibilidad en tiempo real de bicicletas y anclajes en cada estacion."
					}),
					/* @__PURE__ */ jsx(FaqItem, {
						question: "Como puedo enviar feedback?",
						answer: "Puedes enviarnos comentarios directamente desde Play Store o App Store. Tu opinion es clave para mejorar la app."
					})
				]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)] md:text-2xl",
				children: "Explora tambien"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-[var(--muted)]",
				children: "Mientras tanto, accede a toda la analitica desde el navegador."
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ jsxs(Link, {
						to: appRoutes.dashboard(),
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Dashboard en tiempo real"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Mapa interactivo, estado del sistema y alertas."
						})]
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: appRoutes.seoPage("estaciones-con-mas-bicis"),
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Estaciones con mas bicis"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Donde hay bicicletas disponibles ahora mismo."
						})]
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: appRoutes.dashboardStations(),
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Directorio de estaciones"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Ficha detallada de cada estacion del sistema."
						})]
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: appRoutes.reports(),
						className: "ui-surface-block ui-surface-block-interactive",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-[var(--foreground)]",
							children: "Informes mensuales"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-[11px] text-[var(--muted)]",
							children: "Archivo historico con datos agregados por mes."
						})]
					})
				]
			})]
		})
	] });
}
//#endregion
//#region src/app/about.tsx
var $$splitComponentImporter$2 = () => import("./about-BMaJpakb.js");
var Route$32 = createFileRoute("/about")({
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Sobre DatosBizi";
		const description = "DatosBizi es un panel de analitica de movilidad urbana para el sistema de bicicletas publicas Bizi Zaragoza.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/about`
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/about`
			}],
			title
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
//#endregion
//#region src/app/$.tsx
var $$splitNotFoundComponentImporter = () => import("./_-CMsSRxHZ.js");
var Route$31 = createFileRoute("/$")({
	loader: async ({ params }) => {
		const path = params._splat ?? "";
		const redirects = {
			inicio: "/",
			"api/docs": "/developers"
		};
		if (path in redirects) throw redirect({
			to: redirects[path],
			replace: true
		});
		if (path.startsWith("zaragoza/")) {
			const rest = path.slice(9);
			if (rest) throw redirect({
				to: `/${rest}`,
				replace: true
			});
		}
		if (path.startsWith("dashboard/status")) throw redirect({
			to: "/estado",
			replace: true
		});
		throw notFound();
	},
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
//#endregion
//#region src/app/dashboard/route.tsx
var $$splitComponentImporter$1 = () => import("./route-Cx7vJ1gr.js");
var Route$30 = createFileRoute("/dashboard")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
//#endregion
//#region src/app/index.tsx
var $$splitComponentImporter = () => import("./app-f4pnnqmi.js");
var Route$29 = createFileRoute("/")({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{
				name: "description",
				content: SEO_SITE_DESCRIPTION
			},
			{
				property: "og:title",
				content: SEO_SITE_TITLE
			},
			{
				property: "og:description",
				content: SEO_SITE_DESCRIPTION
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:url",
				content: getSiteUrl()
			},
			{
				name: "robots",
				content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:title",
				content: SEO_SITE_TITLE
			},
			{
				name: "twitter:description",
				content: SEO_SITE_DESCRIPTION
			}
		],
		links: [{
			rel: "canonical",
			href: getSiteUrl()
		}],
		title: SEO_SITE_TITLE
	}),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var DEFAULT_RATE_WINDOW_MS = 6e4;
/**
* Hash an API key for storage
*/
function hashApiKey(key) {
	return createHash("sha256").update(key).digest("hex");
}
/**
* Validate an API key and return its info if valid
*/
async function validateApiKey(providedKey) {
	if (!providedKey) return null;
	const keyHash = hashApiKey(providedKey);
	const record = await prisma.apiKey.findUnique({ where: { keyHash } });
	if (!record) return null;
	if (!record.isActive || record.revokedAt) return null;
	prisma.apiKey.update({
		where: { id: record.id },
		data: {
			lastUsedAt: /* @__PURE__ */ new Date(),
			requestCount: { increment: 1 }
		}
	}).catch((error) => {
		logger.warn("api_key.usage_update_failed", { error });
	});
	return {
		id: record.id,
		name: record.name,
		keyPrefix: record.keyPrefix,
		description: record.description,
		ownerEmail: record.ownerEmail,
		isActive: record.isActive,
		lastUsedAt: record.lastUsedAt,
		requestCount: record.requestCount,
		createdAt: record.createdAt,
		customRateLimit: record.customRateLimit,
		customRateWindow: record.customRateWindow
	};
}
/**
* Get rate limits for an API key (custom or defaults)
*/
function getApiKeyRateLimits(apiKeyInfo) {
	if (apiKeyInfo?.customRateLimit && apiKeyInfo?.customRateWindow) return {
		limit: apiKeyInfo.customRateLimit,
		windowMs: apiKeyInfo.customRateWindow
	};
	return {
		limit: 100,
		windowMs: DEFAULT_RATE_WINDOW_MS
	};
}
/**
* Check if API keys feature is configured
* Returns true if we should use multi-key system, false for legacy single-key
*/
function isMultiKeySystemEnabled() {
	return !process.env.PUBLIC_API_KEY?.trim();
}
//#endregion
//#region src/lib/oauth.ts
var OAUTH_SCOPE = "public_api.read";
function getOAuthJwtSecret() {
	const configuredSecret = process.env.JWT_SECRET?.trim();
	if (!configuredSecret) return null;
	return new TextEncoder$1().encode(configuredSecret);
}
function getOAuthIssuer() {
	return getSiteUrl();
}
function getOAuthScope() {
	return OAUTH_SCOPE;
}
function getProtectedResourceMetadataUrl() {
	return `${getSiteUrl()}/.well-known/oauth-protected-resource`;
}
async function verifyOAuthAccessToken(token) {
	const jwtSecret = getOAuthJwtSecret();
	if (!jwtSecret) return null;
	try {
		const { payload } = await jwtVerify(token, jwtSecret, {
			issuer: getOAuthIssuer(),
			audience: getSiteUrl()
		});
		if (payload.tokenUse !== "oauth_access") return null;
		return payload;
	} catch {
		return null;
	}
}
//#endregion
//#region src/lib/security/rate-limit.ts
function normalizeKeyPart(value) {
	if (value === null || value === void 0 || value === "") return "unknown";
	return String(value).replace(/[^a-zA-Z0-9:_-]/g, "_");
}
function getRateLimitHeaders(decision) {
	return {
		"X-RateLimit-Limit": String(decision.limit),
		"X-RateLimit-Remaining": String(decision.remaining),
		"X-RateLimit-Reset": String(Math.ceil(decision.resetAt / 1e3))
	};
}
async function consumeRateLimit(options) {
	const now = Date.now();
	const resetAt = now + options.windowMs;
	const client = await getRedisClient();
	if (!client) {
		updateExecutionContext({ cacheBackend: "redis-unavailable" });
		logger.warn("rate_limit.redis_unavailable", { namespace: options.namespace });
		return {
			allowed: true,
			limit: options.limit,
			remaining: options.limit,
			resetAt,
			retryAfterSeconds: 0,
			backend: "bypass"
		};
	}
	const key = [
		"ratelimit",
		getCity(),
		normalizeKeyPart(options.namespace),
		...options.identifierParts.map((part) => normalizeKeyPart(part))
	].join(":");
	const counter = await client.incr(key);
	if (counter === 1) await client.pExpire(key, options.windowMs);
	let ttlMs = await client.pTTL(key);
	if (ttlMs < 0) {
		ttlMs = options.windowMs;
		await client.pExpire(key, options.windowMs);
	}
	const decision = {
		allowed: counter <= options.limit,
		limit: options.limit,
		remaining: Math.max(0, options.limit - counter),
		resetAt: now + ttlMs,
		retryAfterSeconds: counter <= options.limit ? 0 : Math.max(1, Math.ceil(ttlMs / 1e3)),
		backend: "redis"
	};
	updateExecutionContext({
		cacheBackend: "redis",
		rateLimited: !decision.allowed
	});
	return decision;
}
//#endregion
//#region src/lib/security/public-api.ts
function getBearerChallengeHeader() {
	return `Bearer realm="BiziDashboard API", scope="${getOAuthScope()}", resource_metadata="${getProtectedResourceMetadataUrl()}"`;
}
/**
* Validate API key using either multi-key system or legacy single-key
*/
async function validatePublicApiKey(providedKey) {
	if (!isMultiKeySystemEnabled()) {
		const configuredKey = getPublicApiKey();
		if (!configuredKey) return {
			valid: false,
			info: null
		};
		return {
			valid: isApiKeyValid(providedKey, configuredKey),
			info: null
		};
	}
	if (!providedKey) return {
		valid: false,
		info: null
	};
	const info = await validateApiKey(providedKey);
	return {
		valid: info !== null,
		info
	};
}
async function enforcePublicApiAccess(options) {
	const publicApiKey = readPublicApiKey(options.request.headers);
	const bearerToken = options.request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
	const oauthPayload = bearerToken ? await verifyOAuthAccessToken(bearerToken) : null;
	if (options.requireApiKey && !isMultiKeySystemEnabled() && !getPublicApiKey()) return {
		ok: false,
		response: Response.json({ error: "Public API key is not configured for this elevated route." }, { status: 503 })
	};
	if (oauthPayload && oauthPayload.scope.split(/\s+/u).includes(getOAuthScope())) {
		const keyDecision = await consumeRateLimit({
			namespace: `${options.namespace}:oauth-client`,
			identifierParts: [oauthPayload.clientId],
			limit: options.limit,
			windowMs: options.windowMs
		});
		const headers = getRateLimitHeaders(keyDecision);
		if (keyDecision.backend === "unavailable") return {
			ok: false,
			response: Response.json({ error: "Rate limiting backend unavailable." }, {
				status: 503,
				headers
			})
		};
		if (!keyDecision.allowed) return {
			ok: false,
			response: Response.json({ error: "Too many requests for this route." }, {
				status: 429,
				headers: {
					...headers,
					"Retry-After": String(keyDecision.retryAfterSeconds)
				}
			})
		};
		return {
			ok: true,
			headers,
			providedKey: null,
			apiKeyInfo: null
		};
	}
	const validation = await validatePublicApiKey(publicApiKey);
	if (options.requireApiKey && !validation.valid) {
		await recordSecurityEvent({
			eventType: "auth_failed",
			route: options.route,
			requestId: options.requestId,
			ip: options.clientIp,
			userAgent: options.userAgent,
			outcome: "denied",
			reasonCode: "public_api_key_invalid"
		});
		return {
			ok: false,
			response: Response.json({ error: "Valid X-Public-Api-Key required for this route." }, {
				status: 401,
				headers: { "WWW-Authenticate": getBearerChallengeHeader() }
			})
		};
	}
	const rateLimits = validation.info ? getApiKeyRateLimits(validation.info) : {
		limit: options.limit,
		windowMs: options.windowMs
	};
	const rateLimitKey = validation.info?.id ?? publicApiKey ?? options.clientIp;
	const keyDecision = await consumeRateLimit({
		namespace: `${options.namespace}:key`,
		identifierParts: [rateLimitKey],
		limit: rateLimits.limit,
		windowMs: rateLimits.windowMs
	});
	const headers = getRateLimitHeaders(keyDecision);
	if (keyDecision.backend === "unavailable") return {
		ok: false,
		response: Response.json({ error: "Rate limiting backend unavailable." }, {
			status: 503,
			headers
		})
	};
	if (!keyDecision.allowed) {
		await recordSecurityEvent({
			eventType: "rate_limit_exceeded",
			route: options.route,
			requestId: options.requestId,
			ip: options.clientIp,
			userAgent: options.userAgent,
			outcome: "denied",
			reasonCode: "rate_limit"
		});
		return {
			ok: false,
			response: Response.json({ error: "Too many requests for this route." }, {
				status: 429,
				headers: {
					...headers,
					"Retry-After": String(keyDecision.retryAfterSeconds)
				}
			})
		};
	}
	return {
		ok: true,
		headers,
		providedKey: publicApiKey,
		apiKeyInfo: validation.info
	};
}
//#endregion
//#region src/lib/api-response.ts
function errorResponse$1(message, status = 500, requestId) {
	return Response.json({
		error: message,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		dataState: "error",
		...requestId && { requestId }
	}, { status });
}
//#endregion
//#region src/app/api/openapi[.]json.ts
var PUBLIC_ROUTE_RATE_LIMIT$6 = {
	limit: 20,
	windowMs: 6e4
};
var Route$28 = createFileRoute("/api/openapi.json")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const access = await enforcePublicApiAccess({
			route: "/api/openapi.json",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-openapi",
			limit: PUBLIC_ROUTE_RATE_LIMIT$6.limit,
			windowMs: PUBLIC_ROUTE_RATE_LIMIT$6.windowMs,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		return new Response(JSON.stringify(openApiDocument), {
			status: 200,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.openapi",
			operation: "GET /api/openapi.json"
		});
		return errorResponse$1("Failed to serve OpenAPI document", 500);
	}
} } } });
//#endregion
//#region src/app/dashboard/status/index.tsx
var Route$27 = createFileRoute("/dashboard/status/")({
	head: () => {
		const title = "Estado del sistema - Dashboard Bizi";
		const description = "Estado del sistema DatosBizi. Salud, última muestra, cobertura e incidencias del sistema Bizi Zaragoza.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					name: "robots",
					content: "noindex, nofollow"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			title
		};
	},
	loader: () => getSystemStatusPageData(),
	component: DashboardStatusPage
});
function DashboardStatusPage() {
	const { status, dataset, activeStationsCount, activeIncidentCount } = Route$27.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsxs("header", {
			className: "ui-page-hero",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
					children: "Estado del dashboard"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
					children: "Estado operativo de DatosBizi"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-[var(--muted)] md:text-base",
					children: "Resumen directo del estado de datos usado por el dashboard, sin redirecciones ni pantallas intermedias."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-5 flex flex-wrap gap-3",
					children: [/* @__PURE__ */ jsx("a", {
						className: "ui-inline-action",
						href: appRoutes.status(),
						children: "Abrir estado completo"
					}), /* @__PURE__ */ jsx("a", {
						className: "ui-inline-action",
						href: appRoutes.dashboard(),
						children: "Volver al dashboard"
					})]
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
						children: "Salud"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: getHealthLabel(status.pipeline.healthStatus)
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Ultima muestra"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: formatStatusDateTime(dataset.lastUpdated.lastSampleAt)
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Cobertura"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: getCoverageLabel(dataset)
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Estaciones activas"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: formatStatusNumber(activeStationsCount)
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "ui-section-card",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-xl font-black text-[var(--foreground)]",
				children: "Incidencias activas"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-2 text-sm text-[var(--muted)]",
				children: activeIncidentCount > 0 ? `${activeIncidentCount} incidencias requieren seguimiento operativo.` : "No hay incidencias activas."
			})]
		})
	] });
}
//#endregion
//#region src/server-functions/dashboard-redistribucion.ts
var RebalancingSearchParamsSchema = z.object({
	sort: z.union([z.string(), z.array(z.string())]).optional(),
	filter: z.union([z.string(), z.array(z.string())]).optional(),
	search: z.union([z.string(), z.array(z.string())]).optional(),
	page: z.union([z.string(), z.array(z.string())]).optional(),
	pageSize: z.union([z.string(), z.array(z.string())]).optional()
}).default({});
var getDashboardRebalancingPageData = createServerFn({ method: "GET" }).inputValidator(RebalancingSearchParamsSchema).handler(createSsrRpc("67a06b4f5a19b3a11e7d26444e7ddddf2b16f6bcd3f3a0d3e1678de310ce0673"));
//#endregion
//#region src/app/dashboard/redistribucion/index.tsx
var Route$26 = createFileRoute("/dashboard/redistribucion/")({
	head: () => {
		const title = "Redistribución | Dashboard Bizi";
		const description = "Informe de redistribución de bicicletas Bizi Zaragoza. Análisis de demanda por distrito y recomendaciones de reequilibrio.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					name: "robots",
					content: "noindex, nofollow"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			title
		};
	},
	loader: async ({ searchParams }) => getDashboardRebalancingPageData({ data: searchParams ? await searchParams : {} }),
	component: RedistribucionPage
});
function RedistribucionPage() {
	const { report, districtNames, tableParams } = Route$26.useLoaderData();
	return /* @__PURE__ */ jsx(Suspense, { children: /* @__PURE__ */ jsx(RedistribucionClientWrapper, {
		initialReport: report,
		districtNames,
		tableParams
	}) });
}
async function RedistribucionClientWrapper({ initialReport, districtNames, tableParams }) {
	const { RedistribucionClient } = await import("./RedistribucionClient-Cz9IgAoT.js");
	return /* @__PURE__ */ jsx(RedistribucionClient, {
		initialReport,
		districtNames,
		tableParams
	});
}
//#endregion
//#region src/app/dashboard/_components/MonthFilter.tsx
function MonthFilterContent({ months, activeMonth, className, routeKey = "dashboard_unknown", source = "month_filter" }) {
	const router = useRouter();
	const location = useLocation();
	const pathname = location.pathname;
	const searchParams = new URLSearchParams(location.searchStr ?? "");
	const monthOptions = toMonthOptions(months);
	if (monthOptions.length === 0) return null;
	const updateMonth = (nextMonth) => {
		const nextParams = new URLSearchParams(searchParams.toString());
		trackUmamiEvent(buildFilterChangeEvent({
			surface: "dashboard",
			routeKey,
			module: "month_filter",
			source,
			monthPresent: Boolean(nextMonth)
		}));
		if (nextMonth) nextParams.set("month", nextMonth);
		else nextParams.delete("month");
		const nextQuery = nextParams.toString();
		router.navigate({
			to: nextQuery ? `${pathname}?${nextQuery}` : pathname,
			replace: true
		});
	};
	return /* @__PURE__ */ jsx("div", {
		className,
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 shadow-[var(--shadow-soft)]",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
					children: "Mes"
				}),
				/* @__PURE__ */ jsx(Button, {
					onClick: () => updateMonth(null),
					className: `rounded-full border px-3 py-1 text-xs font-semibold transition ${activeMonth === null ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"}`,
					variant: "ghost",
					size: "sm",
					children: "Acumulado"
				}),
				monthOptions.map((month) => /* @__PURE__ */ jsx(Button, {
					onClick: () => updateMonth(month.key),
					className: `rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${activeMonth === month.key ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"}`,
					variant: "ghost",
					size: "sm",
					children: month.label
				}, month.key))
			]
		})
	});
}
function MonthFilter(props) {
	return /* @__PURE__ */ jsx(Suspense, {
		fallback: /* @__PURE__ */ jsx(Skeleton, { className: "h-10 w-full rounded-xl" }),
		children: /* @__PURE__ */ jsx(MonthFilterContent, { ...props })
	});
}
//#endregion
//#region src/app/dashboard/_components/mobility-insights-model.ts
var PERIODS = [
	{
		key: "all",
		label: "Todo el dia",
		from: 0,
		to: 23
	},
	{
		key: "morning",
		label: "Mañana",
		from: 6,
		to: 11
	},
	{
		key: "midday",
		label: "Mediodia",
		from: 12,
		to: 16
	},
	{
		key: "evening",
		label: "Tarde",
		from: 17,
		to: 21
	},
	{
		key: "night",
		label: "Noche",
		from: 22,
		to: 5
	}
];
function getPeriodByHour(hour) {
	if (hour >= 6 && hour <= 11) return "morning";
	if (hour >= 12 && hour <= 16) return "midday";
	if (hour >= 17 && hour <= 21) return "evening";
	return "night";
}
function isPeriodKey(value) {
	if (!value) return false;
	return PERIODS.some((period) => period.key === value);
}
function resolvePeriod(value) {
	return isPeriodKey(value) ? value : "all";
}
function getDayLabel(day) {
	if (typeof day !== "string" || day.length < 10) return day;
	const month = day.slice(5, 7);
	return `${day.slice(8, 10)}/${month}`;
}
function getMatrixCellColor(value, maxValue) {
	if (!Number.isFinite(value) || value <= 0 || maxValue <= 0) return "rgba(176, 129, 135, 0.16)";
	return `rgba(234, 6, 21, ${.2 + Math.min(1, Math.max(0, value / maxValue)) * .72})`;
}
function isObject(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function isMobilityResponse(value) {
	return isObject(value) && typeof value.methodology === "string" && typeof value.generatedAt === "string" && Array.isArray(value.hourlySignals) && Array.isArray(value.dailyDemand);
}
function toSafeNumber(value) {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : 0;
}
function buildStationDistrictLookup(stations, districts) {
	if (!districts) return /* @__PURE__ */ new Map();
	return buildStationDistrictMap(stations, districts);
}
function buildPeriodInsights(mobilityData, stationDistrictMap) {
	if (!mobilityData) return [];
	const periodMaps = /* @__PURE__ */ new Map();
	PERIODS.forEach((period) => {
		periodMaps.set(period.key, /* @__PURE__ */ new Map());
	});
	for (const row of mobilityData.hourlySignals) {
		const district = stationDistrictMap.get(row.stationId);
		if (!district) continue;
		const hour = Number(row.hour);
		const departures = Math.max(0, toSafeNumber(row.departures));
		const arrivals = Math.max(0, toSafeNumber(row.arrivals));
		const periodsToUpdate = ["all"];
		if (Number.isFinite(hour)) periodsToUpdate.push(getPeriodByHour(hour));
		for (const periodKey of periodsToUpdate) {
			const districtMap = periodMaps.get(periodKey);
			if (!districtMap) continue;
			const current = districtMap.get(district) ?? {
				outbound: 0,
				inbound: 0,
				hourly: /* @__PURE__ */ new Map()
			};
			current.outbound += departures;
			current.inbound += arrivals;
			if (Number.isFinite(hour)) {
				const hourSignal = current.hourly.get(hour) ?? {
					departures: 0,
					arrivals: 0
				};
				hourSignal.departures += departures;
				hourSignal.arrivals += arrivals;
				current.hourly.set(hour, hourSignal);
			}
			districtMap.set(district, current);
		}
	}
	return PERIODS.map((period) => {
		const districtMap = periodMaps.get(period.key) ?? /* @__PURE__ */ new Map();
		const districtRows = Array.from(districtMap.entries()).map(([district, values]) => ({
			district,
			outbound: values.outbound,
			inbound: values.inbound,
			volume: values.outbound + values.inbound,
			net: values.inbound - values.outbound
		})).sort((left, right) => right.volume - left.volume);
		const matrix = districtRows.map((origin) => {
			const originHourly = districtMap.get(origin.district)?.hourly;
			return districtRows.map((destination) => {
				if (origin.district === destination.district) return 0;
				const destHourly = districtMap.get(destination.district)?.hourly;
				if (!originHourly || !destHourly) return 0;
				let affinity = 0;
				for (const [hour, originSignal] of originHourly.entries()) {
					const destSignal = destHourly.get(hour);
					if (!destSignal) continue;
					affinity += Math.min(originSignal.departures, destSignal.arrivals);
				}
				return affinity;
			});
		});
		const maxFlow = matrix.reduce((max, values) => Math.max(max, values.reduce((innerMax, value) => Math.max(innerMax, value), 0)), 0);
		return {
			key: period.key,
			label: period.label,
			districts: districtRows,
			matrix,
			maxFlow,
			totalFlow: districtRows.reduce((sum, row) => sum + row.outbound, 0)
		};
	});
}
function buildTopRoutes(activeInsights) {
	if (!activeInsights) return [];
	const candidates = [];
	activeInsights.matrix.forEach((originRow, originIndex) => {
		originRow.forEach((value, destinationIndex) => {
			if (value <= 0 || originIndex === destinationIndex) return;
			const origin = activeInsights.districts[originIndex]?.district;
			const destination = activeInsights.districts[destinationIndex]?.district;
			if (!origin || !destination) return;
			candidates.push({
				origin,
				destination,
				flow: value
			});
		});
	});
	return candidates.sort((left, right) => right.flow - left.flow).slice(0, 12);
}
function resolveSelectedDistrictName(activeInsights, selectedDistrict, currentSelection) {
	if (!activeInsights || activeInsights.districts.length === 0) return "";
	if (currentSelection && activeInsights.districts.some((district) => district.district === currentSelection)) return currentSelection;
	return selectedDistrict ?? activeInsights.districts[0]?.district ?? "";
}
function buildTopEmitterTowardReference(activeInsights, selectedDistrictName) {
	if (!activeInsights || !selectedDistrictName) return null;
	const refIndex = activeInsights.districts.findIndex((district) => district.district === selectedDistrictName);
	if (refIndex < 0) return null;
	let bestIndex = -1;
	let bestFlow = 0;
	for (let index = 0; index < activeInsights.matrix.length; index += 1) {
		if (index === refIndex) continue;
		const value = activeInsights.matrix[index]?.[refIndex] ?? 0;
		if (value > bestFlow) {
			bestFlow = value;
			bestIndex = index;
		}
	}
	if (bestIndex < 0 || bestFlow <= 0) return null;
	return {
		district: activeInsights.districts[bestIndex].district,
		flow: bestFlow
	};
}
function buildTopReceiverFromReference(activeInsights, selectedDistrictName) {
	if (!activeInsights || !selectedDistrictName) return null;
	const refIndex = activeInsights.districts.findIndex((district) => district.district === selectedDistrictName);
	if (refIndex < 0) return null;
	let bestIndex = -1;
	let bestFlow = 0;
	for (let index = 0; index < activeInsights.matrix.length; index += 1) {
		if (index === refIndex) continue;
		const value = activeInsights.matrix[refIndex]?.[index] ?? 0;
		if (value > bestFlow) {
			bestFlow = value;
			bestIndex = index;
		}
	}
	if (bestIndex < 0 || bestFlow <= 0) return null;
	return {
		district: activeInsights.districts[bestIndex].district,
		flow: bestFlow
	};
}
function buildDailyCurveData(mobilityData) {
	if (!mobilityData) return [];
	return mobilityData.dailyDemand.map((row) => ({
		day: row.day,
		label: getDayLabel(row.day),
		demandScore: toSafeNumber(row.demandScore),
		avgOccupancyRatio: toSafeNumber(row.avgOccupancy)
	}));
}
function buildChordNodes(activeInsights) {
	if (!activeInsights || activeInsights.districts.length === 0) return [];
	const radius = 115;
	const center = 140;
	return activeInsights.districts.map((district, index) => {
		const angle = Math.PI * 2 * index / activeInsights.districts.length - Math.PI / 2;
		return {
			district: district.district,
			x: center + radius * Math.cos(angle),
			y: center + radius * Math.sin(angle)
		};
	});
}
function buildChordLinks(chordNodes, topRoutes) {
	if (chordNodes.length === 0) return [];
	const nodeNames = new Set(chordNodes.map((node) => node.district));
	return topRoutes.filter((route) => nodeNames.has(route.origin) && nodeNames.has(route.destination)).slice(0, 12);
}
//#endregion
//#region src/app/dashboard/_components/MobilityInsights.tsx
function MobilityInsightsContent({ stations, selectedStationId, mobilityDays = 14, demandDays = 30 }) {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.searchStr ?? "");
	const [mobilityData, setMobilityData] = useState(null);
	const [districts, setDistricts] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState(null);
	const [selectedDistrictName, setSelectedDistrictName] = useState("");
	const selectedMonth = searchParams.get("month");
	const activePeriod = resolvePeriod(searchParams.get("period"));
	useEffect(() => {
		const controller = new AbortController();
		let isActive = true;
		const loadData = async () => {
			try {
				setIsLoading(true);
				setErrorMessage(null);
				const searchParams = new URLSearchParams({
					mobilityDays: String(mobilityDays),
					demandDays: String(demandDays)
				});
				if (selectedMonth) searchParams.set("month", selectedMonth);
				const [mobilityResponse, districtsPayload] = await Promise.all([fetch(`${appRoutes.api.mobility()}?${searchParams.toString()}`, { signal: controller.signal }), fetchDistrictCollection(controller.signal)]);
				if (!mobilityResponse.ok || !districtsPayload) throw new Error("No se pudieron cargar los datos de movilidad.");
				const mobilityPayload = await mobilityResponse.json();
				if (!isActive) return;
				if (!isMobilityResponse(mobilityPayload)) throw new Error("Respuesta de movilidad invalida.");
				if (!isDistrictCollection(districtsPayload)) throw new Error("GeoJSON de distritos invalido.");
				setMobilityData(mobilityPayload);
				setDistricts(districtsPayload);
			} catch (error) {
				if (error.name === "AbortError") return;
				captureExceptionWithContext(error, {
					area: "dashboard.mobility-insights",
					operation: "loadData",
					extra: {
						mobilityDays,
						demandDays,
						selectedMonth
					}
				});
				console.error("[Dashboard] Error cargando movilidad", error);
				if (isActive) setErrorMessage("No se pudieron cargar los insights de movilidad.");
			} finally {
				if (isActive) setIsLoading(false);
			}
		};
		loadData();
		return () => {
			isActive = false;
			controller.abort();
		};
	}, [
		demandDays,
		mobilityDays,
		selectedMonth
	]);
	const stationDistrictMap = useMemo(() => {
		return buildStationDistrictLookup(stations, districts);
	}, [districts, stations]);
	const periodInsights = useMemo(() => {
		return buildPeriodInsights(mobilityData, stationDistrictMap);
	}, [mobilityData, stationDistrictMap]);
	const activeInsights = periodInsights.find((insights) => insights.key === activePeriod) ?? periodInsights[0];
	const topRoutes = useMemo(() => buildTopRoutes(activeInsights), [activeInsights]);
	const selectedDistrict = selectedStationId ? stationDistrictMap.get(selectedStationId) ?? null : null;
	useEffect(() => {
		setSelectedDistrictName((current) => {
			return resolveSelectedDistrictName(activeInsights, selectedDistrict, current);
		});
	}, [activeInsights, selectedDistrict]);
	const selectedDistrictFlow = activeInsights?.districts.find((district) => district.district === selectedDistrictName);
	/** Barrio distinto del de referencia con mayor flujo estimado matrix[i][ref] (aportes hacia el referencia). */
	const topEmitterTowardRef = useMemo(() => buildTopEmitterTowardReference(activeInsights, selectedDistrictName), [activeInsights, selectedDistrictName]);
	/** Barrio distinto con mayor flujo estimado matrix[ref][j] (recibe salidas del referencia). */
	const topReceiverFromRef = useMemo(() => buildTopReceiverFromReference(activeInsights, selectedDistrictName), [activeInsights, selectedDistrictName]);
	const dailyCurveData = useMemo(() => buildDailyCurveData(mobilityData), [mobilityData]);
	const chordNodes = useMemo(() => buildChordNodes(activeInsights), [activeInsights]);
	const chordLinks = useMemo(() => buildChordLinks(chordNodes, topRoutes), [chordNodes, topRoutes]);
	const mobilityDataState = resolveMobilityDataState({
		dailyDemandCount: mobilityData?.dailyDemand.length ?? 0,
		hourlySignalCount: mobilityData?.hourlySignals.length ?? 0,
		requestedDemandDays: demandDays
	});
	const resolvedMobilityState = isLoading ? "loading" : errorMessage ? "error" : mobilityData?.dataState ?? mobilityDataState;
	const canRenderInsights = resolvedMobilityState === "ok" || resolvedMobilityState === "partial" || resolvedMobilityState === "stale";
	return /* @__PURE__ */ jsxs("section", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-3xl font-black leading-tight tracking-tight text-[var(--foreground)]",
					children: "Analisis de flujo por barrios"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-[var(--muted)]",
					children: "Distribucion interdistrital de trayectos y metricas de balance neto."
				})] }), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)]/80 p-1",
					children: PERIODS.map((period) => /* @__PURE__ */ jsx(Link, {
						href: appRoutes.dashboardFlow({
							month: selectedMonth,
							period: period.key === "all" ? null : period.key
						}),
						"aria-current": activePeriod === period.key ? "page" : void 0,
						className: `rounded-md px-4 py-1.5 text-xs font-bold transition ${activePeriod === period.key ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`,
						children: period.label
					}, period.key))
				})]
			}),
			shouldShowDataStateNotice(resolvedMobilityState) ? /* @__PURE__ */ jsx(DataStateNotice, {
				state: resolvedMobilityState,
				subject: "los insights de movilidad",
				description: errorMessage ?? (isLoading ? "Estamos calculando flujo, rutas y demanda agregada." : resolvedMobilityState === "partial" ? "Hay datos suficientes para analizar movilidad, pero la ventana disponible es parcial." : resolvedMobilityState === "stale" ? "Las curvas estan disponibles, pero el dataset actual no esta fresco." : "No hay datos de movilidad suficientes para esta ventana."),
				href: appRoutes.status(),
				actionLabel: "Ver estado"
			}) : null,
			canRenderInsights && mobilityData && activeInsights ? /* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-6 xl:grid-cols-12",
				children: [
					/* @__PURE__ */ jsxs(Card, {
						className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-8",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap items-start justify-between gap-3",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
									className: "text-lg font-bold text-[var(--foreground)]",
									children: "Diagrama chord interdistrital"
								}), /* @__PURE__ */ jsx("p", {
									className: "mt-1 max-w-2xl text-xs leading-relaxed text-[var(--muted)]",
									children: "Resume de un vistazo que barrios parecen enviar o recibir mas flujo en el periodo activo. Cada nodo es un barrio y cada curva representa un corredor estimado: cuanto mas marcada, mas volumen relativo."
								})] }), /* @__PURE__ */ jsxs("div", {
									className: "text-right text-xs text-[var(--muted)]",
									children: [/* @__PURE__ */ jsxs("span", { children: ["Barrios representados: ", chordNodes.length] }), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Link, {
										href: appRoutes.dashboardHelp("diagrama-chord"),
										className: "font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
										children: "Como interpretarlo"
									}) })]
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-4 flex items-center justify-center rounded-full border border-dashed border-[var(--border)] bg-[var(--secondary)] py-4",
								children: /* @__PURE__ */ jsxs("svg", {
									viewBox: "0 0 280 280",
									className: "h-[260px] w-[260px]",
									children: [
										/* @__PURE__ */ jsx("circle", {
											cx: "140",
											cy: "140",
											r: "116",
											fill: "none",
											stroke: "rgba(234,6,21,0.22)"
										}),
										chordLinks.map((link, index) => {
											const from = chordNodes.find((node) => node.district === link.origin);
											const to = chordNodes.find((node) => node.district === link.destination);
											if (!from || !to) return null;
											const controlX = 140;
											const controlY = 140;
											const opacity = .25 + Math.min(.65, link.flow / (activeInsights.maxFlow || 1));
											return /* @__PURE__ */ jsx("path", {
												d: `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`,
												fill: "none",
												stroke: `rgba(234, 6, 21, ${opacity})`,
												strokeWidth: 1.2 + link.flow / (activeInsights.maxFlow || 1) * 3
											}, `${link.origin}-${link.destination}-${index}`);
										}),
										chordNodes.map((node) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("circle", {
											cx: node.x,
											cy: node.y,
											r: "5",
											fill: "#ea0615"
										}), /* @__PURE__ */ jsx("text", {
											x: node.x,
											y: node.y - 10,
											textAnchor: "middle",
											fontSize: "9",
											fill: "var(--foreground)",
											children: node.district.slice(0, 10)
										})] }, node.district))
									]
								})
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]",
								children: /* @__PURE__ */ jsxs("span", {
									className: "ui-legend-item",
									children: [/* @__PURE__ */ jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[var(--primary)]" }), " Mayor flujo estimado"]
								})
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-6 xl:col-span-4",
						children: [/* @__PURE__ */ jsxs(Card, {
							className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Rutas de mayor flujo"
							}), /* @__PURE__ */ jsx("div", {
								className: "mt-4 space-y-4",
								children: topRoutes.slice(0, 4).length === 0 ? /* @__PURE__ */ jsx("p", {
									className: "text-sm text-[var(--muted)]",
									children: "Sin rutas destacadas para este periodo."
								}) : topRoutes.slice(0, 4).map((route) => {
									const width = Math.max(12, Math.round(route.flow / (activeInsights.maxFlow || 1) * 100));
									return /* @__PURE__ */ jsxs("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-between gap-2 text-sm",
											children: [/* @__PURE__ */ jsxs("span", {
												className: "font-semibold text-[var(--foreground)]",
												children: [
													route.origin,
													" → ",
													route.destination
												]
											}), /* @__PURE__ */ jsx("span", {
												className: "font-bold text-[var(--muted)]",
												children: route.flow.toFixed(0)
											})]
										}), /* @__PURE__ */ jsx(Progress, {
											className: "bg-black/20",
											value: width,
											indicatorClassName: "bg-[var(--primary)]"
										})]
									}, `${route.origin}-${route.destination}`);
								})
							})]
						}), /* @__PURE__ */ jsxs(Card, {
							className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5",
							children: [
								/* @__PURE__ */ jsx("h3", {
									className: "text-base font-bold text-[var(--foreground)]",
									children: "Resumen de balance neto"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3",
									children: [
										/* @__PURE__ */ jsx("label", {
											className: "block text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]",
											children: "Barrio de referencia"
										}),
										/* @__PURE__ */ jsxs(Select, {
											value: selectedDistrictName,
											onValueChange: (value) => setSelectedDistrictName(value ?? ""),
											children: [/* @__PURE__ */ jsxs(SelectTrigger, {
												"aria-label": "Seleccionar barrio de referencia",
												className: "mt-2 w-full bg-[var(--card)]",
												children: [/* @__PURE__ */ jsx(SelectValue, { placeholder: "Selecciona un barrio" }), /* @__PURE__ */ jsx(SelectIcon, {})]
											}), /* @__PURE__ */ jsx(SelectContent, { children: activeInsights.districts.map((district) => /* @__PURE__ */ jsx(SelectItem, {
												value: district.district,
												children: district.district
											}, district.district)) })]
										}),
										/* @__PURE__ */ jsx("p", {
											className: "mt-2 text-xs text-[var(--muted)]",
											children: "Cambia el barrio para revisar su saldo neto y los barrios con mas flujo estimado hacia el y desde el."
										})
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-4 grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-center",
										children: [
											/* @__PURE__ */ jsx("p", {
												className: "text-[10px] font-bold uppercase tracking-[0.1em] text-rose-500",
												children: "Mayor aporte hacia referencia"
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-rose-500/80",
												children: ["Emisor hacia ", selectedDistrictName || "…"]
											}),
											/* @__PURE__ */ jsx("p", {
												className: "mt-1 text-sm font-bold text-[var(--foreground)]",
												children: topEmitterTowardRef?.district ?? "N/D"
											}),
											/* @__PURE__ */ jsx("p", {
												className: "text-xl font-black text-rose-500",
												children: topEmitterTowardRef ? topEmitterTowardRef.flow.toFixed(0) : "—"
											})
										]
									}), /* @__PURE__ */ jsxs("div", {
										className: "rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center",
										children: [
											/* @__PURE__ */ jsx("p", {
												className: "text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-500",
												children: "Mayor destino desde referencia"
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-500/80",
												children: ["Receptor desde ", selectedDistrictName || "…"]
											}),
											/* @__PURE__ */ jsx("p", {
												className: "mt-1 text-sm font-bold text-[var(--foreground)]",
												children: topReceiverFromRef?.district ?? "N/D"
											}),
											/* @__PURE__ */ jsx("p", {
												className: "text-xl font-black text-emerald-500",
												children: topReceiverFromRef ? topReceiverFromRef.flow.toFixed(0) : "—"
											})
										]
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs text-[var(--muted)]",
									children: selectedDistrictFlow ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("span", {
										className: "font-semibold text-[var(--foreground)]",
										children: selectedDistrictName
									}), `: ${selectedDistrictFlow.net >= 0 ? "+" : ""}${selectedDistrictFlow.net.toFixed(1)} de balance neto, ${selectedDistrictFlow.inbound.toFixed(0)} entradas estimadas y ${selectedDistrictFlow.outbound.toFixed(0)} salidas estimadas.`] }) : "No hay un barrio de referencia disponible para este periodo."
								})
							]
						})]
					}),
					/* @__PURE__ */ jsxs(Card, {
						className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-6",
						children: [
							/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Balance neto por barrio"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-4 space-y-5",
								children: activeInsights.districts.map((district) => {
									const net = district.net;
									const maxMagnitude = Math.max(1, district.volume);
									const width = Math.min(50, Math.abs(net) / maxMagnitude * 100);
									const isImporter = net >= 0;
									return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
										className: "mb-1 flex items-center justify-between text-xs",
										children: [/* @__PURE__ */ jsx("span", {
											className: "font-bold text-[var(--foreground)]",
											children: district.district
										}), /* @__PURE__ */ jsxs("span", {
											className: `font-black ${isImporter ? "text-emerald-500" : "text-rose-500"}`,
											children: [net >= 0 ? "+" : "", net.toFixed(1)]
										})]
									}), /* @__PURE__ */ jsx("div", {
										className: "relative h-3 w-full rounded-full bg-black/20",
										children: isImporter ? /* @__PURE__ */ jsx("div", {
											className: "absolute left-1/2 h-full rounded-r-full bg-emerald-500",
											style: { width: `${width}%` }
										}) : /* @__PURE__ */ jsx("div", {
											className: "absolute right-1/2 h-full rounded-l-full bg-rose-500",
											style: { width: `${width}%` }
										})
									})] }, district.district);
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-6 flex justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]",
								children: [
									/* @__PURE__ */ jsx("span", { children: "Emisor neto" }),
									/* @__PURE__ */ jsx("span", { children: "Neutro" }),
									/* @__PURE__ */ jsx("span", { children: "Receptor neto" })
								]
							})
						]
					}),
					/* @__PURE__ */ jsxs(Card, {
						className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-6",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Matriz origen-destino"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-[10px] text-[var(--muted)]",
								children: "Datos en vivo"
							})]
						}), activeInsights.districts.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "mt-4 text-sm text-[var(--muted)]",
							children: "Sin volumen suficiente."
						}) : /* @__PURE__ */ jsx(ScrollArea, {
							className: "mt-3 max-h-[420px]",
							children: /* @__PURE__ */ jsxs(Table, {
								className: "min-w-full border-collapse text-[11px]",
								children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [/* @__PURE__ */ jsx(TableHead, {
									className: "sticky left-0 z-10 h-auto bg-[var(--card)] px-2 py-2 text-left font-semibold normal-case tracking-normal text-[var(--muted)]",
									children: "O \\ D"
								}), activeInsights.districts.map((district) => /* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-2 py-2 text-left font-semibold normal-case tracking-normal text-[var(--muted)]",
									children: district.district
								}, `dest-${district.district}`))] }) }), /* @__PURE__ */ jsx(TableBody, { children: activeInsights.districts.map((origin, originIndex) => /* @__PURE__ */ jsxs(TableRow, { children: [/* @__PURE__ */ jsx(TableCell, {
									className: "sticky left-0 bg-[var(--card)] px-2 py-2 font-semibold text-[var(--foreground)]",
									children: origin.district
								}), activeInsights.matrix[originIndex]?.map((value, destinationIndex) => /* @__PURE__ */ jsx(TableCell, {
									className: "border border-[var(--border)] px-2 py-2 text-right",
									style: {
										backgroundColor: getMatrixCellColor(value, activeInsights.maxFlow),
										color: value / (activeInsights.maxFlow || 1) > .5 ? "#ffffff" : "var(--foreground)"
									},
									children: value.toFixed(1)
								}, `${originIndex}-${destinationIndex}`))] }, `origin-${origin.district}`)) })]
							})
						})]
					}),
					/* @__PURE__ */ jsxs(Card, {
						className: "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-12",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Curva diaria de demanda"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-xs text-[var(--muted)]",
								children: "Muestra como cambia la actividad diaria y la ocupacion media en el periodo activo."
							})] }), /* @__PURE__ */ jsxs("div", {
								className: "text-right text-xs text-[var(--muted)]",
								children: [/* @__PURE__ */ jsxs("span", { children: [mobilityData.demandDays, " dias"] }), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Link, {
									href: appRoutes.dashboardHelp("demanda-no-viajes-reales"),
									className: "font-semibold text-[var(--primary)] underline-offset-2 hover:underline",
									children: "Entender curva"
								}) })]
							})]
						}), dailyCurveData.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "mt-4 text-sm text-[var(--muted)]",
							children: "Sin datos de demanda diaria."
						}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChartWrapper, {
							height: "h-[260px]",
							children: /* @__PURE__ */ jsx("div", {
								className: "mt-3 h-[260px]",
								children: /* @__PURE__ */ jsx(MeasuredResponsiveContainer, { children: /* @__PURE__ */ jsxs(AreaChart, {
									data: dailyCurveData,
									margin: {
										top: 8,
										right: 10,
										left: 0,
										bottom: 0
									},
									children: [
										/* @__PURE__ */ jsx(CartesianGrid, {
											strokeDasharray: "3 3",
											stroke: "rgba(234, 6, 21, 0.22)"
										}),
										/* @__PURE__ */ jsx(XAxis, {
											dataKey: "label",
											tick: { fontSize: 11 },
											minTickGap: 14
										}),
										/* @__PURE__ */ jsx(YAxis, {
											yAxisId: "score",
											tick: { fontSize: 11 },
											width: 42
										}),
										/* @__PURE__ */ jsx(YAxis, {
											yAxisId: "occ",
											orientation: "right",
											tick: { fontSize: 11 },
											width: 38,
											tickFormatter: (value) => formatPercent(value)
										}),
										/* @__PURE__ */ jsx(Tooltip, { formatter: (value, name) => {
											const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value);
											if (name === "Demanda") return [numericValue.toFixed(1), "Demanda"];
											return [formatPercent(numericValue), "Ocupacion media"];
										} }),
										/* @__PURE__ */ jsx(Area, {
											yAxisId: "score",
											type: "monotone",
											dataKey: "demandScore",
											name: "Demanda",
											stroke: "#ea0615",
											fill: "rgba(234, 6, 21, 0.26)",
											strokeWidth: 2
										}),
										/* @__PURE__ */ jsx(Area, {
											yAxisId: "occ",
											type: "monotone",
											dataKey: "avgOccupancyRatio",
											name: "Ocupacion",
											stroke: "#14b8a6",
											fill: "rgba(20, 184, 166, 0.2)",
											strokeWidth: 2
										})
									]
								}) })
							})
						}), /* @__PURE__ */ jsx("p", {
							className: "text-[11px] text-[var(--muted)]",
							children: mobilityData.methodology
						})] })]
					})
				]
			}) : null
		]
	});
}
function MobilityInsights(props) {
	return /* @__PURE__ */ jsx(Suspense, {
		fallback: /* @__PURE__ */ jsx("div", {
			className: "ui-section-card h-96",
			children: /* @__PURE__ */ jsx(Skeleton, { className: "h-full w-full" })
		}),
		children: /* @__PURE__ */ jsx(MobilityInsightsContent, { ...props })
	});
}
//#endregion
//#region src/server-functions/dashboard-flujo.ts
var FlowSearchParamsSchema = z.object({ month: z.union([z.string(), z.array(z.string())]).optional() }).default({});
var getDashboardFlowPageData = createServerFn({ method: "GET" }).inputValidator(FlowSearchParamsSchema).handler(createSsrRpc("04762fe687ea0dcaa2d458e8cb5d494d0477a23b4c4d628af70688f6f14bc622"));
//#endregion
//#region src/app/dashboard/flujo/index.tsx
var Route$25 = createFileRoute("/dashboard/flujo/")({
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Analisis de flujo - Dashboard Bizi";
		const description = "Analiza corredores de movilidad de Bizi Zaragoza, curva diaria de demanda e impacto horario del transporte publico.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/dashboard/flujo`
				},
				{
					name: "robots",
					content: "noindex, nofollow"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/dashboard/flujo`
			}],
			title
		};
	},
	loader: async ({ searchParams }) => getDashboardFlowPageData({ data: searchParams ? await searchParams : {} }),
	component: DashboardFlowPage
});
function DashboardFlowPage() {
	const { stations, availableMonths, activeMonth, selectedStationId, breadcrumbs, structuredData } = Route$25.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(DashboardPageViewTracker, {
			routeKey: "dashboard_flow",
			pageType: "dashboard",
			template: "flow_analysis"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsxs(PageHeaderCard, { children: [/* @__PURE__ */ jsx(SiteBreadcrumbs, {
			items: breadcrumbs,
			className: "mb-3"
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 text-[var(--primary)]",
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white",
						children: "B"
					}), /* @__PURE__ */ jsx("h1", {
						className: "text-lg font-bold text-[var(--foreground)]",
						children: "Bizi Zaragoza"
					})]
				}), /* @__PURE__ */ jsx(DashboardRouteLinks, {
					activeRoute: "flow",
					routes: [
						"dashboard",
						"stations",
						"flow",
						"conclusions",
						"help"
					],
					variant: "inline",
					className: "hidden items-center gap-5 md:flex"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-end gap-2",
				children: [
					/* @__PURE__ */ jsx(DashboardRouteLinks, {
						activeRoute: "flow",
						routes: [
							"dashboard",
							"stations",
							"flow",
							"conclusions",
							"help"
						],
						variant: "chips",
						className: "flex flex-wrap items-center gap-2 md:hidden"
					}),
					/* @__PURE__ */ jsx(ThemeToggleButton, {}),
					/* @__PURE__ */ jsx(GitHubRepoButton, {})
				]
			})]
		})] }),
		/* @__PURE__ */ jsx(Suspense, { children: /* @__PURE__ */ jsx(MonthFilter, {
			months: availableMonths.months,
			activeMonth,
			routeKey: "dashboard_flow",
			source: "dashboard_flow"
		}) }),
		/* @__PURE__ */ jsx(Suspense, { children: /* @__PURE__ */ jsx(MobilityInsights, {
			stations: stations.stations,
			selectedStationId,
			mobilityDays: 14,
			demandDays: 30
		}) })
	] });
}
//#endregion
//#region src/app/dashboard/estaciones/_components/StationsDirectoryClient.tsx
function normalize(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function StationsDirectoryClient({ stations, dataState }) {
	const [query, setQuery] = useState("");
	const filteredStations = useMemo(() => {
		const normalized = normalize(query);
		if (!normalized) return stations;
		return stations.filter((station) => {
			return normalize(`${station.id} ${station.name}`).includes(normalized);
		});
	}, [query, stations]);
	const directoryDataState = query.trim() ? resolveDataState({
		hasCoverage: dataState !== "no_coverage",
		hasData: filteredStations.length > 0
	}) : dataState;
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(DashboardPageViewTracker, {
			routeKey: "dashboard_stations",
			pageType: "dashboard",
			template: "stations_directory"
		}),
		/* @__PURE__ */ jsxs(PageHeaderCard, {
			className: "z-40 bg-[var(--card)]",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]",
					children: "Estaciones"
				}), /* @__PURE__ */ jsx("h1", {
					className: "text-xl font-bold text-[var(--foreground)]",
					children: "Directorio de estaciones"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-end gap-2",
					children: [
						/* @__PURE__ */ jsx(DashboardRouteLinks, {
							activeRoute: "stations",
							routes: [
								"dashboard",
								"stations",
								"flow",
								"conclusions",
								"help"
							],
							variant: "inline",
							className: "hidden items-center gap-5 md:flex"
						}),
						/* @__PURE__ */ jsx(DashboardRouteLinks, {
							activeRoute: "stations",
							routes: [
								"dashboard",
								"stations",
								"flow",
								"conclusions",
								"help"
							],
							variant: "chips",
							className: "flex flex-wrap items-center gap-2 md:hidden"
						}),
						/* @__PURE__ */ jsx(ThemeToggleButton, {}),
						/* @__PURE__ */ jsx(GitHubRepoButton, {})
					]
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-3",
				children: [/* @__PURE__ */ jsx("label", {
					htmlFor: "stations-directory-search",
					className: "sr-only",
					children: "Buscar por nombre o ID"
				}), /* @__PURE__ */ jsx(Input, {
					id: "stations-directory-search",
					type: "text",
					value: query,
					onChange: (event) => setQuery(event.target.value),
					className: "bg-[var(--secondary)]",
					placeholder: "Buscar por nombre o ID"
				})]
			})]
		}),
		shouldShowDataStateNotice(directoryDataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: directoryDataState,
			subject: "el directorio de estaciones",
			description: query.trim() ? "No hay estaciones que coincidan con la busqueda actual." : "El directorio usa el mismo snapshot compartido que el dashboard principal.",
			href: appRoutes.status(),
			actionLabel: "Ver estado"
		}) : null,
		/* @__PURE__ */ jsx("section", {
			className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
			children: filteredStations.map((station) => {
				const occupancy = station.capacity > 0 ? station.bikesAvailable / station.capacity : 0;
				return /* @__PURE__ */ jsxs(Card, { children: [
					/* @__PURE__ */ jsxs("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]",
						children: ["ID ", station.id]
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "mt-1 text-lg font-semibold text-[var(--foreground)]",
						children: station.name
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--muted)]",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-[10px] uppercase tracking-[0.12em]",
								children: "Bicis"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: station.bikesAvailable
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-[10px] uppercase tracking-[0.12em]",
								children: "Anclajes"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: station.anchorsFree
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-[10px] uppercase tracking-[0.12em]",
								children: "Ocupacion"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: formatPercent(occupancy)
							})] })
						]
					}),
					/* @__PURE__ */ jsx(TrackedLink, {
						href: appRoutes.dashboardStation(station.id),
						trackingEvent: buildEntitySelectEvent({
							surface: "dashboard",
							routeKey: "dashboard_stations",
							entityType: "station",
							source: "stations_directory",
							module: "station_card"
						}),
						className: buttonVariants({
							variant: "outline",
							size: "sm",
							className: "mt-3 min-h-0 border-[var(--primary)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
						}),
						children: "Ver detalle"
					})
				] }, station.id);
			})
		})
	] });
}
//#endregion
//#region src/app/dashboard/estaciones/index.tsx
var Route$24 = createFileRoute("/dashboard/estaciones/")({
	head: () => {
		const siteUrl = getSiteUrl();
		const title = "Estaciones - Dashboard Bizi";
		const description = "Explora todas las estaciones de Bizi Zaragoza y entra al detalle de disponibilidad, patrones horarios y comparativas.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:url",
					content: `${siteUrl}/dashboard/estaciones`
				},
				{
					name: "robots",
					content: "noindex, nofollow"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			links: [{
				rel: "canonical",
				href: `${siteUrl}/dashboard/estaciones`
			}],
			title
		};
	},
	loader: () => getStationsDirectoryPageData(),
	component: StationsDirectoryPage
});
function StationsDirectoryPage() {
	const { stations } = Route$24.useLoaderData();
	return /* @__PURE__ */ jsx(StationsDirectoryClient, {
		stations: stations.stations,
		dataState: stations.dataState
	});
}
//#endregion
//#region src/server-functions/dashboard-conclusiones.ts
var ConclusionsSearchParamsSchema = z.object({ month: z.union([z.string(), z.array(z.string())]).optional() }).default({});
var getDashboardConclusionsPageData = createServerFn({ method: "GET" }).inputValidator(ConclusionsSearchParamsSchema).handler(createSsrRpc("e14cbb00cd4fa5986b5e4962968e9745a8544f807387b1991c79f6a48ca00c1e"));
//#endregion
//#region src/app/dashboard/conclusiones/index.tsx
function formatDelta(deltaRatio) {
	if (deltaRatio === null || !Number.isFinite(deltaRatio)) return "Sin referencia";
	return `${deltaRatio >= 0 ? "+" : ""}${Math.round(deltaRatio * 100)}%`;
}
function formatDate(value) {
	if (!value) return "Sin datos";
	const parsed = new Date(value.length <= 10 ? `${value}T00:00:00.000Z` : value);
	if (Number.isNaN(parsed.getTime())) return value;
	return parsed.toLocaleDateString("es-ES");
}
function formatHourLabel(hour) {
	return `${String(hour).padStart(2, "0")}:00-${String((hour + 1) % 24).padStart(2, "0")}:00`;
}
function getDemandCardLabel(selectedMonth) {
	return selectedMonth ? "Variacion demanda del mes" : "Variacion demanda 7 dias";
}
function getDemandCardDetail(payload) {
	const monthLabel = payload.selectedMonth ? toMonthOptions([payload.selectedMonth])[0]?.label ?? payload.selectedMonth : null;
	return payload.selectedMonth ? `Demanda agregada: ${formatInteger(payload.metrics.demandLast7Days)} puntos en ${monthLabel} (indice de actividad, no viajes exactos).` : `Demanda agregada: ${formatInteger(payload.metrics.demandLast7Days)} puntos en 7 dias (indice de actividad, no viajes exactos).`;
}
function getOccupancyCardLabel(selectedMonth) {
	return selectedMonth ? "Ocupacion media del mes" : "Ocupacion media 7 dias";
}
function getPeriodCaption(selectedMonth, fallback) {
	if (!selectedMonth) return fallback;
	return toMonthOptions([selectedMonth])[0]?.label ?? selectedMonth;
}
function getWeekPatternSummary(payload) {
	const { weekdayWeekendProfile } = payload;
	if (!weekdayWeekendProfile.dominantPeriod) return "Aun no hay suficiente muestra para comparar dias laborables y fin de semana.";
	return weekdayWeekendProfile.dominantPeriod === "weekday" ? `Entre semana la red concentra mas actividad media por dia que en fin de semana (${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} vs ${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} pts).` : `En fin de semana la red concentra mas actividad media por dia que entre semana (${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} vs ${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} pts).`;
}
var Route$23 = createFileRoute("/dashboard/conclusiones/")({
	head: () => {
		const title = "Conclusiones de movilidad";
		const description = "Resumen ejecutivo de movilidad en Zaragoza con demanda, horas pico, barrios mas activos y patrones entre semana y fin de semana.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					name: "robots",
					content: "noindex, nofollow"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			title
		};
	},
	loader: async ({ searchParams }) => getDashboardConclusionsPageData({ data: searchParams ? await searchParams : {} }),
	component: DashboardConclusionsPage
});
function DashboardConclusionsPage() {
	const { payload, fromCache, availableMonths, activeMonth, breadcrumbs, structuredData } = Route$23.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx(DashboardPageViewTracker, {
			routeKey: "dashboard_conclusions",
			pageType: "dashboard",
			template: "conclusions_report"
		}),
		/* @__PURE__ */ jsx("script", {
			type: "application/ld+json",
			suppressHydrationWarning: true,
			dangerouslySetInnerHTML: { __html: JSON.stringify(structuredData) }
		}),
		/* @__PURE__ */ jsxs(PageHeaderCard, { children: [/* @__PURE__ */ jsx(SiteBreadcrumbs, {
			items: breadcrumbs,
			className: "mb-3"
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 text-[var(--primary)]",
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white",
						children: "B"
					}), /* @__PURE__ */ jsx("h1", {
						className: "text-lg font-bold text-[var(--foreground)]",
						children: "Bizi Zaragoza"
					})]
				}), /* @__PURE__ */ jsx(DashboardRouteLinks, {
					activeRoute: "conclusions",
					routes: [
						"dashboard",
						"stations",
						"flow",
						"conclusions",
						"help"
					],
					variant: "inline",
					className: "hidden items-center gap-5 md:flex"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-end gap-2",
				children: [
					/* @__PURE__ */ jsx(DashboardRouteLinks, {
						activeRoute: "conclusions",
						routes: [
							"dashboard",
							"stations",
							"flow",
							"conclusions",
							"help"
						],
						variant: "chips",
						className: "flex flex-wrap items-center gap-2 md:hidden"
					}),
					/* @__PURE__ */ jsx(ThemeToggleButton, {}),
					/* @__PURE__ */ jsx(GitHubRepoButton, {})
				]
			})]
		})] }),
		/* @__PURE__ */ jsx(Suspense, { children: /* @__PURE__ */ jsx(MonthFilter, {
			months: availableMonths.months,
			activeMonth,
			routeKey: "dashboard_conclusions",
			source: "dashboard_conclusions"
		}) }),
		/* @__PURE__ */ jsx("section", {
			className: "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl space-y-2",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
							children: "Informe ejecutivo diario"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "text-2xl font-black leading-tight text-[var(--foreground)] md:text-3xl",
							children: "Conclusiones generales de movilidad en Zaragoza"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-[var(--muted)]",
							children: payload.summary
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: ["Dia informe ", payload.dateKey]
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: ["Cobertura desde ", formatDate(payload.sourceFirstDay)]
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "ui-chip",
							children: ["Ultima muestra ", formatDate(payload.sourceLastDay)]
						}),
						/* @__PURE__ */ jsx("span", {
							className: "ui-chip",
							children: fromCache ? "Actualizacion diaria en cache" : "Actualizado hoy"
						})
					]
				})]
			})
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: getDemandCardLabel(payload.selectedMonth)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: formatDelta(payload.metrics.demandDeltaRatio)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: getDemandCardDetail(payload)
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: getOccupancyCardLabel(payload.selectedMonth)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: formatPercent(payload.metrics.occupancyLast7Days)
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-[var(--muted)]",
							children: ["Variacion: ", formatDelta(payload.metrics.occupancyDeltaRatio)]
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "stat-label",
							children: "Cobertura historica"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "stat-value",
							children: payload.totalHistoricalDays
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Dias con informacion consolidada."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-6 xl:grid-cols-12",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card xl:col-span-7",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: "Hallazgos principales"
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs text-[var(--muted)]",
						children: [
							"Cobertura desde ",
							formatDate(payload.sourceFirstDay),
							" hasta ",
							formatDate(payload.sourceLastDay),
							"."
						]
					}),
					payload.highlights.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "mt-4 text-sm text-[var(--muted)]",
						children: "Sin highlights disponibles para el dia actual."
					}) : /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-3",
						children: payload.highlights.map((item) => /* @__PURE__ */ jsxs("article", {
							className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: item.title
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-xs text-[var(--muted)]",
								children: item.detail
							})]
						}, `${item.title}-${item.detail}`))
					})
				]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card xl:col-span-5",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "text-base font-bold text-[var(--foreground)]",
					children: "Recomendaciones operativas"
				}), payload.recommendations.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "mt-4 text-sm text-[var(--muted)]",
					children: "Sin recomendaciones para hoy."
				}) : /* @__PURE__ */ jsx("ol", {
					className: "mt-4 space-y-3 text-sm text-[var(--muted)]",
					children: payload.recommendations.map((recommendation, index) => /* @__PURE__ */ jsxs("li", {
						className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
						children: [/* @__PURE__ */ jsx("span", {
							className: "mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[10px] font-bold text-[var(--primary)]",
							children: index + 1
						}), recommendation]
					}, `${recommendation}-${index}`))
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 xl:grid-cols-2",
			children: [
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-base font-bold text-[var(--foreground)]",
								children: "Entre semana vs fin de semana"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-xs text-[var(--muted)]",
								children: getPeriodCaption(payload.selectedMonth, "Ventana actual")
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-sm text-[var(--muted)]",
							children: getWeekPatternSummary(payload)
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 grid gap-3 md:grid-cols-2",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
										children: "Entre semana"
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "mt-2 text-xl font-black text-[var(--foreground)]",
										children: [payload.weekdayWeekendProfile.weekday.avgDemand.toFixed(1), " pts"]
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "mt-1 text-xs text-[var(--muted)]",
										children: [
											"Ocupacion media ",
											formatPercent(payload.weekdayWeekendProfile.weekday.avgOccupancy),
											" · ",
											payload.weekdayWeekendProfile.weekday.daysCount,
											" dias"
										]
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-4",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
										children: "Fin de semana"
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "mt-2 text-xl font-black text-[var(--foreground)]",
										children: [payload.weekdayWeekendProfile.weekend.avgDemand.toFixed(1), " pts"]
									}),
									/* @__PURE__ */ jsxs("p", {
										className: "mt-1 text-xs text-[var(--muted)]",
										children: [
											"Ocupacion media ",
											formatPercent(payload.weekdayWeekendProfile.weekend.avgOccupancy),
											" · ",
											payload.weekdayWeekendProfile.weekend.daysCount,
											" dias"
										]
									})
								]
							})]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-3 text-xs text-[var(--muted)]",
							children: ["Variacion relativa fin de semana vs laborable: ", formatDelta(payload.weekdayWeekendProfile.demandGapRatio)]
						})
					]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-base font-bold text-[var(--foreground)]",
							children: "Horas pico de demanda"
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-[var(--muted)]",
							children: getPeriodCaption(payload.selectedMonth, "Ultimos 7 dias")
						})]
					}), payload.peakDemandHours.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "mt-4 text-sm text-[var(--muted)]",
						children: "Todavia no hay suficiente historico horario para detectar picos."
					}) : /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-3",
						children: payload.peakDemandHours.map((slot, index) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: formatHourLabel(slot.hour)
							}), /* @__PURE__ */ jsx("p", {
								className: "text-[11px] text-[var(--muted)]",
								children: "Franja con mayor actividad agregada"
							})] }), /* @__PURE__ */ jsxs("p", {
								className: "text-xs font-bold text-[var(--foreground)]",
								children: [formatInteger(slot.demandScore), " pts"]
							})]
						}, `${slot.hour}-${index}`))
					})]
				}),
				/* @__PURE__ */ jsxs("article", {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-base font-bold text-[var(--foreground)]",
							children: "Barrios con mas demanda"
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-[var(--muted)]",
							children: getPeriodCaption(payload.selectedMonth, "Ultimos 7 dias")
						})]
					}), payload.topDistrictsByDemand.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "mt-4 text-sm text-[var(--muted)]",
						children: "No se ha podido agrupar la demanda por barrios todavia."
					}) : /* @__PURE__ */ jsx("div", {
						className: "mt-4 space-y-3",
						children: payload.topDistrictsByDemand.map((district, index) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: district.district
							}), /* @__PURE__ */ jsx("p", {
								className: "text-[11px] text-[var(--muted)]",
								children: "Mayor intensidad agregada de uso reciente"
							})] }), /* @__PURE__ */ jsxs("p", {
								className: "text-xs font-bold text-[var(--foreground)]",
								children: [formatInteger(district.demandScore), " pts"]
							})]
						}, `${district.district}-${index}`))
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 xl:grid-cols-2",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: payload.selectedMonth ? "Estaciones con mayor demanda media del mes" : "Estaciones con mayor demanda media (30 dias)"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-[var(--muted)]",
						children: payload.selectedMonth ? getPeriodCaption(payload.selectedMonth, "") : "Actualizacion diaria en cache de BD"
					})]
				}), payload.topStationsByDemand.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-[var(--muted)]",
					children: "Sin ranking de estaciones disponible todavia."
				}) : /* @__PURE__ */ jsx("div", {
					className: "mt-4 space-y-2",
					children: payload.topStationsByDemand.map((station, index) => /* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "outline",
						size: "sm",
						children: /* @__PURE__ */ jsxs(Link, {
							href: appRoutes.dashboardStation(station.stationId),
							className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex min-w-0 items-center gap-3",
								children: [/* @__PURE__ */ jsx("span", {
									className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]",
									children: index + 1
								}), /* @__PURE__ */ jsxs("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ jsx("p", {
										className: "truncate text-sm font-semibold text-[var(--foreground)]",
										children: station.stationName
									}), /* @__PURE__ */ jsxs("p", {
										className: "text-[11px] text-[var(--muted)]",
										children: ["ID ", station.stationId]
									})]
								})]
							}), /* @__PURE__ */ jsxs("p", {
								className: "text-xs font-bold text-[var(--foreground)]",
								children: ["Indice ", station.avgDemand.toFixed(1)]
							})]
						})
					}, station.stationId))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: payload.selectedMonth ? "Estaciones menos usadas del mes" : "Estaciones menos usadas"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-[var(--muted)]",
						children: "Tambien enlaza al detalle"
					})]
				}), payload.leastUsedStations.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-[var(--muted)]",
					children: "Sin ranking de estaciones menos usadas disponible todavia."
				}) : /* @__PURE__ */ jsx("div", {
					className: "mt-4 space-y-2",
					children: payload.leastUsedStations.map((station, index) => /* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "outline",
						size: "sm",
						children: /* @__PURE__ */ jsxs(Link, {
							href: appRoutes.dashboardStation(station.stationId),
							className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex min-w-0 items-center gap-3",
								children: [/* @__PURE__ */ jsx("span", {
									className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)]/8 text-xs font-bold text-[var(--foreground)]",
									children: index + 1
								}), /* @__PURE__ */ jsxs("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ jsx("p", {
										className: "truncate text-sm font-semibold text-[var(--foreground)]",
										children: station.stationName
									}), /* @__PURE__ */ jsxs("p", {
										className: "text-[11px] text-[var(--muted)]",
										children: ["ID ", station.stationId]
									})]
								})]
							}), /* @__PURE__ */ jsxs("p", {
								className: "text-xs font-bold text-[var(--foreground)]",
								children: ["Indice ", station.avgDemand.toFixed(1)]
							})]
						})
					}, station.stationId))
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 xl:grid-cols-2",
			children: [/* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: "Informes mensuales publicados"
					}), /* @__PURE__ */ jsx(Link, {
						href: appRoutes.reports(),
						className: "text-xs font-bold text-[var(--primary)] transition hover:opacity-80",
						children: "Ver archivo completo"
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-4 space-y-2",
					children: availableMonths.months.slice(0, 6).map((month) => /* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "outline",
						size: "sm",
						children: /* @__PURE__ */ jsxs(Link, {
							href: appRoutes.reportMonth(month),
							className: "flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
								className: "text-sm font-semibold text-[var(--foreground)]",
								children: ["Informe ", toMonthOptions([month])[0]?.label ?? month]
							}), /* @__PURE__ */ jsx("p", {
								className: "text-[11px] text-[var(--muted)]",
								children: "URL indexable permanente con resumen y enlaces al dashboard filtrado."
							})] }), /* @__PURE__ */ jsx("span", {
								className: "text-xs font-bold text-[var(--primary)]",
								children: "Abrir"
							})]
						})
					}, month))
				})]
			}), /* @__PURE__ */ jsxs("article", {
				className: "ui-section-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold text-[var(--foreground)]",
						children: "Landings SEO relacionadas"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-xs text-[var(--muted)]",
						children: "Enlazadas al dashboard y al detalle de estaciones"
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-4 grid gap-2 md:grid-cols-2",
					children: [
						[appRoutes.dashboardStations(), "Estaciones mas usadas"],
						[`${appRoutes.dashboard()}?rankingTab=turnover`, "Ranking de estaciones"],
						[appRoutes.dashboardFlow(), "Viajes por dia"],
						[appRoutes.reports(), "Viajes por mes"]
					].map(([href, label]) => /* @__PURE__ */ jsx(Button, {
						asChild: true,
						variant: "outline",
						size: "sm",
						children: /* @__PURE__ */ jsx(Link, {
							href,
							className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)]",
							children: label
						})
					}, href))
				})]
			})]
		})
	] });
}
//#endregion
//#region src/app/dashboard/ayuda/_components/help-center-selectors.ts
var CATEGORY_PRIORITY_MAP = new Map(CATEGORY_PRIORITY.map((category, index) => [category, index]));
var FAQ_PRIORITY_MAP = new Map(FAQ_PRIORITY_IDS.map((faqId, index) => [faqId, index]));
var FAQ_INDEX_MAP = new Map(FAQ_ITEMS.map((item, index) => [item.id, index]));
function normalizeText(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function compareCategories(a, b) {
	const rankA = CATEGORY_PRIORITY_MAP.get(a) ?? Number.MAX_SAFE_INTEGER;
	const rankB = CATEGORY_PRIORITY_MAP.get(b) ?? Number.MAX_SAFE_INTEGER;
	if (rankA !== rankB) return rankA - rankB;
	return a.localeCompare(b, "es-ES");
}
function compareFaqItems(a, b) {
	const rankA = FAQ_PRIORITY_MAP.get(a.id) ?? Number.MAX_SAFE_INTEGER;
	const rankB = FAQ_PRIORITY_MAP.get(b.id) ?? Number.MAX_SAFE_INTEGER;
	if (rankA !== rankB) return rankA - rankB;
	return (FAQ_INDEX_MAP.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (FAQ_INDEX_MAP.get(b.id) ?? Number.MAX_SAFE_INTEGER);
}
function formatDateTime$1(value) {
	if (!value) return "Sin datos";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "Sin datos";
	return parsed.toLocaleString("es-ES", { timeZone: TIMEZONE });
}
function getHelpCenterCategories() {
	const uniqueCategories = new Set(FAQ_ITEMS.map((item) => item.category));
	return Array.from(uniqueCategories.values()).sort(compareCategories);
}
function filterHelpCenterFaqItems(params) {
	const normalizedQuery = normalizeText(params.query);
	return FAQ_ITEMS.filter((item) => {
		if (params.activeCategory && item.category !== params.activeCategory) return false;
		if (!normalizedQuery) return true;
		return normalizeText(`${item.category} ${item.question} ${item.answer}`).includes(normalizedQuery);
	});
}
function groupHelpCenterFaqItems(items) {
	const sortedItems = [...items].sort((a, b) => {
		const categoryDiff = compareCategories(a.category, b.category);
		if (categoryDiff !== 0) return categoryDiff;
		return compareFaqItems(a, b);
	});
	const map = /* @__PURE__ */ new Map();
	for (const item of sortedItems) {
		const rows = map.get(item.category) ?? [];
		rows.push(item);
		map.set(item.category, rows);
	}
	return Array.from(map.entries());
}
function getHelpCenterCategoryCounts() {
	const counts = /* @__PURE__ */ new Map();
	for (const item of FAQ_ITEMS) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
	return counts;
}
function getHelpCenterCategoryMatchesBySearch(params) {
	const normalizedQuery = normalizeText(params.query);
	const counts = /* @__PURE__ */ new Map();
	for (const category of params.categories) counts.set(category, 0);
	for (const item of FAQ_ITEMS) {
		if (!normalizedQuery) {
			counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
			continue;
		}
		if (normalizeText(`${item.category} ${item.question} ${item.answer}`).includes(normalizedQuery)) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
	}
	return counts;
}
function buildHelpCenterFaqStructuredData() {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: FAQ_ITEMS.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer
			}
		}))
	};
}
//#endregion
//#region src/app/dashboard/ayuda/_components/HelpCenterClient.tsx
var HELP_CENTER_FAQ_STRUCTURED_DATA = buildHelpCenterFaqStructuredData();
var HELP_CENTER_CATEGORIES = getHelpCenterCategories();
var HELP_CENTER_CATEGORY_COUNTS = getHelpCenterCategoryCounts();
function HelpCenterClient({ historyMeta }) {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState(null);
	const [openItemId, setOpenItemId] = useState(FAQ_ITEMS[0]?.id ?? "");
	const breadcrumbs = [
		{
			label: "Inicio",
			href: appRoutes.home()
		},
		{
			label: "Dashboard",
			href: appRoutes.dashboard()
		},
		{
			label: "Ayuda",
			href: appRoutes.dashboardHelp()
		}
	];
	const normalizedQuery = useMemo(() => normalizeText(query), [query]);
	const filteredItems = useMemo(() => {
		return filterHelpCenterFaqItems({
			query,
			activeCategory
		});
	}, [activeCategory, query]);
	const categories = HELP_CENTER_CATEGORIES;
	const groupedItems = useMemo(() => {
		return groupHelpCenterFaqItems(filteredItems);
	}, [filteredItems]);
	const categoryCounts = HELP_CENTER_CATEGORY_COUNTS;
	const categoryMatchesBySearch = useMemo(() => {
		return getHelpCenterCategoryMatchesBySearch({
			categories,
			query
		});
	}, [categories, query]);
	const faqStructuredData = HELP_CENTER_FAQ_STRUCTURED_DATA;
	const showFilteredCount = normalizedQuery.length > 0 || activeCategory !== null;
	const resolvedOpenItemId = filteredItems.length === 0 ? "" : filteredItems.some((item) => item.id === openItemId) ? openItemId : filteredItems[0]?.id ?? "";
	return /* @__PURE__ */ jsxs("div", {
		className: "relative flex min-h-screen w-full flex-col overflow-x-hidden",
		children: [
			/* @__PURE__ */ jsx(DashboardPageViewTracker, {
				routeKey: "dashboard_help",
				pageType: "dashboard",
				template: "help_center"
			}),
			/* @__PURE__ */ jsx("script", {
				type: "application/ld+json",
				suppressHydrationWarning: true,
				dangerouslySetInnerHTML: { __html: JSON.stringify(faqStructuredData) }
			}),
			/* @__PURE__ */ jsx(PageHeaderCard, {
				className: "px-6 py-4 md:px-10",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex w-full max-w-5xl items-center justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-8",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3 text-[var(--primary)]",
							children: [/* @__PURE__ */ jsx("div", {
								className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white",
								children: "B"
							}), /* @__PURE__ */ jsx("h2", {
								className: "text-lg font-bold text-[var(--foreground)]",
								children: "Bizi Zaragoza"
							})]
						}), /* @__PURE__ */ jsx(DashboardRouteLinks, {
							activeRoute: "help",
							routes: [
								"dashboard",
								"stations",
								"flow",
								"conclusions",
								"help"
							],
							variant: "inline",
							className: "hidden items-center gap-6 md:flex"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-end gap-3",
						children: [
							/* @__PURE__ */ jsxs("label", {
								htmlFor: "help-search-desktop",
								className: "hidden items-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 sm:flex",
								children: [/* @__PURE__ */ jsx("span", {
									className: "sr-only",
									children: "Buscar ayuda o preguntas frecuentes"
								}), /* @__PURE__ */ jsx(Input, {
									id: "help-search-desktop",
									type: "text",
									value: query,
									onChange: (event) => setQuery(event.target.value),
									className: "h-auto min-h-0 w-44 border-0 bg-transparent px-0 py-0 text-sm text-[var(--foreground)] shadow-none outline-none placeholder:text-[var(--muted)] focus:border-0",
									placeholder: "Buscar ayuda..."
								})]
							}),
							/* @__PURE__ */ jsx(DashboardRouteLinks, {
								activeRoute: "help",
								routes: [
									"dashboard",
									"stations",
									"flow",
									"conclusions",
									"help"
								],
								variant: "chips",
								className: "flex flex-wrap items-center gap-2 md:hidden"
							}),
							/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.api.history(),
								trackingEvent: buildExportClickEvent({
									surface: "dashboard",
									routeKey: "dashboard_help",
									source: "help_header",
									ctaId: "history_json",
									entityType: "api",
									module: "help_header"
								}),
								className: "ui-icon-button",
								children: "Historico"
							}),
							/* @__PURE__ */ jsx(ThemeToggleButton, {}),
							/* @__PURE__ */ jsx(GitHubRepoButton, {})
						]
					})]
				})
			}),
			/* @__PURE__ */ jsxs("main", {
				className: "mx-auto w-full max-w-5xl px-6 py-10",
				children: [
					/* @__PURE__ */ jsx(SiteBreadcrumbs, {
						items: breadcrumbs,
						className: "mb-6"
					}),
					/* @__PURE__ */ jsxs("label", {
						htmlFor: "help-search-mobile",
						className: "mb-6 flex items-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm sm:hidden",
						children: [/* @__PURE__ */ jsx("span", {
							className: "sr-only",
							children: "Buscar ayuda o preguntas frecuentes"
						}), /* @__PURE__ */ jsx(Input, {
							id: "help-search-mobile",
							type: "text",
							value: query,
							onChange: (event) => setQuery(event.target.value),
							className: "h-auto min-h-0 w-full border-0 bg-transparent px-0 py-0 text-sm text-[var(--foreground)] shadow-none outline-none placeholder:text-[var(--muted)] focus:border-0",
							placeholder: "Buscar ayuda..."
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "max-w-2xl",
							children: [
								/* @__PURE__ */ jsx(Badge, {
									className: "mb-4 px-3 py-1 text-xs font-bold tracking-[0.14em]",
									children: "Centro de ayuda"
								}),
								/* @__PURE__ */ jsx("h1", {
									className: "text-4xl font-black leading-tight tracking-tight text-[var(--foreground)] md:text-5xl",
									children: "Preguntas frecuentes"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-4 text-lg text-[var(--muted)]",
									children: "Explora nuestra metodologia y resuelve dudas sobre como procesamos los datos de Bizi Zaragoza en tiempo real."
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)]",
									children: [
										/* @__PURE__ */ jsxs("span", {
											className: "rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1",
											children: [filteredItems.length, " preguntas visibles"]
										}),
										activeCategory ? /* @__PURE__ */ jsxs(Button, {
											variant: "ghost",
											onClick: () => setActiveCategory(null),
											className: "h-auto min-h-0 rounded-full border border-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
											children: [
												"Categoria: ",
												activeCategory,
												" ×"
											]
										}) : null,
										normalizedQuery ? /* @__PURE__ */ jsxs(Button, {
											variant: "ghost",
											onClick: () => setQuery(""),
											className: "h-auto min-h-0 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 transition hover:border-[var(--primary)] hover:text-[var(--primary)]",
											children: [
												"Buscar: ",
												query,
												" ×"
											]
										}) : null
									]
								})
							]
						}), /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, {
							className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
							children: "Cobertura de datos"
						}) }), /* @__PURE__ */ jsxs(CardContent, { children: [/* @__PURE__ */ jsxs("div", {
							className: "space-y-2 text-sm text-[var(--foreground)]",
							children: [
								/* @__PURE__ */ jsxs("p", { children: ["Datos desde: ", /* @__PURE__ */ jsx("span", {
									className: "font-semibold",
									children: formatDateTime$1(historyMeta?.coverage?.firstRecordedAt)
								})] }),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: ["Ultima muestra: ", formatDateTime$1(historyMeta?.coverage?.lastRecordedAt)]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-1 text-xs text-[var(--muted)]",
									children: [
										"Dias disponibles: ",
										historyMeta?.coverage?.totalDays ?? 0,
										" · Estaciones activas:",
										" ",
										historyMeta?.coverage?.totalStations ?? 0
									]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-3 text-xs text-[var(--muted)]",
									children: ["Fuente: ", historyMeta?.source?.provider ?? "Bizi Zaragoza GBFS"]
								}),
								/* @__PURE__ */ jsx(TrackedAnchor, {
									href: historyMeta?.source?.gbfsDiscoveryUrl ?? "https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json",
									target: "_blank",
									rel: "noreferrer",
									trackingEvent: buildCtaClickEvent({
										surface: "dashboard",
										routeKey: "dashboard_help",
										source: "help_coverage",
										ctaId: "source_feed_open",
										destination: "gbfs_feed",
										isExternal: true
									}),
									className: "mt-1 inline-flex text-xs font-semibold text-[var(--primary)] underline decoration-[var(--primary)]/40 underline-offset-2",
									children: "Ver feed de origen"
								})
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.api.history(),
								trackingEvent: buildExportClickEvent({
									surface: "dashboard",
									routeKey: "dashboard_help",
									source: "help_coverage",
									ctaId: "history_json",
									entityType: "api",
									module: "help_coverage"
								}),
								className: "rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white",
								children: "Ver historico completo"
							}), /* @__PURE__ */ jsx(TrackedLink, {
								href: appRoutes.api.openApi(),
								trackingEvent: buildCtaClickEvent({
									surface: "dashboard",
									routeKey: "dashboard_help",
									source: "help_coverage",
									ctaId: "api_open",
									destination: "openapi",
									entityType: "api"
								}),
								className: "rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-xs font-bold text-[var(--foreground)]",
								children: "Definicion API"
							})]
						})] })] })]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3",
						children: categories.map((category) => {
							const isCategoryFilterActive = activeCategory === category;
							const categoryMatches = categoryMatchesBySearch.get(category) ?? 0;
							const totalInCategory = categoryCounts.get(category) ?? 0;
							return /* @__PURE__ */ jsxs(Button, {
								variant: "ghost",
								onClick: () => {
									const nextCategory = activeCategory === category ? null : category;
									trackUmamiEvent(buildPanelOpenEvent({
										surface: "dashboard",
										routeKey: "dashboard_help",
										module: nextCategory ? "faq_category" : "faq_category_reset",
										source: category
									}));
									setActiveCategory(nextCategory);
								},
								"aria-pressed": isCategoryFilterActive,
								className: `h-auto min-h-0 w-full flex-col items-start justify-start rounded-xl border bg-[var(--card)] p-6 text-left transition hover:border-[var(--primary)] ${isCategoryFilterActive ? "border-[var(--primary)] bg-[var(--primary)]/6 shadow-[0_0_0_1px_var(--primary-soft)]" : "border-[var(--border)]"}`,
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "mb-4 flex items-start justify-between gap-3",
										children: [/* @__PURE__ */ jsx("div", {
											className: "flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-xl font-black text-[var(--primary)]",
											children: category.slice(0, 1)
										}), /* @__PURE__ */ jsxs(Badge, {
											variant: isCategoryFilterActive ? "default" : "muted",
											children: [
												categoryMatches,
												"/",
												totalInCategory
											]
										})]
									}),
									/* @__PURE__ */ jsx("h3", {
										className: "text-xl font-bold text-[var(--foreground)]",
										children: category
									}),
									/* @__PURE__ */ jsx("p", {
										className: "mt-2 text-sm text-[var(--muted)]",
										children: showFilteredCount ? `${categoryMatches} de ${totalInCategory} preguntas coinciden.` : `${totalInCategory} preguntas disponibles.`
									})
								]
							}, category);
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-14 space-y-8",
						children: groupedItems.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted)]",
							children: "No hay coincidencias para la busqueda actual."
						}) : groupedItems.map(([category, items]) => /* @__PURE__ */ jsxs("section", {
							className: "space-y-4",
							children: [/* @__PURE__ */ jsxs("h2", {
								className: "flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]",
								children: [
									/* @__PURE__ */ jsx("span", { className: "h-1 w-8 rounded-full bg-[var(--primary)]" }),
									category,
									/* @__PURE__ */ jsx(Badge, {
										variant: "muted",
										children: items.length
									})
								]
							}), /* @__PURE__ */ jsx(Accordion, {
								className: "space-y-3",
								value: resolvedOpenItemId ? [resolvedOpenItemId] : [],
								onValueChange: (value) => setOpenItemId(value[0] ?? ""),
								children: items.map((item) => /* @__PURE__ */ jsxs(AccordionItem, {
									value: item.id,
									className: "overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]",
									children: [/* @__PURE__ */ jsx(AccordionTrigger, {
										className: "h-auto min-h-0 px-5 py-4",
										children: /* @__PURE__ */ jsx("p", {
											className: "text-base font-semibold text-[var(--foreground)]",
											children: item.question
										})
									}), /* @__PURE__ */ jsx(AccordionContent, {
										className: "px-5 py-4 text-sm leading-relaxed text-[var(--muted)]",
										children: item.answer
									})]
								}, item.id))
							})]
						}, category))
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "relative mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 p-8 text-white",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "max-w-md",
							children: [/* @__PURE__ */ jsx("h2", {
								className: "text-2xl font-bold",
								children: "No encontraste lo que buscabas?"
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-sm text-white/85",
								children: "Si necesitas soporte directo o quieres compartir feedback, usa el acceso dedicado y deja contexto sobre la vista, la estacion o el problema detectado."
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-6 flex flex-wrap gap-3",
							children: [/* @__PURE__ */ jsx(FeedbackCta, {
								source: "help_support_block",
								ctaId: "feedback_help_open",
								module: "help_support_block",
								className: "rounded-lg bg-white px-6 py-3 text-sm font-bold text-[var(--primary)] transition hover:bg-white/90",
								pendingClassName: "rounded-lg border border-white/30 bg-black/20 px-6 py-3 text-sm font-bold text-white/80",
								pendingLabel: "Feedback pronto",
								children: "Enviar feedback"
							}), /* @__PURE__ */ jsx("a", {
								href: "https://www.linkedin.com/in/guillermocastella/",
								target: "_blank",
								rel: "noreferrer",
								className: "rounded-lg border border-white/30 bg-black/20 px-6 py-3 text-sm font-bold text-white",
								children: "Contacto"
							})]
						})]
					})
				]
			})
		]
	});
}
//#endregion
//#region src/server-functions/dashboard-ayuda.ts
var getDashboardHelpPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("646e488c0be3026872095ee83795e3920c6dcaf349f46636cc18843a729f3a63"));
//#endregion
//#region src/app/dashboard/ayuda/index.tsx
var Route$22 = createFileRoute("/dashboard/ayuda/")({
	head: () => {
		const title = "Centro de ayuda - Dashboard Bizi";
		const description = "FAQ del dashboard de Bizi Zaragoza para entender alertas, rankings, movilidad, predicciones y metodologia de calculo.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					name: "robots",
					content: "noindex, nofollow"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			title
		};
	},
	loader: () => getDashboardHelpPageData(),
	component: DashboardHelpPage
});
function DashboardHelpPage() {
	const { historyMeta } = Route$22.useLoaderData();
	return /* @__PURE__ */ jsx(HelpCenterClient, { historyMeta });
}
//#endregion
//#region src/app/dashboard/alertas/_components/AlertsHistoryClient.tsx
var PAGE_SIZE = 100;
var DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
var ALL_STATIONS_VALUE = "__all_stations__";
function formatDateTime(value) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return value;
	return parsed.toLocaleString("es-ES");
}
function parseAlertTypeFilter(value) {
	if (value === "LOW_BIKES" || value === "LOW_ANCHORS") return value;
	return "all";
}
function parseStateFilter(value) {
	if (value === "active" || value === "resolved") return value;
	return "all";
}
function parseSeverityFilter(value) {
	if (value === "1" || value === "2") return value;
	return "all";
}
function parseDateInput(value) {
	if (!value || !DATE_INPUT_PATTERN.test(value)) return "";
	return value;
}
function parsePageIndex(value) {
	if (!value) return 0;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) return 0;
	return parsed - 1;
}
function toLocalDateInputValue(date) {
	return (/* @__PURE__ */ new Date(date.getTime() - date.getTimezoneOffset() * 6e4)).toISOString().slice(0, 10);
}
function getRangeForLastDays(days) {
	const end = /* @__PURE__ */ new Date();
	const start = new Date(end);
	start.setDate(end.getDate() - Math.max(days - 1, 0));
	return {
		fromDate: toLocalDateInputValue(start),
		toDate: toLocalDateInputValue(end)
	};
}
function parseViewStateFromSearchParams(params, stations) {
	const stationIdCandidate = (params.get("stationId") ?? "").trim();
	return {
		stationId: Boolean(stationIdCandidate) && (stations.length === 0 || stations.some((station) => station.id === stationIdCandidate)) ? stationIdCandidate : "",
		alertType: parseAlertTypeFilter(params.get("alertType")),
		stateFilter: parseStateFilter(params.get("state")),
		severityFilter: parseSeverityFilter(params.get("severity")),
		fromDate: parseDateInput(params.get("from")),
		toDate: parseDateInput(params.get("to")),
		page: parsePageIndex(params.get("page"))
	};
}
function buildViewQueryFromState(state) {
	const params = new URLSearchParams();
	if (state.stationId) params.set("stationId", state.stationId);
	if (state.alertType !== "all") params.set("alertType", state.alertType);
	if (state.stateFilter !== "all") params.set("state", state.stateFilter);
	if (state.severityFilter !== "all") params.set("severity", state.severityFilter);
	if (state.fromDate) params.set("from", state.fromDate);
	if (state.toDate) params.set("to", state.toDate);
	if (state.page > 0) params.set("page", String(state.page + 1));
	return params.toString();
}
function AlertsHistoryClient({ stations }) {
	const router = useRouter();
	const location = useLocation();
	const pathname = location.pathname;
	const searchParams = new URLSearchParams(location.searchStr ?? "");
	const [stationId, setStationId] = useState("");
	const [alertType, setAlertType] = useState("all");
	const [stateFilter, setStateFilter] = useState("all");
	const [severityFilter, setSeverityFilter] = useState("all");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [page, setPage] = useState(0);
	const [isUrlReady, setIsUrlReady] = useState(false);
	const lastSyncedUrlRef = useRef(null);
	const prevStationsLengthRef = useRef(-1);
	const [rows, setRows] = useState([]);
	const [totalRows, setTotalRows] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState(null);
	const apiQueryString = useMemo(() => {
		const params = new URLSearchParams();
		params.set("limit", String(PAGE_SIZE));
		params.set("offset", String(page * PAGE_SIZE));
		if (stationId) params.set("stationId", stationId);
		if (alertType !== "all") params.set("alertType", alertType);
		if (stateFilter !== "all") params.set("state", stateFilter);
		if (severityFilter !== "all") params.set("severity", severityFilter);
		if (fromDate) params.set("from", `${fromDate}T00:00:00.000Z`);
		if (toDate) params.set("to", `${toDate}T23:59:59.999Z`);
		return params.toString();
	}, [
		alertType,
		fromDate,
		page,
		severityFilter,
		stateFilter,
		stationId,
		toDate
	]);
	const viewQueryString = useMemo(() => buildViewQueryFromState({
		stationId,
		alertType,
		stateFilter,
		severityFilter,
		fromDate,
		toDate,
		page
	}), [
		alertType,
		fromDate,
		page,
		severityFilter,
		stateFilter,
		stationId,
		toDate
	]);
	useEffect(() => {
		const serialized = searchParams.toString();
		const urlChanged = lastSyncedUrlRef.current === null || serialized !== lastSyncedUrlRef.current;
		const stationsJustHydrated = prevStationsLengthRef.current === 0 && stations.length > 0 && !urlChanged;
		if (!urlChanged && !stationsJustHydrated) {
			prevStationsLengthRef.current = stations.length;
			setIsUrlReady(true);
			return;
		}
		const parsedState = parseViewStateFromSearchParams(new URLSearchParams(serialized), stations);
		setStationId(parsedState.stationId);
		setAlertType(parsedState.alertType);
		setStateFilter(parsedState.stateFilter);
		setSeverityFilter(parsedState.severityFilter);
		setFromDate(parsedState.fromDate);
		setToDate(parsedState.toDate);
		setPage(parsedState.page);
		if (urlChanged) lastSyncedUrlRef.current = serialized;
		prevStationsLengthRef.current = stations.length;
		setIsUrlReady(true);
	}, [searchParams, stations]);
	useEffect(() => {
		if (!isUrlReady) return;
		if (buildViewQueryFromState(parseViewStateFromSearchParams(new URLSearchParams(window.location.search), stations)) === viewQueryString) return;
		const nextUrl = viewQueryString.length > 0 ? `${pathname}?${viewQueryString}` : pathname;
		router.navigate({
			to: nextUrl,
			replace: true
		});
	}, [
		isUrlReady,
		pathname,
		router,
		stations,
		viewQueryString
	]);
	useAbortableAsyncEffect(async (signal, isActive) => {
		try {
			const payload = await fetchJson(`${appRoutes.api.alertsHistory()}?${apiQueryString}`, {
				signal,
				cache: "no-store",
				errorMessage: "No se pudo cargar el historial de alertas."
			});
			if (!isActive()) return;
			setRows(Array.isArray(payload.alerts) ? payload.alerts : []);
			setTotalRows(Number(payload.pagination?.total ?? 0));
		} catch (error) {
			if (!isActive()) return;
			captureExceptionWithContext(error, {
				area: "dashboard.alerts-history",
				operation: "loadHistory",
				extra: { query: apiQueryString }
			});
			console.error("[Dashboard] Error cargando historial de alertas.", error);
			setRows([]);
			setTotalRows(0);
			setErrorMessage("No se pudo cargar el historial de alertas.");
		}
	}, [apiQueryString], {
		onStart: () => {
			setIsLoading(true);
			setErrorMessage(null);
		},
		onSettled: () => {
			setIsLoading(false);
		}
	});
	const pageCount = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
	const hasNextPage = page + 1 < pageCount;
	const hasPreviousPage = page > 0;
	const stats = useMemo(() => {
		return {
			active: rows.filter((row) => row.isActive).length,
			critical: rows.filter((row) => row.severity >= 2).length
		};
	}, [rows]);
	const copyToClipboard = useCallback(() => {
		const text = [[
			"Fecha",
			"Estación",
			"ID",
			"Tipo",
			"Severidad",
			"Estado",
			"Valor",
			"Ventana"
		], ...rows.map((row) => [
			formatDateTime(row.generatedAt),
			row.stationName,
			row.stationId,
			formatAlertType(row.alertType),
			row.severity >= 2 ? "Crítica" : "Media",
			row.isActive ? "Activa" : "Resuelta",
			row.metricValue.toFixed(1),
			`${row.windowHours}h`
		])].map((row) => row.join("	")).join("\n");
		navigator.clipboard.writeText(text);
	}, [rows]);
	const downloadCsvHref = useMemo(() => {
		const params = new URLSearchParams(apiQueryString);
		params.set("offset", "0");
		params.set("limit", "2000");
		params.set("format", "csv");
		return `${appRoutes.api.alertsHistory()}?${params.toString()}`;
	}, [apiQueryString]);
	const activeQuickRange = useMemo(() => {
		if (!fromDate || !toDate) return null;
		const today = getRangeForLastDays(1);
		const last7Days = getRangeForLastDays(7);
		const last30Days = getRangeForLastDays(30);
		if (fromDate === today.fromDate && toDate === today.toDate) return "today";
		if (fromDate === last7Days.fromDate && toDate === last7Days.toDate) return "last7";
		if (fromDate === last30Days.fromDate && toDate === last30Days.toDate) return "last30";
		return null;
	}, [fromDate, toDate]);
	const hasActiveFilters = stationId.length > 0 || alertType !== "all" || stateFilter !== "all" || severityFilter !== "all" || fromDate.length > 0 || toDate.length > 0 || page > 0;
	const applyQuickRange = (days) => {
		const range = getRangeForLastDays(days);
		setFromDate(range.fromDate);
		setToDate(range.toDate);
		setPage(0);
	};
	const clearFilters = () => {
		setStationId("");
		setAlertType("all");
		setStateFilter("all");
		setSeverityFilter("all");
		setFromDate("");
		setToDate("");
		setPage(0);
	};
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsxs(PageHeaderCard, { children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3 text-[var(--primary)]",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white",
							children: "B"
						}), /* @__PURE__ */ jsx("h1", {
							className: "text-lg font-bold text-[var(--foreground)]",
							children: "Historial de alertas"
						})]
					}), /* @__PURE__ */ jsx(DashboardRouteLinks, {
						routes: [
							"dashboard",
							"stations",
							"flow",
							"conclusions",
							"help"
						],
						variant: "inline",
						className: "hidden items-center gap-5 md:flex"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-end gap-2",
					children: [
						/* @__PURE__ */ jsx(DashboardRouteLinks, {
							routes: [
								"dashboard",
								"stations",
								"flow",
								"conclusions",
								"help"
							],
							variant: "chips",
							className: "flex flex-wrap items-center gap-2 md:hidden"
						}),
						/* @__PURE__ */ jsx(Link, {
							to: appRoutes.dashboard(),
							className: "ui-icon-button",
							"aria-label": "Volver al dashboard",
							children: "Inicio"
						}),
						/* @__PURE__ */ jsx(ThemeToggleButton, {}),
						/* @__PURE__ */ jsx(GitHubRepoButton, {})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-6",
				children: [
					/* @__PURE__ */ jsxs(Select, {
						value: stationId || ALL_STATIONS_VALUE,
						onValueChange: (value) => {
							setStationId(!value || value === ALL_STATIONS_VALUE ? "" : value);
							setPage(0);
						},
						children: [/* @__PURE__ */ jsxs(SelectTrigger, {
							"aria-label": "Filtrar por estación",
							className: "w-full bg-[var(--secondary)]",
							children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
							value: ALL_STATIONS_VALUE,
							children: "Todas las estaciones"
						}), stations.map((station) => /* @__PURE__ */ jsx(SelectItem, {
							value: station.id,
							children: station.name
						}, station.id))] })]
					}),
					/* @__PURE__ */ jsxs(Select, {
						value: alertType,
						onValueChange: (value) => {
							setAlertType(value ?? "all");
							setPage(0);
						},
						children: [/* @__PURE__ */ jsxs(SelectTrigger, {
							"aria-label": "Filtrar por tipo de alerta",
							className: "w-full bg-[var(--secondary)]",
							children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [
							/* @__PURE__ */ jsx(SelectItem, {
								value: "all",
								children: "Todos los tipos"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "LOW_BIKES",
								children: "Pocas bicis"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "LOW_ANCHORS",
								children: "Pocos anclajes"
							})
						] })]
					}),
					/* @__PURE__ */ jsxs(Select, {
						value: stateFilter,
						onValueChange: (value) => {
							setStateFilter(value ?? "all");
							setPage(0);
						},
						children: [/* @__PURE__ */ jsxs(SelectTrigger, {
							"aria-label": "Filtrar por estado",
							className: "w-full bg-[var(--secondary)]",
							children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [
							/* @__PURE__ */ jsx(SelectItem, {
								value: "all",
								children: "Todos los estados"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "active",
								children: "Activas"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "resolved",
								children: "Resueltas"
							})
						] })]
					}),
					/* @__PURE__ */ jsxs(Select, {
						value: severityFilter,
						onValueChange: (value) => {
							setSeverityFilter(value ?? "all");
							setPage(0);
						},
						children: [/* @__PURE__ */ jsxs(SelectTrigger, {
							"aria-label": "Filtrar por severidad",
							className: "w-full bg-[var(--secondary)]",
							children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [
							/* @__PURE__ */ jsx(SelectItem, {
								value: "all",
								children: "Todas las severidades"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "1",
								children: "Media"
							}),
							/* @__PURE__ */ jsx(SelectItem, {
								value: "2",
								children: "Critica"
							})
						] })]
					}),
					/* @__PURE__ */ jsx(Input, {
						type: "date",
						value: fromDate,
						onChange: (event) => {
							setFromDate(event.target.value);
							setPage(0);
						},
						"aria-label": "Fecha desde",
						className: "bg-[var(--secondary)]"
					}),
					/* @__PURE__ */ jsx(Input, {
						type: "date",
						value: toDate,
						onChange: (event) => {
							setToDate(event.target.value);
							setPage(0);
						},
						"aria-label": "Fecha hasta",
						className: "bg-[var(--secondary)]"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]",
						children: "Rangos rapidos"
					}),
					/* @__PURE__ */ jsx(Button, {
						onClick: () => applyQuickRange(1),
						variant: activeQuickRange === "today" ? "default" : "outline",
						size: "sm",
						className: `rounded-full px-3 py-1 text-xs ${activeQuickRange === "today" ? "border-[var(--primary)]" : "hover:border-[var(--primary)]"}`,
						children: "Hoy"
					}),
					/* @__PURE__ */ jsx(Button, {
						onClick: () => applyQuickRange(7),
						variant: activeQuickRange === "last7" ? "default" : "outline",
						size: "sm",
						className: `rounded-full px-3 py-1 text-xs ${activeQuickRange === "last7" ? "border-[var(--primary)]" : "hover:border-[var(--primary)]"}`,
						children: "7 dias"
					}),
					/* @__PURE__ */ jsx(Button, {
						onClick: () => applyQuickRange(30),
						variant: activeQuickRange === "last30" ? "default" : "outline",
						size: "sm",
						className: `rounded-full px-3 py-1 text-xs ${activeQuickRange === "last30" ? "border-[var(--primary)]" : "hover:border-[var(--primary)]"}`,
						children: "30 dias"
					}),
					/* @__PURE__ */ jsx(Button, {
						onClick: clearFilters,
						disabled: !hasActiveFilters,
						variant: "outline",
						size: "sm",
						className: "rounded-full px-3 py-1 text-xs hover:border-[var(--primary)]",
						children: "Limpiar filtros"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "ml-auto text-xs text-[var(--muted)]",
						children: "La URL refleja los filtros actuales."
					})
				]
			})
		] }),
		/* @__PURE__ */ jsxs("section", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs(Card, {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Total filtrado"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: totalRows
					})]
				}),
				/* @__PURE__ */ jsxs(Card, {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Activas (pagina)"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: stats.active
					})]
				}),
				/* @__PURE__ */ jsxs(Card, {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Criticas (pagina)"
					}), /* @__PURE__ */ jsx("p", {
						className: "stat-value",
						children: stats.critical
					})]
				}),
				/* @__PURE__ */ jsxs(Card, {
					className: "ui-section-card",
					children: [/* @__PURE__ */ jsx("p", {
						className: "stat-label",
						children: "Exportar"
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							onClick: copyToClipboard,
							disabled: rows.length === 0,
							variant: "outline",
							size: "sm",
							className: "px-3 py-2 text-xs",
							children: "Copiar"
						}), /* @__PURE__ */ jsx("a", {
							href: downloadCsvHref,
							className: "inline-flex rounded-lg border border-[var(--primary)] px-3 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white",
							children: "CSV"
						})]
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]",
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: "flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: "Registros de alertas"
					}), /* @__PURE__ */ jsxs("p", {
						className: "text-xs text-[var(--muted)]",
						children: [
							"Pagina ",
							page + 1,
							"/",
							pageCount,
							" · ",
							rows.length,
							" filas"
						]
					})]
				}),
				isLoading ? /* @__PURE__ */ jsx("p", {
					className: "px-4 py-6 text-sm text-[var(--muted)]",
					children: "Cargando historial..."
				}) : errorMessage ? /* @__PURE__ */ jsx("p", {
					className: "px-4 py-6 text-sm text-[var(--muted)]",
					children: errorMessage
				}) : rows.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "px-4 py-6 text-sm text-[var(--muted)]",
					children: "No hay alertas para los filtros actuales."
				}) : /* @__PURE__ */ jsx(ScrollArea, {
					className: "overflow-x-auto max-h-[600px]",
					children: /* @__PURE__ */ jsxs(Table, {
						className: "min-w-full border-collapse text-sm",
						children: [/* @__PURE__ */ jsx(TableHeader, {
							className: "sticky top-0 z-10 bg-[var(--secondary)]",
							children: /* @__PURE__ */ jsxs(TableRow, {
								className: "text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]",
								children: [
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Fecha"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Estacion"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Tipo"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Severidad"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Estado"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Valor"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-auto px-4 py-3",
										children: "Ventana"
									})
								]
							})
						}), /* @__PURE__ */ jsx(TableBody, { children: rows.map((row) => /* @__PURE__ */ jsxs(TableRow, {
							className: "border-t border-[var(--border)] text-[var(--foreground)]",
							children: [
								/* @__PURE__ */ jsx(TableCell, {
									className: "whitespace-nowrap px-4 py-3 text-xs text-[var(--muted)]",
									children: formatDateTime(row.generatedAt)
								}),
								/* @__PURE__ */ jsxs(TableCell, {
									className: "px-4 py-3",
									children: [/* @__PURE__ */ jsx("p", {
										className: "font-semibold",
										children: row.stationName
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-[var(--muted)]",
										children: row.stationId
									})]
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "whitespace-nowrap px-4 py-3",
									children: formatAlertType(row.alertType)
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-4 py-3",
									children: /* @__PURE__ */ jsx(Badge, {
										variant: row.severity >= 2 ? "danger" : "warning",
										children: row.severity >= 2 ? "Critica" : "Media"
									})
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-4 py-3",
									children: /* @__PURE__ */ jsx(Badge, {
										variant: row.isActive ? "success" : "muted",
										children: row.isActive ? "Activa" : "Resuelta"
									})
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "whitespace-nowrap px-4 py-3 text-xs",
									children: row.metricValue.toFixed(1)
								}),
								/* @__PURE__ */ jsxs(TableCell, {
									className: "whitespace-nowrap px-4 py-3 text-xs text-[var(--muted)]",
									children: [row.windowHours, "h"]
								})
							]
						}, row.id)) })]
					})
				}),
				/* @__PURE__ */ jsxs("footer", {
					className: "flex items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
					children: [/* @__PURE__ */ jsxs("p", {
						className: "text-xs text-[var(--muted)]",
						children: [
							"Muestra de ",
							PAGE_SIZE,
							" filas por pagina"
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							onClick: () => hasPreviousPage && setPage((current) => current - 1),
							disabled: !hasPreviousPage || isLoading,
							variant: "outline",
							size: "sm",
							className: "text-xs",
							children: "Anterior"
						}), /* @__PURE__ */ jsx(Button, {
							onClick: () => hasNextPage && setPage((current) => current + 1),
							disabled: !hasNextPage || isLoading,
							variant: "outline",
							size: "sm",
							className: "text-xs",
							children: "Siguiente"
						})]
					})]
				})
			]
		})
	] });
}
//#endregion
//#region src/server-functions/dashboard-alertas.ts
var getAlertsHistoryPageData = createServerFn({ method: "GET" }).handler(createSsrRpc("11dcf17e9b708291fd9c9de38dc41400f5fd9c701b169868a9374fcd97ad78f9"));
//#endregion
//#region src/app/dashboard/alertas/index.tsx
var Route$21 = createFileRoute("/dashboard/alertas/")({
	head: () => {
		const title = "Historial de alertas - Dashboard Bizi";
		const description = "Consulta alertas activas y resueltas de Bizi Zaragoza para detectar estaciones vacias, llenas o con riesgo operativo.";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					name: "robots",
					content: "noindex, nofollow"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:title",
					content: title
				},
				{
					name: "twitter:description",
					content: description
				}
			],
			title
		};
	},
	loader: () => getAlertsHistoryPageData(),
	component: DashboardAlertsHistoryPage
});
function DashboardAlertsHistoryPage() {
	const { stations } = Route$21.useLoaderData();
	return /* @__PURE__ */ jsx(AlertsHistoryClient, { stations: stations.stations });
}
//#endregion
//#region src/app/api/status/index.ts
var Route$20 = createFileRoute("/api/status/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const format = new URL(request.url).searchParams.get("format");
		const access = await enforcePublicApiAccess({
			route: "/api/status",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-status",
			limit: 40,
			windowMs: 6e4,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		const data = await getPipelineStatusSummary();
		if (!data || typeof data !== "object") throw new Error("Respuesta invalida al consultar el estado del sistema.");
		const payload = {
			...data,
			dataState: resolveStatusDataState(data)
		};
		if (format === "csv") {
			const csv = "timestamp,lastCollection,status\n" + (payload.pipeline?.lastSuccessfulPoll || "") + "," + (payload.pipeline?.lastSuccessfulPoll || "") + "," + (payload.quality?.freshness?.lastUpdated || "");
			return new Response(csv, {
				status: 200,
				headers: {
					"Content-Type": "text/csv; charset=utf-8",
					...access.headers
				}
			});
		}
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.status",
			operation: "GET /api/status"
		});
		logger.error("api.status.failed", { error });
		return new Response(JSON.stringify({
			error: "Failed to fetch status",
			dataState: "error"
		}), { status: 500 });
	}
} } } });
//#endregion
//#region src/lib/csv.ts
function escapeCsvCell$1(value) {
	return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}
function toCsv$1(headers, rows) {
	return [headers.map(escapeCsvCell$1).join(","), ...rows.map((row) => row.map(escapeCsvCell$1).join(","))].join("\n");
}
function rowsToCsv(headers, rows) {
	return toCsv$1(headers, rows.map((row) => headers.map((h) => row[h])));
}
//#endregion
//#region src/app/api/stations/index.ts
var Route$19 = createFileRoute("/api/stations/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const format = new URL(request.url).searchParams.get("format");
		const access = await enforcePublicApiAccess({
			route: "/api/stations",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-stations",
			limit: 40,
			windowMs: 6e4,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		const [stations, dataset] = await Promise.all([getStationsWithLatestStatus(), getSharedDatasetSnapshot().catch(() => null)]);
		const payload = {
			stations,
			generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			dataState: resolveStationsDataState({
				count: stations.length,
				coverage: dataset?.coverage,
				status: dataset?.pipeline
			})
		};
		if (format === "csv") {
			const csv = rowsToCsv([
				"stationId",
				"stationName",
				"lat",
				"lon",
				"capacity",
				"bikesAvailable",
				"anchorsFree",
				"recordedAt"
			], payload.stations);
			return new Response(csv, {
				status: 200,
				headers: {
					"Content-Type": "text/csv; charset=utf-8",
					"Content-Disposition": "attachment; filename=\"stations-current.csv\"",
					"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
					...access.headers
				}
			});
		}
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.stations",
			operation: "GET /api/stations"
		});
		logger.error("api.stations.failed", { error });
		return errorResponse$1("Failed to fetch stations", 500);
	}
} } } });
//#endregion
//#region src/app/api/rebalancing-report/index.ts
var MAX_DAYS = 90;
var DEFAULT_DAYS = 15;
var PUBLIC_ROUTE_RATE_LIMIT$5 = {
	limit: 20,
	windowMs: 6e4
};
function parseDays(value) {
	if (value === null) return DEFAULT_DAYS;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DAYS) return null;
	return parsed;
}
function escapeCell(value) {
	return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}
function toCsvDiagnostics(rows) {
	return [[
		"stationId",
		"stationName",
		"districtName",
		"capacity",
		"currentBikes",
		"currentAnchors",
		"currentOccupancy",
		"inferredType",
		"classification",
		"actionGroup",
		"urgency",
		"priorityScore",
		"targetBandMin",
		"targetBandMax",
		"occupancyAvg",
		"pctTimeEmpty",
		"pctTimeFull",
		"rotation",
		"persistenceProxy",
		"riskEmptyAt1h",
		"riskFullAt1h",
		"selfCorrectionProbability",
		"estimatedRecoveryMinutes",
		"classificationReasons",
		"actionReasons"
	], ...rows.map((row) => [
		row.stationId,
		row.stationName,
		row.districtName ?? "",
		row.capacity,
		row.currentBikes,
		row.currentAnchors,
		row.currentOccupancy.toFixed(3),
		row.inferredType,
		row.classification,
		row.actionGroup,
		row.urgency,
		row.priorityScore.toFixed(3),
		row.targetBand.min,
		row.targetBand.max,
		row.globalMetrics.occupancyAvg.toFixed(3),
		row.globalMetrics.pctTimeEmpty.toFixed(3),
		row.globalMetrics.pctTimeFull.toFixed(3),
		row.globalMetrics.rotation.toFixed(0),
		row.globalMetrics.persistenceProxy.toFixed(3),
		row.risk.riskEmptyAt1h.toFixed(3),
		row.risk.riskFullAt1h.toFixed(3),
		row.risk.selfCorrectionProbability.toFixed(3),
		row.risk.estimatedRecoveryMinutes ?? "",
		row.classificationReasons.join(" | "),
		row.actionReasons.join(" | ")
	])].map((row) => row.map(escapeCell).join(",")).join("\n");
}
function toCsvTransfers(rows) {
	return [[
		"originStationId",
		"originStationName",
		"destinationStationId",
		"destinationStationName",
		"bikesToMove",
		"timeWindowStart",
		"timeWindowEnd",
		"matchScore",
		"confidence",
		"emptiesAvoided",
		"fullsAvoided",
		"usesRecovered",
		"costScore",
		"reasons"
	], ...rows.map((row) => [
		row.originStationId,
		row.originStationName,
		row.destinationStationId,
		row.destinationStationName,
		row.bikesToMove,
		row.timeWindow.start,
		row.timeWindow.end,
		row.matchScore.toFixed(3),
		row.confidence.toFixed(3),
		row.expectedImpact.emptiesAvoided.toFixed(2),
		row.expectedImpact.fullsAvoided.toFixed(2),
		row.expectedImpact.usesRecovered.toFixed(2),
		row.expectedImpact.costScore.toFixed(3),
		row.reasons.join(" | ")
	])].map((row) => row.map(escapeCell).join(",")).join("\n");
}
var Route$18 = createFileRoute("/api/rebalancing-report/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const { searchParams } = new URL(request.url);
		const district = searchParams.get("district")?.trim() || null;
		const format = searchParams.get("format");
		const days = parseDays(searchParams.get("days"));
		if (days === null) return new Response(JSON.stringify({
			error: `Invalid days parameter. Must be an integer between 1 and ${MAX_DAYS}.`,
			dataState: "error"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (format !== null && format !== "json" && format !== "csv") return errorResponse$1("Invalid format. Use json or csv.", 400);
		const access = await enforcePublicApiAccess({
			route: "/api/rebalancing-report",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-rebalancing",
			limit: PUBLIC_ROUTE_RATE_LIMIT$5.limit,
			windowMs: PUBLIC_ROUTE_RATE_LIMIT$5.windowMs,
			requireApiKey: format === "csv" || days > 30
		});
		if (!access.ok) return access.response;
		const report = await buildRebalancingReport({
			days,
			district
		});
		if (format === "csv") {
			const combined = `# DIAGNOSTICOS\n${toCsvDiagnostics(report.diagnostics)}\n\n# TRANSFERENCIAS\n${toCsvTransfers(report.transfers)}`;
			return new Response(combined, {
				status: 200,
				headers: {
					"Content-Type": "text/csv; charset=utf-8",
					"Content-Disposition": `attachment; filename="rebalancing-report-${days}d.csv"`,
					"Cache-Control": "public, max-age=300, stale-while-revalidate=60",
					...access.headers
				}
			});
		}
		return new Response(JSON.stringify(report), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=60",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.rebalancing-report",
			operation: "GET /api/rebalancing-report"
		});
		logger.error("api.rebalancing_report.failed", { error });
		return errorResponse$1("Failed to build rebalancing report", 500);
	}
} } } });
//#endregion
//#region src/app/api/rankings/index.ts
var Route$17 = createFileRoute("/api/rankings/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const typeParam = new URL(request.url).searchParams.get("type") ?? "turnover";
		if (typeParam !== "turnover" && typeParam !== "availability") return new Response(JSON.stringify({
			error: "Invalid type. Use \"turnover\" or \"availability\".",
			dataState: "error"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const type = typeParam;
		const limitParam = new URL(request.url).searchParams.get("limit") ?? "20";
		const parsedLimit = parseInt(limitParam);
		if (!Number.isFinite(parsedLimit) || parsedLimit < 1) return new Response(JSON.stringify({
			error: "Invalid limit. Must be a positive integer.",
			dataState: "error"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const limit = Math.min(Math.max(1, parsedLimit), 200);
		const format = new URL(request.url).searchParams.get("format");
		const access = await enforcePublicApiAccess({
			route: "/api/rankings",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-rankings",
			limit: 40,
			windowMs: 6e4,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		const [rankings, stations, districtCollection, dataset] = await Promise.all([
			getStationRankings(type, limit),
			getStationsWithLatestStatus(),
			fetchDistrictCollection$1().catch(() => null),
			getSharedDatasetSnapshot().catch(() => null)
		]);
		let enriched = enrichRankingRows(rankings, new Map(stations.map((s) => [s.id, s.name])), districtCollection !== null ? buildStationDistrictMap(stations.map((s) => ({
			id: s.id,
			lon: s.lon,
			lat: s.lat
		})), districtCollection) : /* @__PURE__ */ new Map());
		const peakMap = buildPeakFullHoursByStation([]);
		enriched = attachPeakFullHours(enriched, peakMap);
		const districtSpotlight = buildDistrictSpotlight(enriched, typeParam);
		const payload = {
			type,
			limit,
			rankings: enriched,
			districtSpotlight,
			generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			dataState: resolveRankingsDataState({
				count: enriched.length,
				coverage: dataset?.coverage
			})
		};
		if (format === "csv") {
			const csv = [[
				"stationId",
				"turnoverScore",
				"emptyHours",
				"fullHours",
				"totalHours"
			], ...payload.rankings.map((r) => [
				r.stationId,
				r.turnoverScore,
				r.emptyHours,
				r.fullHours,
				r.totalHours
			])].map((r) => r.join(",")).join("\n");
			return new Response(csv, {
				status: 200,
				headers: {
					"Content-Type": "text/csv; charset=utf-8",
					...access.headers
				}
			});
		}
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=300",
				...access.headers
			}
		});
	} catch (error) {
		return errorResponse$1("Failed to fetch rankings", 500);
	}
} } } });
//#endregion
//#region src/app/api/predictions/index.ts
var PUBLIC_ROUTE_RATE_LIMIT$4 = {
	limit: 30,
	windowMs: 6e4
};
var Route$16 = createFileRoute("/api/predictions/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const stationId = new URL(request.url).searchParams.get("stationId")?.trim() ?? "";
		if (!stationId || stationId.length < 1 || stationId.length > 64) return new Response(JSON.stringify({ error: "stationId must be 1-64 characters" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const access = await enforcePublicApiAccess({
			route: "/api/predictions",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-predictions",
			limit: PUBLIC_ROUTE_RATE_LIMIT$4.limit,
			windowMs: PUBLIC_ROUTE_RATE_LIMIT$4.windowMs,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		const payload = await getStationPredictions(stationId);
		if (!payload) return new Response(JSON.stringify({ error: "station not found" }), {
			status: 404,
			headers: {
				"Content-Type": "application/json",
				...access.headers
			}
		});
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.predictions",
			operation: "GET /api/predictions"
		});
		logger.error("api.predictions.failed", { error });
		return errorResponse$1("Failed to generate predictions", 500);
	}
} } } });
//#endregion
//#region src/app/api/patterns/index.ts
var PUBLIC_ROUTE_RATE_LIMIT$3 = {
	limit: 30,
	windowMs: 6e4
};
var Route$15 = createFileRoute("/api/patterns/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const stationId = new URL(request.url).searchParams.get("stationId");
		if (!stationId || stationId.trim().length < 1 || stationId.trim().length > 64) return new Response(JSON.stringify({ error: "stationId query parameter is required (max 64 chars)" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const access = await enforcePublicApiAccess({
			route: "/api/patterns",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-patterns",
			limit: PUBLIC_ROUTE_RATE_LIMIT$3.limit,
			windowMs: PUBLIC_ROUTE_RATE_LIMIT$3.windowMs,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		const patterns = await withCache(`patterns:stationId=${stationId}`, 300, () => getStationPatterns(stationId, void 0));
		return new Response(JSON.stringify(patterns), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.patterns",
			operation: "GET /api/patterns"
		});
		logger.error("api.patterns.failed", { error });
		return errorResponse$1("Failed to fetch station patterns", 500);
	}
} } } });
//#endregion
//#region src/app/api/mobility/index.ts
var Route$14 = createFileRoute("/api/mobility/")({ server: { handlers: { GET: async ({ request }) => {
	const { searchParams } = new URL(request.url);
	const mobilityDays = Number(searchParams.get("mobilityDays")) || 14;
	const demandDays = Number(searchParams.get("demandDays")) || 30;
	const monthKey = searchParams.get("month");
	return new Response(JSON.stringify({
		mobilityDays,
		demandDays,
		selectedMonth: monthKey,
		methodology: "Matriz O-D estimada con variaciones netas horarias de bicis por estacion; no representa viajes individuales observados.",
		hourlySignals: [],
		dailyDemand: [],
		systemHourlyProfile: [],
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		dataState: "empty"
	}), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300, stale-while-revalidate=120"
		}
	});
} } } });
//#endregion
//#region src/app/api/history/index.ts
var HISTORY_CSV_HEADERS = [
	"day",
	"demandScore",
	"avgOccupancy",
	"balanceIndex",
	"sampleCount"
];
async function buildHistoryPayload() {
	const [historyMeta, dailyHistoryRows, status] = await Promise.all([
		getHistoryMetadata(),
		prisma.$queryRaw`
      SELECT
        TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
        SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
        AVG("occupancyAvg") AS "avgOccupancy",
        AVG(CASE
          WHEN "occupancyAvg" IS NULL THEN 0.5
          WHEN ABS("occupancyAvg" - 0.5) >= 0.5 THEN 0
          ELSE 1 - (2 * ABS("occupancyAvg" - 0.5))
        END) AS "balanceIndex",
        SUM("sampleCount") AS "sampleCount"
      FROM "HourlyStationStat"
      WHERE "occupancyAvg" IS NOT NULL
      GROUP BY TO_CHAR("bucketStart", 'YYYY-MM-DD')
      ORDER BY day ASC;
    `,
		getPipelineStatusSummary().catch(() => null)
	]);
	const history = dailyHistoryRows.map((row) => ({
		day: row.day,
		demandScore: Number(row.demandScore ?? 0),
		avgOccupancy: Number(row.avgOccupancy ?? 0),
		balanceIndex: Number(row.balanceIndex ?? 0),
		sampleCount: Number(row.sampleCount ?? 0)
	}));
	return {
		source: historyMeta.source,
		coverage: historyMeta.coverage,
		history,
		generatedAt: historyMeta.generatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
		dataState: resolveHistoryDataState({
			count: history.length,
			coverage: historyMeta.coverage,
			status,
			expectedDays: 30
		})
	};
}
var Route$13 = createFileRoute("/api/history/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const format = new URL(request.url).searchParams.get("format");
		const access = await enforcePublicApiAccess({
			route: "/api/history",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-history",
			limit: 40,
			windowMs: 6e4,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		const payload = await buildHistoryPayload();
		if (format === "csv") return new Response(rowsToCsv(HISTORY_CSV_HEADERS, payload.history), {
			status: 200,
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": "attachment; filename=\"history-balance.csv\"",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=120",
				...access.headers
			}
		});
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=120",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.history",
			operation: "GET /api/history"
		});
		return errorResponse$1("Failed to fetch historical data", 500);
	}
} } } });
//#endregion
//#region src/app/api/heatmap/index.ts
var PUBLIC_ROUTE_RATE_LIMIT$2 = {
	limit: 30,
	windowMs: 6e4
};
var Route$12 = createFileRoute("/api/heatmap/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const stationId = new URL(request.url).searchParams.get("stationId");
		if (!stationId || stationId.trim().length < 1 || stationId.trim().length > 64) return new Response(JSON.stringify({ error: "stationId query parameter is required (max 64 chars)" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const access = await enforcePublicApiAccess({
			route: "/api/heatmap",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-heatmap",
			limit: PUBLIC_ROUTE_RATE_LIMIT$2.limit,
			windowMs: PUBLIC_ROUTE_RATE_LIMIT$2.windowMs,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		const heatmap = await withCache(`heatmap:stationId=${stationId}`, 300, () => getHeatmap(stationId, void 0));
		return new Response(JSON.stringify(heatmap), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.heatmap",
			operation: "GET /api/heatmap"
		});
		logger.error("api.heatmap.failed", { error });
		return errorResponse$1("Failed to fetch station heatmap", 500);
	}
} } } });
//#endregion
//#region src/app/api/docs/index.ts
var Route$11 = createFileRoute("/api/docs/")({ server: { handlers: { GET: async () => {
	throw redirect({
		to: "/developers",
		status: 308
	});
} } } });
//#endregion
//#region src/services/data-storage.ts
/**
* Store multiple station statuses in a transaction
* Handles duplicates by catching unique constraint errors
* 
* @param statuses Array of GBFS station statuses
* @returns Storage result with success status and count
*/
async function storeStationStatuses(statuses) {
	const result = {
		success: true,
		count: 0,
		duplicateCount: 0,
		skippedMissingStationIds: [],
		errors: []
	};
	try {
		const missingStationIds = await getMissingStationIds(statuses.map((status) => status.station_id));
		if (missingStationIds.length > 0) {
			result.skippedMissingStationIds = missingStationIds;
			captureWarningWithContext("Station status rows skipped because station metadata is unavailable.", {
				area: "services.data-storage",
				operation: "storeStationStatuses",
				dedupeKey: `data-storage:missing-stations:${missingStationIds.sort().join(",")}`,
				extra: {
					statusCount: statuses.length,
					missingStationCount: missingStationIds.length,
					missingStationIdsSample: missingStationIds.slice(0, 10)
				}
			});
			logger.warn("storage.station_statuses_missing_station_metadata", {
				statusCount: statuses.length,
				missingStationCount: missingStationIds.length,
				missingStationIdsSample: missingStationIds.slice(0, 10)
			});
		}
		const missingStationIdSet = new Set(missingStationIds);
		const data = statuses.filter((status) => !missingStationIdSet.has(status.station_id)).map((status) => ({
			stationId: status.station_id,
			bikesAvailable: status.num_bikes_available,
			anchorsFree: status.num_docks_available,
			recordedAt: /* @__PURE__ */ new Date(status.recorded_at * 1e3)
		}));
		if (data.length === 0) return result;
		const { count } = await prisma.stationStatus.createMany({
			data,
			skipDuplicates: true
		});
		result.count = count;
		result.duplicateCount = data.length - count;
	} catch (error) {
		result.success = false;
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		if (result.errors.length === 0) statuses.forEach((status) => {
			result.errors.push({
				stationId: status.station_id,
				error: errorMessage
			});
		});
		captureExceptionWithContext(error, {
			area: "services.data-storage",
			operation: "storeStationStatuses",
			extra: { statusCount: statuses.length }
		});
		logger.error("storage.station_statuses_failed", { error });
	}
	return result;
}
async function upsertStations(stations) {
	if (stations.length === 0) return { createdOrUpdated: 0 };
	const values = stations.map((station) => sql`(${station.station_id}, ${station.name}, ${station.lat}, ${station.lon}, ${station.capacity ?? 0}, true, NOW(), NOW())`);
	await prisma.$executeRaw`
    INSERT INTO "Station" (id, name, lat, lon, capacity, "isActive", "createdAt", "updatedAt")
    VALUES ${join(values)}
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      capacity = EXCLUDED.capacity,
      "isActive" = EXCLUDED."isActive",
      "updatedAt" = NOW();
  `;
	return { createdOrUpdated: stations.length };
}
async function getStationMetadataCount() {
	return prisma.station.count();
}
async function getMissingStationIds(stationIds) {
	const uniqueStationIds = Array.from(new Set(stationIds));
	if (uniqueStationIds.length === 0) return [];
	const existingStations = await prisma.station.findMany({
		where: { id: { in: uniqueStationIds } },
		select: { id: true }
	});
	const existingStationIds = new Set(existingStations.map((station) => station.id));
	return uniqueStationIds.filter((stationId) => !existingStationIds.has(stationId));
}
async function getSnapshotCount(recordedAt) {
	return prisma.stationStatus.count({ where: { recordedAt } });
}
async function getRecentSnapshotSummaries(options) {
	const limit = Math.max(1, options?.limit ?? 10);
	const minStationCount = Math.max(0, options?.minStationCount ?? 0);
	const havingClause = minStationCount > 0 ? sql`HAVING COUNT(*) >= ${minStationCount}` : empty;
	return (await prisma.$queryRaw(sql`
    SELECT "recordedAt", COUNT(*)::int AS "stationCount"
    FROM "StationStatus"
    GROUP BY "recordedAt"
    ${havingClause}
    ORDER BY "recordedAt" DESC
    LIMIT ${limit}
  `)).map((row) => ({
		recordedAt: row.recordedAt,
		stationCount: Number(row.stationCount)
	}));
}
//#endregion
//#region src/lib/observability.ts
/**
* Five Pillars of Data Observability Implementation
* 
* 1. Freshness: Data is recent (last_updated within threshold)
* 2. Volume: Expected number of records (station count within range)
* 3. Schema: Structure matches expected (validated externally, checked here)
* 4. Distribution: Values are in expected ranges (bikes >= 0, docks >= 0)
* 5. Lineage: Source is traceable (GBFS version logged)
*/
/**
* Quality thresholds from RESEARCH.md
*/
var QUALITY_THRESHOLDS = {
	freshness: { maxAgeSeconds: 300 },
	volume: {
		minStations: 200,
		maxStations: 500,
		expectedStations: 276
	},
	distribution: {
		minBikes: 0,
		minDocks: 0
	},
	lineage: { minVersion: "2.0" }
};
/**
* Check if data is fresh (Pillar 1)
* Data should be recent (last_updated within 5 minutes)
*/
function checkFreshness(lastUpdated, maxAgeSeconds = QUALITY_THRESHOLDS.freshness.maxAgeSeconds) {
	const lastUpdatedDate = /* @__PURE__ */ new Date(lastUpdated * 1e3);
	const ageSeconds = Math.floor(((/* @__PURE__ */ new Date()).getTime() - lastUpdatedDate.getTime()) / 1e3);
	return {
		lastUpdated: lastUpdatedDate,
		ageSeconds,
		maxAgeSeconds,
		isFresh: ageSeconds <= maxAgeSeconds
	};
}
/**
* Check volume is within expected range (Pillar 2)
* Bizi has ~276 stations, we expect 200-500
*/
async function checkVolume(stationCount) {
	return {
		stationCount,
		previousCount: await getPreviousStationCount(),
		expectedRange: {
			min: QUALITY_THRESHOLDS.volume.minStations,
			max: QUALITY_THRESHOLDS.volume.maxStations
		},
		isValid: stationCount >= QUALITY_THRESHOLDS.volume.minStations && stationCount <= QUALITY_THRESHOLDS.volume.maxStations
	};
}
/**
* Get the count of stations from the previous collection
* For anomaly detection (sudden drops/spikes)
*/
async function getPreviousStationCount() {
	try {
		const recentSnapshots = await getRecentSnapshotSummaries({
			limit: 2,
			minStationCount: QUALITY_THRESHOLDS.volume.minStations
		});
		if (recentSnapshots.length < 2) return null;
		return recentSnapshots[1].stationCount;
	} catch {
		return null;
	}
}
/**
* Check schema validity (Pillar 3)
* Schema is validated externally by Zod, we check the result
*/
function checkSchema(schemaErrors = []) {
	return {
		isValid: schemaErrors.length === 0,
		errors: schemaErrors
	};
}
/**
* Check value distribution (Pillar 4)
* Values should be in expected ranges (bikes >= 0, docks >= 0)
*/
function checkDistribution(stations) {
	let negativeBikesCount = 0;
	let negativeDocksCount = 0;
	let zeroCapacityCount = 0;
	for (const station of stations) {
		if (station.num_bikes_available < 0) negativeBikesCount++;
		if (station.num_docks_available < 0) negativeDocksCount++;
		if (station.num_bikes_available + station.num_docks_available === 0) zeroCapacityCount++;
	}
	return {
		negativeBikesCount,
		negativeDocksCount,
		zeroCapacityCount,
		isValid: negativeBikesCount === 0 && negativeDocksCount === 0
	};
}
/**
* Check lineage (Pillar 5)
* Source should be traceable with valid GBFS version
*/
function checkLineage(gbfsVersion, sourceUrl) {
	return {
		gbfsVersion,
		sourceUrl,
		isValid: gbfsVersion.startsWith("2.")
	};
}
/**
* Main validation function - checks all Five Pillars
* 
* @param input Validation input data
* @param schemaErrors Any schema validation errors from Zod (empty array if valid)
* @returns Complete observability metrics
*/
async function validateDataQuality(input, schemaErrors = []) {
	const timestamp = /* @__PURE__ */ new Date();
	const warnings = [];
	const errors = [];
	const freshness = checkFreshness(input.lastUpdated);
	const volume = await checkVolume(input.stations.length);
	const schema = checkSchema(schemaErrors);
	const distribution = checkDistribution(input.stations);
	const lineage = checkLineage(input.gbfsVersion, input.sourceUrl);
	if (!freshness.isFresh) {
		const message = `Data is stale: ${freshness.ageSeconds}s old (max: ${freshness.maxAgeSeconds}s)`;
		if (freshness.ageSeconds > freshness.maxAgeSeconds * 2) errors.push(message);
		else warnings.push(message);
	}
	if (!volume.isValid) {
		const message = `Volume anomaly: ${volume.stationCount} stations (expected ${volume.expectedRange.min}-${volume.expectedRange.max})`;
		errors.push(message);
	} else if (volume.previousCount !== null && volume.previousCount > 0) {
		const changePercent = Math.abs(volume.stationCount - volume.previousCount) / volume.previousCount * 100;
		if (changePercent > 20) warnings.push(`Volume changed ${changePercent.toFixed(1)}% from previous collection (${volume.previousCount} → ${volume.stationCount})`);
	}
	if (!schema.isValid) errors.push(`Schema validation failed: ${schema.errors.join(", ")}`);
	if (!distribution.isValid) {
		if (distribution.negativeBikesCount > 0) errors.push(`${distribution.negativeBikesCount} stations have negative bike counts`);
		if (distribution.negativeDocksCount > 0) errors.push(`${distribution.negativeDocksCount} stations have negative dock counts`);
	}
	if (distribution.zeroCapacityCount > 0) warnings.push(`${distribution.zeroCapacityCount} stations report zero capacity`);
	if (!lineage.isValid) errors.push(`Invalid GBFS version: ${lineage.gbfsVersion} (expected 2.x)`);
	const allChecksPassed = freshness.isFresh && volume.isValid && schema.isValid && distribution.isValid && lineage.isValid;
	return {
		timestamp,
		collectionId: input.collectionId,
		freshness,
		volume,
		schema,
		distribution,
		lineage,
		allChecksPassed,
		warnings,
		errors
	};
}
/**
* Log observability metrics for monitoring
* 
* @param metrics Observability metrics to log
*/
function logObservabilityMetrics(metrics) {
	const logData = {
		timestamp: metrics.timestamp.toISOString(),
		collectionId: metrics.collectionId,
		allChecksPassed: metrics.allChecksPassed,
		freshness: {
			isFresh: metrics.freshness.isFresh,
			ageSeconds: metrics.freshness.ageSeconds
		},
		volume: {
			isValid: metrics.volume.isValid,
			stationCount: metrics.volume.stationCount
		},
		schema: {
			isValid: metrics.schema.isValid,
			errorCount: metrics.schema.errors.length
		},
		distribution: {
			isValid: metrics.distribution.isValid,
			negativeBikes: metrics.distribution.negativeBikesCount,
			negativeDocks: metrics.distribution.negativeDocksCount
		},
		lineage: {
			isValid: metrics.lineage.isValid,
			version: metrics.lineage.gbfsVersion
		},
		warnings: metrics.warnings,
		errors: metrics.errors
	};
	if (metrics.allChecksPassed) logger.info("observability.quality_checks_passed", logData);
	else logger.warn("observability.quality_checks_failed", logData);
}
/**
* Check if data should be stored based on quality metrics
* Data with critical errors should still be stored for debugging,
* but flagged appropriately
* 
* @param metrics Observability metrics
* @returns Whether storage should proceed
*/
function shouldStoreData(metrics) {
	if (!metrics.allChecksPassed) logger.warn("observability.storing_with_quality_issues", {
		errorCount: metrics.errors.length,
		warningCount: metrics.warnings.length
	});
	return true;
}
//#endregion
//#region src/services/data-validator.ts
/**
* Generate a unique collection ID
*/
function generateCollectionId() {
	return `col-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
function toValidationInput(response, sourceUrl, collectionId) {
	return {
		lastUpdated: response.last_updated,
		stations: response.data.stations.map((station) => ({
			station_id: station.station_id,
			num_bikes_available: station.num_bikes_available,
			num_docks_available: station.num_docks_available
		})),
		gbfsVersion: response.version,
		sourceUrl,
		collectionId
	};
}
function toStationStatuses(response) {
	return response.data.stations.map((station) => ({
		station_id: station.station_id,
		num_bikes_available: station.num_bikes_available,
		num_docks_available: station.num_docks_available,
		recorded_at: response.last_updated
	}));
}
/**
* Orchestrates the complete validation and storage pipeline:
* 1. Validate data quality (Five Pillars)
* 2. Log observability metrics
* 3. Store valid data
* 4. Return comprehensive result
* 
* @param response Raw GBFS status response
* @param options Validation and storage options
* @returns Complete validation result
*/
async function validateAndStore(response, options) {
	const collectionId = options.collectionId ?? generateCollectionId();
	const result = {
		success: true,
		stored: false,
		metrics: null,
		errors: [],
		warnings: []
	};
	try {
		const metrics = await validateDataQuality(toValidationInput(response, options.sourceUrl, collectionId), options.schemaErrors ?? []);
		result.metrics = metrics;
		logObservabilityMetrics(metrics);
		result.warnings = [...metrics.warnings];
		result.errors = [...metrics.errors];
		if (metrics.errors.length > 0) incrementValidationErrors(metrics.errors.length);
		const shouldStore = shouldStoreData(metrics);
		const skipStorage = options.skipStorageOnError && !metrics.allChecksPassed;
		if (!shouldStore || skipStorage) {
			logger.warn("validator.storage_skipped", { collectionId });
			result.success = metrics.allChecksPassed;
			return result;
		}
		const stationStatuses = toStationStatuses(response);
		const storageResult = await storeStationStatuses(stationStatuses);
		result.storageResult = {
			count: storageResult.count,
			duplicateCount: storageResult.duplicateCount,
			errors: storageResult.errors
		};
		if (storageResult.success) {
			result.stored = true;
			logger.info("validator.storage_succeeded", {
				collectionId,
				insertedCount: storageResult.count,
				duplicateCount: storageResult.duplicateCount,
				skippedMissingStationCount: storageResult.skippedMissingStationIds.length
			});
			if (storageResult.skippedMissingStationIds.length > 0) result.warnings.push(`Skipped ${storageResult.skippedMissingStationIds.length} station statuses because station metadata is still unavailable after refresh.`);
			if (storageResult.duplicateCount > 0) result.warnings.push(`${storageResult.duplicateCount} duplicate entries skipped`);
			if (storageResult.count === 0 && storageResult.duplicateCount === stationStatuses.length && stationStatuses.length > 0) {
				const warningMessage = `Snapshot already stored; skipped ${storageResult.duplicateCount} duplicates`;
				result.warnings.push(warningMessage);
				captureWarningWithContext(warningMessage, {
					area: "services.data-validator",
					operation: "validateAndStore",
					tags: { handled: true },
					dedupeKey: `data-validator:duplicate-snapshot:${response.last_updated}`,
					extra: {
						collectionId,
						snapshotTimestamp: response.last_updated,
						duplicateCount: storageResult.duplicateCount,
						stationCount: stationStatuses.length,
						sourceUrl: options.sourceUrl
					}
				});
			}
		} else {
			result.success = false;
			result.errors.push(`Storage failed: ${storageResult.errors.length} errors`);
			storageResult.errors.forEach((e) => {
				result.errors.push(`Station ${e.stationId}: ${e.error}`);
			});
		}
		result.success = metrics.allChecksPassed && storageResult.success;
	} catch (error) {
		result.success = false;
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		result.errors.push(`Validation pipeline failed: ${errorMessage}`);
		captureExceptionWithContext(error, {
			area: "services.data-validator",
			operation: "validateAndStore",
			extra: {
				collectionId,
				sourceUrl: options.sourceUrl,
				stationCount: response.data.stations.length
			}
		});
		logger.error("validator.pipeline_failed", {
			collectionId,
			error
		});
	}
	return result;
}
//#endregion
//#region src/analytics/job-lock.ts
var DEFAULT_LOCK_TTL_MS = 3300 * 1e3;
async function acquireJobLock(name, ttlMs = DEFAULT_LOCK_TTL_MS) {
	const now = /* @__PURE__ */ new Date();
	const ownerId = `${process.pid}-${randomUUID$1()}`;
	const expiresAt = new Date(now.getTime() + ttlMs);
	const result = await prisma.$executeRaw`
    INSERT INTO "JobLock" (name, "lockedAt", "lockExpiresAt", "lockedBy")
    VALUES (${name}, ${now}, ${expiresAt}, ${ownerId})
    ON CONFLICT(name) DO UPDATE SET
      "lockedAt" = excluded."lockedAt",
      "lockExpiresAt" = excluded."lockExpiresAt",
      "lockedBy" = excluded."lockedBy"
    WHERE "JobLock"."lockExpiresAt" IS NULL OR "JobLock"."lockExpiresAt" <= ${now};
  `;
	if (Number(result) === 0) return null;
	const refresh = async () => {
		const refreshedAt = /* @__PURE__ */ new Date();
		const refreshedUntil = new Date(refreshedAt.getTime() + ttlMs);
		const refreshed = await prisma.$executeRaw`
      UPDATE "JobLock"
      SET "lockedAt" = ${refreshedAt}, "lockExpiresAt" = ${refreshedUntil}
      WHERE name = ${name} AND "lockedBy" = ${ownerId};
    `;
		return Number(refreshed) > 0;
	};
	const release = async () => {
		await prisma.$executeRaw`
      UPDATE "JobLock"
      SET "lockExpiresAt" = NULL, "lockedAt" = NULL, "lockedBy" = NULL
      WHERE name = ${name} AND "lockedBy" = ${ownerId};
    `;
	};
	return {
		name,
		ownerId,
		expiresAt,
		refresh,
		release
	};
}
//#endregion
//#region src/jobs/utils.ts
async function ensureLockRefreshed(lock, stage, context) {
	if (!await lock.refresh()) throw new Error(`${context} lock refresh failed at stage: ${stage}`);
}
//#endregion
//#region src/jobs/bizi-collection.ts
var isScheduled = false;
var COLLECTION_LOCK_TTL_MS = 600 * 1e3;
var COLLECTION_LOCK_NAME = "gbfs-collection";
var DEFAULT_GBFS_SOURCE_URL = "https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json";
var hasSyncedStationInformationSinceStartup = false;
var jobState = {
	lastRun: null,
	lastSuccess: null,
	consecutiveFailures: 0,
	totalRuns: 0,
	totalSuccesses: 0
};
/**
* Get current job state for observability
*/
function getJobState() {
	return { ...jobState };
}
async function shouldSyncStationInformation() {
	if (!hasSyncedStationInformationSinceStartup) return true;
	return await getStationMetadataCount() === 0;
}
/**
* Run a single collection cycle
* Orchestrates: fetch → validate → store
*/
async function executeCollection(requestId, trigger) {
	const startTime = Date.now();
	const collectionId = `col-${Date.now()}-${randomUUID().slice(0, 8)}`;
	const sourceUrl = process.env.GBFS_URL ?? process.env.GBFS_DISCOVERY_URL ?? DEFAULT_GBFS_SOURCE_URL;
	updateExecutionContext({
		requestId,
		collectionId,
		trigger,
		sourceUrl
	});
	logger.info("collection.started", {
		trigger,
		sourceUrl
	});
	const lock = await acquireJobLock(COLLECTION_LOCK_NAME, COLLECTION_LOCK_TTL_MS);
	if (!lock) {
		const skippedAt = /* @__PURE__ */ new Date();
		logger.info("collection.lock_skipped");
		return {
			success: true,
			collectionId,
			stationCount: 0,
			recordedAt: null,
			quality: null,
			duration: Date.now() - startTime,
			warnings: ["Skipped collection because another collector is already running."],
			timestamp: skippedAt
		};
	}
	jobState.lastRun = /* @__PURE__ */ new Date();
	jobState.totalRuns++;
	const result = {
		success: false,
		collectionId,
		stationCount: 0,
		recordedAt: null,
		quality: null,
		duration: 0,
		warnings: [],
		timestamp: /* @__PURE__ */ new Date()
	};
	await createCollectionRun({
		collectionId,
		requestId,
		city: getCity(),
		trigger,
		sourceUrl
	});
	try {
		const discovery = await fetchDiscovery();
		const syncStationInformation = await shouldSyncStationInformation();
		const stationStatusPromise = fetchStationStatus(discovery);
		const stationInformationPromise = syncStationInformation ? fetchStationInformation(discovery) : Promise.resolve(null);
		const [stationStatusResponse, initialStationInformation] = await Promise.all([stationStatusPromise, stationInformationPromise]);
		let stationInformation = initialStationInformation;
		if (!stationInformation) {
			const missingStationIds = await getMissingStationIds(stationStatusResponse.data.stations.map((station) => station.station_id));
			if (missingStationIds.length > 0) {
				logger.warn("collection.station_metadata_missing", {
					missingStationCount: missingStationIds.length,
					missingStationIdsSample: missingStationIds.slice(0, 10)
				});
				stationInformation = await fetchStationInformation(discovery);
			}
		}
		if (stationInformation) {
			await upsertStations(stationInformation);
			hasSyncedStationInformationSinceStartup = true;
			logger.info("collection.station_metadata_synced", {
				stationCount: stationInformation.length,
				reason: syncStationInformation ? "startup_or_bootstrap" : "missing_station_ids"
			});
		}
		await ensureLockRefreshed(lock, "post-station-metadata-sync", "collection");
		const snapshotRecordedAt = /* @__PURE__ */ new Date(stationStatusResponse.last_updated * 1e3);
		const existingSnapshotCount = await getSnapshotCount(snapshotRecordedAt);
		const expectedStationCount = stationStatusResponse.data.stations.length;
		updateExecutionContext({ gbfsVersion: stationStatusResponse.version });
		if (existingSnapshotCount >= expectedStationCount && expectedStationCount > 0) {
			const skipMessage = `Snapshot ${snapshotRecordedAt.toISOString()} already ingested; skipping duplicate trigger (${existingSnapshotCount} stations)`;
			result.success = true;
			result.stationCount = expectedStationCount;
			result.recordedAt = snapshotRecordedAt;
			result.warnings = [skipMessage];
			jobState.lastSuccess = /* @__PURE__ */ new Date();
			jobState.totalSuccesses++;
			jobState.consecutiveFailures = 0;
			await updateCollectionRun(collectionId, {
				status: "skipped",
				gbfsVersion: stationStatusResponse.version,
				snapshotRecordedAt,
				expectedStationCount,
				insertedCount: expectedStationCount,
				duplicateCount: 0,
				warningCount: 1,
				errorCount: 0,
				warnings: [skipMessage],
				errors: [],
				durationMs: Date.now() - startTime,
				finishedAt: /* @__PURE__ */ new Date()
			});
			logger.info("collection.snapshot_already_ingested", {
				snapshotRecordedAt: snapshotRecordedAt.toISOString(),
				expectedStationCount
			});
			return result;
		}
		if (existingSnapshotCount > 0 && existingSnapshotCount < expectedStationCount) logger.warn("collection.partial_snapshot_resume", {
			snapshotRecordedAt: snapshotRecordedAt.toISOString(),
			existingSnapshotCount,
			expectedStationCount
		});
		const validationResult = await validateAndStore(stationStatusResponse, {
			sourceUrl,
			collectionId
		});
		result.success = validationResult.success;
		result.stationCount = validationResult.storageResult?.count ?? 0;
		result.recordedAt = validationResult.metrics?.freshness.lastUpdated ?? /* @__PURE__ */ new Date();
		result.quality = validationResult.metrics;
		result.warnings = validationResult.warnings;
		if (validationResult.errors.length > 0) result.warnings.push(...validationResult.errors);
		if (result.success) {
			jobState.lastSuccess = /* @__PURE__ */ new Date();
			jobState.totalSuccesses++;
			jobState.consecutiveFailures = 0;
			const duplicateOnlyWarning = result.warnings.find((warning) => warning.startsWith("Snapshot already stored;"));
			if (duplicateOnlyWarning) logger.info("collection.snapshot_duplicate", { warning: duplicateOnlyWarning });
			else logger.info("collection.succeeded", {
				stationCount: result.stationCount,
				duplicateCount: validationResult.storageResult?.duplicateCount ?? 0
			});
		} else {
			jobState.consecutiveFailures++;
			result.error = validationResult.errors.join(", ");
			captureExceptionWithContext(new Error(result.error || "Collection completed with validation or storage errors"), {
				area: "jobs.collection",
				operation: "runCollection",
				tags: {
					phase: "validate-store",
					handled: true
				},
				extra: {
					stationCount: result.stationCount,
					warnings: result.warnings,
					errors: validationResult.errors
				}
			});
			logger.warn("collection.completed_with_errors", {
				error: result.error,
				warnings: result.warnings
			});
		}
	} catch (error) {
		jobState.consecutiveFailures++;
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		result.error = errorMessage;
		result.success = false;
		captureExceptionWithContext(error, {
			area: "jobs.collection",
			operation: "runCollection",
			extra: { warnings: result.warnings }
		});
		logger.error("collection.failed", {
			error,
			errorMessage,
			warnings: result.warnings
		});
		throw error;
	} finally {
		result.duration = Date.now() - startTime;
		result.timestamp = /* @__PURE__ */ new Date();
		recordCollection({
			success: result.success,
			stationsCollected: result.stationCount,
			timestamp: result.timestamp,
			error: result.error
		});
		if (jobState.consecutiveFailures >= 3) logger.warn("collection.consecutive_failures", { consecutiveFailures: jobState.consecutiveFailures });
		await updateCollectionRun(collectionId, {
			status: result.success ? "succeeded" : result.error ? "failed" : "skipped",
			snapshotRecordedAt: result.recordedAt,
			gbfsVersion: result.quality?.lineage.gbfsVersion ?? null,
			expectedStationCount: result.quality?.volume.stationCount ?? null,
			insertedCount: result.stationCount,
			duplicateCount: result.quality ? result.quality.volume.stationCount - result.stationCount : 0,
			warningCount: result.warnings.length,
			errorCount: result.error ? 1 : 0,
			warnings: result.warnings,
			errors: result.error ? [result.error] : [],
			durationMs: result.duration,
			finishedAt: result.timestamp
		});
		try {
			await lock.release();
		} catch (releaseError) {
			captureExceptionWithContext(releaseError, {
				area: "jobs.collection",
				operation: "release collection lock"
			});
			logger.error("collection.lock_release_failed", { error: releaseError });
		}
	}
	return result;
}
async function runCollection(options = {}) {
	const existingContext = getExecutionContext();
	const requestId = options.requestId ?? existingContext?.requestId ?? resolveRequestId(null);
	const trigger = options.trigger ?? "manual";
	if (existingContext) {
		updateExecutionContext({
			requestId,
			trigger
		});
		return executeCollection(requestId, trigger);
	}
	return runWithExecutionContext({
		requestId,
		trigger,
		city: getCity()
	}, () => executeCollection(requestId, trigger));
}
/**
* Check if the collection job is currently scheduled
*/
function isCollectionScheduled() {
	return isScheduled;
}
//#endregion
//#region src/lib/security/ops-api.ts
var DEFAULT_OPS_RATE_LIMIT = {
	limit: 10,
	windowMs: 6e4
};
function errorResponse(status, error, headers) {
	return Response.json({
		success: false,
		error,
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	}, {
		status,
		headers
	});
}
async function enforceOperationalAccess(options) {
	const expectedApiKey = getOpsApiKey();
	const limit = options.limit ?? DEFAULT_OPS_RATE_LIMIT.limit;
	const windowMs = options.windowMs ?? DEFAULT_OPS_RATE_LIMIT.windowMs;
	if (!expectedApiKey) return { response: errorResponse(503, options.misconfiguredError ?? "Server misconfigured: OPS_API_KEY is required.") };
	const providedKey = readOpsApiKey(options.request.headers) ?? "";
	const [ipDecision, keyDecision] = await Promise.all([consumeRateLimit({
		namespace: `${options.namespace}:ip`,
		identifierParts: [options.clientIp],
		limit,
		windowMs
	}), consumeRateLimit({
		namespace: `${options.namespace}:key`,
		identifierParts: [providedKey || "missing"],
		limit,
		windowMs
	})]);
	const effectiveDecision = !ipDecision.allowed ? ipDecision : keyDecision;
	const headers = getRateLimitHeaders(effectiveDecision);
	if (effectiveDecision.backend === "unavailable") return { response: errorResponse(503, "Rate limiting backend unavailable.", headers) };
	if (!effectiveDecision.allowed) return { response: errorResponse(429, options.rateLimitError ?? "Too many requests.", {
		...headers,
		"Retry-After": String(effectiveDecision.retryAfterSeconds)
	}) };
	if (!isApiKeyValid(providedKey, expectedApiKey)) return { response: errorResponse(401, options.unauthorizedError ?? "Unauthorized. Valid OPS_API_KEY required.", headers) };
	return {
		headers,
		providedKey,
		decision: effectiveDecision
	};
}
//#endregion
//#region src/app/api/collect/index.ts
var DEFAULT_RATE_LIMIT_MAX = 6;
var DEFAULT_RATE_LIMIT_WINDOW_MS = 6e4;
function toIsoString(value) {
	return value ? value.toISOString() : null;
}
function readPositiveInteger(value, fallback) {
	if (!value) return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
	return Math.floor(parsed);
}
function getRateLimitConfig() {
	return {
		max: readPositiveInteger(process.env.COLLECT_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
		windowMs: readPositiveInteger(process.env.COLLECT_RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS)
	};
}
var Route$10 = createFileRoute("/api/collect/")({ server: { handlers: {
	POST: async (opts) => {
		const request = opts.request;
		try {
			const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
			const userAgent = request.headers.get("user-agent") || "";
			const { max, windowMs } = getRateLimitConfig();
			const access = await enforceOperationalAccess({
				request,
				clientIp,
				namespace: "collect",
				limit: max,
				windowMs,
				unauthorizedError: "Unauthorized collect trigger.",
				rateLimitError: "Too many requests for /api/collect.",
				misconfiguredError: "Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required."
			});
			if ("response" in access) {
				const status = access.response.status;
				await recordSecurityEvent({
					eventType: status === 429 ? "rate_limit_exceeded" : status === 401 ? "auth_failed" : "ops_unavailable",
					route: "/api/collect",
					requestId: "",
					ip: clientIp,
					userAgent,
					outcome: status === 429 ? "denied" : "error",
					reasonCode: access.response.statusText || String(status)
				});
				return access.response;
			}
			const result = await runCollection({
				trigger: "manual",
				requestId: ""
			});
			await recordSecurityEvent({
				eventType: "manual_collect_triggered",
				route: "/api/collect",
				requestId: "",
				collectionId: result.collectionId,
				ip: clientIp,
				userAgent,
				outcome: result.success ? "success" : "error",
				metadata: {
					stationCount: result.stationCount,
					durationMs: result.duration
				}
			});
			if (!result.success) return new Response(JSON.stringify({
				success: false,
				error: result.error ?? "Collection failed",
				collectionId: result.collectionId,
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			}), {
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...access.headers
				}
			});
			return new Response(JSON.stringify({
				success: true,
				collectionId: result.collectionId,
				stationCount: result.stationCount,
				recordedAt: toIsoString(result.recordedAt),
				quality: result.quality,
				duration: result.duration,
				warnings: result.warnings,
				timestamp: result.timestamp.toISOString()
			}), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					...access.headers
				}
			});
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "api.collect",
				operation: "POST /api/collect"
			});
			logger.error("api.collect.post_failed", { error });
			return new Response(JSON.stringify({
				success: false,
				error: "Collection failed",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			}), {
				status: 500,
				headers: { "Content-Type": "application/json" }
			});
		}
	},
	GET: async (opts) => {
		const request = opts.request;
		try {
			const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
			const userAgent = request.headers.get("user-agent") || "";
			const { max, windowMs } = getRateLimitConfig();
			const access = await enforceOperationalAccess({
				request,
				clientIp,
				namespace: "collect",
				limit: max,
				windowMs,
				unauthorizedError: "Unauthorized collect trigger.",
				rateLimitError: "Too many requests for /api/collect.",
				misconfiguredError: "Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required."
			});
			if ("response" in access) {
				await recordSecurityEvent({
					eventType: access.response.status === 429 ? "rate_limit_exceeded" : "auth_failed",
					route: "/api/collect",
					requestId: "",
					ip: clientIp,
					userAgent,
					outcome: "denied",
					reasonCode: String(access.response.status)
				});
				return access.response;
			}
			const state = getJobState();
			return new Response(JSON.stringify({
				lastSuccess: toIsoString(state.lastSuccess),
				isScheduled: isCollectionScheduled()
			}), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					...access.headers
				}
			});
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "api.collect",
				operation: "GET /api/collect"
			});
			logger.error("api.collect.get_failed", { error });
			return new Response(JSON.stringify({
				error: "Failed to query collect state",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			}), {
				status: 500,
				headers: { "Content-Type": "application/json" }
			});
		}
	}
} } });
//#endregion
//#region src/app/api/app-versions/index.ts
var PUBLIC_ROUTE_RATE_LIMIT$1 = {
	limit: 30,
	windowMs: 6e4
};
var DEFAULT_APP_VERSIONS = {
	minVersion: "1.0.0",
	maxVersion: "999.999.999",
	versions: []
};
function isAppVersion(value) {
	return isRecord(value) && typeof value.version === "string" && typeof value.allowed === "boolean" && (value.reason === void 0 || typeof value.reason === "string");
}
function isAppVersionsResponse(value) {
	return isRecord(value) && typeof value.minVersion === "string" && typeof value.maxVersion === "string" && Array.isArray(value.versions) && value.versions.every(isAppVersion);
}
function parseAppVersions() {
	const env = process.env.APP_VERSIONS;
	if (!env) return DEFAULT_APP_VERSIONS;
	const parsed = tryParseJson(env);
	if (parsed.ok && isAppVersionsResponse(parsed.value)) return parsed.value;
	captureExceptionWithContext(parsed.ok ? /* @__PURE__ */ new Error("APP_VERSIONS must match the expected response shape.") : parsed.error, {
		area: "api.app-versions",
		operation: "parseAppVersions"
	});
	logger.warn("api.app_versions.invalid_config");
	return DEFAULT_APP_VERSIONS;
}
var APP_VERSIONS = parseAppVersions();
var Route$9 = createFileRoute("/api/app-versions/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const access = await enforcePublicApiAccess({
			route: "/api/app-versions",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-app-versions",
			limit: PUBLIC_ROUTE_RATE_LIMIT$1.limit,
			windowMs: PUBLIC_ROUTE_RATE_LIMIT$1.windowMs,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		return new Response(JSON.stringify(APP_VERSIONS), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=3600, s-maxage=86400",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.app-versions",
			operation: "GET /api/app-versions"
		});
		return new Response(JSON.stringify(APP_VERSIONS), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=3600"
			}
		});
	}
} } } });
//#endregion
//#region src/app/api/alerts/index.ts
var Route$8 = createFileRoute("/api/alerts/")({ server: { handlers: { GET: async (opts) => {
	const request = opts.request;
	try {
		const limitParam = parseInt(new URL(request.url).searchParams.get("limit") ?? "50");
		const limit = Math.min(Math.max(1, limitParam), 200);
		const access = await enforcePublicApiAccess({
			route: "/api/alerts",
			request,
			requestId: "",
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			userAgent: request.headers.get("user-agent") || "",
			namespace: "public-alerts",
			limit: 40,
			windowMs: 6e4,
			requireApiKey: false
		});
		if (!access.ok) return access.response;
		const payload = {
			limit,
			alerts: await getActiveAlerts(limit),
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=300, stale-while-revalidate=300",
				...access.headers
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.alerts",
			operation: "GET /api/alerts"
		});
		logger.error("api.alerts.failed", { error });
		return errorResponse$1("Failed to fetch alerts", 500);
	}
} } } });
//#endregion
//#region src/app/api/health/ready.ts
async function getHandler$1() {
	return new Response(JSON.stringify({
		status: "ok",
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	}), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
}
var Route$7 = createFileRoute("/api/health/ready")({ server: { handlers: { GET: getHandler$1 } } });
//#endregion
//#region src/app/api/health/live.ts
async function getHandler() {
	return new Response(JSON.stringify({
		status: "ok",
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	}), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
}
var Route$6 = createFileRoute("/api/health/live")({ server: { handlers: { GET: getHandler } } });
//#endregion
//#region src/app/api/alerts/history/route.ts
var Route$5 = createFileRoute("/api/alerts/history")({ server: { handlers: { GET: ({ request }) => GET(request) } } });
var DEFAULT_LIMIT = 200;
var MAX_LIMIT = 2e3;
var MAX_OFFSET = 2e4;
var PUBLIC_ROUTE_RATE_LIMIT = {
	limit: 20,
	windowMs: 6e4
};
function parseBoundedInteger(value, fallback, min, max) {
	if (value === null) return fallback;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
	return parsed;
}
function parseOptionalDate(value) {
	if (value === null || value.trim().length === 0) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed;
}
function parseState(value) {
	if (!value) return "all";
	if (value === "all" || value === "active" || value === "resolved") return value;
	return null;
}
function parseFormat(value) {
	if (!value) return "json";
	if (value === "json" || value === "csv") return value;
	return null;
}
function parseAlertType(value) {
	if (!value || value === "all") return null;
	if (value === "LOW_BIKES" || value === "LOW_ANCHORS") return value;
	return null;
}
function parseSeverity(value) {
	if (value === null || value === "all") return null;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) return;
	return parsed;
}
function escapeCsvCell(value) {
	if (value === null || value === void 0) return "";
	const text = String(value);
	if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
	return text;
}
function toCsv(rows) {
	return `${[
		"id",
		"stationId",
		"stationName",
		"alertType",
		"severity",
		"metricValue",
		"windowHours",
		"generatedAt",
		"state"
	].join(",")}\n${rows.map((row) => {
		return [
			row.id,
			row.stationId,
			row.stationName,
			row.alertType,
			row.severity,
			row.metricValue,
			row.windowHours,
			row.generatedAt,
			row.isActive ? "active" : "resolved"
		].map((value) => escapeCsvCell(value)).join(",");
	}).join("\n")}`;
}
function parseQuery(request) {
	const { searchParams } = new URL(request.url);
	const format = parseFormat(searchParams.get("format"));
	const state = parseState(searchParams.get("state"));
	const alertType = parseAlertType(searchParams.get("alertType"));
	const severity = parseSeverity(searchParams.get("severity"));
	const limit = parseBoundedInteger(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
	const offset = parseBoundedInteger(searchParams.get("offset"), 0, 0, MAX_OFFSET);
	const from = parseOptionalDate(searchParams.get("from"));
	const to = parseOptionalDate(searchParams.get("to"));
	const stationIdRaw = searchParams.get("stationId");
	const stationId = stationIdRaw && stationIdRaw.trim().length > 0 ? stationIdRaw.trim() : null;
	if (format === null) return Response.json({ error: "Invalid format. Use json or csv." }, { status: 400 });
	if (state === null) return Response.json({ error: "Invalid state. Use all, active, or resolved." }, { status: 400 });
	const alertTypeParam = searchParams.get("alertType");
	if (alertTypeParam && alertTypeParam !== "all" && !alertType) return Response.json({ error: "Invalid alertType. Use LOW_BIKES, LOW_ANCHORS, or all." }, { status: 400 });
	if (severity === void 0) return Response.json({ error: "Invalid severity. Use an integer between 1 and 5." }, { status: 400 });
	if (limit === null || offset === null) return Response.json({ error: `Invalid pagination. limit must be 1..${MAX_LIMIT} and offset must be 0..${MAX_OFFSET}.` }, { status: 400 });
	if (searchParams.get("from") && !from || searchParams.get("to") && !to) return Response.json({ error: "Invalid date filter. Use ISO date or datetime (for example 2026-03-09 or 2026-03-09T12:00:00Z)." }, { status: 400 });
	if (from && to && from > to) return Response.json({ error: "Invalid date range. from must be before or equal to to." }, { status: 400 });
	return {
		format,
		state,
		stationId,
		alertType,
		severity,
		limit,
		offset,
		from,
		to
	};
}
function buildWhereFilters(query) {
	const where = {};
	if (query.state === "active") where.isActive = true;
	else if (query.state === "resolved") where.isActive = false;
	if (query.stationId) where.stationId = query.stationId;
	if (query.alertType) where.alertType = query.alertType;
	if (query.severity !== null) where.severity = query.severity;
	if (query.from || query.to) where.generatedAt = {
		...query.from ? { gte: query.from } : {},
		...query.to ? { lte: query.to } : {}
	};
	return where;
}
async function GET(request) {
	return withApiRequest(request, {
		route: "/api/alerts/history",
		routeGroup: "public.api"
	}, async ({ requestId, clientIp, userAgent }) => {
		const parsed = parseQuery(request);
		if (parsed instanceof Response) return parsed;
		const access = await enforcePublicApiAccess({
			route: "/api/alerts/history",
			request,
			requestId,
			clientIp,
			userAgent,
			namespace: "public-alerts-history",
			limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
			windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
			requireApiKey: parsed.format === "csv" || parsed.limit > 500
		});
		if (!access.ok) return access.response;
		const where = buildWhereFilters(parsed);
		try {
			const [total, rows] = await Promise.all([prisma.stationAlert.count({ where }), prisma.stationAlert.findMany({
				where,
				include: { station: { select: { name: true } } },
				orderBy: [{ generatedAt: "desc" }, { id: "desc" }],
				take: parsed.limit,
				skip: parsed.offset
			})]);
			const alerts = rows.map((row) => ({
				id: row.id,
				stationId: row.stationId,
				stationName: row.station?.name ?? row.stationId,
				alertType: row.alertType,
				severity: row.severity,
				metricValue: Number(row.metricValue),
				windowHours: row.windowHours,
				generatedAt: row.generatedAt.toISOString(),
				isActive: row.isActive
			}));
			if (parsed.format === "csv") {
				const csv = toCsv(alerts);
				const suffix = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				return new Response(csv, {
					status: 200,
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition": `attachment; filename="alerts-history-${suffix}.csv"`,
						"Cache-Control": "no-store",
						...access.headers
					}
				});
			}
			return Response.json({
				filters: {
					state: parsed.state,
					stationId: parsed.stationId,
					alertType: parsed.alertType,
					severity: parsed.severity,
					from: parsed.from?.toISOString() ?? null,
					to: parsed.to?.toISOString() ?? null
				},
				pagination: {
					total,
					limit: parsed.limit,
					offset: parsed.offset,
					returned: alerts.length
				},
				alerts,
				generatedAt: (/* @__PURE__ */ new Date()).toISOString()
			}, {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-store",
					...access.headers
				}
			});
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "api.alerts-history",
				operation: "GET /api/alerts/history",
				extra: {
					format: parsed.format,
					state: parsed.state,
					stationId: parsed.stationId,
					alertType: parsed.alertType,
					severity: parsed.severity,
					limit: parsed.limit,
					offset: parsed.offset,
					from: parsed.from?.toISOString() ?? null,
					to: parsed.to?.toISOString() ?? null
				}
			});
			logger.error("api.alerts_history.failed", { error });
			return Response.json({
				error: "Failed to fetch alert history",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			}, { status: 500 });
		}
	});
}
//#endregion
//#region src/lib/auth/jwt.ts
var DEFAULT_SECRET$1 = "dev-secret-do-not-use-in-production";
function getJwtSecret() {
	const raw = process.env.JWT_SECRET;
	if (!raw) {
		if (process.env.NEXT_PHASE !== "phase-production-build") throw new Error("JWT_SECRET is required in production");
		logger.warn("jwt.using_insecure_default");
		return new TextEncoder().encode(DEFAULT_SECRET$1);
	}
	if (raw.length < 32) throw new Error(`JWT_SECRET must be at least 32 characters long (got ${raw.length}). Generate a strong secret: \`openssl rand -base64 32\``);
	return new TextEncoder().encode(raw);
}
var JWT_SECRET = getJwtSecret();
var ACCESS_TOKEN_EXPIRY = "15m";
var REFRESH_TOKEN_EXPIRY = "7d";
function hashToken(token) {
	return createHash("sha256").update(token).digest("hex");
}
function hashPublicKey(publicKey) {
	return createHash("sha256").update(publicKey).digest("hex");
}
async function generateAccessToken(installId) {
	return await new SignJWT({ installId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setJti(randomUUID()).setExpirationTime(ACCESS_TOKEN_EXPIRY).sign(JWT_SECRET);
}
async function issueRefreshToken(installId) {
	const issuedAt = /* @__PURE__ */ new Date();
	return {
		token: await new SignJWT({
			installId,
			type: "refresh"
		}).setProtectedHeader({ alg: "HS256" }).setIssuedAt(Math.floor(issuedAt.getTime() / 1e3)).setJti(randomUUID()).setExpirationTime(REFRESH_TOKEN_EXPIRY).sign(JWT_SECRET),
		issuedAt
	};
}
async function verifyAccessToken(token) {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return payload;
	} catch {
		return null;
	}
}
async function verifyRefreshToken(token) {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		if (payload.type !== "refresh") return null;
		return payload;
	} catch {
		return null;
	}
}
//#endregion
//#region src/app/api/token/refresh/index.ts
var ACCESS_TOKEN_EXPIRY_SECONDS = 900;
var REFRESH_RATE_LIMIT = {
	limit: 30,
	windowMs: 300 * 1e3
};
var refreshRequestSchema = z.object({ refreshToken: z.string().trim().min(20).max(4096) });
var Route$4 = createFileRoute("/api/token/refresh/")({ server: { handlers: {
	POST: async (opts) => {
		const request = opts.request;
		try {
			const requestId = "";
			const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
			const userAgent = request.headers.get("user-agent") || "";
			const originRejection = rejectDisallowedMobileOrigin(request);
			if (originRejection) return originRejection;
			const body = await request.json().catch(() => null);
			const parsed = refreshRequestSchema.safeParse(body);
			const tokenFingerprint = parsed.success ? hashToken(parsed.data.refreshToken) : "invalid-body";
			const [ipDecision, tokenDecision] = await Promise.all([consumeRateLimit({
				namespace: "token-refresh:ip",
				identifierParts: [clientIp],
				limit: REFRESH_RATE_LIMIT.limit,
				windowMs: REFRESH_RATE_LIMIT.windowMs
			}), consumeRateLimit({
				namespace: "token-refresh:token",
				identifierParts: [tokenFingerprint],
				limit: REFRESH_RATE_LIMIT.limit,
				windowMs: REFRESH_RATE_LIMIT.windowMs
			})]);
			const rateLimitDecision = !ipDecision.allowed ? ipDecision : tokenDecision;
			const baseHeaders = {
				...buildMobileCorsHeaders(request),
				...getRateLimitHeaders(rateLimitDecision)
			};
			if (rateLimitDecision.backend === "unavailable") return new Response(JSON.stringify({ error: "Rate limiting backend unavailable" }), {
				status: 503,
				headers: {
					"Content-Type": "application/json",
					...baseHeaders
				}
			});
			if (!rateLimitDecision.allowed) {
				await recordSecurityEvent({
					eventType: "rate_limit_exceeded",
					route: "/api/token/refresh",
					requestId,
					ip: clientIp,
					userAgent,
					outcome: "denied",
					reasonCode: "rate_limit"
				});
				return new Response(JSON.stringify({ error: "Too many refresh attempts" }), {
					status: 429,
					headers: {
						"Content-Type": "application/json",
						...baseHeaders,
						"Retry-After": String(rateLimitDecision.retryAfterSeconds)
					}
				});
			}
			if (!parsed.success) return new Response(JSON.stringify({
				error: "Invalid request payload",
				details: parsed.error.flatten()
			}), {
				status: 400,
				headers: {
					"Content-Type": "application/json",
					...baseHeaders
				}
			});
			const payload = await verifyRefreshToken(parsed.data.refreshToken);
			if (!payload?.installId) {
				await recordSecurityEvent({
					eventType: "auth_failed",
					route: "/api/token/refresh",
					requestId,
					ip: clientIp,
					userAgent,
					outcome: "denied",
					reasonCode: "invalid_refresh_token"
				});
				return new Response(JSON.stringify({ error: "Invalid or expired refresh token" }), {
					status: 401,
					headers: {
						"Content-Type": "application/json",
						...baseHeaders
					}
				});
			}
			const install = await prisma.install.findUnique({ where: { installId: payload.installId } });
			if (!install || !install.isActive || install.revokedAt) {
				await recordSecurityEvent({
					eventType: "auth_failed",
					route: "/api/token/refresh",
					requestId,
					installId: payload.installId,
					ip: clientIp,
					userAgent,
					outcome: "denied",
					reasonCode: "install_inactive"
				});
				return new Response(JSON.stringify({ error: "Installation not found or inactive" }), {
					status: 401,
					headers: {
						"Content-Type": "application/json",
						...baseHeaders
					}
				});
			}
			const incomingHash = hashToken(parsed.data.refreshToken);
			if (install.refreshTokenHash !== incomingHash) {
				await prisma.install.update({
					where: { installId: install.installId },
					data: {
						isActive: false,
						revokedAt: /* @__PURE__ */ new Date()
					}
				});
				await recordSecurityEvent({
					eventType: "token_reuse_detected",
					route: "/api/token/refresh",
					requestId,
					installId: install.installId,
					ip: clientIp,
					userAgent,
					outcome: "denied",
					reasonCode: "refresh_token_reuse"
				});
				return new Response(JSON.stringify({ error: "Refresh token revoked" }), {
					status: 401,
					headers: {
						"Content-Type": "application/json",
						...baseHeaders
					}
				});
			}
			const [issuedRefreshToken, accessToken] = await Promise.all([issueRefreshToken(install.installId), generateAccessToken(install.installId)]);
			await prisma.install.update({
				where: { installId: install.installId },
				data: {
					refreshTokenHash: hashToken(issuedRefreshToken.token),
					refreshTokenIssuedAt: issuedRefreshToken.issuedAt,
					lastSeenAt: issuedRefreshToken.issuedAt,
					lastAuthAt: issuedRefreshToken.issuedAt,
					revokedAt: null,
					isActive: true
				}
			});
			await recordSecurityEvent({
				eventType: "token_refreshed",
				route: "/api/token/refresh",
				requestId,
				installId: install.installId,
				ip: clientIp,
				userAgent,
				outcome: "success"
			});
			return new Response(JSON.stringify({
				accessToken,
				refreshToken: issuedRefreshToken.token,
				expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS
			}), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					...baseHeaders
				}
			});
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "api.token-refresh",
				operation: "POST /api/token/refresh"
			});
			logger.error("api.token_refresh.failed", { error });
			return new Response(JSON.stringify({ error: "Failed to refresh token" }), {
				status: 500,
				headers: { "Content-Type": "application/json" }
			});
		}
	},
	OPTIONS: async (opts) => {
		const request = opts.request;
		const rejection = rejectDisallowedMobileOrigin(request);
		if (rejection) return rejection;
		return new Response(null, {
			status: 204,
			headers: buildMobileCorsHeaders(request)
		});
	}
} } });
//#endregion
//#region src/app/api/ops/sentry-test/index.ts
var RATE_LIMIT_MAX = 6;
var RATE_LIMIT_WINDOW_MS = 6e4;
function resolveSentryDsnSource() {
	if (process.env.SENTRY_DSN?.trim()) return "SENTRY_DSN";
	if (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return "NEXT_PUBLIC_SENTRY_DSN";
	return null;
}
var Route$3 = createFileRoute("/api/ops/sentry-test/")({ server: { handlers: { POST: async (opts) => {
	const request = opts.request;
	try {
		const access = await enforceOperationalAccess({
			request,
			clientIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
			namespace: "ops-sentry-test",
			limit: RATE_LIMIT_MAX,
			windowMs: RATE_LIMIT_WINDOW_MS,
			unauthorizedError: "Unauthorized Sentry test trigger.",
			rateLimitError: "Too many requests for /api/ops/sentry-test.",
			misconfiguredError: "Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required."
		});
		if ("response" in access) return access.response;
		const dsnSource = resolveSentryDsnSource();
		if (!dsnSource) return new Response(JSON.stringify({
			success: false,
			error: "Sentry DSN is not configured on the server runtime.",
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		}), {
			status: 503,
			headers: {
				"Content-Type": "application/json",
				...access.headers,
				"Cache-Control": "no-store"
			}
		});
		const marker = randomUUID();
		const eventId = captureExceptionWithContext(/* @__PURE__ */ new Error(`Manual Sentry probe from /api/ops/sentry-test (${marker})`), {
			area: "api.ops.sentry-test",
			operation: "POST /api/ops/sentry-test",
			extra: {
				marker,
				dsnSource
			}
		});
		const flushed = await Sentry.flush(2e3);
		logger.warn("api.ops.sentry_test.triggered", {
			eventId,
			flushed,
			dsnSource
		});
		return new Response(JSON.stringify({
			success: true,
			eventId,
			flushed,
			marker,
			dsnSource,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		}), {
			status: 202,
			headers: {
				"Content-Type": "application/json",
				...access.headers,
				"Cache-Control": "no-store"
			}
		});
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "api.ops.sentry-test",
			operation: "POST /api/ops/sentry-test"
		});
		return new Response(JSON.stringify({
			success: false,
			error: "Sentry test failed",
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
} } } });
//#endregion
//#region src/app/api/install/register/index.ts
var REGISTER_RATE_LIMIT = {
	limit: 10,
	windowMs: 300 * 1e3
};
var installRegisterSchema = z.object({
	platform: z.enum(["ios", "android"]),
	appVersion: z.string().trim().min(1).max(256),
	osVersion: z.string().trim().min(1).max(256),
	publicKey: z.string().trim().min(40).max(2048).regex(/^[A-Za-z0-9+/=]+$/)
});
var Route$2 = createFileRoute("/api/install/register/")({ server: { handlers: {
	POST: async (opts) => {
		const request = opts.request;
		try {
			const requestId = "";
			const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
			const userAgent = request.headers.get("user-agent") || "";
			const originRejection = rejectDisallowedMobileOrigin(request);
			if (originRejection) return originRejection;
			const body = await request.json().catch(() => null);
			const parsed = installRegisterSchema.safeParse(body);
			const publicKeyFingerprint = parsed.success ? hashPublicKey(parsed.data.publicKey) : "invalid-body";
			const [ipDecision, deviceDecision] = await Promise.all([consumeRateLimit({
				namespace: "install-register:ip",
				identifierParts: [clientIp],
				limit: REGISTER_RATE_LIMIT.limit,
				windowMs: REGISTER_RATE_LIMIT.windowMs
			}), consumeRateLimit({
				namespace: "install-register:device",
				identifierParts: [publicKeyFingerprint],
				limit: REGISTER_RATE_LIMIT.limit,
				windowMs: REGISTER_RATE_LIMIT.windowMs
			})]);
			const rateLimitDecision = !ipDecision.allowed ? ipDecision : deviceDecision;
			const baseHeaders = {
				...buildMobileCorsHeaders(request),
				...getRateLimitHeaders(rateLimitDecision)
			};
			if (rateLimitDecision.backend === "unavailable") return new Response(JSON.stringify({ error: "Rate limiting backend unavailable" }), {
				status: 503,
				headers: {
					"Content-Type": "application/json",
					...baseHeaders
				}
			});
			if (!rateLimitDecision.allowed) {
				await recordSecurityEvent({
					eventType: "rate_limit_exceeded",
					route: "/api/install/register",
					requestId,
					ip: clientIp,
					userAgent,
					outcome: "denied",
					reasonCode: "rate_limit",
					metadata: { publicKeyFingerprint }
				});
				return new Response(JSON.stringify({ error: "Too many installation registration attempts" }), {
					status: 429,
					headers: {
						"Content-Type": "application/json",
						...baseHeaders,
						"Retry-After": String(rateLimitDecision.retryAfterSeconds)
					}
				});
			}
			if (!parsed.success) {
				await recordSecurityEvent({
					eventType: "auth_failed",
					route: "/api/install/register",
					requestId,
					ip: clientIp,
					userAgent,
					outcome: "denied",
					reasonCode: "validation_failed"
				});
				return new Response(JSON.stringify({
					error: "Invalid request payload",
					details: parsed.error.flatten()
				}), {
					status: 400,
					headers: {
						"Content-Type": "application/json",
						...baseHeaders
					}
				});
			}
			const installId = randomUUID$1();
			const issuedRefreshToken = await issueRefreshToken(installId);
			await prisma.install.create({ data: {
				installId,
				platform: parsed.data.platform,
				appVersion: parsed.data.appVersion,
				osVersion: parsed.data.osVersion,
				publicKey: parsed.data.publicKey,
				publicKeyFingerprint,
				refreshTokenHash: hashToken(issuedRefreshToken.token),
				refreshTokenIssuedAt: issuedRefreshToken.issuedAt,
				lastSeenAt: issuedRefreshToken.issuedAt,
				lastAuthAt: issuedRefreshToken.issuedAt,
				isActive: true
			} });
			await recordSecurityEvent({
				eventType: "install_registered",
				route: "/api/install/register",
				requestId,
				installId,
				ip: clientIp,
				userAgent,
				outcome: "success",
				metadata: {
					platform: parsed.data.platform,
					appVersion: parsed.data.appVersion
				}
			});
			return new Response(JSON.stringify({
				installId,
				refreshToken: issuedRefreshToken.token
			}), {
				status: 201,
				headers: {
					"Content-Type": "application/json",
					...baseHeaders
				}
			});
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "api.install-register",
				operation: "POST /api/install/register"
			});
			logger.error("api.install_register.failed", { error });
			return new Response(JSON.stringify({ error: "Failed to register installation" }), {
				status: 500,
				headers: { "Content-Type": "application/json" }
			});
		}
	},
	OPTIONS: async (opts) => {
		const request = opts.request;
		const rejection = rejectDisallowedMobileOrigin(request);
		if (rejection) return rejection;
		return new Response(null, {
			status: 204,
			headers: buildMobileCorsHeaders(request)
		});
	}
} } });
//#endregion
//#region src/lib/geo/nominatim.ts
var PUBLIC_NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
var NOMINATIM_BASE_URL = normalizeBaseUrl(process.env.NOMINATIM_BASE_URL, PUBLIC_NOMINATIM_BASE_URL);
var CACHE_TTL_SECONDS = 720 * 60 * 60;
var NOMINATIM_MIN_INTERVAL_MS = Math.max(parseInteger(process.env.NOMINATIM_MIN_INTERVAL_MS, NOMINATIM_BASE_URL === PUBLIC_NOMINATIM_BASE_URL ? 1e3 : 0), 0);
var nextNominatimRequestAt = 0;
var nominatimQueue = Promise.resolve();
var hasWarnedWeakIdentity = false;
function normalizeBaseUrl(rawValue, fallback) {
	const value = rawValue?.trim();
	if (!value) return fallback;
	return value.replace(/\/+$/, "") || fallback;
}
function parseInteger(rawValue, fallback) {
	if (!rawValue) return fallback;
	const parsed = Number.parseInt(rawValue, 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}
function sleep(milliseconds) {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}
async function withNominatimRateLimit(task) {
	const queuedTask = nominatimQueue.catch(() => void 0).then(async () => {
		const waitMs = Math.max(0, nextNominatimRequestAt - Date.now());
		if (waitMs > 0) await sleep(waitMs);
		nextNominatimRequestAt = Date.now() + NOMINATIM_MIN_INTERVAL_MS;
		return task();
	});
	nominatimQueue = queuedTask.then(() => void 0, () => void 0);
	return queuedTask;
}
function getNominatimContactEmail() {
	return process.env.NOMINATIM_CONTACT_EMAIL?.trim() || void 0;
}
function getNominatimReferer() {
	const siteUrl = getSiteUrl();
	return isFallbackSiteUrl(siteUrl) ? void 0 : siteUrl;
}
function getNominatimUserAgent() {
	const configuredUserAgent = process.env.NOMINATIM_USER_AGENT?.trim();
	if (configuredUserAgent) return configuredUserAgent;
	const identityParts = [getNominatimReferer(), getNominatimContactEmail()].filter(Boolean);
	if (identityParts.length > 0) return `${SITE_NAME}/1.0 (${identityParts.join("; ")})`;
	return `${SITE_NAME}/1.0`;
}
function warnIfPublicNominatimIdentityLooksWeak() {
	if (hasWarnedWeakIdentity || NOMINATIM_BASE_URL !== PUBLIC_NOMINATIM_BASE_URL) return;
	if (getNominatimReferer() || getNominatimContactEmail() || process.env.NOMINATIM_USER_AGENT?.trim()) return;
	hasWarnedWeakIdentity = true;
	captureWarningWithContext("Public Nominatim configured without a strong application identity.", {
		area: "geo.nominatim",
		operation: "warnIfPublicNominatimIdentityLooksWeak",
		tags: { handled: true },
		dedupeKey: "geo.nominatim.weak-identity"
	});
	console.warn("[Nominatim] Public API configured without APP_URL/NEXT_PUBLIC_APP_URL, NOMINATIM_CONTACT_EMAIL or NOMINATIM_USER_AGENT. This may trigger 403 blocks.");
}
function applyCommonParams(url, locale) {
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("accept-language", locale);
	url.searchParams.set("addressdetails", "1");
	const contactEmail = getNominatimContactEmail();
	if (contactEmail) url.searchParams.set("email", contactEmail);
}
function buildHeaders(locale) {
	const headers = {
		Accept: "application/json",
		"Accept-Language": locale,
		"User-Agent": getNominatimUserAgent()
	};
	const referer = getNominatimReferer();
	if (referer) headers.Referer = referer;
	return headers;
}
async function fetchNominatim(url, locale) {
	warnIfPublicNominatimIdentityLooksWeak();
	return withNominatimRateLimit(async () => {
		const response = await fetch(url.toString(), { headers: buildHeaders(locale) });
		if (!response.ok) {
			const responseText = (await response.text()).trim();
			const policyHint = response.status === 403 ? " Possible causes: invalid or generic User-Agent/Referer, more than 1 req/s, or autocomplete/bulk usage forbidden by the public Nominatim policy." : "";
			const detail = responseText ? ` Response: ${responseText.slice(0, 200)}` : "";
			throw new Error(`Nominatim API error: ${response.status}.${policyHint}${detail}`);
		}
		return response;
	});
}
async function searchLocations(query, limit = 10, locale = "es") {
	const cacheKey = `geo:search:${query}:${limit}:${locale}`;
	const cached = await getCachedJson(cacheKey);
	if (cached) return cached;
	const url = new URL(`${NOMINATIM_BASE_URL}/search`);
	url.searchParams.set("q", query);
	url.searchParams.set("limit", String(limit));
	applyCommonParams(url, locale);
	const results = (await (await fetchNominatim(url, locale)).json()).map((item) => ({
		id: String(item.place_id),
		name: item.display_name.split(",")[0] || item.display_name,
		address: item.display_name,
		lat: parseFloat(item.lat),
		lon: parseFloat(item.lon),
		type: item.type === "house" || item.type === "building" ? "address" : "place"
	}));
	await setCachedJson(cacheKey, results, CACHE_TTL_SECONDS);
	return results;
}
async function reverseGeocode(lat, lon, locale = "es") {
	const cacheKey = `geo:reverse:${lat.toFixed(4)}:${lon.toFixed(4)}:${locale}`;
	const cached = await getCachedJson(cacheKey);
	if (cached) return cached;
	const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
	url.searchParams.set("lat", String(lat));
	url.searchParams.set("lon", String(lon));
	applyCommonParams(url, locale);
	const data = await (await fetchNominatim(url, locale)).json();
	const city = data.address?.city || data.address?.town || data.address?.village || "";
	const district = data.address?.neighbourhood || data.address?.suburb;
	const result = {
		address: data.display_name,
		city,
		district,
		lat,
		lon
	};
	await setCachedJson(cacheKey, result, CACHE_TTL_SECONDS);
	return result;
}
//#endregion
//#region src/lib/auth/signature.ts
var DEFAULT_SECRET = "dev-secret-do-not-use-in-production";
function getSignatureSecret() {
	const raw = process.env.SIGNATURE_SECRET;
	if (!raw) {
		if (process.env.NEXT_PHASE !== "phase-production-build") throw new Error("SIGNATURE_SECRET is required in production");
		logger.warn("signature.using_insecure_default");
		return DEFAULT_SECRET;
	}
	if (raw.length < 32) throw new Error(`SIGNATURE_SECRET must be at least 32 characters long (got ${raw.length}). Generate a strong secret: \`openssl rand -base64 32\``);
	return raw;
}
var SIGNATURE_SECRET = getSignatureSecret();
function normalizeSignedPayload(body) {
	if (!body || typeof body !== "object" || Array.isArray(body)) return JSON.stringify(body);
	const clone = { ...body };
	delete clone.signature;
	return JSON.stringify(clone);
}
function verifySignature(body, timestamp, signature) {
	const bodyString = normalizeSignedPayload(body);
	const expectedSignature = createHmac("sha256", SIGNATURE_SECRET).update(`${timestamp}.${bodyString}`).digest("hex");
	try {
		const signatureBuffer = Buffer.from(signature, "hex");
		const expectedBuffer = Buffer.from(expectedSignature, "hex");
		if (signatureBuffer.length !== expectedBuffer.length) return false;
		return timingSafeEqual$1(signatureBuffer, expectedBuffer);
	} catch {
		return false;
	}
}
function isSignatureExpired(timestamp, maxAgeMs = 6e4) {
	return Math.abs(Date.now() - timestamp) > maxAgeMs;
}
//#endregion
//#region src/lib/security/mobile-auth.ts
async function deny(options) {
	await recordSecurityEvent({
		eventType: options.eventType,
		route: options.route,
		requestId: options.requestId,
		installId: options.installId ?? null,
		ip: options.clientIp,
		userAgent: options.userAgent,
		outcome: "denied",
		reasonCode: options.reasonCode
	});
	return {
		ok: false,
		response: Response.json({ error: options.message }, {
			status: options.status,
			headers: options.headers
		})
	};
}
async function verifyMobileRequest(options) {
	const authHeader = options.request.headers.get("authorization");
	const installId = options.request.headers.get("x-installation-id")?.trim();
	if (!authHeader || !authHeader.startsWith("Bearer ")) return deny({
		route: options.route,
		requestId: options.requestId,
		clientIp: options.clientIp,
		userAgent: options.userAgent,
		eventType: "auth_failed",
		reasonCode: "missing_bearer_token",
		status: 401,
		message: "Missing or invalid Authorization header",
		headers: options.headers
	});
	if (!installId) return deny({
		route: options.route,
		requestId: options.requestId,
		clientIp: options.clientIp,
		userAgent: options.userAgent,
		eventType: "auth_failed",
		reasonCode: "missing_installation_id",
		status: 401,
		message: "Missing X-Installation-Id header",
		headers: options.headers
	});
	const payload = await verifyAccessToken(authHeader.slice(7));
	if (!payload || payload.installId !== installId) return deny({
		route: options.route,
		requestId: options.requestId,
		clientIp: options.clientIp,
		userAgent: options.userAgent,
		installId,
		eventType: "auth_failed",
		reasonCode: "access_token_invalid",
		status: 401,
		message: "Invalid or expired token",
		headers: options.headers
	});
	const install = await prisma.install.findUnique({ where: { installId } });
	if (!install || !install.isActive || install.revokedAt) return deny({
		route: options.route,
		requestId: options.requestId,
		clientIp: options.clientIp,
		userAgent: options.userAgent,
		installId,
		eventType: "auth_failed",
		reasonCode: "install_inactive",
		status: 401,
		message: "Installation not found or inactive",
		headers: options.headers
	});
	const requireSignature = shouldRequireSignedMobileRequests();
	const { timestamp, signature } = options.body;
	if (requireSignature && (!timestamp || !signature)) return deny({
		route: options.route,
		requestId: options.requestId,
		clientIp: options.clientIp,
		userAgent: options.userAgent,
		installId,
		eventType: "signature_invalid",
		reasonCode: "signature_required",
		status: 401,
		message: "Signed request required",
		headers: options.headers
	});
	if (timestamp || signature) {
		if (!timestamp || !signature) return deny({
			route: options.route,
			requestId: options.requestId,
			clientIp: options.clientIp,
			userAgent: options.userAgent,
			installId,
			eventType: "signature_invalid",
			reasonCode: "signature_missing_fields",
			status: 401,
			message: "Missing signed request fields",
			headers: options.headers
		});
		if (isSignatureExpired(timestamp, 6e4)) return deny({
			route: options.route,
			requestId: options.requestId,
			clientIp: options.clientIp,
			userAgent: options.userAgent,
			installId,
			eventType: "signature_invalid",
			reasonCode: "signature_expired",
			status: 401,
			message: "Request timestamp expired",
			headers: options.headers
		});
		if (!verifySignature(options.body, timestamp, signature)) return deny({
			route: options.route,
			requestId: options.requestId,
			clientIp: options.clientIp,
			userAgent: options.userAgent,
			installId,
			eventType: "signature_invalid",
			reasonCode: "signature_mismatch",
			status: 401,
			message: "Invalid signature",
			headers: options.headers
		});
	}
	await prisma.install.update({
		where: { installId },
		data: {
			lastSeenAt: /* @__PURE__ */ new Date(),
			lastAuthAt: /* @__PURE__ */ new Date()
		}
	});
	updateExecutionContext({ installId });
	return {
		ok: true,
		installId
	};
}
//#endregion
//#region src/app/api/geo/search/index.ts
var GEO_SEARCH_RATE_LIMIT = {
	limit: 60,
	windowMs: 6e4
};
var geoSearchSchema = z.object({
	query: z.string().trim().min(2).max(200),
	limit: z.number().int().min(1).max(20).optional(),
	timestamp: z.number().int().positive().optional(),
	signature: z.string().trim().min(10).max(512).optional()
});
var Route$1 = createFileRoute("/api/geo/search/")({ server: { handlers: {
	POST: async (opts) => {
		const request = opts.request;
		try {
			const requestId = "";
			const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
			const userAgent = request.headers.get("user-agent") || "";
			const originRejection = rejectDisallowedMobileOrigin(request);
			if (originRejection) return originRejection;
			const rawBody = await request.json().catch(() => null);
			const parsed = geoSearchSchema.safeParse(rawBody);
			const baseHeaders = buildMobileCorsHeaders(request);
			if (!parsed.success) return new Response(JSON.stringify({
				error: "Invalid request payload",
				details: parsed.error.flatten()
			}), {
				status: 400,
				headers: {
					"Content-Type": "application/json",
					...baseHeaders
				}
			});
			const authResult = await verifyMobileRequest({
				body: parsed.data,
				route: "/api/geo/search",
				request,
				requestId,
				clientIp,
				userAgent,
				headers: baseHeaders
			});
			if (!authResult.ok) return authResult.response;
			const [ipDecision, installDecision] = await Promise.all([consumeRateLimit({
				namespace: "geo-search:ip",
				identifierParts: [clientIp],
				limit: GEO_SEARCH_RATE_LIMIT.limit,
				windowMs: GEO_SEARCH_RATE_LIMIT.windowMs
			}), consumeRateLimit({
				namespace: "geo-search:install",
				identifierParts: [authResult.installId],
				limit: GEO_SEARCH_RATE_LIMIT.limit,
				windowMs: GEO_SEARCH_RATE_LIMIT.windowMs
			})]);
			const rateLimitDecision = !ipDecision.allowed ? ipDecision : installDecision;
			const headers = {
				...baseHeaders,
				...getRateLimitHeaders(rateLimitDecision)
			};
			if (rateLimitDecision.backend === "unavailable") return new Response(JSON.stringify({ error: "Rate limiting backend unavailable" }), {
				status: 503,
				headers: {
					"Content-Type": "application/json",
					...headers
				}
			});
			if (!rateLimitDecision.allowed) {
				await recordSecurityEvent({
					eventType: "rate_limit_exceeded",
					route: "/api/geo/search",
					requestId,
					installId: authResult.installId,
					ip: clientIp,
					userAgent,
					outcome: "denied",
					reasonCode: "rate_limit"
				});
				return new Response(JSON.stringify({ error: "Too many geo search requests" }), {
					status: 429,
					headers: {
						"Content-Type": "application/json",
						...headers,
						"Retry-After": String(rateLimitDecision.retryAfterSeconds)
					}
				});
			}
			const results = await searchLocations(parsed.data.query, parsed.data.limit ?? 10);
			return new Response(JSON.stringify({ results }), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					...headers,
					"Cache-Control": "public, max-age=3600, s-maxage=2592000"
				}
			});
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "api.geo-search",
				operation: "POST /api/geo/search"
			});
			logger.error("api.geo_search.failed", { error });
			return new Response(JSON.stringify({ error: "Failed to search locations" }), {
				status: 500,
				headers: { "Content-Type": "application/json" }
			});
		}
	},
	OPTIONS: async (opts) => {
		const request = opts.request;
		const rejection = rejectDisallowedMobileOrigin(request);
		if (rejection) return rejection;
		return new Response(null, {
			status: 204,
			headers: buildMobileCorsHeaders(request)
		});
	}
} } });
//#endregion
//#region src/app/api/geo/reverse/index.ts
var GEO_REVERSE_RATE_LIMIT = {
	limit: 60,
	windowMs: 6e4
};
var geoReverseSchema = z.object({
	lat: z.number().min(-90).max(90),
	lon: z.number().min(-180).max(180),
	timestamp: z.number().int().positive().optional(),
	signature: z.string().trim().min(10).max(512).optional()
});
var Route = createFileRoute("/api/geo/reverse/")({ server: { handlers: {
	POST: async (opts) => {
		const request = opts.request;
		try {
			const requestId = "";
			const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
			const userAgent = request.headers.get("user-agent") || "";
			const originRejection = rejectDisallowedMobileOrigin(request);
			if (originRejection) return originRejection;
			const rawBody = await request.json().catch(() => null);
			const parsed = geoReverseSchema.safeParse(rawBody);
			const baseHeaders = buildMobileCorsHeaders(request);
			if (!parsed.success) return new Response(JSON.stringify({
				error: "Invalid request payload",
				details: parsed.error.flatten()
			}), {
				status: 400,
				headers: {
					"Content-Type": "application/json",
					...baseHeaders
				}
			});
			const authResult = await verifyMobileRequest({
				body: parsed.data,
				route: "/api/geo/reverse",
				request,
				requestId,
				clientIp,
				userAgent,
				headers: baseHeaders
			});
			if (!authResult.ok) return authResult.response;
			const [ipDecision, installDecision] = await Promise.all([consumeRateLimit({
				namespace: "geo-reverse:ip",
				identifierParts: [clientIp],
				limit: GEO_REVERSE_RATE_LIMIT.limit,
				windowMs: GEO_REVERSE_RATE_LIMIT.windowMs
			}), consumeRateLimit({
				namespace: "geo-reverse:install",
				identifierParts: [authResult.installId],
				limit: GEO_REVERSE_RATE_LIMIT.limit,
				windowMs: GEO_REVERSE_RATE_LIMIT.windowMs
			})]);
			const rateLimitDecision = !ipDecision.allowed ? ipDecision : installDecision;
			const headers = {
				...baseHeaders,
				...getRateLimitHeaders(rateLimitDecision)
			};
			if (rateLimitDecision.backend === "unavailable") return new Response(JSON.stringify({ error: "Rate limiting backend unavailable" }), {
				status: 503,
				headers: {
					"Content-Type": "application/json",
					...headers
				}
			});
			if (!rateLimitDecision.allowed) {
				await recordSecurityEvent({
					eventType: "rate_limit_exceeded",
					route: "/api/geo/reverse",
					requestId,
					installId: authResult.installId,
					ip: clientIp,
					userAgent,
					outcome: "denied",
					reasonCode: "rate_limit"
				});
				return new Response(JSON.stringify({ error: "Too many reverse geocoding requests" }), {
					status: 429,
					headers: {
						"Content-Type": "application/json",
						...headers,
						"Retry-After": String(rateLimitDecision.retryAfterSeconds)
					}
				});
			}
			const result = await reverseGeocode(parsed.data.lat, parsed.data.lon);
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					...headers,
					"Cache-Control": "public, max-age=3600, s-maxage=2592000"
				}
			});
		} catch (error) {
			captureExceptionWithContext(error, {
				area: "api.geo-reverse",
				operation: "POST /api/geo/reverse"
			});
			logger.error("api.geo_reverse.failed", { error });
			return new Response(JSON.stringify({ error: "Failed to reverse geocode" }), {
				status: 500,
				headers: { "Content-Type": "application/json" }
			});
		}
	},
	OPTIONS: async (opts) => {
		const request = opts.request;
		const rejection = rejectDisallowedMobileOrigin(request);
		if (rejection) return rejection;
		return new Response(null, {
			status: 204,
			headers: buildMobileCorsHeaders(request)
		});
	}
} } });
//#endregion
//#region src/routeTree.gen.ts
var ViajesPorMesZaragozaRoute = Route$63.update({
	id: "/viajes-por-mes-zaragoza",
	path: "/viajes-por-mes-zaragoza",
	getParentRoute: () => Route$45
});
var ViajesPorDiaZaragozaRoute = Route$62.update({
	id: "/viajes-por-dia-zaragoza",
	path: "/viajes-por-dia-zaragoza",
	getParentRoute: () => Route$45
});
var UsoBiziPorHoraRoute = Route$61.update({
	id: "/uso-bizi-por-hora",
	path: "/uso-bizi-por-hora",
	getParentRoute: () => Route$45
});
var UsoBiziPorEstacionRoute = Route$60.update({
	id: "/uso-bizi-por-estacion",
	path: "/uso-bizi-por-estacion",
	getParentRoute: () => Route$45
});
var SitemapDotxmlRoute = Route$44.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$45
});
var RobotsDottxtRoute = Route$43.update({
	id: "/robots.txt",
	path: "/robots.txt",
	getParentRoute: () => Route$45
});
var RedistribucionBiziZaragozaRoute = Route$59.update({
	id: "/redistribucion-bizi-zaragoza",
	path: "/redistribucion-bizi-zaragoza",
	getParentRoute: () => Route$45
});
var RankingEstacionesBiziRoute = Route$58.update({
	id: "/ranking-estaciones-bizi",
	path: "/ranking-estaciones-bizi",
	getParentRoute: () => Route$45
});
var MetodologiaRoute = Route$42.update({
	id: "/metodologia",
	path: "/metodologia",
	getParentRoute: () => Route$45
});
var MapaEstacionesBiziZaragozaRoute = Route$57.update({
	id: "/mapa-estaciones-bizi-zaragoza",
	path: "/mapa-estaciones-bizi-zaragoza",
	getParentRoute: () => Route$45
});
var LlmsDottxtRoute = Route$41.update({
	id: "/llms.txt",
	path: "/llms.txt",
	getParentRoute: () => Route$45
});
var LlmsFullDottxtRoute = Route$40.update({
	id: "/llms-full.txt",
	path: "/llms-full.txt",
	getParentRoute: () => Route$45
});
var InformesMensualesBiziZaragozaRoute = Route$55.update({
	id: "/informes-mensuales-bizi-zaragoza",
	path: "/informes-mensuales-bizi-zaragoza",
	getParentRoute: () => Route$45
});
var InformesRoute = Route$39.update({
	id: "/informes",
	path: "/informes",
	getParentRoute: () => Route$45
});
var ExplorarRoute = Route$38.update({
	id: "/explorar",
	path: "/explorar",
	getParentRoute: () => Route$45
});
var EstadoRoute = Route$37.update({
	id: "/estado",
	path: "/estado",
	getParentRoute: () => Route$45
});
var EstadisticasBiziZaragozaRoute = Route$54.update({
	id: "/estadisticas-bizi-zaragoza",
	path: "/estadisticas-bizi-zaragoza",
	getParentRoute: () => Route$45
});
var EstacionesMasUsadasZaragozaRoute = Route$52.update({
	id: "/estaciones-mas-usadas-zaragoza",
	path: "/estaciones-mas-usadas-zaragoza",
	getParentRoute: () => Route$45
});
var EstacionesConMasBicisRoute = Route$51.update({
	id: "/estaciones-con-mas-bicis",
	path: "/estaciones-con-mas-bicis",
	getParentRoute: () => Route$45
});
var DevelopersRoute = Route$36.update({
	id: "/developers",
	path: "/developers",
	getParentRoute: () => Route$45
});
var CompararRoute = Route$35.update({
	id: "/comparar",
	path: "/comparar",
	getParentRoute: () => Route$45
});
var BiciradarRoute = Route$34.update({
	id: "/biciradar",
	path: "/biciradar",
	getParentRoute: () => Route$45
});
var BetaRoute = Route$33.update({
	id: "/beta",
	path: "/beta",
	getParentRoute: () => Route$45
});
var BarriosBiziZaragozaRoute = Route$46.update({
	id: "/barrios-bizi-zaragoza",
	path: "/barrios-bizi-zaragoza",
	getParentRoute: () => Route$45
});
var AboutRoute = Route$32.update({
	id: "/about",
	path: "/about",
	getParentRoute: () => Route$45
});
var SplatRoute = Route$31.update({
	id: "/$",
	path: "/$",
	getParentRoute: () => Route$45
});
var DashboardRouteRoute = Route$30.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$45
});
var IndexRoute = Route$29.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$45
});
var DashboardIndexRoute = Route$49.update({
	id: "/",
	path: "/",
	getParentRoute: () => DashboardRouteRoute
});
var InformesMonthRoute = Route$56.update({
	id: "/$month",
	path: "/$month",
	getParentRoute: () => InformesRoute
});
var EstacionesStationIdRoute = Route$53.update({
	id: "/estaciones/$stationId",
	path: "/estaciones/$stationId",
	getParentRoute: () => Route$45
});
var BarriosDistrictSlugRoute = Route$47.update({
	id: "/barrios/$districtSlug",
	path: "/barrios/$districtSlug",
	getParentRoute: () => Route$45
});
var ApiOpenapiDotjsonRoute = Route$28.update({
	id: "/api/openapi.json",
	path: "/api/openapi.json",
	getParentRoute: () => Route$45
});
var DashboardStatusIndexRoute = Route$27.update({
	id: "/status/",
	path: "/status/",
	getParentRoute: () => DashboardRouteRoute
});
var DashboardRedistribucionIndexRoute = Route$26.update({
	id: "/redistribucion/",
	path: "/redistribucion/",
	getParentRoute: () => DashboardRouteRoute
});
var DashboardFlujoIndexRoute = Route$25.update({
	id: "/flujo/",
	path: "/flujo/",
	getParentRoute: () => DashboardRouteRoute
});
var DashboardEstacionesIndexRoute = Route$24.update({
	id: "/estaciones/",
	path: "/estaciones/",
	getParentRoute: () => DashboardRouteRoute
});
var DashboardConclusionesIndexRoute = Route$23.update({
	id: "/conclusiones/",
	path: "/conclusiones/",
	getParentRoute: () => DashboardRouteRoute
});
var DashboardAyudaIndexRoute = Route$22.update({
	id: "/ayuda/",
	path: "/ayuda/",
	getParentRoute: () => DashboardRouteRoute
});
var DashboardAlertasIndexRoute = Route$21.update({
	id: "/alertas/",
	path: "/alertas/",
	getParentRoute: () => DashboardRouteRoute
});
var ApiStatusIndexRoute = Route$20.update({
	id: "/api/status/",
	path: "/api/status/",
	getParentRoute: () => Route$45
});
var ApiStationsIndexRoute = Route$19.update({
	id: "/api/stations/",
	path: "/api/stations/",
	getParentRoute: () => Route$45
});
var ApiRebalancingReportIndexRoute = Route$18.update({
	id: "/api/rebalancing-report/",
	path: "/api/rebalancing-report/",
	getParentRoute: () => Route$45
});
var ApiRankingsIndexRoute = Route$17.update({
	id: "/api/rankings/",
	path: "/api/rankings/",
	getParentRoute: () => Route$45
});
var ApiPredictionsIndexRoute = Route$16.update({
	id: "/api/predictions/",
	path: "/api/predictions/",
	getParentRoute: () => Route$45
});
var ApiPatternsIndexRoute = Route$15.update({
	id: "/api/patterns/",
	path: "/api/patterns/",
	getParentRoute: () => Route$45
});
var ApiMobilityIndexRoute = Route$14.update({
	id: "/api/mobility/",
	path: "/api/mobility/",
	getParentRoute: () => Route$45
});
var ApiHistoryIndexRoute = Route$13.update({
	id: "/api/history/",
	path: "/api/history/",
	getParentRoute: () => Route$45
});
var ApiHeatmapIndexRoute = Route$12.update({
	id: "/api/heatmap/",
	path: "/api/heatmap/",
	getParentRoute: () => Route$45
});
var ApiDocsIndexRoute = Route$11.update({
	id: "/api/docs/",
	path: "/api/docs/",
	getParentRoute: () => Route$45
});
var ApiCollectIndexRoute = Route$10.update({
	id: "/api/collect/",
	path: "/api/collect/",
	getParentRoute: () => Route$45
});
var ApiAppVersionsIndexRoute = Route$9.update({
	id: "/api/app-versions/",
	path: "/api/app-versions/",
	getParentRoute: () => Route$45
});
var ApiAlertsIndexRoute = Route$8.update({
	id: "/api/alerts/",
	path: "/api/alerts/",
	getParentRoute: () => Route$45
});
var DashboardViewsModeRoute = Route$50.update({
	id: "/views/$mode",
	path: "/views/$mode",
	getParentRoute: () => DashboardRouteRoute
});
var DashboardEstacionesStationIdRoute = Route$48.update({
	id: "/estaciones/$stationId",
	path: "/estaciones/$stationId",
	getParentRoute: () => DashboardRouteRoute
});
var ApiHealthReadyRoute = Route$7.update({
	id: "/api/health/ready",
	path: "/api/health/ready",
	getParentRoute: () => Route$45
});
var ApiHealthLiveRoute = Route$6.update({
	id: "/api/health/live",
	path: "/api/health/live",
	getParentRoute: () => Route$45
});
var ApiAlertsHistoryRouteRoute = Route$5.update({
	id: "/api/alerts/history",
	path: "/api/alerts/history",
	getParentRoute: () => Route$45
});
var ApiTokenRefreshIndexRoute = Route$4.update({
	id: "/api/token/refresh/",
	path: "/api/token/refresh/",
	getParentRoute: () => Route$45
});
var ApiOpsSentryTestIndexRoute = Route$3.update({
	id: "/api/ops/sentry-test/",
	path: "/api/ops/sentry-test/",
	getParentRoute: () => Route$45
});
var ApiInstallRegisterIndexRoute = Route$2.update({
	id: "/api/install/register/",
	path: "/api/install/register/",
	getParentRoute: () => Route$45
});
var ApiGeoSearchIndexRoute = Route$1.update({
	id: "/api/geo/search/",
	path: "/api/geo/search/",
	getParentRoute: () => Route$45
});
var ApiGeoReverseIndexRoute = Route.update({
	id: "/api/geo/reverse/",
	path: "/api/geo/reverse/",
	getParentRoute: () => Route$45
});
var DashboardRouteRouteChildren = {
	DashboardIndexRoute,
	DashboardEstacionesStationIdRoute,
	DashboardViewsModeRoute,
	DashboardAlertasIndexRoute,
	DashboardAyudaIndexRoute,
	DashboardConclusionesIndexRoute,
	DashboardEstacionesIndexRoute,
	DashboardFlujoIndexRoute,
	DashboardRedistribucionIndexRoute,
	DashboardStatusIndexRoute
};
var DashboardRouteRouteWithChildren = DashboardRouteRoute._addFileChildren(DashboardRouteRouteChildren);
var InformesRouteChildren = { InformesMonthRoute };
var rootRouteChildren = {
	IndexRoute,
	DashboardRouteRoute: DashboardRouteRouteWithChildren,
	SplatRoute,
	AboutRoute,
	BarriosBiziZaragozaRoute,
	BetaRoute,
	BiciradarRoute,
	CompararRoute,
	DevelopersRoute,
	EstacionesConMasBicisRoute,
	EstacionesMasUsadasZaragozaRoute,
	EstadisticasBiziZaragozaRoute,
	EstadoRoute,
	ExplorarRoute,
	InformesRoute: InformesRoute._addFileChildren(InformesRouteChildren),
	InformesMensualesBiziZaragozaRoute,
	LlmsFullDottxtRoute,
	LlmsDottxtRoute,
	MapaEstacionesBiziZaragozaRoute,
	MetodologiaRoute,
	RankingEstacionesBiziRoute,
	RedistribucionBiziZaragozaRoute,
	RobotsDottxtRoute,
	SitemapDotxmlRoute,
	UsoBiziPorEstacionRoute,
	UsoBiziPorHoraRoute,
	ViajesPorDiaZaragozaRoute,
	ViajesPorMesZaragozaRoute,
	ApiOpenapiDotjsonRoute,
	BarriosDistrictSlugRoute,
	EstacionesStationIdRoute,
	ApiAlertsHistoryRouteRoute,
	ApiHealthLiveRoute,
	ApiHealthReadyRoute,
	ApiAlertsIndexRoute,
	ApiAppVersionsIndexRoute,
	ApiCollectIndexRoute,
	ApiDocsIndexRoute,
	ApiHeatmapIndexRoute,
	ApiHistoryIndexRoute,
	ApiMobilityIndexRoute,
	ApiPatternsIndexRoute,
	ApiPredictionsIndexRoute,
	ApiRankingsIndexRoute,
	ApiRebalancingReportIndexRoute,
	ApiStationsIndexRoute,
	ApiStatusIndexRoute,
	ApiGeoReverseIndexRoute,
	ApiGeoSearchIndexRoute,
	ApiInstallRegisterIndexRoute,
	ApiOpsSentryTestIndexRoute,
	ApiTokenRefreshIndexRoute
};
var routeTree = Route$45._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/integrations/tanstack-query/root-provider.tsx
function getContext() {
	return { queryClient: new QueryClient() };
}
//#endregion
//#region src/router.tsx
function getRouter() {
	const context = getContext();
	const router = createRouter({
		routeTree,
		context,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0
	});
	setupRouterSsrQueryIntegration({
		router,
		queryClient: context.queryClient
	});
	return router;
}
//#endregion
export { getRouter };

//# sourceMappingURL=router-BIRzKSzQ.js.map