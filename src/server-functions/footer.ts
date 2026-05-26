import { createServerFn } from '@tanstack/react-start'
import { resolveStatusDataState } from '@/lib/data-state'
import { getPipelineStatusSummary } from '@/services/shared-data'

export type FooterVersionInfo = {
  gitSha: string
  version: string
  buildDate: string
}

export type FooterData = {
  lastUpdated: string | null
  version: FooterVersionInfo | null
}

async function getGitShaFallback(): Promise<string> {
  try {
    const { execSync } = await import('node:child_process')
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export const getFooterData = createServerFn({ method: 'GET' }).handler(async (): Promise<FooterData> => {
  let lastUpdated: string | null = null

  try {
    const status = await getPipelineStatusSummary()
    if (status && typeof status === 'object') {
      const payload = { ...status, dataState: resolveStatusDataState(status) }
      const timestamp = payload?.quality?.freshness?.lastUpdated
      if (typeof timestamp === 'string' && timestamp.length > 0) {
        lastUpdated = timestamp
      }
    }
  } catch {
    // Non-critical footer metadata must not break page rendering.
  }

  const version: FooterVersionInfo = {
    version: process.env.IMAGE_TAG ?? 'dev',
    gitSha: process.env.GIT_SHA ?? (await getGitShaFallback()),
    buildDate: process.env.BUILD_DATE ?? new Date().toISOString(),
  }

  return { lastUpdated, version }
})
