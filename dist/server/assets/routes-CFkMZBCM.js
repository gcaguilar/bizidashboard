import { n as DEFAULT_CITY, r as isValidCity, t as CITY_CONFIGS } from "./constants-NS3nVLZ-.js";
//#region src/lib/site.ts
function getCity() {
	return (process.env.CITY || "zaragoza").toLowerCase();
}
function getCurrentCityKey() {
	const cityKey = getCity();
	return isValidCity(cityKey) ? cityKey : DEFAULT_CITY;
}
function getCityName() {
	return CITY_CONFIGS[getCurrentCityKey()].name;
}
var SITE_NAME = "BiziDashboard";
var SITE_TITLE = `BiziDashboard ${getCityName()}`;
`${getCityName()}`;
var SEO_SITE_TITLE = `DatosBizi ${getCityName()}`;
var SEO_SITE_DESCRIPTION = `DatosBizi centraliza estaciones Bizi ${getCityName()}, disponibilidad, analisis de uso, informes mensuales y datos abiertos en una unica capa publica.`;
var FALLBACK_SITE_URL = "http://localhost:3000";
function ensureProtocol(value) {
	if (/^https?:\/\//i.test(value)) return value;
	return `https://${value}`;
}
function normalizeHttpOrigin(candidate, fallback) {
	try {
		const parsed = new URL(ensureProtocol(candidate.trim()));
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return fallback;
		return parsed.origin;
	} catch {
		return fallback;
	}
}
function getSiteUrl() {
	return normalizeHttpOrigin(process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim() || FALLBACK_SITE_URL, FALLBACK_SITE_URL);
}
function isFallbackSiteUrl(url) {
	return normalizeHttpOrigin(url, FALLBACK_SITE_URL) === FALLBACK_SITE_URL;
}
function getRobotsBaseUrl() {
	const candidate = process.env.ROBOTS_BASE_URL?.trim();
	if (!candidate) return getSiteUrl();
	return normalizeHttpOrigin(candidate, getSiteUrl());
}
function getRobotsSitemapUrl() {
	return `${getRobotsBaseUrl()}/sitemap.xml`;
}
//#endregion
//#region src/lib/routes.ts
var CITY_SEGMENTS = [
	"zaragoza",
	"madrid",
	"barcelona"
];
function encodeSegment(value) {
	return encodeURIComponent(value);
}
function buildQuery(pathname, query) {
	if (!query) return pathname;
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value === null || value === void 0 || value === "") continue;
		params.set(key, String(value));
	}
	const queryString = params.toString();
	return queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
}
function buildHash(pathname, hash) {
	if (!hash) return pathname;
	const normalizedHash = hash.replace(/^#/, "");
	return normalizedHash.length > 0 ? `${pathname}#${normalizedHash}` : pathname;
}
var appRoutes = {
	home: () => "/",
	login: () => "/login",
	register: () => "/register",
	profile: () => "/profile",
	llms: () => "/llms.txt",
	llmsFull: () => "/llms-full.txt",
	homeAlias: () => "/inicio",
	citiesAlias: () => "/ciudades",
	cityRootAlias: (city) => `/${encodeSegment(city)}`,
	cityDashboardAlias: (city) => `/${encodeSegment(city)}/dashboard`,
	cityExploreAlias: (city) => `/${encodeSegment(city)}/explorar`,
	cityReportsAlias: (city) => `/${encodeSegment(city)}/informes`,
	cityStatusAlias: (city) => `/${encodeSegment(city)}/estado`,
	cityHelpAlias: (city) => `/${encodeSegment(city)}/ayuda`,
	cityFlowAlias: (city) => `/${encodeSegment(city)}/flujo`,
	cityConclusionsAlias: (city) => `/${encodeSegment(city)}/conclusiones`,
	cityAlertsAlias: (city) => `/${encodeSegment(city)}/alertas`,
	cityStationsAlias: (city) => `/${encodeSegment(city)}/estaciones`,
	beta: () => "/beta",
	biciradar: () => "/biciradar",
	utilityLanding: () => "/mapa-estaciones-bizi-zaragoza",
	insightsLanding: () => "/estadisticas-bizi-zaragoza",
	compare: (params) => buildQuery("/comparar", {
		dimension: params?.dimension,
		left: params?.left,
		right: params?.right
	}),
	developers: () => "/developers",
	developersAlias: () => "/developers",
	helpAlias: () => "/ayuda",
	methodology: () => "/metodologia",
	explore: (params) => buildQuery("/explorar", { q: params?.q }),
	reports: () => "/informes",
	reportMonth: (month) => `/informes/${encodeSegment(month)}`,
	status: () => "/estado",
	dashboard: () => "/dashboard",
	dashboardAlerts: () => "/dashboard/alertas",
	dashboardHelp: (hash) => buildHash("/dashboard/ayuda", hash),
	dashboardConclusions: (params) => buildQuery("/dashboard/conclusiones", { month: params?.month }),
	dashboardFlow: (params) => buildQuery("/dashboard/flujo", {
		month: params?.month,
		period: params?.period
	}),
	dashboardStations: () => "/dashboard/estaciones",
	dashboardStation: (stationId) => `/dashboard/estaciones/${encodeSegment(stationId)}`,
	stationDetail: (stationId) => `/estaciones/${encodeSegment(stationId)}`,
	dashboardStatus: () => "/dashboard/status",
	dashboardView: (mode) => `/dashboard/views/${encodeSegment(mode)}`,
	dashboardRedistribucion: () => "/dashboard/redistribucion",
	districtLanding: () => "/barrios-bizi-zaragoza",
	districtDetail: (districtSlug) => `/barrios/${encodeSegment(districtSlug)}`,
	seoPage: (slug) => `/${encodeSegment(slug)}`,
	api: {
		docs: () => "/api/docs",
		openApi: () => "/api/openapi.json",
		socialImage: () => "/api/social-image",
		stations: (params) => buildQuery("/api/stations", { format: params?.format }),
		rankings: (params) => buildQuery("/api/rankings", {
			type: params?.type,
			limit: params?.limit,
			format: params?.format
		}),
		alerts: (params) => buildQuery("/api/alerts", { limit: params?.limit }),
		status: (params) => buildQuery("/api/status", { format: params?.format }),
		mobility: (params) => buildQuery("/api/mobility", {
			mobilityDays: params?.mobilityDays,
			demandDays: params?.demandDays,
			month: params?.month
		}),
		history: (params) => buildQuery("/api/history", { format: params?.format }),
		historyCsv: () => buildQuery("/api/history", { format: "csv" }),
		alertsHistory: (params) => buildQuery("/api/alerts/history", {
			format: params?.format,
			state: params?.state,
			limit: params?.limit
		}),
		predictions: (stationId = "101") => buildQuery("/api/predictions", { stationId }),
		rebalancingReport: (params) => buildQuery("/api/rebalancing-report", {
			district: params?.district,
			days: params?.days,
			format: params?.format
		})
	}
};
var DASHBOARD_ROUTE_CONFIG = {
	dashboard: {
		href: appRoutes.dashboard(),
		label: "Inicio"
	},
	stations: {
		href: appRoutes.dashboardStations(),
		label: "Estaciones"
	},
	flow: {
		href: appRoutes.dashboardFlow(),
		label: "Flujo"
	},
	conclusions: {
		href: appRoutes.dashboardConclusions(),
		label: "Conclusiones"
	},
	redistribucion: {
		href: appRoutes.dashboardRedistribucion(),
		label: "Redistribución"
	},
	help: {
		href: appRoutes.dashboardHelp(),
		label: "Ayuda"
	}
};
var INDEXABLE_PUBLIC_ROUTE_REGISTRY = [
	{
		id: "home",
		href: appRoutes.home(),
		label: "Inicio",
		sitemap: {
			changeFrequency: "hourly",
			priority: 1
		}
	},
	{
		id: "biciradar",
		href: appRoutes.biciradar(),
		label: "Bici Radar",
		sitemap: {
			changeFrequency: "weekly",
			priority: .76
		}
	},
	{
		id: "developers",
		href: appRoutes.developers(),
		label: "Developers",
		sitemap: {
			changeFrequency: "weekly",
			priority: .72
		}
	},
	{
		id: "utility-landing",
		href: appRoutes.utilityLanding(),
		label: "Mapa estaciones",
		sitemap: {
			changeFrequency: "hourly",
			priority: .79
		}
	},
	{
		id: "insights-landing",
		href: appRoutes.insightsLanding(),
		label: "Estadisticas",
		sitemap: {
			changeFrequency: "daily",
			priority: .75
		}
	},
	{
		id: "methodology",
		href: appRoutes.methodology(),
		label: "Metodologia",
		sitemap: {
			changeFrequency: "weekly",
			priority: .64
		}
	},
	{
		id: "reports",
		href: appRoutes.reports(),
		label: "Informes",
		sitemap: {
			changeFrequency: "daily",
			priority: .82
		}
	},
	{
		id: "district-landing",
		href: appRoutes.districtLanding(),
		label: "Barrios",
		sitemap: {
			changeFrequency: "daily",
			priority: .72
		}
	},
	{
		id: "status",
		href: appRoutes.status(),
		label: "Estado",
		sitemap: {
			changeFrequency: "hourly",
			priority: .68
		}
	}
];
var TOOL_PUBLIC_ROUTE_REGISTRY = [
	{
		id: "beta",
		href: appRoutes.beta(),
		label: "Beta",
		sitemap: {
			changeFrequency: "weekly",
			priority: .4
		}
	},
	{
		id: "compare",
		href: appRoutes.compare(),
		label: "Comparar",
		sitemap: {
			changeFrequency: "daily",
			priority: .78
		}
	},
	{
		id: "explore",
		href: appRoutes.explore(),
		label: "Explorar",
		sitemap: {
			changeFrequency: "daily",
			priority: .84
		}
	},
	{
		id: "dashboard",
		href: appRoutes.dashboard(),
		label: "Dashboard",
		sitemap: {
			changeFrequency: "hourly",
			priority: .9
		}
	},
	{
		id: "dashboard-flow",
		href: appRoutes.dashboardFlow(),
		label: "Flujo",
		sitemap: {
			changeFrequency: "hourly",
			priority: .8
		}
	},
	{
		id: "dashboard-alerts",
		href: appRoutes.dashboardAlerts(),
		label: "Alertas",
		sitemap: {
			changeFrequency: "hourly",
			priority: .8
		}
	},
	{
		id: "dashboard-stations",
		href: appRoutes.dashboardStations(),
		label: "Estaciones",
		sitemap: {
			changeFrequency: "daily",
			priority: .7
		}
	},
	{
		id: "dashboard-help",
		href: appRoutes.dashboardHelp(),
		label: "Ayuda",
		sitemap: {
			changeFrequency: "weekly",
			priority: .5
		}
	},
	{
		id: "dashboard-conclusions",
		href: appRoutes.dashboardConclusions(),
		label: "Conclusiones",
		sitemap: {
			changeFrequency: "daily",
			priority: .75
		}
	},
	{
		id: "dashboard-redistribucion",
		href: appRoutes.dashboardRedistribucion(),
		label: "Redistribucion",
		sitemap: {
			changeFrequency: "daily",
			priority: .75
		}
	}
];
[...INDEXABLE_PUBLIC_ROUTE_REGISTRY, ...TOOL_PUBLIC_ROUTE_REGISTRY];
var EXACT_REDIRECT_ENTRIES = [
	{
		source: appRoutes.beta(),
		destination: appRoutes.biciradar()
	},
	{
		source: "/estaciones-mas-usadas",
		destination: appRoutes.seoPage("estaciones-mas-usadas-zaragoza")
	},
	{
		source: appRoutes.seoPage("informes-mensuales-bizi-zaragoza"),
		destination: appRoutes.reports()
	},
	{
		source: appRoutes.dashboardStatus(),
		destination: appRoutes.status()
	},
	{
		source: appRoutes.homeAlias(),
		destination: appRoutes.home()
	},
	{
		source: appRoutes.citiesAlias(),
		destination: appRoutes.home()
	},
	{
		source: appRoutes.helpAlias(),
		destination: appRoutes.methodology()
	},
	...CITY_SEGMENTS.flatMap((city) => [
		{
			source: appRoutes.cityRootAlias(city),
			destination: appRoutes.dashboard()
		},
		{
			source: appRoutes.cityDashboardAlias(city),
			destination: appRoutes.dashboard()
		},
		{
			source: appRoutes.cityExploreAlias(city),
			destination: appRoutes.explore()
		},
		{
			source: appRoutes.cityReportsAlias(city),
			destination: appRoutes.reports()
		},
		{
			source: appRoutes.cityStatusAlias(city),
			destination: appRoutes.status()
		},
		{
			source: appRoutes.cityHelpAlias(city),
			destination: appRoutes.methodology()
		},
		{
			source: appRoutes.cityFlowAlias(city),
			destination: appRoutes.dashboardFlow()
		},
		{
			source: appRoutes.cityConclusionsAlias(city),
			destination: appRoutes.dashboardConclusions()
		},
		{
			source: appRoutes.cityAlertsAlias(city),
			destination: appRoutes.dashboardAlerts()
		},
		{
			source: appRoutes.cityStationsAlias(city),
			destination: appRoutes.dashboardStations()
		}
	])
];
new Map(EXACT_REDIRECT_ENTRIES.map((entry) => [entry.source, entry.destination]));
function toAbsoluteRouteUrl(pathname) {
	return `${getSiteUrl()}${pathname}`;
}
//#endregion
export { SEO_SITE_DESCRIPTION as a, SITE_TITLE as c, getRobotsSitemapUrl as d, getSiteUrl as f, toAbsoluteRouteUrl as i, getCityName as l, INDEXABLE_PUBLIC_ROUTE_REGISTRY as n, SEO_SITE_TITLE as o, isFallbackSiteUrl as p, appRoutes as r, SITE_NAME as s, DASHBOARD_ROUTE_CONFIG as t, getRobotsBaseUrl as u };

//# sourceMappingURL=routes-CFkMZBCM.js.map