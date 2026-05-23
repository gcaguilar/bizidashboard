import { createFileRoute } from '@tanstack/react-router'
import { getPipelineStatusSummary } from '@/services/shared-data'
import { withPublicApiRoute } from '@/lib/security/public-api-route'

async function checkDatabase(): Promise<{ ok: boolean; error?: string; durationMs: number }> {
  const start = Date.now()
  try {
    const { prisma } = await import('@/db')
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, durationMs: Date.now() - start }
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
      durationMs: Date.now() - start,
    }
  }
}

async function handler(): Promise<Response> {
  const checks: Array<{ name: string; ok: boolean; error?: string; durationMs: number }> = []
  let allOk = true

  const dbResult = await checkDatabase()
  checks.push({ name: 'database', ...dbResult })
  if (!dbResult.ok) allOk = false

  const pipelineStart = Date.now()
  try {
    const data = await getPipelineStatusSummary()
    const isRecent = data?.quality?.freshness?.lastUpdated
      ? Date.now() - new Date(data.quality.freshness.lastUpdated).getTime() < 5 * 60 * 1000
      : false
    checks.push({
      name: 'pipeline',
      ok: !!data && isRecent,
      durationMs: Date.now() - pipelineStart,
      error: isRecent ? undefined : 'datos no actualizados en los ultimos 5 minutos',
    })
    if (!(!!data && isRecent)) allOk = false
  } catch (err: unknown) {
    allOk = false
    checks.push({
      name: 'pipeline',
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
      durationMs: Date.now() - pipelineStart,
    })
  }

  const status = allOk ? 'ok' : 'degraded'
  const payload = { status, checks, timestamp: new Date().toISOString() }

  return new Response(JSON.stringify(payload), {
    status: allOk ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const Route = createFileRoute('/api/health/ready')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/health/ready',
          routeGroup: 'api.health',
          namespace: 'health-ready',
          limit: 20,
          windowMs: 30_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=15',
        },
        handler,
      ),
    },
  },
})

export { handler as GET }