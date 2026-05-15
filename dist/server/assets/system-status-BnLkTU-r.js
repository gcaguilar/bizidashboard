import { r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as TIMEZONE } from "./timezone-DIvdn6H4.js";
//#region src/lib/openapi-document.ts
var openApiDocument = {
	openapi: "3.1.0",
	info: {
		title: "Bizi Dashboard API",
		version: "0.5.0",
		description: "API endpoints for station status, rankings, alerts, patterns, heatmaps, mobility, and transit impact."
	},
	components: { securitySchemes: {
		OpsApiKey: {
			type: "apiKey",
			in: "header",
			name: "x-ops-api-key",
			description: "Required for GET/POST /api/collect. x-collect-api-key is accepted temporarily as a compatibility alias."
		},
		PublicApiKey: {
			type: "apiKey",
			in: "header",
			name: "x-public-api-key",
			description: "Required for elevated access to expensive public endpoints and CSV exports."
		},
		OAuthClientCredentials: {
			type: "oauth2",
			description: "OAuth 2.0 client credentials for agents that need bearer tokens instead of x-public-api-key.",
			flows: { clientCredentials: {
				tokenUrl: "/oauth/token",
				scopes: { "public_api.read": "Read protected public API routes and exports." }
			} }
		}
	} },
	paths: {
		"/api/health/live": { get: {
			operationId: "get_health_live",
			summary: "Liveness probe (no dependencies)",
			responses: { 200: { description: "Process is alive" } }
		} },
		"/api/health/ready": { get: {
			operationId: "get_health_ready",
			summary: "Readiness probe (checks database connectivity)",
			responses: {
				200: { description: "Service is ready to serve traffic" },
				503: { description: "Service dependencies are not ready" }
			}
		} },
		"/api/status": { get: {
			operationId: "get_status",
			summary: "Get pipeline observability metrics",
			responses: { 200: { description: "Pipeline and system status payload" } }
		} },
		"/api/stations": { get: {
			operationId: "get_stations",
			summary: "List stations with latest availability snapshot",
			responses: { 200: { description: "Stations payload with generatedAt" } }
		} },
		"/api/rankings": { get: {
			operationId: "get_rankings",
			summary: "Get station rankings by turnover or availability",
			parameters: [{
				name: "type",
				in: "query",
				required: true,
				description: "Ranking type to return",
				schema: {
					type: "string",
					enum: ["turnover", "availability"]
				}
			}, {
				name: "limit",
				in: "query",
				required: false,
				description: "Maximum number of rows",
				schema: {
					type: "integer",
					minimum: 1,
					maximum: 100,
					default: 20
				}
			}],
			responses: { 200: { description: "Rankings payload" } }
		} },
		"/api/alerts": { get: {
			operationId: "get_alerts",
			summary: "List active alerts",
			parameters: [{
				name: "limit",
				in: "query",
				required: false,
				description: "Maximum number of alerts",
				schema: {
					type: "integer",
					minimum: 1,
					maximum: 200,
					default: 50
				}
			}],
			responses: { 200: { description: "Alerts payload" } }
		} },
		"/api/alerts/history": { get: {
			operationId: "get_alerts_history",
			summary: "List alert history with filters, pagination, and CSV export",
			parameters: [
				{
					name: "state",
					in: "query",
					required: false,
					description: "Filter by alert state",
					schema: {
						type: "string",
						enum: [
							"all",
							"active",
							"resolved"
						],
						default: "all"
					}
				},
				{
					name: "stationId",
					in: "query",
					required: false,
					description: "Filter by station identifier",
					schema: { type: "string" }
				},
				{
					name: "alertType",
					in: "query",
					required: false,
					description: "Filter by alert type",
					schema: {
						type: "string",
						enum: [
							"all",
							"LOW_BIKES",
							"LOW_ANCHORS"
						],
						default: "all"
					}
				},
				{
					name: "severity",
					in: "query",
					required: false,
					description: "Filter by severity (1=media, 2=critica)",
					schema: {
						type: "integer",
						minimum: 1,
						maximum: 5
					}
				},
				{
					name: "from",
					in: "query",
					required: false,
					description: "Start datetime (ISO 8601)",
					schema: {
						type: "string",
						format: "date-time"
					}
				},
				{
					name: "to",
					in: "query",
					required: false,
					description: "End datetime (ISO 8601)",
					schema: {
						type: "string",
						format: "date-time"
					}
				},
				{
					name: "limit",
					in: "query",
					required: false,
					description: "Rows per page",
					schema: {
						type: "integer",
						minimum: 1,
						maximum: 2e3,
						default: 200
					}
				},
				{
					name: "offset",
					in: "query",
					required: false,
					description: "Pagination offset",
					schema: {
						type: "integer",
						minimum: 0,
						maximum: 2e4,
						default: 0
					}
				},
				{
					name: "format",
					in: "query",
					required: false,
					description: "Response format",
					schema: {
						type: "string",
						enum: ["json", "csv"],
						default: "json"
					}
				}
			],
			responses: { 200: { description: "Alert history payload or CSV file" } }
		} },
		"/api/patterns": { get: {
			operationId: "get_patterns",
			summary: "Get weekday/weekend hourly patterns for one station",
			parameters: [{
				name: "stationId",
				in: "query",
				required: true,
				description: "Station identifier",
				schema: { type: "string" }
			}],
			responses: { 200: { description: "Pattern rows" } }
		} },
		"/api/heatmap": { get: {
			operationId: "get_heatmap",
			summary: "Get occupancy heatmap cells for one station",
			parameters: [{
				name: "stationId",
				in: "query",
				required: true,
				description: "Station identifier",
				schema: { type: "string" }
			}],
			responses: { 200: { description: "Heatmap rows" } }
		} },
		"/api/mobility": { get: {
			operationId: "get_mobility",
			summary: "Get mobility signals, demand curve, and transit impact",
			parameters: [{
				name: "mobilityDays",
				in: "query",
				required: false,
				description: "Lookback days for hourly mobility signals",
				schema: {
					type: "integer",
					minimum: 1,
					maximum: 365,
					default: 14
				}
			}, {
				name: "demandDays",
				in: "query",
				required: false,
				description: "Lookback days for daily demand curve",
				schema: {
					type: "integer",
					minimum: 1,
					maximum: 365,
					default: 30
				}
			}],
			responses: { 200: { description: "Mobility payload" } }
		} },
		"/api/history": { get: {
			operationId: "get_history",
			summary: "Get full historical demand data since first record",
			responses: { 200: { description: "Historical coverage metadata and daily history" } }
		} },
		"/api/collect": {
			get: {
				operationId: "get_collect",
				summary: "Get collection job state",
				security: [{ OpsApiKey: [] }],
				responses: { 200: { description: "Collector state payload" } }
			},
			post: {
				operationId: "post_collect",
				summary: "Trigger one data collection run",
				security: [{ OpsApiKey: [] }],
				responses: {
					200: { description: "Collection execution payload" },
					401: { description: "Missing or invalid API key" },
					429: { description: "Rate limit exceeded" },
					503: { description: "Collect trigger endpoint misconfigured" }
				}
			}
		},
		"/api/rebalancing-report": { get: {
			operationId: "get_rebalancing_report",
			summary: "Station rebalancing diagnostic report with classification, predictions, and transfer recommendations",
			description: "Returns a full rebalancing report: station diagnostics classified A-F (overstock, deficit, peak_saturation, peak_emptying, balanced, data_review), risk predictions at 1h/3h, network elasticity context, origin-destination transfer recommendations, KPIs, and baseline comparison. Filterable by barrio/district.",
			parameters: [
				{
					name: "district",
					in: "query",
					required: false,
					description: "Filter results by barrio/district name (e.g. \"Centro\", \"Delicias\")",
					schema: { type: "string" }
				},
				{
					name: "days",
					in: "query",
					required: false,
					description: "Analysis window in days (default 15, max 90)",
					schema: {
						type: "integer",
						minimum: 1,
						maximum: 90,
						default: 15
					}
				},
				{
					name: "format",
					in: "query",
					required: false,
					description: "Response format: json (default) or csv",
					schema: {
						type: "string",
						enum: ["json", "csv"]
					}
				}
			],
			responses: {
				200: { description: "Rebalancing report with station diagnostics (classification A-F), transfer recommendations, KPIs, and baseline comparison" },
				400: { description: "Invalid query parameters" },
				500: { description: "Internal server error" }
			}
		} },
		"/api/docs": { get: {
			operationId: "get_api_docs",
			summary: "Get OpenAPI document (compatibility endpoint)",
			responses: { 200: { description: "OpenAPI document" } }
		} },
		"/api/openapi.json": { get: {
			operationId: "get_openapi_json",
			summary: "Get OpenAPI document",
			responses: { 200: { description: "OpenAPI document" } }
		} }
	}
};
//#endregion
//#region src/lib/system-status.ts
function toDate(value) {
	if (!value) return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function formatStatusDateTime(value) {
	const parsed = toDate(value);
	return parsed ? parsed.toLocaleString("es-ES", { timeZone: TIMEZONE }) : "Sin datos";
}
function formatStatusNumber(value) {
	return new Intl.NumberFormat("es-ES").format(value);
}
function getHealthLabel(status) {
	switch (status) {
		case "healthy": return "Saludable";
		case "degraded": return "Degradado";
		case "down": return "Caido";
		default: return "Desconocido";
	}
}
function getHealthToneClasses(status) {
	switch (status) {
		case "healthy": return "border-emerald-500/40 bg-emerald-500/12 text-emerald-200";
		case "degraded": return "border-amber-500/40 bg-amber-500/12 text-amber-200";
		case "down": return "border-rose-500/40 bg-rose-500/12 text-rose-200";
		default: return "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]";
	}
}
function getObservedCadenceLabel(status) {
	if (status.pipeline.pollsLast24Hours <= 0) return "Sin datos recientes";
	return `~${Math.max(1, Math.round(1440 / status.pipeline.pollsLast24Hours))} min por sondeo`;
}
function getPipelineLagMinutes(status) {
	const lastPoll = toDate(status.pipeline.lastSuccessfulPoll);
	const lastCheck = toDate(status.quality.lastCheck);
	if (!lastPoll) return null;
	return Math.max(0, Math.round(((lastCheck?.getTime() ?? Date.now()) - lastPoll.getTime()) / 6e4));
}
function getPipelineLagLabel(status) {
	const lagMinutes = getPipelineLagMinutes(status);
	if (lagMinutes === null) return "Sin referencia";
	if (lagMinutes < 1) return "<1 min";
	return `${lagMinutes} min`;
}
function getCoverageLabel(dataset) {
	const firstRecordedAt = formatStatusDateTime(dataset.coverage.firstRecordedAt);
	const lastRecordedAt = formatStatusDateTime(dataset.coverage.lastRecordedAt);
	return `${dataset.coverage.totalDays} dias · ${firstRecordedAt} -> ${lastRecordedAt}`;
}
function getDatasetVersionLabel(dataset) {
	const parsed = toDate(dataset.lastUpdated.lastSampleAt ?? dataset.coverage.lastRecordedAt ?? dataset.coverage.generatedAt);
	if (!parsed) return "Sin version derivada";
	return `cov-${parsed.toISOString().slice(0, 10).replace(/-/g, "")}-${dataset.coverage.totalSamples}`;
}
function getApiVersionLabel() {
	return openApiDocument.info.version;
}
function buildSystemIncidents(status, dataset) {
	const incidents = [];
	if (status.pipeline.healthReason) incidents.push({
		id: "pipeline-health",
		severity: status.pipeline.healthStatus,
		title: `Pipeline ${getHealthLabel(status.pipeline.healthStatus).toLowerCase()}`,
		description: status.pipeline.healthReason
	});
	if (!status.quality.freshness.isFresh) incidents.push({
		id: "freshness",
		severity: status.pipeline.healthStatus === "down" ? "down" : "degraded",
		title: "Datos sin frescura operativa",
		description: `La ultima muestra confirmada es ${formatStatusDateTime(status.quality.freshness.lastUpdated)}.`
	});
	if (status.pipeline.validationErrors > 0) incidents.push({
		id: "validation-errors",
		severity: status.pipeline.validationErrors > 10 ? "down" : "degraded",
		title: "Errores de validacion acumulados",
		description: `${formatStatusNumber(status.pipeline.validationErrors)} incidencias de validacion registradas.`
	});
	if (dataset.coverage.totalDays === 0 || dataset.stats.totalSamples === 0) incidents.push({
		id: "coverage",
		severity: "down",
		title: "Sin cobertura historica suficiente",
		description: "No hay historial agregado suficiente para alimentar rankings, predicciones o series temporales."
	});
	if (incidents.length === 0) incidents.push({
		id: "no-incidents",
		severity: "healthy",
		title: "Sin incidentes activos",
		description: "La ingesta, la cobertura y la API responden dentro de los umbrales esperados."
	});
	return incidents;
}
function buildSystemCapabilities(status, dataset, stations) {
	const hasHistory = dataset.coverage.totalDays > 0 && dataset.stats.totalSamples > 0;
	const hasLiveStations = stations.stations.length > 0 || status.quality.volume.recentStationCount > 0;
	const predictionsState = hasHistory && status.quality.freshness.lastUpdated ? status.pipeline.healthStatus === "down" ? "degraded" : "healthy" : "down";
	const rankingsState = hasHistory && dataset.stats.totalStations > 0 ? status.pipeline.healthStatus === "down" ? "degraded" : "healthy" : "down";
	const historyState = hasHistory ? "healthy" : "down";
	const apiState = status.pipeline.healthStatus;
	const scrapersState = status.pipeline.pollsLast24Hours > 0 ? status.pipeline.healthStatus : "down";
	const ingestionState = status.quality.freshness.isFresh ? status.pipeline.healthStatus === "down" ? "degraded" : "healthy" : status.pipeline.healthStatus === "healthy" ? "degraded" : "down";
	return [
		{
			id: "predictions",
			label: "Estado predicciones",
			href: appRoutes.dashboardView("data"),
			state: predictionsState,
			description: hasHistory ? "La capa predictiva puede combinar historico y snapshot actual." : "Falta historico suficiente para sostener predicciones fiables."
		},
		{
			id: "rankings",
			label: "Estado rankings",
			href: appRoutes.dashboardView("operations"),
			state: rankingsState,
			description: hasHistory ? "Hay cobertura agregada para priorizacion por uso y disponibilidad." : "Los rankings necesitan historico agregado para ser consistentes."
		},
		{
			id: "history",
			label: "Estado historico",
			href: appRoutes.dashboardView("data"),
			state: historyState,
			description: hasHistory ? `${formatStatusNumber(dataset.stats.totalSamples)} muestras agregadas disponibles.` : "No hay muestras agregadas suficientes para auditoria o series temporales."
		},
		{
			id: "api",
			label: "Estado API",
			href: appRoutes.developers(),
			state: apiState,
			description: hasLiveStations ? `La API publica sirve snapshots con version ${getApiVersionLabel()}.` : "La API no tiene snapshot operativo reciente que publicar."
		},
		{
			id: "scrapers",
			label: "Estado scrapers",
			href: appRoutes.api.status(),
			state: scrapersState,
			description: status.pipeline.pollsLast24Hours > 0 ? `${formatStatusNumber(status.pipeline.pollsLast24Hours)} recogidas registradas en 24 horas.` : "No hay recogidas recientes registradas."
		},
		{
			id: "ingestion",
			label: "Estado ingestion",
			href: appRoutes.status(),
			state: ingestionState,
			description: status.quality.freshness.isFresh ? `Ultima muestra util ${formatStatusDateTime(status.quality.freshness.lastUpdated)}.` : "La ingesta va retrasada respecto al umbral de frescura esperado."
		}
	];
}
//#endregion
export { getApiVersionLabel as a, getHealthLabel as c, getPipelineLagLabel as d, openApiDocument as f, formatStatusNumber as i, getHealthToneClasses as l, buildSystemIncidents as n, getCoverageLabel as o, formatStatusDateTime as r, getDatasetVersionLabel as s, buildSystemCapabilities as t, getObservedCadenceLabel as u };

//# sourceMappingURL=system-status-BnLkTU-r.js.map