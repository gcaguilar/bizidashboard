import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { i as isValidCity, n as DEFAULT_CITY, r as init_constants, t as CITY_CONFIGS } from "./constants-CkURxSfD.js";
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
var SITE_NAME, SITE_TITLE, SEO_SITE_NAME, FALLBACK_SITE_URL;
var init_site = __esmMin((() => {
	init_constants();
	SITE_NAME = "BiziDashboard";
	SITE_TITLE = `BiziDashboard ${getCityName()}`;
	`${getCityName()}`;
	SEO_SITE_NAME = "DatosBizi";
	`${SEO_SITE_NAME}${getCityName()}`;
	`${getCityName()}`;
	FALLBACK_SITE_URL = "http://localhost:3000";
}));
//#endregion
export { getSiteUrl as a, getCurrentCityKey as i, SITE_TITLE as n, init_site as o, getCityName as r, SITE_NAME as t };
