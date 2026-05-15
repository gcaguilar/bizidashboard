import { i as isDistrictCollection, n as buildStationDistrictMap, s as parseJsonWithGuard, t as DISTRICTS_GEOJSON_URL } from "./districts-DMcc_jOx.js";
import { t as fetchDistrictCollection } from "./districts.server-Qiyl6lhv.js";
import { l as fetchStations, o as fetchRankings } from "./api-rZCrrrVI.js";
import { cache } from "react";
//#region src/lib/seo-districts.ts
function slugifyDistrictName(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function buildDistrictSeoRows({ stations, districtCollection, turnoverRankings, availabilityRankings }) {
	if (!districtCollection) return [];
	const stationDistrictMap = buildStationDistrictMap(stations, districtCollection);
	const stationTurnoverMap = new Map(turnoverRankings.map((row) => [row.stationId, Number(row.turnoverScore)]));
	const stationAvailabilityMap = new Map(availabilityRankings.map((row) => [row.stationId, Number(row.emptyHours) + Number(row.fullHours)]));
	const groupedDistricts = /* @__PURE__ */ new Map();
	for (const station of stations) {
		const districtName = stationDistrictMap.get(station.id);
		if (!districtName) continue;
		const districtSlug = slugifyDistrictName(districtName);
		const turnoverScore = stationTurnoverMap.get(station.id) ?? 0;
		const availabilityRisk = stationAvailabilityMap.get(station.id) ?? 0;
		const current = groupedDistricts.get(districtSlug) ?? {
			slug: districtSlug,
			name: districtName,
			stationCount: 0,
			bikesAvailable: 0,
			anchorsFree: 0,
			capacity: 0,
			avgTurnover: 0,
			avgAvailabilityRisk: 0,
			topStations: []
		};
		current.stationCount += 1;
		current.bikesAvailable += station.bikesAvailable;
		current.anchorsFree += station.anchorsFree;
		current.capacity += station.capacity;
		current.avgTurnover += turnoverScore;
		current.avgAvailabilityRisk += availabilityRisk;
		current.topStations.push({
			stationId: station.id,
			stationName: station.name,
			bikesAvailable: station.bikesAvailable,
			anchorsFree: station.anchorsFree,
			capacity: station.capacity,
			turnoverScore,
			availabilityRisk
		});
		groupedDistricts.set(districtSlug, current);
	}
	return Array.from(groupedDistricts.values()).map((district) => ({
		...district,
		avgTurnover: district.stationCount > 0 ? Number((district.avgTurnover / district.stationCount).toFixed(1)) : 0,
		avgAvailabilityRisk: district.stationCount > 0 ? Number((district.avgAvailabilityRisk / district.stationCount).toFixed(1)) : 0,
		topStations: district.topStations.sort((left, right) => right.turnoverScore - left.turnoverScore || right.bikesAvailable - left.bikesAvailable).slice(0, 6)
	})).sort((left, right) => right.avgTurnover - left.avgTurnover || right.stationCount - left.stationCount || left.name.localeCompare(right.name, "es"));
}
var getDistrictSeoRows = cache(async () => {
	const stationsResponse = await fetchStations().catch(() => ({
		stations: [],
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	}));
	const stationCount = Math.max(stationsResponse.stations.length, 1);
	const [districtCollection, turnoverResponse, availabilityResponse] = await Promise.all([
		fetchDistrictCollection().catch(() => null),
		fetchRankings("turnover", stationCount).catch(() => ({
			type: "turnover",
			limit: stationCount,
			rankings: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		})),
		fetchRankings("availability", stationCount).catch(() => ({
			type: "availability",
			limit: stationCount,
			rankings: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		}))
	]);
	return buildDistrictSeoRows({
		stations: stationsResponse.stations,
		districtCollection,
		turnoverRankings: turnoverResponse.rankings,
		availabilityRankings: availabilityResponse.rankings
	});
});
var getDistrictSeoRowBySlug = cache(async (slug) => {
	return (await getDistrictSeoRows()).find((row) => row.slug === slug) ?? null;
});
cache(async () => {
	if (typeof window !== "undefined") return [];
	const [{ readFile }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
	const geoJsonPath = path.join(process.cwd(), "public", DISTRICTS_GEOJSON_URL.replace(/^\/+/, ""));
	try {
		const payload = parseJsonWithGuard(await readFile(geoJsonPath, "utf8"), isDistrictCollection);
		if (!payload) return [];
		return payload.features.map((feature) => feature.properties?.distrito).filter((name) => typeof name === "string" && name.length > 0).map((name) => slugifyDistrictName(name));
	} catch {
		return [];
	}
});
//#endregion
export { slugifyDistrictName as i, getDistrictSeoRowBySlug as n, getDistrictSeoRows as r, buildDistrictSeoRows as t };

//# sourceMappingURL=seo-districts-DZRBlyA9.js.map