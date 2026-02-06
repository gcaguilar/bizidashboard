import { getRedisClient } from './redis'

const DEFAULT_TTL_SECONDS = 300

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const client = await getRedisClient()

  if (!client) return null

  try {
    const cachedValue = await client.get(key)

    if (!cachedValue) return null

    try {
      return JSON.parse(cachedValue) as T
    } catch (error) {
      console.warn(`Failed to parse cached JSON for key ${key}`, error)
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

  try {
    const payload = JSON.stringify(value)
    await client.set(key, payload, { EX: ttlSeconds })
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
