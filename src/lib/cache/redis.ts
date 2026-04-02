import { createClient } from 'redis'
import { captureExceptionWithContext, captureWarningWithContext } from '@/lib/sentry-reporting'
import { logger } from '@/lib/logger'

type RedisClient = ReturnType<typeof createClient>

let cachedClient: RedisClient | null = null
let cachedClientPromise: Promise<RedisClient | null> | null = null
let warnedMissingUrl = false
let connectionFailures = 0
const MAX_CONNECTION_RETRIES = 3
let warnedConnectionFailure = false

export async function getRedisHealthSummary(): Promise<{
  configured: boolean
  available: boolean
  backend: 'redis' | 'disabled'
}> {
  const client = await getRedisClient()

  return {
    configured: Boolean(process.env.REDIS_URL?.trim()),
    available: client !== null,
    backend: client !== null ? 'redis' : 'disabled',
  }
}

export async function getRedisClient(): Promise<RedisClient | null> {
  if (connectionFailures >= MAX_CONNECTION_RETRIES) return null

  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    if (!warnedMissingUrl) {
      if (process.env.NODE_ENV === 'production') {
        captureWarningWithContext('REDIS_URL is not set; Redis cache is disabled in production.', {
          area: 'cache.redis',
          operation: 'getRedisClient',
          tags: {
            handled: true,
          },
          dedupeKey: 'cache.redis.missing-url.production',
        })
      }
      logger.warn('redis.missing_url')
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
      captureExceptionWithContext(error, {
        area: 'cache.redis',
        operation: 'client.error',
      })
      logger.warn('redis.client_error', { error })
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
        captureExceptionWithContext(error, {
          area: 'cache.redis',
          operation: 'connect',
        })
        logger.warn('redis.connect_failed', { error })
        warnedConnectionFailure = true
      }
      connectionFailures++
      cachedClientPromise = null
      return null
    })

  return cachedClientPromise
}
