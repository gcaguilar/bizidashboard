import { createClient } from 'redis'

type RedisClient = ReturnType<typeof createClient>

let cachedClient: RedisClient | null = null
let cachedClientPromise: Promise<RedisClient | null> | null = null
let warnedMissingUrl = false

export async function getRedisClient(): Promise<RedisClient | null> {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    if (!warnedMissingUrl) {
      console.warn('REDIS_URL is not set; skipping Redis cache')
      warnedMissingUrl = true
    }
    return null
  }

  if (cachedClient) return cachedClient
  if (cachedClientPromise) return cachedClientPromise

  const client = createClient({ url: redisUrl })
  client.on('error', (error: unknown) => {
    console.warn('Redis client error', error)
  })

  cachedClientPromise = client
    .connect()
    .then(() => {
      cachedClient = client
      return client
    })
    .catch((error: unknown) => {
      console.warn('Failed to connect to Redis; skipping cache', error)
      cachedClientPromise = null
      return null
    })

  return cachedClientPromise
}
