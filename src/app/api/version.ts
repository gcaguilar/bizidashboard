import { createFileRoute } from '@tanstack/react-router'

async function getGitShaFallback(): Promise<string> {
  try {
    const { execSync } = await import('node:child_process')
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

async function getHandler() {
  const payload = {
    status: 'ok' as const,
    version: process.env.IMAGE_TAG ?? 'dev',
    gitSha: process.env.GIT_SHA ?? (await getGitShaFallback()),
    buildDate: process.env.BUILD_DATE ?? new Date().toISOString(),
    timestamp: new Date().toISOString(),
  }
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const Route = createFileRoute('/api/version')({
  server: {
    handlers: {
      GET: getHandler,
    },
  },
})

export const GET = getHandler