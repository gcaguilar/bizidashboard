import { createServerFn } from '@tanstack/react-start'
import { getStationSeoRows } from '@/lib/seo-stations'
import type { StationSeoSummary } from '@/lib/seo-stations'
import { buildNetworkBriefing } from '@/lib/network-briefing'
import { fetchAlerts, fetchSharedDatasetSnapshot, fetchStatus } from '@/lib/api'
import { buildFallbackDatasetSnapshot, buildFallbackStatus } from '@/lib/shared-data-fallbacks'

export type HomePageData = {
  mostUsedStations: StationSeoSummary[]
  problemStations: StationSeoSummary[]
  stationRows: StationSeoSummary[]
  bikesAvailable: number
  activeStationsCount: number
  generatedAt: string
  briefing: ReturnType<typeof buildNetworkBriefing>
}

export const getHomePageData = createServerFn({ method: 'GET' }).handler(async () => {
  const stationRows = await getStationSeoRows()
  const nowIso = new Date().toISOString()
  const [status, dataset, alerts] = await Promise.all([
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchAlerts(20).catch(() => ({ limit: 20, alerts: [], generatedAt: nowIso })),
  ])

  const mostUsed = [...stationRows]
    .filter(s => s.turnover?.turnoverScore != null && Number(s.turnover.turnoverScore) > 0)
    .sort((a, b) => Number(b.turnover!.turnoverScore) - Number(a.turnover!.turnoverScore))
    .slice(0, 5)

  const problem = [...stationRows]
    .filter(s => s.availability != null)
    .sort((a, b) => {
      const aHours = Number(a.availability?.emptyHours ?? 0) + Number(a.availability?.fullHours ?? 0)
      const bHours = Number(b.availability?.emptyHours ?? 0) + Number(b.availability?.fullHours ?? 0)
      return bHours - aHours
    })
    .slice(0, 5)

  const indexable = stationRows.filter(r => r.indexability.indexable)
  const bikesAvailable = indexable.reduce((sum, r) => sum + r.station.bikesAvailable, 0)

  return {
    mostUsedStations: mostUsed,
    problemStations: problem,
    stationRows,
    bikesAvailable,
    activeStationsCount: indexable.length,
    generatedAt: new Date().toISOString(),
    briefing: buildNetworkBriefing({
      stations: stationRows.map((row) => row.station),
      activeAlertsCount: alerts.alerts.filter((alert) => alert.isActive).length,
      coverageDays: dataset.coverage.totalDays,
      lastUpdatedAt: status.quality.freshness.lastUpdated ?? dataset.lastUpdated.lastSampleAt,
      pipelineHealthy: status.pipeline.healthStatus === 'healthy',
    }),
  }
})
