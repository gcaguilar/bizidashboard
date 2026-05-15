import { i as resolveDatasetDataState, l as resolveStatusDataState, r as resolveDataState } from "./data-state-UX6jPIR_.js";
//#region src/lib/shared-data-fallbacks.ts
var FALLBACK_SHARED_DATA_SOURCE = {
	provider: "Bizi Zaragoza GBFS",
	gbfsDiscoveryUrl: "https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json"
};
function buildFallbackStatus(nowIso) {
	const fallback = {
		pipeline: {
			lastSuccessfulPoll: null,
			totalRowsCollected: 0,
			pollsLast24Hours: 0,
			validationErrors: 0,
			consecutiveFailures: 0,
			lastDataFreshness: false,
			lastStationCount: 0,
			averageStationsPerPoll: 0,
			healthStatus: "down",
			healthReason: "No se pudieron consultar las tablas de datos."
		},
		quality: {
			freshness: {
				isFresh: false,
				lastUpdated: null,
				maxAgeSeconds: 600
			},
			volume: {
				recentStationCount: 0,
				averageStationsPerPoll: 0,
				expectedRange: {
					min: 200,
					max: 500
				}
			},
			lastCheck: null
		},
		system: {
			uptime: nowIso,
			version: process.env.npm_package_version ?? "0.1.0",
			environment: "production"
		},
		operations: {
			cache: {
				configured: false,
				available: false,
				backend: "disabled"
			},
			recentCollections: [],
			security: {
				failedAuthLast24Hours: 0,
				rateLimitedLast24Hours: 0,
				refreshTokenReuseLast24Hours: 0
			}
		},
		timestamp: nowIso
	};
	return {
		...fallback,
		dataState: resolveStatusDataState(fallback)
	};
}
function buildFallbackDatasetSnapshot(nowIso) {
	const fallback = {
		source: FALLBACK_SHARED_DATA_SOURCE,
		coverage: {
			firstRecordedAt: null,
			lastRecordedAt: null,
			totalSamples: 0,
			totalStations: 0,
			totalDays: 0,
			generatedAt: nowIso
		},
		lastUpdated: {
			lastSampleAt: null,
			generatedAt: nowIso
		},
		stats: {
			totalSamples: 0,
			totalStations: 0,
			totalDays: 0,
			generatedAt: nowIso
		},
		pipeline: buildFallbackStatus(nowIso)
	};
	return {
		...fallback,
		dataState: resolveDatasetDataState({
			coverage: fallback.coverage,
			status: fallback.pipeline
		})
	};
}
function buildFallbackStations(nowIso) {
	return {
		stations: [],
		generatedAt: nowIso,
		dataState: resolveDataState({
			hasCoverage: false,
			hasData: false
		})
	};
}
function buildFallbackAvailableMonths(nowIso) {
	return {
		months: [],
		generatedAt: nowIso
	};
}
//#endregion
export { buildFallbackStatus as i, buildFallbackDatasetSnapshot as n, buildFallbackStations as r, buildFallbackAvailableMonths as t };

//# sourceMappingURL=shared-data-fallbacks-BAmlHD2N.js.map