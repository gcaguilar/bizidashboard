import { getRedisClient } from './redis'

const DEFAULT_TTL_SECONDS = 300

const CITY = process.env.CITY ?? 'default'

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
      console.warn(`Failed to parse cached JSON for key ${fullKey}`, error)
      return null
    }
  } catch (error) {
    console.warn('Failed to read from Redis cache', error)
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
    console.warn('Failed to write to Redis cache', error)
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
