import { getRedisClient } from './redis'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { logger } from '@/lib/logger'
import { CacheTTL } from './config'

const DEFAULT_TTL_SECONDS = CacheTTL.DEFAULT

const CITY = process.env.CITY ?? 'default'
const reportedCacheErrors = new Set<string>()

function reportCacheErrorOnce(
  operation: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  if (reportedCacheErrors.has(operation)) {
    return
  }

  reportedCacheErrors.add(operation)
  captureExceptionWithContext(error, {
    area: 'cache.redis',
    operation,
    extra,
  })
}

function getNamespacedKey(key: string): string {
  return `${CITY}:${key}`
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const client = await getRedisClient()

  if (!client) return null

  const fullKey = getNamespacedKey(key)

  try {
    const cachedValue = await client.get(fullKey)

    if (!cachedValue) return null

    try {
      return JSON.parse(cachedValue) as T
    } catch (error) {
      reportCacheErrorOnce('getCachedJson.parse', error, { key: fullKey })
      logger.warn('cache.redis_parse_failed', {
        key: fullKey,
        error,
      })
      return null
    }
  } catch (error) {
    reportCacheErrorOnce('getCachedJson.read', error, { key: fullKey })
    logger.warn('cache.redis_read_failed', {
      key: fullKey,
      error,
    })
    return null
  }
}

/**
 * `ttlSeconds` may be `null` to persist the entry with no expiry: useful for
 * immutable, expensive artifacts (e.g. a closed month report) that should be
 * computed once and served until explicitly invalidated.
 */
export async function setCachedJson(
  key: string,
  value: unknown,
  ttlSeconds: number | null = DEFAULT_TTL_SECONDS
): Promise<void> {
  const client = await getRedisClient()

  if (!client) return

  const fullKey = getNamespacedKey(key)

  try {
    const payload = JSON.stringify(value)
    await (ttlSeconds === null
      ? client.set(fullKey, payload)
      : client.set(fullKey, payload, { EX: ttlSeconds }))
  } catch (error) {
    reportCacheErrorOnce('setCachedJson.write', error, { key: fullKey })
    logger.warn('cache.redis_write_failed', {
      key: fullKey,
      error,
    })
  }
}

/**
 * Removes an entry so the next read recomputes it. Used to invalidate persisted
 * artifacts after a backfill or retention change.
 */
export async function deleteCachedJson(key: string): Promise<void> {
  const client = await getRedisClient()

  if (!client) return

  const fullKey = getNamespacedKey(key)

  try {
    await client.del(fullKey)
  } catch (error) {
    reportCacheErrorOnce('deleteCachedJson.delete', error, { key: fullKey })
    logger.warn('cache.redis_delete_failed', {
      key: fullKey,
      error,
    })
  }
}

export type StaleCacheOptions = {
  /** Edad a partir de la cual se devuelve el valor viejo y se refresca en segundo plano. */
  softTtlSeconds: number
  /** Edad maxima tras la cual el valor viejo ya no se sirve. */
  hardTtlSeconds: number
}

type StaleCacheEnvelope<T> = {
  value: T
  storedAt: number
}

const staleInflight = new Map<string, Promise<unknown>>()

function isStaleCacheEnvelope<T>(value: unknown): value is StaleCacheEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'storedAt' in value &&
    typeof (value as { storedAt?: unknown }).storedAt === 'number'
  )
}

async function refreshStaleCache<T>(
  key: string,
  options: StaleCacheOptions,
  fetcher: () => Promise<T>
): Promise<T> {
  const namespacedKey = getNamespacedKey(key)
  const current = staleInflight.get(namespacedKey)

  if (current) {
    return current as Promise<T>
  }

  const promise = (async () => {
    const freshValue = await fetcher()
    await setCachedJson(
      key,
      { value: freshValue, storedAt: Date.now() } satisfies StaleCacheEnvelope<T>,
      options.hardTtlSeconds
    )
    return freshValue
  })().finally(() => {
    staleInflight.delete(namespacedKey)
  })

  staleInflight.set(namespacedKey, promise)
  return promise
}

/**
 * Cache con stale-while-revalidate.
 *
 * - Antes de `softTtlSeconds` devuelve el valor sin tocar el origen.
 * - Entre soft y hard devuelve el valor viejo al instante y lanza un refresco
 *   en segundo plano (una sola promesa por clave).
 * - Pasado `hardTtlSeconds` espera al refresco.
 *
 * Se usa para el informe del mes en curso: durante unos minutos puede servirse
 * la version anterior mientras se recalcula, en lugar de bloquear la peticion
 * durante 10-20 s.
 */
export async function withStaleCache<T>(
  key: string,
  options: StaleCacheOptions,
  fetcher: () => Promise<T>
): Promise<T> {
  if (
    !Number.isFinite(options.softTtlSeconds) ||
    !Number.isFinite(options.hardTtlSeconds) ||
    options.softTtlSeconds < 0 ||
    options.hardTtlSeconds <= options.softTtlSeconds
  ) {
    throw new Error('withStaleCache requires 0 <= softTtlSeconds < hardTtlSeconds')
  }

  const cachedValue = await getCachedJson<unknown>(key)

  if (isStaleCacheEnvelope<T>(cachedValue)) {
    const ageSeconds = (Date.now() - cachedValue.storedAt) / 1000

    if (ageSeconds <= options.softTtlSeconds) {
      return cachedValue.value
    }

    if (ageSeconds <= options.hardTtlSeconds) {
      void refreshStaleCache(key, options, fetcher).catch((error) => {
        logger.warn('cache.stale_refresh_failed', { key, error })
      })
      return cachedValue.value
    }
  }

  return refreshStaleCache(key, options, fetcher)
}

const inflight = new Map<string, Promise<unknown>>()

export async function withCache<T>(
  key: string,
  ttlSeconds: number | null = DEFAULT_TTL_SECONDS,
  fetcher: () => Promise<T>
): Promise<T> {
  const cachedValue = await getCachedJson<T>(key)

  if (cachedValue !== null) return cachedValue

  const namespacedKey = getNamespacedKey(key)
  if (inflight.has(namespacedKey)) {
    return inflight.get(namespacedKey) as Promise<T>
  }

  const promise = fetcher()
    .then(async (freshValue) => {
      await setCachedJson(key, freshValue, ttlSeconds)
      inflight.delete(namespacedKey)
      return freshValue
    })
    .catch((error) => {
      inflight.delete(namespacedKey)
      throw error
    })

  inflight.set(namespacedKey, promise)
  return promise
}
