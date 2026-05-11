import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import { r as CitySwitcher } from "./page-shell-CC8M_45q.js";
import { d as prisma, r as getRedisHealthSummary, t as withCache, u as getCity } from "./cache-DMRFuswD.js";
import { i as runWithExecutionContext, n as init_request_context, r as resolveRequestId } from "./request-context-C8lr5lzL.js";
import { t as logger } from "./logger-C1tbYDM5.js";
import { n as captureWarningWithContext, r as init_sentry_reporting, t as captureExceptionWithContext } from "./sentry-reporting-CvzcSweH.js";
import { f as resolveStatusDataState, o as resolveDataState, s as resolveDatasetDataState } from "./button-CZXsd1v7.js";
import { i as toAbsoluteRouteUrl, n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import * as React from "react";
import { cache } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import "server-only";
import { Prisma } from "@prisma/client";
import { createHash, timingSafeEqual } from "node:crypto";
//#region src/components/ui/breadcrumb.tsx
init_utils();
var Breadcrumb = React.forwardRef(function Breadcrumb({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("nav", {
		ref,
		"aria-label": "Breadcrumb",
		className: cn("", className),
		...props
	});
});
var BreadcrumbList = React.forwardRef(function BreadcrumbList({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("ol", {
		ref,
		className: cn("flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]", className),
		...props
	});
});
var BreadcrumbItem = React.forwardRef(function BreadcrumbItem({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("li", {
		ref,
		className: cn("flex items-center gap-2", className),
		...props
	});
});
React.forwardRef(function BreadcrumbLink({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("a", {
		ref,
		className: cn("rounded-sm transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]", className),
		...props
	});
});
var BreadcrumbPage = React.forwardRef(function BreadcrumbPage({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("span", {
		ref,
		"aria-current": "page",
		className: cn("font-semibold text-[var(--foreground)]", className),
		...props
	});
});
var BreadcrumbSeparator = React.forwardRef(function BreadcrumbSeparator({ className, children = "/", ...props }, ref) {
	return /* @__PURE__ */ jsx("span", {
		ref,
		"aria-hidden": "true",
		className: cn("text-[var(--muted)]", className),
		...props,
		children
	});
});
//#endregion
//#region src/app/_components/SiteBreadcrumbs.tsx
function SiteBreadcrumbs({ items, className }) {
	if (items.length === 0) return null;
	return /* @__PURE__ */ jsx("div", {
		className,
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ jsx(Breadcrumb, { children: /* @__PURE__ */ jsx(BreadcrumbList, { children: items.map((item, index) => {
				const isLast = index === items.length - 1;
				return /* @__PURE__ */ jsxs(BreadcrumbItem, { children: [isLast ? /* @__PURE__ */ jsx(BreadcrumbPage, { children: item.label }) : /* @__PURE__ */ jsx(Link, {
					to: item.href,
					className: "rounded-sm transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
					children: item.label
				}), !isLast ? /* @__PURE__ */ jsx(BreadcrumbSeparator, {}) : null] }, `${item.href}-${item.label}`);
			}) }) }), /* @__PURE__ */ jsx(CitySwitcher, {
				compact: true,
				className: "min-w-[280px] flex-1 sm:flex-none"
			})]
		})
	});
}
//#endregion
//#region src/services/shared-data/coverage-service.ts
var CACHE_KEY$1 = "shared-data:coverage";
var CACHE_TTL_SECONDS$1 = 300;
var GBFS_DISCOVERY_URL = "https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json";
function toNumber(value) {
	if (typeof value === "bigint") return Number(value);
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	return 0;
}
function toIsoString$1(value) {
	if (!value) return null;
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}
function getSharedDataSource() {
	return {
		provider: "Bizi Zaragoza GBFS",
		gbfsDiscoveryUrl: GBFS_DISCOVERY_URL
	};
}
var getCoverageSummary = cache(async () => {
	return withCache(CACHE_KEY$1, CACHE_TTL_SECONDS$1, async () => {
		const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
		const [coverageRows, stationRows, hourlyDaysRows, dailyDaysRows] = await Promise.all([
			prisma.$queryRaw`
        SELECT
          MIN("recordedAt") AS "firstRecordedAt",
          MAX("recordedAt") AS "lastRecordedAt",
          COUNT(*) AS "totalSamples"
        FROM "StationStatus";
      `,
			prisma.$queryRaw`
        SELECT COUNT(*) AS "totalStations"
        FROM "Station"
        WHERE "isActive" = true;
      `.catch((error) => {
				console.warn("[SharedData] Unable to read active stations summary:", error);
				return [];
			}),
			prisma.$queryRaw`
        SELECT COUNT(DISTINCT TO_CHAR("bucketStart", 'YYYY-MM-DD')) AS "totalDays"
        FROM "HourlyStationStat"
        WHERE "occupancyAvg" IS NOT NULL;
      `.catch((error) => {
				console.warn("[SharedData] Unable to read day coverage from HourlyStationStat:", error);
				return [];
			}),
			prisma.$queryRaw`
        SELECT COUNT(DISTINCT TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "totalDays"
        FROM "DailyStationStat"
        WHERE "bucketDate" IS NOT NULL;
      `.catch((error) => {
				console.warn("[SharedData] Unable to read day coverage from DailyStationStat:", error);
				return [];
			})
		]);
		const coverage = coverageRows[0] ?? {
			firstRecordedAt: null,
			lastRecordedAt: null,
			totalSamples: 0
		};
		return {
			firstRecordedAt: toIsoString$1(coverage.firstRecordedAt),
			lastRecordedAt: toIsoString$1(coverage.lastRecordedAt),
			totalSamples: toNumber(coverage.totalSamples),
			totalStations: toNumber(stationRows[0]?.totalStations),
			totalDays: Math.max(toNumber(hourlyDaysRows[0]?.totalDays), toNumber(dailyDaysRows[0]?.totalDays)),
			generatedAt
		};
	});
});
var getHistoryMetadata = cache(async () => {
	const coverage = await getCoverageSummary();
	return {
		source: getSharedDataSource(),
		coverage,
		generatedAt: coverage.generatedAt
	};
});
//#endregion
//#region src/lib/collection-runs.ts
async function getRecentCollectionRuns(limit = 5) {
	try {
		return (await prisma.collectionRun.findMany({
			orderBy: [{ startedAt: "desc" }],
			take: limit
		})).map((row) => ({
			collectionId: row.collectionId,
			trigger: row.trigger,
			status: row.status,
			requestId: row.requestId,
			snapshotRecordedAt: row.snapshotRecordedAt?.toISOString() ?? null,
			insertedCount: row.insertedCount,
			duplicateCount: row.duplicateCount,
			warningCount: row.warningCount,
			errorCount: row.errorCount,
			startedAt: row.startedAt.toISOString(),
			finishedAt: row.finishedAt?.toISOString() ?? null
		}));
	} catch (error) {
		logger.warn("collection_run.list_failed", { error });
		return [];
	}
}
//#endregion
//#region src/lib/metrics.ts
/**
* Persistent Metrics Store
* 
* Tracks pipeline metrics using database aggregation queries.
* Metrics persist across restarts and provide observability into:
* - Last successful poll timestamp
* - Total rows collected
* - Validation errors
* - Data freshness
* 
* @module metrics
*/
init_sentry_reporting();
var metricsCache = {
	consecutiveFailures: 0,
	lastValidationErrors: 0,
	appStartTime: /* @__PURE__ */ new Date(),
	lastCollectionResult: null
};
var METRICS_CACHE_TTL_MS = 3e4;
var POLL_INTERVAL_MINUTES = 5;
var FRESH_DATA_MAX_AGE_MS = 600 * 1e3;
var HEALTH_DOWN_AFTER_MS = 900 * 1e3;
var EXPECTED_POLLS_PER_DAY = 1440 / POLL_INTERVAL_MINUTES;
var DEGRADED_POLLS_THRESHOLD = 240;
var metricsSnapshotCache = null;
var reportedMetricsErrors = /* @__PURE__ */ new Set();
function reportMetricsErrorOnce(operation, error) {
	if (reportedMetricsErrors.has(operation)) return;
	reportedMetricsErrors.add(operation);
	captureExceptionWithContext(error, {
		area: "metrics",
		operation
	});
}
/**
* Get the total count of rows in StationStatus table
*/
async function getTotalRowsCollected() {
	try {
		return await prisma.stationStatus.count();
	} catch (error) {
		reportMetricsErrorOnce("getTotalRowsCollected", error);
		logger.error("metrics.total_rows_failed", { error });
		return 0;
	}
}
/**
* Get the count of polls in the last 24 hours
* A "poll" is a distinct recordedAt timestamp
*/
async function getPollsLast24Hours() {
	try {
		const twentyFourHoursAgo = /* @__PURE__ */ new Date(Date.now() - 1440 * 60 * 1e3);
		return (await prisma.stationStatus.groupBy({
			by: ["recordedAt"],
			where: { recordedAt: { gte: twentyFourHoursAgo } }
		})).length;
	} catch (error) {
		reportMetricsErrorOnce("getPollsLast24Hours", error);
		logger.error("metrics.polls_last_24h_failed", { error });
		return 0;
	}
}
/**
* Get the timestamp of the last successful poll
* Based on the most recent recordedAt in StationStatus
*/
async function getLastSuccessfulPoll() {
	try {
		return (await prisma.stationStatus.findFirst({
			orderBy: { recordedAt: "desc" },
			select: { recordedAt: true }
		}))?.recordedAt || null;
	} catch (error) {
		reportMetricsErrorOnce("getLastSuccessfulPoll", error);
		logger.error("metrics.last_successful_poll_failed", { error });
		return null;
	}
}
/**
* Get the most recent station count from the latest poll
*/
async function getLastStationCount() {
	try {
		const latestTimestamp = await prisma.stationStatus.findFirst({
			orderBy: { recordedAt: "desc" },
			select: { recordedAt: true }
		});
		if (!latestTimestamp) return 0;
		return await prisma.stationStatus.count({ where: { recordedAt: latestTimestamp.recordedAt } });
	} catch (error) {
		reportMetricsErrorOnce("getLastStationCount", error);
		logger.error("metrics.last_station_count_failed", { error });
		return 0;
	}
}
/**
* Calculate average stations per poll over the last 7 days
*/
async function getAverageStationsPerPoll() {
	try {
		const sevenDaysAgo = /* @__PURE__ */ new Date(Date.now() - 10080 * 60 * 1e3);
		const groupedPolls = await prisma.stationStatus.groupBy({
			by: ["recordedAt"],
			where: { recordedAt: { gte: sevenDaysAgo } },
			_count: { _all: true }
		});
		if (groupedPolls.length === 0) return 0;
		const totalStations = groupedPolls.reduce((sum, poll) => sum + poll._count._all, 0);
		return Math.round(totalStations / groupedPolls.length);
	} catch (error) {
		reportMetricsErrorOnce("getAverageStationsPerPoll", error);
		logger.error("metrics.average_stations_failed", { error });
		return 0;
	}
}
/**
* Check if the latest data is fresh (within 10 minutes)
*/
async function isDataFresh() {
	const lastPoll = await getLastSuccessfulPoll();
	if (!lastPoll) return {
		isFresh: false,
		lastUpdated: null
	};
	const maxAgeMs = FRESH_DATA_MAX_AGE_MS;
	return {
		isFresh: Date.now() - lastPoll.getTime() <= maxAgeMs,
		lastUpdated: lastPoll
	};
}
/**
* Calculate health status based on pipeline metrics
*/
function calculateHealthStatus(lastPoll, consecutiveFailures, validationErrors, polls24h) {
	const maxHealthyPollLag = new Date(Date.now() - HEALTH_DOWN_AFTER_MS);
	if (consecutiveFailures >= 5) return {
		status: "down",
		reason: `Pipeline has ${consecutiveFailures} consecutive failures`
	};
	if (!lastPoll || lastPoll < maxHealthyPollLag) return {
		status: "down",
		reason: lastPoll ? `No successful poll in the last 15 minutes (last: ${lastPoll.toISOString()})` : "No successful polls yet"
	};
	if (polls24h < DEGRADED_POLLS_THRESHOLD) return {
		status: "degraded",
		reason: `Only ${polls24h} polls in last 24h (expected ~${EXPECTED_POLLS_PER_DAY})`
	};
	if (validationErrors > 10) return {
		status: "degraded",
		reason: `${validationErrors} validation errors accumulated`
	};
	return {
		status: "healthy",
		reason: null
	};
}
/**
* Get the current version from package.json
*/
function getVersion() {
	try {
		return process.env.npm_package_version || "0.1.0";
	} catch {
		return "0.1.0";
	}
}
/**
* Get current pipeline metrics
*/
async function getMetrics() {
	const now = Date.now();
	if (metricsSnapshotCache && metricsSnapshotCache.expiresAt > now) return metricsSnapshotCache.value;
	const [lastSuccessfulPoll, totalRowsCollected, pollsLast24Hours, lastStationCount, averageStationsPerPoll, freshness] = await Promise.all([
		getLastSuccessfulPoll(),
		getTotalRowsCollected(),
		getPollsLast24Hours(),
		getLastStationCount(),
		getAverageStationsPerPoll(),
		isDataFresh()
	]);
	const { status: healthStatus, reason: healthReason } = calculateHealthStatus(lastSuccessfulPoll, metricsCache.consecutiveFailures, metricsCache.lastValidationErrors, pollsLast24Hours);
	const metrics = {
		lastSuccessfulPoll,
		totalRowsCollected,
		pollsLast24Hours,
		validationErrors: metricsCache.lastValidationErrors,
		consecutiveFailures: metricsCache.consecutiveFailures,
		lastDataFreshness: freshness.isFresh,
		lastStationCount,
		averageStationsPerPoll,
		healthStatus,
		healthReason
	};
	metricsSnapshotCache = {
		value: metrics,
		expiresAt: now + METRICS_CACHE_TTL_MS
	};
	return metrics;
}
/**
* Get system metrics
*/
function getSystemMetrics() {
	return {
		uptime: metricsCache.appStartTime,
		version: getVersion(),
		environment: "production"
	};
}
async function getStatus() {
	const [pipeline, system] = await Promise.all([getMetrics(), Promise.resolve(getSystemMetrics())]);
	return {
		pipeline,
		quality: {
			freshness: {
				isFresh: pipeline.lastDataFreshness,
				lastUpdated: pipeline.lastSuccessfulPoll,
				maxAgeSeconds: Math.floor(FRESH_DATA_MAX_AGE_MS / 1e3)
			},
			volume: {
				recentStationCount: pipeline.lastStationCount,
				averageStationsPerPoll: pipeline.averageStationsPerPoll,
				expectedRange: {
					min: 200,
					max: 500
				}
			},
			lastCheck: pipeline.lastSuccessfulPoll
		},
		system,
		timestamp: /* @__PURE__ */ new Date()
	};
}
//#endregion
//#region src/lib/security/config.ts
init_request_context();
function getPublicApiKey() {
	const trimmed = process.env.PUBLIC_API_KEY?.trim();
	return trimmed ? trimmed : null;
}
//#endregion
//#region src/lib/security/http.ts
function readHeader(headers, names) {
	for (const name of names) {
		const value = headers.get(name)?.trim();
		if (value) return value;
	}
	return null;
}
function getClientIp(headers) {
	const forwardedFor = headers.get("x-forwarded-for");
	if (forwardedFor) {
		const firstIp = forwardedFor.split(",")[0]?.trim();
		if (firstIp) return firstIp;
	}
	return readHeader(headers, [
		"x-real-ip",
		"cf-connecting-ip",
		"fly-client-ip"
	]) ?? "unknown";
}
function getSecuritySalt() {
	const salt = process.env.SIGNATURE_SECRET || process.env.JWT_SECRET;
	if (!salt) throw new Error("SECURITY_ERROR: SIGNATURE_SECRET or JWT_SECRET must be configured");
	return salt;
}
function hashSensitiveValue(value) {
	if (!value) return null;
	const salt = getSecuritySalt();
	return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}
function isApiKeyValid(providedApiKey, expectedApiKey) {
	if (!providedApiKey) return false;
	const providedBuffer = Buffer.from(providedApiKey);
	const expectedBuffer = Buffer.from(expectedApiKey);
	if (providedBuffer.length !== expectedBuffer.length) return false;
	return timingSafeEqual(providedBuffer, expectedBuffer);
}
function readPublicApiKey(headers) {
	return readHeader(headers, ["x-public-api-key"]);
}
async function withApiRequest(request, meta, handler) {
	const requestId = resolveRequestId(request.headers);
	const clientIp = getClientIp(request.headers);
	const userAgent = request.headers.get("user-agent");
	const startedAt = Date.now();
	return runWithExecutionContext({
		requestId,
		route: meta.route,
		routeGroup: meta.routeGroup,
		method: request.method,
		city: getCity(),
		ipHash: hashSensitiveValue(clientIp),
		userAgentHash: hashSensitiveValue(userAgent)
	}, async () => {
		logger.info("request.started", {
			route: meta.route,
			method: request.method
		});
		try {
			const response = await handler({
				requestId,
				clientIp,
				userAgent,
				startedAt
			});
			response.headers.set("X-Request-Id", requestId);
			logger.info("request.completed", {
				route: meta.route,
				method: request.method,
				status: response.status,
				durationMs: Date.now() - startedAt
			});
			return response;
		} catch (error) {
			logger.error("request.failed", {
				route: meta.route,
				method: request.method,
				durationMs: Date.now() - startedAt,
				error
			});
			throw error;
		}
	});
}
//#endregion
//#region src/lib/security/audit.ts
async function recordSecurityEvent(input) {
	try {
		await prisma.securityEvent.create({ data: {
			eventType: input.eventType,
			route: input.route,
			requestId: input.requestId,
			installId: input.installId ?? null,
			collectionId: input.collectionId ?? null,
			ipHash: hashSensitiveValue(input.ip),
			userAgentHash: hashSensitiveValue(input.userAgent),
			outcome: input.outcome,
			reasonCode: input.reasonCode ?? null,
			metadata: input.metadata ?? Prisma.JsonNull
		} });
	} catch (error) {
		logger.warn("security_event.persist_failed", {
			route: input.route,
			eventType: input.eventType,
			error
		});
	}
}
async function getSecurityEventSummary(hours = 24) {
	const since = /* @__PURE__ */ new Date(Date.now() - hours * 60 * 60 * 1e3);
	try {
		const [failedAuthLast24Hours, rateLimitedLast24Hours, refreshTokenReuseLast24Hours] = await Promise.all([
			prisma.securityEvent.count({ where: {
				createdAt: { gte: since },
				outcome: "denied",
				eventType: { in: [
					"auth_failed",
					"signature_invalid",
					"token_reuse_detected"
				] }
			} }),
			prisma.securityEvent.count({ where: {
				createdAt: { gte: since },
				eventType: "rate_limit_exceeded"
			} }),
			prisma.securityEvent.count({ where: {
				createdAt: { gte: since },
				eventType: "token_reuse_detected"
			} })
		]);
		return {
			failedAuthLast24Hours,
			rateLimitedLast24Hours,
			refreshTokenReuseLast24Hours
		};
	} catch (error) {
		logger.warn("security_event.summary_failed", { error });
		return {
			failedAuthLast24Hours: 0,
			rateLimitedLast24Hours: 0,
			refreshTokenReuseLast24Hours: 0
		};
	}
}
//#endregion
//#region src/services/shared-data/pipeline-status-service.ts
var CACHE_KEY = "shared-data:pipeline-status";
var CACHE_TTL_SECONDS = 60;
function toIsoString(value) {
	if (!value) return null;
	return value instanceof Date ? value.toISOString() : value;
}
function serializeStatus(status) {
	return {
		pipeline: {
			...status.pipeline,
			lastSuccessfulPoll: toIsoString(status.pipeline.lastSuccessfulPoll)
		},
		quality: {
			freshness: {
				...status.quality.freshness,
				lastUpdated: toIsoString(status.quality.freshness.lastUpdated)
			},
			volume: { ...status.quality.volume },
			lastCheck: toIsoString(status.quality.lastCheck)
		},
		system: {
			...status.system,
			uptime: toIsoString(status.system.uptime) ?? (/* @__PURE__ */ new Date(0)).toISOString()
		},
		timestamp: toIsoString(status.timestamp) ?? (/* @__PURE__ */ new Date(0)).toISOString()
	};
}
async function getPipelineStatusSummary() {
	return withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
		const [status, cache, recentCollections, security] = await Promise.all([
			getStatus(),
			getRedisHealthSummary(),
			getRecentCollectionRuns(),
			getSecurityEventSummary()
		]);
		return {
			...serializeStatus(status),
			operations: {
				cache,
				recentCollections,
				security
			}
		};
	});
}
//#endregion
//#region src/services/shared-data/index.ts
init_sentry_reporting();
function buildFallbackCoverage(nowIso) {
	return {
		firstRecordedAt: null,
		lastRecordedAt: null,
		totalSamples: 0,
		totalStations: 0,
		totalDays: 0,
		generatedAt: nowIso
	};
}
var getSharedDatasetSnapshot = cache(async () => {
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const [coverageResult, pipelineResult] = await Promise.allSettled([getCoverageSummary(), getPipelineStatusSummary()]);
	const coverage = coverageResult.status === "fulfilled" ? coverageResult.value : buildFallbackCoverage(nowIso);
	const pipeline = pipelineResult.status === "fulfilled" ? pipelineResult.value : {
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
			healthReason: "Partial shared snapshot fallback due to upstream failure."
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
			lastCheck: nowIso
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
	if (coverageResult.status === "rejected") captureWarningWithContext("Shared dataset snapshot degraded: coverage fallback applied.", {
		area: "shared-data.snapshot",
		operation: "getSharedDatasetSnapshot",
		dedupeKey: "shared-data.snapshot.coverage-fallback",
		extra: { reason: String(coverageResult.reason) }
	});
	if (pipelineResult.status === "rejected") captureWarningWithContext("Shared dataset snapshot degraded: pipeline fallback applied.", {
		area: "shared-data.snapshot",
		operation: "getSharedDatasetSnapshot",
		dedupeKey: "shared-data.snapshot.pipeline-fallback",
		extra: { reason: String(pipelineResult.reason) }
	});
	return {
		source: getSharedDataSource(),
		coverage,
		lastUpdated: {
			lastSampleAt: coverage.lastRecordedAt,
			generatedAt: coverage.generatedAt
		},
		stats: {
			totalSamples: coverage.totalSamples,
			totalStations: coverage.totalStations,
			totalDays: coverage.totalDays,
			generatedAt: coverage.generatedAt
		},
		pipeline
	};
});
//#endregion
//#region src/lib/breadcrumbs.ts
init_routes();
function createRootBreadcrumbs(...items) {
	return [{
		label: "Inicio",
		href: appRoutes.home()
	}, ...items];
}
function buildBreadcrumbStructuredData(items) {
	return {
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.label,
			item: toAbsoluteRouteUrl(item.href)
		}))
	};
}
//#endregion
//#region src/lib/shared-data-fallbacks.ts
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
		source: getSharedDataSource(),
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
export { SiteBreadcrumbs as _, buildBreadcrumbStructuredData as a, getPipelineStatusSummary as c, readPublicApiKey as d, withApiRequest as f, getSharedDataSource as g, getHistoryMetadata as h, buildFallbackStatus as i, recordSecurityEvent as l, getCoverageSummary as m, buildFallbackDatasetSnapshot as n, createRootBreadcrumbs as o, getPublicApiKey as p, buildFallbackStations as r, getSharedDatasetSnapshot as s, buildFallbackAvailableMonths as t, isApiKeyValid as u };
