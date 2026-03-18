import { createClient } from 'redis'

type RedisClient = ReturnType<typeof createClient>

let cachedClient: RedisClient | null = null
let cachedClientPromise: Promise<RedisClient | null> | null = null
let warnedMissingUrl = false
let connectionFailures = 0
const MAX_CONNECTION_RETRIES = 3
let warnedConnectionFailure = false

export async function getRedisClient(): Promise<RedisClient | null> {
  if (connectionFailures >= MAX_CONNECTION_RETRIES) return null

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

  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 1000,
      reconnectStrategy: () => false,
    },
  })
  client.on('error', (error: unknown) => {
    if (!warnedConnectionFailure) {
      console.warn('Redis client error; disabling Redis cache for this process', error)
      warnedConnectionFailure = true
    }
  })

  cachedClientPromise = client
    .connect()
    .then(() => {
      cachedClient = client
      return client
    })
    .catch((error: unknown) => {
      if (!warnedConnectionFailure) {
        console.warn('Failed to connect to Redis; disabling cache', error)
        warnedConnectionFailure = true
      }
      connectionFailures++
      cachedClientPromise = null
      return null
    })

  return cachedClientPromise
}
