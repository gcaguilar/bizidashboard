import { r as appRoutes } from "./routes-CFkMZBCM.js";
//#region src/lib/seo-policy.ts
var DUPLICATE_CANONICAL_PATHS = {
	[appRoutes.beta()]: appRoutes.biciradar(),
	[appRoutes.seoPage("informes-mensuales-bizi-zaragoza")]: appRoutes.reports()
};
function normalizeSeoPath(path) {
	const normalized = path.trim().replace(/\/+$/u, "");
	return normalized.length > 0 ? normalized : "/";
}
function isDashboardPath(path) {
	return /^\/dashboard(?:\/|$)/u.test(normalizeSeoPath(path));
}
function isToolPath(path) {
	const normalized = normalizeSeoPath(path);
	return normalized === appRoutes.compare() || normalized === appRoutes.explore();
}
function resolveCanonicalSeoPath(path) {
	const normalized = normalizeSeoPath(path);
	return DUPLICATE_CANONICAL_PATHS[normalized] ?? normalized;
}
function inferSeoPageType(path) {
	const normalized = normalizeSeoPath(path);
	if (resolveCanonicalSeoPath(normalized) !== normalized) return "duplicate";
	if (isDashboardPath(normalized)) return "dashboard";
	if (isToolPath(normalized)) return "tool";
	if (/^\/estaciones\/[^/]+$/u.test(normalized)) return "station";
	if (/^\/barrios\/[^/]+$/u.test(normalized)) return "district";
	if (/^\/informes\/[^/]+$/u.test(normalized)) return "report";
	return "marketing";
}
function normalizeThresholds(thresholds) {
	return (thresholds ?? []).filter((threshold) => Number.isFinite(threshold.current) && Number.isFinite(threshold.minimum));
}
function evaluatePageIndexability({ path, canonicalPath, pageType, dataState, hasMeaningfulContent = true, hasData = true, requiresStrongCoverage = false, isDuplicate = false, thresholds }) {
	const normalizedPath = normalizeSeoPath(path);
	const resolvedCanonicalPath = resolveCanonicalSeoPath(canonicalPath ?? normalizedPath);
	const resolvedPageType = pageType ?? inferSeoPageType(normalizedPath);
	const thresholdList = normalizeThresholds(thresholds);
	const duplicateRoute = isDuplicate || resolvedPageType === "duplicate" || resolvedCanonicalPath !== normalizedPath;
	if (resolvedPageType === "dashboard") return {
		canonicalPath: resolvedCanonicalPath,
		pageType: resolvedPageType,
		indexable: false,
		includeInSitemap: false,
		follow: true,
		reason: "operational-route"
	};
	if (resolvedPageType === "tool") return {
		canonicalPath: resolvedCanonicalPath,
		pageType: resolvedPageType,
		indexable: false,
		includeInSitemap: false,
		follow: true,
		reason: "interactive-tool-route"
	};
	if (duplicateRoute) return {
		canonicalPath: resolvedCanonicalPath,
		pageType: "duplicate",
		indexable: false,
		includeInSitemap: false,
		follow: true,
		reason: "duplicate-or-legacy-route"
	};
	if (!hasMeaningfulContent) return {
		canonicalPath: resolvedCanonicalPath,
		pageType: resolvedPageType,
		indexable: false,
		includeInSitemap: false,
		follow: true,
		reason: "missing-visible-context"
	};
	if (dataState === "loading" || dataState === "error") return {
		canonicalPath: resolvedCanonicalPath,
		pageType: resolvedPageType,
		indexable: false,
		includeInSitemap: false,
		follow: true,
		reason: "metadata-source-unavailable"
	};
	if (dataState === "no_coverage") return {
		canonicalPath: resolvedCanonicalPath,
		pageType: resolvedPageType,
		indexable: false,
		includeInSitemap: false,
		follow: true,
		reason: "no-coverage"
	};
	if (dataState === "empty" || !hasData) return {
		canonicalPath: resolvedCanonicalPath,
		pageType: resolvedPageType,
		indexable: false,
		includeInSitemap: false,
		follow: true,
		reason: "empty-or-thin-content"
	};
	if (requiresStrongCoverage && dataState === "partial") return {
		canonicalPath: resolvedCanonicalPath,
		pageType: resolvedPageType,
		indexable: false,
		includeInSitemap: false,
		follow: true,
		reason: "partial-coverage"
	};
	const failedThreshold = thresholdList.find((threshold) => threshold.current < threshold.minimum);
	if (failedThreshold) return {
		canonicalPath: resolvedCanonicalPath,
		pageType: resolvedPageType,
		indexable: false,
		includeInSitemap: false,
		follow: true,
		reason: `below-threshold:${failedThreshold.label}`
	};
	return {
		canonicalPath: resolvedCanonicalPath,
		pageType: resolvedPageType,
		indexable: true,
		includeInSitemap: true,
		follow: true,
		reason: "indexable"
	};
}
//#endregion
export { evaluatePageIndexability as t };

//# sourceMappingURL=seo-policy-DRv3Xzev.js.map