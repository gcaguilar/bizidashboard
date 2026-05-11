import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { Link, useLocation } from "@tanstack/react-router";
import { jsx } from "react/jsx-runtime";
//#region src/lib/umami.ts
function basePayload(surface, routeKey) {
	return {
		surface,
		route_key: routeKey
	};
}
function readString(payload, key) {
	const value = payload?.[key];
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
}
function readBoolean(payload, key) {
	const value = payload?.[key];
	return typeof value === "boolean" ? value : void 0;
}
function surfaceFromPathname(pathname) {
	return pathname?.startsWith("/dashboard") ? "dashboard" : "public";
}
function normalizeRouteKey(pathname) {
	return pathname.replace(/^\/+/, "").replace(/\/+/g, "_").replace(/[^a-zA-Z0-9_]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase() || "unknown";
}
function resolveRouteKeyFromPathname(pathname) {
	if (!pathname || pathname === "/") return "home";
	if (pathname === "/dashboard") return "dashboard_home";
	if (pathname === "/dashboard/flujo") return "dashboard_flow";
	if (pathname === "/dashboard/conclusiones") return "dashboard_conclusions";
	if (pathname === "/dashboard/redistribucion") return "dashboard_redistribucion";
	if (pathname === "/dashboard/ayuda") return "dashboard_help";
	if (pathname === "/dashboard/alertas") return "dashboard_alerts";
	if (pathname === "/dashboard/estaciones") return "dashboard_stations";
	if (pathname.startsWith("/dashboard/estaciones/")) return "dashboard_station_detail";
	if (pathname === "/developers") return "developers";
	if (pathname === "/metodologia") return "methodology";
	if (pathname === "/informes") return "report_archive";
	if (pathname.startsWith("/informes/")) return "monthly_report";
	if (pathname.startsWith("/estaciones/")) return "station_detail";
	if (pathname.startsWith("/barrios/")) return "district_detail";
	if (pathname === "/estado") return "status";
	if (pathname === "/biciradar") return "biciradar";
	if (pathname === "/explorar") return "explore";
	if (pathname === "/comparar") return "compare";
	if (pathname === "/mapa-estaciones-bizi-zaragoza") return "utility_landing";
	if (pathname === "/estadisticas-bizi-zaragoza") return "insights_landing";
	return normalizeRouteKey(pathname);
}
function getQueryLengthBucket(length) {
	if (length <= 0) return "0";
	if (length <= 2) return "1_2";
	if (length <= 5) return "3_5";
	return "6_plus";
}
function getResultCountBucket(count) {
	if (count <= 0) return "0";
	if (count === 1) return "1";
	if (count <= 5) return "2_5";
	if (count <= 20) return "6_20";
	return "21_plus";
}
function sanitizeUmamiPayload(payload) {
	if (!payload) return;
	const sanitizedEntries = Object.entries(payload).filter(([key, value]) => {
		if (!ALLOWED_PAYLOAD_KEY_SET.has(key) || value === void 0 || value === null) return false;
		if (typeof value === "string") return value.trim().length > 0;
		return true;
	});
	return sanitizedEntries.length > 0 ? Object.fromEntries(sanitizedEntries) : void 0;
}
function buildPublicPageViewEvent({ routeKey, pageType, template }) {
	return {
		name: "public_page_view",
		payload: {
			...basePayload("public", routeKey),
			page_type: pageType,
			template
		}
	};
}
function buildDashboardPageViewEvent({ routeKey, pageType, template, mode }) {
	return {
		name: "dashboard_page_view",
		payload: {
			...basePayload("dashboard", routeKey),
			page_type: pageType,
			template,
			mode
		}
	};
}
function buildSearchSubmitEvent({ surface, routeKey, source, queryLength, resultCount }) {
	return {
		name: "search_submit",
		payload: {
			...basePayload(surface, routeKey),
			source,
			query_present: queryLength > 0,
			query_length_bucket: getQueryLengthBucket(queryLength),
			result_count_bucket: typeof resultCount === "number" ? getResultCountBucket(resultCount) : void 0
		}
	};
}
function buildNavigationClickEvent({ surface, routeKey, source, destination, module, sourceRole, destinationRole, transitionKind }) {
	return {
		name: "navigation_click",
		payload: {
			...basePayload(surface, routeKey),
			source,
			destination,
			module,
			source_role: sourceRole,
			destination_role: destinationRole,
			transition_kind: transitionKind
		}
	};
}
function buildCtaClickEvent({ surface, routeKey, source, ctaId, destination, module, entityType, monthPresent, isExternal, sourceRole, destinationRole, transitionKind }) {
	return {
		name: "cta_click",
		payload: {
			...basePayload(surface, routeKey),
			source,
			destination,
			module,
			cta_id: ctaId,
			entity_type: entityType,
			month_present: monthPresent,
			is_external: isExternal,
			source_role: sourceRole,
			destination_role: destinationRole,
			transition_kind: transitionKind
		}
	};
}
function buildDashboardModeChangeEvent({ routeKey, mode, source }) {
	return {
		name: "dashboard_mode_change",
		payload: {
			...basePayload("dashboard", routeKey),
			mode,
			source
		}
	};
}
function buildFilterChangeEvent({ surface, routeKey, module, source, destination, monthPresent, period, timeWindow, resultCount }) {
	return {
		name: "filter_change",
		payload: {
			...basePayload(surface, routeKey),
			module,
			source,
			destination,
			month_present: monthPresent,
			period,
			time_window: timeWindow,
			result_count_bucket: typeof resultCount === "number" ? getResultCountBucket(resultCount) : void 0
		}
	};
}
function buildEntitySelectEvent({ surface, routeKey, entityType, source, module }) {
	return {
		name: "entity_select",
		payload: {
			...basePayload(surface, routeKey),
			entity_type: entityType,
			source,
			module
		}
	};
}
function buildPanelOpenEvent({ surface, routeKey, module, source, destination }) {
	return {
		name: "panel_open",
		payload: {
			...basePayload(surface, routeKey),
			module,
			source,
			destination
		}
	};
}
function buildExportClickEvent({ surface, routeKey, source, ctaId, entityType, module }) {
	return {
		name: "export_click",
		payload: {
			...basePayload(surface, routeKey),
			source,
			cta_id: ctaId,
			entity_type: entityType,
			module
		}
	};
}
function buildLegacyInteractionEvent({ eventName, pathname, eventData }) {
	const surface = surfaceFromPathname(pathname);
	const routeKey = resolveRouteKeyFromPathname(pathname);
	const source = readString(eventData, "source") ?? routeKey;
	const destination = readString(eventData, "destination");
	const monthPresent = readBoolean(eventData, "month_present") ?? Boolean(readString(eventData, "month"));
	switch (eventName) {
		case "related_module_click": return buildNavigationClickEvent({
			surface,
			routeKey,
			source,
			destination: destination ?? "internal_module"
		});
		case "station_card_click": return buildEntitySelectEvent({
			surface,
			routeKey,
			entityType: "station",
			source,
			module: destination
		});
		case "api_cta_click": return buildCtaClickEvent({
			surface,
			routeKey,
			source,
			ctaId: "api_open",
			destination,
			entityType: "api"
		});
		case "report_open_click": return buildCtaClickEvent({
			surface,
			routeKey,
			source,
			ctaId: "report_open",
			destination,
			entityType: "report",
			monthPresent
		});
		case "dataset_download_click": return buildExportClickEvent({
			surface,
			routeKey,
			source,
			ctaId: "dataset_download",
			entityType: "api",
			module: destination
		});
		case "dataset_source_click": return buildCtaClickEvent({
			surface,
			routeKey,
			source,
			ctaId: "dataset_source_open",
			destination,
			isExternal: true
		});
		case "app_external_click": return buildCtaClickEvent({
			surface,
			routeKey,
			source,
			ctaId: "app_external",
			destination,
			isExternal: true
		});
		case "ad_landing_primary_click": return buildCtaClickEvent({
			surface,
			routeKey,
			source,
			ctaId: "landing_primary",
			destination
		});
		case "ad_landing_secondary_click": return buildCtaClickEvent({
			surface,
			routeKey,
			source,
			ctaId: "landing_secondary",
			destination
		});
		case "home_cta_primary_click": return buildCtaClickEvent({
			surface,
			routeKey,
			source,
			ctaId: "home_primary",
			destination
		});
	}
}
function trackUmamiEvent(event) {
	if (typeof window === "undefined") return;
	window.umami?.track(event.name, sanitizeUmamiPayload(event.payload));
}
var ALLOWED_PAYLOAD_KEY_SET;
var init_umami = __esmMin((() => {
	ALLOWED_PAYLOAD_KEY_SET = new Set([
		"surface",
		"route_key",
		"page_type",
		"template",
		"source",
		"destination",
		"module",
		"cta_id",
		"mode",
		"month_present",
		"period",
		"time_window",
		"entity_type",
		"query_present",
		"query_length_bucket",
		"result_count_bucket",
		"is_external",
		"source_role",
		"destination_role",
		"transition_kind"
	]);
}));
//#endregion
//#region src/app/_components/TrackedLink.tsx
init_umami();
function TrackedLink({ children, eventName, eventData, trackingEvent, navigationEvent, ctaEvent, entitySelectEvent, onClick, className, ...linkProps }) {
	const pathname = useLocation().pathname;
	function handleClick(event) {
		const surface = pathname?.startsWith("/dashboard") ? "dashboard" : "public";
		const routeKey = resolveRouteKeyFromPathname(pathname);
		if (trackingEvent) trackUmamiEvent(trackingEvent);
		else if (navigationEvent) trackUmamiEvent(buildNavigationClickEvent({
			surface,
			routeKey,
			...navigationEvent
		}));
		else if (ctaEvent) trackUmamiEvent(buildCtaClickEvent({
			surface,
			routeKey,
			...ctaEvent
		}));
		else if (entitySelectEvent) trackUmamiEvent(buildEntitySelectEvent({
			surface,
			routeKey,
			...entitySelectEvent
		}));
		else if (eventName) trackUmamiEvent(buildLegacyInteractionEvent({
			eventName,
			eventData,
			pathname
		}));
		onClick?.(event);
	}
	return /* @__PURE__ */ jsx(Link, {
		...linkProps,
		onClick: handleClick,
		className: `${className ?? ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim(),
		children
	});
}
//#endregion
export { buildEntitySelectEvent as a, buildLegacyInteractionEvent as c, buildPublicPageViewEvent as d, buildSearchSubmitEvent as f, trackUmamiEvent as h, buildDashboardPageViewEvent as i, buildNavigationClickEvent as l, resolveRouteKeyFromPathname as m, buildCtaClickEvent as n, buildExportClickEvent as o, init_umami as p, buildDashboardModeChangeEvent as r, buildFilterChangeEvent as s, TrackedLink as t, buildPanelOpenEvent as u };
