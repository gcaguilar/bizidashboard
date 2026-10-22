import { createClient, type RedisClientType } from 'redis'
import { captureExceptionWithContext, captureWarningWithContext } from '@/lib/sentry-reporting'
import { logger } from '@/lib/logger'

// `ReturnType<typeof createClient>` no longer resolves to the inferred client
// type in redis v6 (RESP3 is now the default), so use the exported alias
// directly, whose defaults (`RESP = 3`) match what `createClient` returns here.
type RedisClient = RedisClientType

let cachedClient: RedisClient | null = null
let cachedClientPromise: Promise<RedisClient | null> | null = null
let warnedMissingUrl = false
let connectionFailures = 0
let lastConnectFailureAt = 0
let connectionPending = false
const MAX_CONNECTION_RETRIES = 3
/** Tras agotar los reintentos, esperar este cooldown antes de volver a intentar. */
const CONNECTION_FAILURE_COOLDOWN_MS = 30_000
/** Reintentos de reconexión con backoff (200 ms por reintento, techo 5 s). */
const MAX_RECONNECT_ATTEMPTS = 20
/**
 * La petición que abre la conexión no espera todo el presupuesto de
 * reintentos: si Redis no responde en 3 s degrada ya (null) y el intento
 * sigue en segundo plano hasta calentar `cachedClient`.
 */
const CONNECT_HANDOFF_TIMEOUT_MS = 3_000
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
  if (connectionFailures >= MAX_CONNECTION_RETRIES) {
    // Un cliente reconectado resetea el contador en 'ready'; si no, tras el
    // cooldown se reintenta en lugar de cerrar la puerta para siempre (un
    // arranque con Redis aún levantándose no debe quedar sin caché hasta el
    // próximo reinicio del proceso).
    if (Date.now() - lastConnectFailureAt < CONNECTION_FAILURE_COOLDOWN_MS) {
      return null
    }
    connectionFailures = 0
  }

  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    if (!warnedMissingUrl) {
      if (process.env.NODE_ENV === 'production') {
        captureWarningWithContext('REDIS_URL is not set; Redis cache is disabled in production.', {
          area: 'cache.redis',
          operation: 'getRedisClient',
          tags: { handled: true },
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

  if (connectionPending) {
    return null
  }

  connectionPending = true
  const client = createClient({
    url: redisUrl,
    // Sin cola offline: mientras Redis no está disponible los comandos fallan
    // al instante y las rutas degradan a sin caché, en lugar de bloquear la
    // petición esperando la reconexión.
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 1000,
      // Reconexión con backoff. Sin estrategia (el valor anterior `false`),
      // una caída transitoria de Redis dejaba el proceso sin caché y con el
      // rate limit en fail-open hasta reiniciar el proceso.
      reconnectStrategy: (retries: number) =>
        retries >= MAX_RECONNECT_ATTEMPTS
          ? false
          : Math.min(retries * 200, 5000),
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
  client.on('ready', () => {
    // La primera conexión y cada reconexión devuelven el contador a cero.
    connectionFailures = 0
  })
  client.on('terminated', () => {
    // La reconexión renunció (cliente muerto). Se descarta para que la
    // próxima petición abra uno nuevo con su propio presupuesto de reintentos.
    if (cachedClient === client) {
      cachedClient = null
      cachedClientPromise = null
      connectionPending = false
      connectionFailures++
      lastConnectFailureAt = Date.now()
    }
  })

  const attempt: Promise<RedisClient | null> = client
    .connect()
    .then(() => {
      cachedClient = client
      connectionPending = false
      connectionFailures = 0
      return client
    })
    .catch((error: unknown) => {
      client.quit().catch(() => {})
      if (!warnedConnectionFailure) {
        captureExceptionWithContext(error, {
          area: 'cache.redis',
          operation: 'connect',
        })
        logger.warn('redis.connect_failed', { error })
        warnedConnectionFailure = true
      }
      connectionFailures++
      lastConnectFailureAt = Date.now()
      cachedClientPromise = null
      cachedClient = null
      connectionPending = false
      return null
    })

  cachedClientPromise = new Promise<RedisClient | null>((resolve) => {
    const handoffTimer = setTimeout(() => resolve(null), CONNECT_HANDOFF_TIMEOUT_MS)
    attempt.then(
      () => clearTimeout(handoffTimer),
      () => clearTimeout(handoffTimer)
    )
    attempt.then(resolve, resolve)
  })

  return cachedClientPromise
}
