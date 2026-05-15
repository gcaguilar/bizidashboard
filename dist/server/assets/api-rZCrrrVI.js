import { n as buildStationDistrictMap } from "./districts-DMcc_jOx.js";
import { n as captureWarningWithContext } from "./sentry-reporting-6fzVQr1k.js";
import { a as resolveHistoryDataState, c as resolveStationsDataState, i as resolveDatasetDataState, l as resolveStatusDataState, s as resolveRankingsDataState } from "./data-state-UX6jPIR_.js";
import { r as withCache } from "./cache-CQ9JHJ0b.js";
import { c as getStationPatternsBulk, i as getHeatmap, l as getStationRankings, n as getAvailableDataMonths, s as getStationPatterns, t as getActiveAlerts, u as getStationsWithLatestStatus } from "./read-BIJZag-j.js";
import { t as fetchDistrictCollection } from "./districts.server-Qiyl6lhv.js";
import { n as getPipelineStatusSummary, t as getSharedDatasetSnapshot, v as getHistoryMetadata } from "./shared-data-DRRoN2Of.js";
//#region src/lib/ranking-enrichment.ts
function quantile(sortedAsc, q) {
	if (sortedAsc.length === 0) return 0;
	const pos = Math.min(1, Math.max(0, q)) * (sortedAsc.length - 1);
	const base = Math.floor(pos);
	const next = Math.min(sortedAsc.length - 1, base + 1);
	const t = pos - base;
	return sortedAsc[base] * (1 - t) + sortedAsc[next] * t;
}
function turnoverThresholds(turnovers) {
	const sorted = [...turnovers].sort((a, b) => a - b);
	return {
		low: quantile(sorted, .33),
		high: quantile(sorted, .66)
	};
}
var DEFAULT_PEAK_HOURS_TOP_N = 3;
/**
* Por estación: las N franjas con mayor `occupancyAvg` (0–1, bicis/capacidad) en el patrón agregado.
*/
function buildPeakFullHoursByStation(patterns, topN = DEFAULT_PEAK_HOURS_TOP_N) {
	const byStation = /* @__PURE__ */ new Map();
	for (const p of patterns) {
		const list = byStation.get(p.stationId) ?? [];
		list.push(p);
		byStation.set(p.stationId, list);
	}
	const out = /* @__PURE__ */ new Map();
	for (const [stationId, list] of byStation) {
		const top = [...list].sort((a, b) => Number(b.occupancyAvg) - Number(a.occupancyAvg) || Number(b.sampleCount) - Number(a.sampleCount)).slice(0, topN).map((p) => ({
			dayType: p.dayType,
			hour: p.hour,
			occupancyAvg: Number(Number(p.occupancyAvg).toFixed(4)),
			sampleCount: p.sampleCount
		}));
		out.set(stationId, top);
	}
	return out;
}
function attachPeakFullHours(rows, peakByStation) {
	return rows.map((r) => ({
		...r,
		peakFullHours: peakByStation.get(r.stationId) ?? []
	}));
}
/**
* Añade nombre de estación, barrio (distrito Zaragoza vía GeoJSON) y una lectura heurística:
* muchas horas vacías + bajo turnover en el lote → posible baja demanda;
* muchas horas vacías + alto turnover → huecos con rotación (demanda presente).
*/
function enrichRankingRows(rows, stationNameById, districtNameById) {
	const { low, high } = turnoverThresholds(rows.map((r) => Number(r.turnoverScore)));
	return rows.map((row) => {
		const totalHours = Number(row.totalHours) || 0;
		const emptyHours = Number(row.emptyHours) || 0;
		const fullHours = Number(row.fullHours) || 0;
		const turnoverScore = Number(row.turnoverScore) || 0;
		const problemHours = emptyHours + fullHours;
		const emptyHourShare = totalHours > 0 ? Number((emptyHours / totalHours).toFixed(4)) : 0;
		let demandVsStressedHint;
		if (totalHours <= 0) demandVsStressedHint = "datos_incompletos";
		else if (!(emptyHours / totalHours >= .12 || emptyHours >= 24)) demandVsStressedHint = "poco_estres_disponibilidad";
		else if (turnoverScore <= low) demandVsStressedHint = "mucho_vacio_baja_demanda_estimada";
		else if (turnoverScore >= high) demandVsStressedHint = "huecos_con_rotacion_alta";
		else demandVsStressedHint = "huecos_con_rotacion_media";
		return {
			...row,
			stationName: stationNameById.get(row.stationId) ?? `Estación ${row.stationId}`,
			districtName: districtNameById.get(row.stationId) ?? null,
			problemHours,
			emptyHourShare,
			demandVsStressedHint,
			peakFullHours: []
		};
	});
}
/** Una estación representativa por barrio: máximo estrés (availability) o máximo giro (turnover). */
function buildDistrictSpotlight(enriched, type) {
	const byDistrict = /* @__PURE__ */ new Map();
	for (const row of enriched) {
		const district = row.districtName ?? "Sin barrio asignado";
		const current = byDistrict.get(district);
		const score = type === "availability" ? row.problemHours : Number(row.turnoverScore);
		const currentScore = current ? type === "availability" ? current.problemHours : Number(current.turnoverScore) : -Infinity;
		if (!current || score > currentScore) byDistrict.set(district, row);
	}
	return Array.from(byDistrict.values()).map((r) => ({
		districtName: r.districtName ?? "Sin barrio asignado",
		stationId: r.stationId,
		stationName: r.stationName,
		turnoverScore: r.turnoverScore,
		emptyHours: r.emptyHours,
		fullHours: r.fullHours,
		problemHours: r.problemHours,
		emptyHourShare: r.emptyHourShare,
		demandVsStressedHint: r.demandVsStressedHint,
		peakFullHours: r.peakFullHours
	})).sort((a, b) => a.districtName.localeCompare(b.districtName, "es"));
}
//#endregion
//#region src/lib/api.ts
var LIVE_CACHE_TTL_SECONDS = 60;
var ANALYTICS_CACHE_TTL_SECONDS = 300;
function assertArray(value, label) {
	if (!Array.isArray(value)) throw new Error(`Respuesta invalida: ${label} no es una lista.`);
}
function normalizeRecordedAt(recordedAt) {
	return recordedAt instanceof Date ? recordedAt.toISOString() : recordedAt;
}
function normalizeStations(stations) {
	return stations.map((station) => ({
		...station,
		recordedAt: normalizeRecordedAt(station.recordedAt)
	}));
}
async function fetchLiveStationsFallback() {
	try {
		const [{ fetchDiscovery, fetchStationInformation, fetchStationStatus }] = await Promise.all([import("./gbfs-client-D6YixscF.js")]);
		const discovery = await fetchDiscovery();
		const [stationStatus, stationInformation] = await Promise.all([fetchStationStatus(discovery), fetchStationInformation(discovery)]);
		const infoMap = new Map(stationInformation.map((station) => [station.station_id, station]));
		const recordedAt = (/* @__PURE__ */ new Date(stationStatus.last_updated * 1e3)).toISOString();
		return stationStatus.data.stations.map((status) => {
			const info = infoMap.get(status.station_id);
			return {
				id: status.station_id,
				name: info?.name ?? `Estacion ${status.station_id}`,
				lat: Number(info?.lat ?? 0),
				lon: Number(info?.lon ?? 0),
				capacity: Number(info?.capacity ?? status.num_bikes_available + status.num_docks_available),
				bikesAvailable: Number(status.num_bikes_available ?? 0),
				anchorsFree: Number(status.num_docks_available ?? 0),
				recordedAt
			};
		}).filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lon));
	} catch (error) {
		captureWarningWithContext("Live GBFS stations fallback failed.", {
			area: "api.fetchStations",
			operation: "fetchLiveStationsFallback",
			dedupeKey: "api.fetchStations.live-fallback-failed",
			extra: { reason: String(error) }
		});
		return [];
	}
}
async function fetchStations() {
	const payload = await withCache("stations:current", LIVE_CACHE_TTL_SECONDS, async () => {
		const [dbStations, dataset] = await Promise.all([getStationsWithLatestStatus().catch(() => []), getSharedDatasetSnapshot().catch(() => null)]);
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const stations = dbStations.length > 0 ? dbStations : await fetchLiveStationsFallback();
		return {
			stations,
			generatedAt: nowIso,
			dataState: resolveStationsDataState({
				count: stations.length,
				coverage: dataset?.coverage,
				status: dataset?.pipeline
			})
		};
	});
	assertArray(payload.stations, "stations");
	return {
		...payload,
		stations: normalizeStations(payload.stations)
	};
}
async function fetchRankingsLite(type, limit = 20) {
	return withCache(`rankings-lite:type=${type}:limit=${limit}`, ANALYTICS_CACHE_TTL_SECONDS, async () => {
		const [rankings, dataset] = await Promise.all([getStationRankings(type, limit), getSharedDatasetSnapshot().catch(() => null)]);
		return {
			type,
			limit,
			rankings,
			generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			dataState: resolveRankingsDataState({
				count: rankings.length,
				coverage: dataset?.coverage,
				status: dataset?.pipeline,
				requestedLimit: limit
			})
		};
	});
}
async function fetchRankings(type, limit = 20) {
	if (!type) throw new Error("Debes indicar el tipo de ranking.");
	if (!Number.isInteger(limit) || limit <= 0) throw new Error("El limite del ranking debe ser un entero positivo.");
	const payload = await withCache(`rankings:type=${type}:limit=${limit}`, ANALYTICS_CACHE_TTL_SECONDS, async () => {
		const [rankings, stations, districtCollection, dataset] = await Promise.all([
			getStationRankings(type, limit),
			getStationsWithLatestStatus(),
			fetchDistrictCollection().catch(() => null),
			getSharedDatasetSnapshot().catch(() => null)
		]);
		let enrichedRankings = enrichRankingRows(rankings, new Map(stations.map((s) => [s.id, s.name])), districtCollection !== null ? buildStationDistrictMap(stations.map((s) => ({
			id: s.id,
			lon: s.lon,
			lat: s.lat
		})), districtCollection) : /* @__PURE__ */ new Map());
		const peakMap = buildPeakFullHoursByStation(await getStationPatternsBulk(enrichedRankings.map((r) => r.stationId)).catch((error) => {
			captureWarningWithContext("Rankings enrichment degraded: station patterns unavailable.", {
				area: "api.fetchRankings",
				operation: "fetchRankings",
				dedupeKey: "api.fetchRankings.station-patterns-fallback",
				extra: {
					type,
					limit,
					reason: String(error)
				}
			});
			return [];
		}));
		enrichedRankings = attachPeakFullHours(enrichedRankings, peakMap);
		const districtSpotlight = buildDistrictSpotlight(enrichedRankings, type);
		return {
			type,
			limit,
			rankings: enrichedRankings,
			districtSpotlight,
			generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			dataState: resolveRankingsDataState({
				count: enrichedRankings.length,
				coverage: dataset?.coverage,
				status: dataset?.pipeline,
				requestedLimit: limit
			})
		};
	});
	assertArray(payload.rankings, "rankings");
	const districtSpotlight = Array.isArray(payload.districtSpotlight) ? payload.districtSpotlight : [];
	if (!Array.isArray(payload.districtSpotlight)) console.warn("[Rankings] Payload legacy sin districtSpotlight como lista; se normaliza a [].");
	return {
		...payload,
		districtSpotlight
	};
}
async function fetchAlerts(limit = 50) {
	if (!Number.isInteger(limit) || limit <= 0) throw new Error("El limite de alertas debe ser un entero positivo.");
	const payload = await withCache(`alerts:limit=${limit}`, ANALYTICS_CACHE_TTL_SECONDS, async () => {
		return {
			limit,
			alerts: await getActiveAlerts(limit),
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	});
	assertArray(payload.alerts, "alerts");
	return payload;
}
async function fetchStatus() {
	return await withCache("status:current", LIVE_CACHE_TTL_SECONDS, async () => {
		const data = await getPipelineStatusSummary();
		if (!data || typeof data !== "object") throw new Error("Respuesta invalida al consultar el estado del sistema.");
		return {
			...data,
			dataState: resolveStatusDataState(data)
		};
	});
}
async function fetchPatterns(stationId, monthKey) {
	if (!stationId) throw new Error("stationId es obligatorio para patrones.");
	const data = await withCache(`patterns:stationId=${stationId}:month=${monthKey ?? "all"}`, ANALYTICS_CACHE_TTL_SECONDS, () => getStationPatterns(stationId, monthKey ?? void 0));
	assertArray(data, "patterns");
	return data;
}
async function fetchHeatmap(stationId, monthKey) {
	if (!stationId) throw new Error("stationId es obligatorio para el heatmap.");
	const data = await withCache(`heatmap:stationId=${stationId}:month=${monthKey ?? "all"}`, ANALYTICS_CACHE_TTL_SECONDS, () => getHeatmap(stationId, monthKey ?? void 0));
	assertArray(data, "heatmap");
	return data;
}
async function fetchAvailableDataMonths() {
	const payload = await withCache("data-months", ANALYTICS_CACHE_TTL_SECONDS, async () => ({
		months: await getAvailableDataMonths(),
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	}));
	assertArray(payload.months, "months");
	return payload;
}
async function fetchHistoryMetadata() {
	return await withCache("history:metadata", ANALYTICS_CACHE_TTL_SECONDS, async () => {
		const [historyMetadata, status] = await Promise.all([getHistoryMetadata(), getPipelineStatusSummary().catch(() => null)]);
		return {
			...historyMetadata,
			dataState: resolveHistoryDataState({
				count: historyMetadata.coverage.totalDays,
				coverage: historyMetadata.coverage,
				status,
				expectedDays: 30
			})
		};
	});
}
async function fetchSharedDatasetSnapshot() {
	return await withCache("shared-dataset:snapshot", LIVE_CACHE_TTL_SECONDS, async () => {
		const snapshot = await getSharedDatasetSnapshot();
		return {
			...snapshot,
			dataState: resolveDatasetDataState({
				coverage: snapshot.coverage,
				status: snapshot.pipeline
			})
		};
	});
}
//#endregion
export { fetchPatterns as a, fetchSharedDatasetSnapshot as c, attachPeakFullHours as d, buildDistrictSpotlight as f, fetchHistoryMetadata as i, fetchStations as l, enrichRankingRows as m, fetchAvailableDataMonths as n, fetchRankings as o, buildPeakFullHoursByStation as p, fetchHeatmap as r, fetchRankingsLite as s, fetchAlerts as t, fetchStatus as u };

//# sourceMappingURL=api-rZCrrrVI.js.map