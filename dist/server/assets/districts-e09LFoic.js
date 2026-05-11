//#region src/lib/json.ts
function tryParseJson(rawValue) {
	if (typeof rawValue !== "string") return {
		ok: false,
		error: /* @__PURE__ */ new Error("JSON input must be a string.")
	};
	try {
		return {
			ok: true,
			value: JSON.parse(rawValue)
		};
	} catch (error) {
		return {
			ok: false,
			error
		};
	}
}
function parseJsonValue(rawValue) {
	const result = tryParseJson(rawValue);
	return result.ok ? result.value : null;
}
function parseJsonWithGuard(rawValue, guard) {
	const result = tryParseJson(rawValue);
	if (!result.ok) return null;
	return guard(result.value) ? result.value : null;
}
function isRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
//#endregion
//#region src/lib/districts.ts
var DISTRICTS_GEOJSON_URL = "/data/distritos-zaragoza.geojson";
var districtCollectionCache = null;
var districtCollectionPromise = null;
function toLngLatPair(coordinate) {
	if (!coordinate || coordinate.length < 2) return null;
	const lng = coordinate[0];
	const lat = coordinate[1];
	if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
	return [lng, lat];
}
function isPointInRing(point, ring) {
	if (ring.length < 3) return false;
	const [lng, lat] = point;
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
		const current = toLngLatPair(ring[i]);
		const previous = toLngLatPair(ring[j]);
		if (!current || !previous) continue;
		const [xi, yi] = current;
		const [xj, yj] = previous;
		if (yi > lat !== yj > lat && lng < (xj - xi) * (lat - yi) / (yj - yi || Number.EPSILON) + xi) inside = !inside;
	}
	return inside;
}
function isPointInPolygon(point, polygon) {
	if (polygon.length === 0) return false;
	if (!isPointInRing(point, polygon[0] ?? [])) return false;
	for (let i = 1; i < polygon.length; i += 1) if (isPointInRing(point, polygon[i] ?? [])) return false;
	return true;
}
function isDistrictCollection(value) {
	if (!value || typeof value !== "object") return false;
	const maybeCollection = value;
	if (maybeCollection.type !== "FeatureCollection") return false;
	if (!Array.isArray(maybeCollection.features)) return false;
	return maybeCollection.features.every((feature) => {
		if (!feature || typeof feature !== "object") return false;
		const maybeFeature = feature;
		if (maybeFeature.type !== "Feature") return false;
		const geometryType = maybeFeature.geometry?.type;
		return geometryType === "Polygon" || geometryType === "MultiPolygon";
	});
}
async function loadDistrictCollection() {
	if (typeof window === "undefined") {
		const [{ readFile }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
		return parseJsonWithGuard(await readFile(path.join(process.cwd(), "public", DISTRICTS_GEOJSON_URL.replace(/^\/+/, "")), "utf8"), isDistrictCollection);
	}
	const response = await fetch(DISTRICTS_GEOJSON_URL);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const payload = await response.json();
	return isDistrictCollection(payload) ? payload : null;
}
async function fetchDistrictCollection(signal) {
	if (districtCollectionCache) return districtCollectionCache;
	if (!districtCollectionPromise) districtCollectionPromise = loadDistrictCollection().then((collection) => {
		districtCollectionCache = collection;
		return collection;
	}).catch((error) => {
		districtCollectionPromise = null;
		throw error;
	});
	if (!signal) return districtCollectionPromise;
	return new Promise((resolve, reject) => {
		const handleAbort = () => {
			signal.removeEventListener("abort", handleAbort);
			reject(new DOMException("Aborted", "AbortError"));
		};
		if (signal.aborted) {
			handleAbort();
			return;
		}
		signal.addEventListener("abort", handleAbort, { once: true });
		districtCollectionPromise?.then((value) => {
			signal.removeEventListener("abort", handleAbort);
			resolve(value);
		}).catch((error) => {
			signal.removeEventListener("abort", handleAbort);
			reject(error);
		});
	});
}
function isPointInDistrict(point, district) {
	if (district.geometry.type === "Polygon") return isPointInPolygon(point, district.geometry.coordinates);
	return district.geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
}
function findDistrictName(point, districts) {
	for (const district of districts.features) {
		if (!isPointInDistrict(point, district)) continue;
		return district.properties?.distrito ?? "Distrito sin nombre";
	}
	return null;
}
function buildStationDistrictMap(stations, districts) {
	const stationDistrictMap = /* @__PURE__ */ new Map();
	for (const station of stations) {
		if (!Number.isFinite(station.lon) || !Number.isFinite(station.lat)) continue;
		const districtName = findDistrictName([station.lon, station.lat], districts);
		if (!districtName) continue;
		stationDistrictMap.set(station.id, districtName);
	}
	return stationDistrictMap;
}
//#endregion
export { isDistrictCollection as a, parseJsonValue as c, findDistrictName as i, parseJsonWithGuard as l, buildStationDistrictMap as n, isPointInDistrict as o, fetchDistrictCollection as r, isRecord as s, DISTRICTS_GEOJSON_URL as t };
