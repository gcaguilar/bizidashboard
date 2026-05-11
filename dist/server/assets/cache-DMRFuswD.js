import { r as init_constants } from "./constants-CkURxSfD.js";
import { t as logger } from "./logger-C1tbYDM5.js";
import { n as captureWarningWithContext, r as init_sentry_reporting, t as captureExceptionWithContext } from "./sentry-reporting-CvzcSweH.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "redis";
//#region src/lib/postgres-schema.ts
init_constants();
var PG_IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/;
function normalizeDatabaseSchemaName(rawValue) {
	const schema = (rawValue || "zaragoza").trim().toLowerCase();
	if (!PG_IDENTIFIER_PATTERN.test(schema)) throw new Error(`Invalid CITY value "${rawValue}". Expected a lowercase PostgreSQL identifier matching ${PG_IDENTIFIER_PATTERN.source}.`);
	return schema;
}
function quotePgIdentifier(identifier) {
	return `"${normalizeDatabaseSchemaName(identifier)}"`;
}
function stripPrismaSchemaParam(databaseUrl) {
	const url = new URL(databaseUrl);
	url.searchParams.delete("schema");
	return url.toString();
}
function buildPgSearchPathOption(schema) {
	return `-c search_path=${normalizeDatabaseSchemaName(schema)},public`;
}
//#endregion
//#region src/lib/prisma-client.ts
async function createPostgresPrismaClient({ databaseUrl = process.env.DATABASE_URL, city = process.env.CITY, ensureSchema = true } = {}) {
	if (!databaseUrl) throw new Error("DATABASE_URL is required to create a PostgreSQL Prisma client.");
	const schema = normalizeDatabaseSchemaName(city);
	const client = new PrismaClient({ adapter: new PrismaPg({
		connectionString: stripPrismaSchemaParam(databaseUrl),
		options: buildPgSearchPathOption(schema)
	}, { schema }) });
	await client.$connect();
	if (ensureSchema) {
		const quotedSchema = quotePgIdentifier(schema);
		await client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${quotedSchema}`);
	}
	return client;
}
//#endregion
//#region src/lib/db.ts
var globalForPrisma = global;
function isBuildPhase() {
	return process.env.NEXT_PHASE === "phase-production-build";
}
function createBuildPrismaMock() {
	return new Proxy(() => void 0, {
		get() {
			return createBuildPrismaMock();
		},
		apply() {
			return Promise.reject(/* @__PURE__ */ new Error("Database not available during build"));
		}
	});
}
async function createPrismaClient() {
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) return createBuildPrismaMock();
	return createPostgresPrismaClient({
		databaseUrl: dbUrl,
		city: getCity()
	});
}
var _prismaPromise = null;
function getPrismaClient() {
	if (isBuildPhase()) return Promise.resolve(createBuildPrismaMock());
	if (!globalForPrisma.prisma) {
		if (!_prismaPromise) _prismaPromise = createPrismaClient().then((client) => {
			globalForPrisma.prisma = client;
			return client;
		}).catch((error) => {
			_prismaPromise = null;
			throw error;
		});
		return _prismaPromise;
	}
	return Promise.resolve(globalForPrisma.prisma);
}
var prisma = isBuildPhase() || !process.env.DATABASE_URL ? createBuildPrismaMock() : await getPrismaClient();
function getCity() {
	return normalizeDatabaseSchemaName(process.env.CITY);
}
//#endregion
//#region src/lib/months.ts
var MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
function isValidMonthKey(value) {
	return typeof value === "string" && MONTH_KEY_PATTERN.test(value);
}
function normalizeMonthSearchParam(value) {
	const candidate = Array.isArray(value) ? value[0] : value;
	return isValidMonthKey(candidate) ? candidate : null;
}
function getMonthBounds(monthKey) {
	const [year, month] = monthKey.split("-").map(Number);
	const start = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1));
	const end = new Date(Date.UTC(year ?? 1970, month ?? 1, 1));
	return {
		start: start.toISOString(),
		endExclusive: end.toISOString()
	};
}
function formatMonthLabel(monthKey) {
	if (!isValidMonthKey(monthKey)) return monthKey;
	const { start } = getMonthBounds(monthKey);
	return new Date(start).toLocaleDateString("es-ES", {
		month: "long",
		year: "numeric",
		timeZone: "UTC"
	});
}
function toMonthOptions(months) {
	return months.filter(isValidMonthKey).map((key) => ({
		key,
		label: formatMonthLabel(key)
	}));
}
function resolveActiveMonth(availableMonths, value) {
	if (!value) return null;
	return availableMonths.includes(value) ? value : null;
}
//#endregion
//#region src/lib/cache/redis.ts
init_sentry_reporting();
var cachedClient = null;
var cachedClientPromise = null;
var warnedMissingUrl = false;
var connectionFailures = 0;
var MAX_CONNECTION_RETRIES = 3;
var warnedConnectionFailure = false;
async function getRedisHealthSummary() {
	const client = await getRedisClient();
	return {
		configured: Boolean(process.env.REDIS_URL?.trim()),
		available: client !== null,
		backend: client !== null ? "redis" : "disabled"
	};
}
async function getRedisClient() {
	if (connectionFailures >= MAX_CONNECTION_RETRIES) return null;
	const redisUrl = process.env.REDIS_URL;
	if (!redisUrl) {
		if (!warnedMissingUrl) {
			captureWarningWithContext("REDIS_URL is not set; Redis cache is disabled in production.", {
				area: "cache.redis",
				operation: "getRedisClient",
				tags: { handled: true },
				dedupeKey: "cache.redis.missing-url.production"
			});
			logger.warn("redis.missing_url");
			warnedMissingUrl = true;
		}
		return null;
	}
	if (cachedClient) return cachedClient;
	if (cachedClientPromise) return cachedClientPromise;
	const client = createClient({
		url: redisUrl,
		socket: {
			connectTimeout: 1e3,
			reconnectStrategy: () => false
		}
	});
	client.on("error", (error) => {
		if (!warnedConnectionFailure) {
			captureExceptionWithContext(error, {
				area: "cache.redis",
				operation: "client.error"
			});
			logger.warn("redis.client_error", { error });
			warnedConnectionFailure = true;
		}
	});
	cachedClientPromise = client.connect().then(() => {
		cachedClient = client;
		return client;
	}).catch((error) => {
		if (!warnedConnectionFailure) {
			captureExceptionWithContext(error, {
				area: "cache.redis",
				operation: "connect"
			});
			logger.warn("redis.connect_failed", { error });
			warnedConnectionFailure = true;
		}
		connectionFailures++;
		cachedClientPromise = null;
		return null;
	});
	return cachedClientPromise;
}
//#endregion
//#region src/lib/cache/config.ts
/**
* Centralized cache configuration
* 
* All cache TTL values in seconds should be defined here
* to ensure consistency across the application.
*/
var CacheTTL = {
	/** Default cache time: 5 minutes */
	DEFAULT: 300,
	/** Short-lived cache for live data: 1 minute */
	LIVE: 60,
	/** Medium cache for analytics data: 5 minutes */
	ANALYTICS: 300,
	/** Extended cache for historical data: 30 minutes */
	HISTORICAL: 1800,
	/** Long-term cache for rarely changing data: 1 hour */
	LONG_TERM: 3600
};
//#endregion
//#region src/lib/cache/cache.ts
init_sentry_reporting();
var DEFAULT_TTL_SECONDS = CacheTTL.DEFAULT;
var CITY = process.env.CITY ?? "default";
var reportedCacheErrors = /* @__PURE__ */ new Set();
function reportCacheErrorOnce(operation, error, extra) {
	if (reportedCacheErrors.has(operation)) return;
	reportedCacheErrors.add(operation);
	captureExceptionWithContext(error, {
		area: "cache.redis",
		operation,
		extra
	});
}
function getNamespacedKey(key) {
	return `${CITY}:${key}`;
}
async function getCachedJson(key) {
	const client = await getRedisClient();
	if (!client) return null;
	const fullKey = getNamespacedKey(key);
	try {
		const cachedValue = await client.get(fullKey);
		if (!cachedValue) return null;
		try {
			return JSON.parse(cachedValue);
		} catch (error) {
			reportCacheErrorOnce("getCachedJson.parse", error, { key: fullKey });
			logger.warn("cache.redis_parse_failed", {
				key: fullKey,
				error
			});
			return null;
		}
	} catch (error) {
		reportCacheErrorOnce("getCachedJson.read", error, { key: fullKey });
		logger.warn("cache.redis_read_failed", {
			key: fullKey,
			error
		});
		return null;
	}
}
async function setCachedJson(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
	const client = await getRedisClient();
	if (!client) return;
	const fullKey = getNamespacedKey(key);
	try {
		const payload = JSON.stringify(value);
		await client.set(fullKey, payload, { EX: ttlSeconds });
	} catch (error) {
		reportCacheErrorOnce("setCachedJson.write", error, { key: fullKey });
		logger.warn("cache.redis_write_failed", {
			key: fullKey,
			error
		});
	}
}
async function withCache(key, ttlSeconds = DEFAULT_TTL_SECONDS, fetcher) {
	const cachedValue = await getCachedJson(key);
	if (cachedValue !== null) return cachedValue;
	const freshValue = await fetcher();
	await setCachedJson(key, freshValue, ttlSeconds);
	return freshValue;
}
//#endregion
export { getMonthBounds as a, resolveActiveMonth as c, prisma as d, formatMonthLabel as i, toMonthOptions as l, getRedisClient as n, isValidMonthKey as o, getRedisHealthSummary as r, normalizeMonthSearchParam as s, withCache as t, getCity as u };
