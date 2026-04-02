import { getRedisClient } from './redis'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { logger } from '@/lib/logger'

const DEFAULT_TTL_SECONDS = 300

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

export async function setCachedJson(
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
  const client = await getRedisClient()

  if (!client) return

  const fullKey = getNamespacedKey(key)

  try {
    const payload = JSON.stringify(value)
    await client.set(fullKey, payload, { EX: ttlSeconds })
  } catch (error) {
    reportCacheErrorOnce('setCachedJson.write', error, { key: fullKey })
    logger.warn('cache.redis_write_failed', {
      key: fullKey,
      error,
    })
  }
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
  fetcher: () => Promise<T>
): Promise<T> {
  const cachedValue = await getCachedJson<T>(key)

  if (cachedValue !== null) return cachedValue

  const freshValue = await fetcher()
  await setCachedJson(key, freshValue, ttlSeconds)
  return freshValue
}
