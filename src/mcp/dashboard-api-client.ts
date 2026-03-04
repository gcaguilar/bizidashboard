import type { RankingType } from './dashboard-planner'

export type DashboardApiClientOptions = {
  baseUrl: string
  timeoutMs?: number
  fetcher?: typeof fetch
}

const DEFAULT_TIMEOUT_MS = 20_000

function assertPositiveInteger(
  value: number,
  label: string,
  minimum: number,
  maximum: number
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${label} must be an integer between ${minimum} and ${maximum}.`
    )
  }
}

export class DashboardApiClient {
  private readonly baseUrl: string

  private readonly timeoutMs: number

  private readonly fetcher: typeof fetch

  constructor(options: DashboardApiClientOptions) {
    this.baseUrl = options.baseUrl
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fetcher = options.fetcher ?? fetch

    if (!this.baseUrl) {
      throw new Error('API base URL is required.')
    }

    if (this.timeoutMs <= 0) {
      throw new Error('timeoutMs must be greater than zero.')
    }
  }

  async getStatus(): Promise<unknown> {
    return this.request('/api/status')
  }

  async getStations(): Promise<unknown> {
    return this.request('/api/stations')
  }

  async getRankings(type: RankingType, limit = 20): Promise<unknown> {
    assertPositiveInteger(limit, 'limit', 1, 100)

    return this.request('/api/rankings', {
      type,
      limit
    })
  }

  async getAlerts(limit = 50): Promise<unknown> {
    assertPositiveInteger(limit, 'limit', 1, 200)

    return this.request('/api/alerts', {
      limit
    })
  }

  async getPatterns(stationId: string): Promise<unknown> {
    if (!stationId) {
      throw new Error('stationId is required for patterns.')
    }

    return this.request('/api/patterns', {
      stationId
    })
  }

  async getHeatmap(stationId: string): Promise<unknown> {
    if (!stationId) {
      throw new Error('stationId is required for heatmap.')
    }

    return this.request('/api/heatmap', {
      stationId
    })
  }

  async getMobility(
    mobilityDays = 14,
    demandDays = 30
  ): Promise<unknown> {
    assertPositiveInteger(mobilityDays, 'mobilityDays', 1, 90)
    assertPositiveInteger(demandDays, 'demandDays', 1, 120)

    return this.request('/api/mobility', {
      mobilityDays,
      demandDays
    })
  }

  private async request(
    path: string,
    params?: Record<string, string | number>
  ): Promise<unknown> {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`
    const url = new URL(path, base)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value))
      }
    }

    const abortController = new AbortController()
    const timeout = setTimeout(() => abortController.abort(), this.timeoutMs)

    try {
      const response = await this.fetcher(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        signal: abortController.signal
      })

      const body = await response.text()

      if (!response.ok) {
        const sample = body.slice(0, 300)
        throw new Error(
          `Request to ${url.pathname} failed with ${response.status}. Body: ${sample}`
        )
      }

      try {
        return JSON.parse(body) as unknown
      } catch {
        throw new Error(
          `Request to ${url.pathname} returned invalid JSON payload.`
        )
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        throw new Error(`Request to ${path} timed out after ${this.timeoutMs}ms.`)
      }

      throw error
    } finally {
      clearTimeout(timeout)
    }
  }
}
