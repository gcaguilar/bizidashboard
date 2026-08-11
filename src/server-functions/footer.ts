import { createServerFn } from '@tanstack/react-start'
import { resolveUmamiRuntimeConfig, type UmamiRuntimeConfig } from '@/lib/umami-config'

export type FooterVersionInfo = {
  gitSha: string
  version: string
  buildDate: string
}

export type FooterData = {
  version: FooterVersionInfo | null
  umami: UmamiRuntimeConfig | null
}

let cachedGitSha: string | null = null

async function getGitShaFallback(): Promise<string> {
  if (cachedGitSha) {
    return cachedGitSha
  }

  try {
    const { execSync } = await import('node:child_process')
    cachedGitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    cachedGitSha = 'unknown'
  }

  return cachedGitSha
}

// Static per server process (env vars / build metadata) — resolved once and
// never revalidated; see `staleTime: Infinity` on the root route loader.
export const getFooterData = createServerFn({ method: 'GET' }).handler(async (): Promise<FooterData> => {
  const version: FooterVersionInfo = {
    version: process.env.IMAGE_TAG ?? 'dev',
    gitSha: process.env.GIT_SHA ?? (await getGitShaFallback()),
    buildDate: process.env.BUILD_DATE ?? new Date().toISOString(),
  }

  return {
    version,
    umami: resolveUmamiRuntimeConfig(process.env),
  }
})
