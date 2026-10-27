import { createServerFn } from '@tanstack/react-start'
import { getStationSeoRows } from '@/lib/seo-stations'
import type { StationSeoSummary } from '@/lib/seo-stations'
import type { HomeDiagnosisSummary } from '@/lib/home-diagnosis'
import { buildNetworkBriefing } from '@/lib/network-briefing'
import { hasNoAvailability } from '@/lib/network-health'
import type { NetworkHealth } from '@/lib/network-health'
import { slugifyDistrictName } from '@/lib/seo-districts'
import { fetchAlerts, fetchSharedDatasetSnapshot, fetchStatus } from '@/lib/api'
import { buildFallbackDatasetSnapshot, buildFallbackStatus } from '@/services/shared-data'
import { fetchComparableNetworkBaseline } from '@/lib/network-briefing-baseline'

export type CriticalDistrictCount = { name: string; slug: string | null; criticalCount: number };
export type DistrictOption = { name: string; slug: string };

export type HomePageData = {
  mostUsedStations: HomeDiagnosisSummary[]
  problemStations: HomeDiagnosisSummary[]
  bikesAvailable: number
  activeStationsCount: number
  generatedAt: string
  briefing: ReturnType<typeof buildNetworkBriefing>
  anchorsFreeTotal: number
  criticalStationsCount: number
  health: NetworkHealth
  topCriticalDistricts: CriticalDistrictCount[]
  districts: DistrictOption[]
}

// Solo viaja al HTML lo que la portada pinta: el resto del ranking (horas punta,
// indexabilidad, etc.) no se usa en cliente. La red completa se pide a /api/stations.
function toHomeDiagnosisSummary(row: StationSeoSummary): HomeDiagnosisSummary {
  return {
    station: row.station,
    districtName: row.districtName,
    currentOccupancy: row.currentOccupancy,
    turnover: row.turnover ? { turnoverScore: row.turnover.turnoverScore } : null,
    availability: row.availability
      ? {
          emptyHours: row.availability.emptyHours,
          fullHours: row.availability.fullHours,
          totalHours: row.availability.totalHours,
        }
      : null,
  }
}

export const getHomePageData = createServerFn({ method: 'GET' }).handler(async () => {
  const nowIso = new Date().toISOString()
  const [stationRows, status, dataset, alerts] = await Promise.all([
    getStationSeoRows(),
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchAlerts(20).catch(() => ({ limit: 20, alerts: [], generatedAt: nowIso })),
  ])
  const baseline = await fetchComparableNetworkBaseline(
    new Date(status.quality.freshness.lastUpdated ?? dataset.lastUpdated.lastSampleAt ?? nowIso),
    stationRows.length,
  )

  const mostUsed = [...stationRows]
    .filter(s => s.turnover?.turnoverScore != null && Number(s.turnover.turnoverScore) > 0)
    .sort((a, b) => Number(b.turnover!.turnoverScore) - Number(a.turnover!.turnoverScore))
    .slice(0, 5)
    .map(toHomeDiagnosisSummary)

  const problem = [...stationRows]
    .filter(s => s.availability != null)
    .sort((a, b) => {
      const aHours = Number(a.availability?.emptyHours ?? 0) + Number(a.availability?.fullHours ?? 0)
      const bHours = Number(b.availability?.emptyHours ?? 0) + Number(b.availability?.fullHours ?? 0)
      return bHours - aHours
    })
    .slice(0, 5)
    .map(toHomeDiagnosisSummary)

  // Todos los indicadores de red se calculan sobre el mismo conjunto (todas las
  // estaciones con datos), igual que el semáforo: así las cifras cuadran entre sí.
  const bikesAvailable = stationRows.reduce((sum, r) => sum + r.station.bikesAvailable, 0)
  const anchorsFreeTotal = stationRows.reduce((sum, r) => sum + r.station.anchorsFree, 0)
  const criticalStationsCount = stationRows.filter(r => hasNoAvailability(r.station)).length

  const briefing = buildNetworkBriefing({
    stations: stationRows.map((row) => row.station),
    activeAlertsCount: alerts.alerts.filter((alert) => alert.isActive).length,
    coverageDays: dataset.coverage.totalDays,
    lastUpdatedAt: status.quality.freshness.lastUpdated ?? dataset.lastUpdated.lastSampleAt,
    pipelineHealthy: status.pipeline.healthStatus === 'healthy',
    baseline,
  })

  const criticalDistrictsByName = new Map<string, CriticalDistrictCount>()
  for (const row of stationRows) {
    if (!row.districtName || !hasNoAvailability(row.station)) continue
    const known = criticalDistrictsByName.get(row.districtName)
    if (known) {
      known.criticalCount += 1
      if (known.slug == null && row.districtSlug != null) known.slug = row.districtSlug
      continue
    }
    criticalDistrictsByName.set(row.districtName, {
      name: row.districtName,
      slug: row.districtSlug,
      criticalCount: 1,
    })
  }
  const topCriticalDistricts = [...criticalDistrictsByName.values()]
    .filter(district => district.criticalCount > 0)
    .sort((a, b) => b.criticalCount - a.criticalCount || a.name.localeCompare(b.name, 'es'))
    .slice(0, 3)

  const districtSlugByName = new Map<string, string | null>()
  for (const row of stationRows) {
    if (!row.districtName) continue
    if (!districtSlugByName.has(row.districtName)) {
      districtSlugByName.set(row.districtName, null)
    }
    if (row.districtSlug != null && districtSlugByName.get(row.districtName) == null) {
      districtSlugByName.set(row.districtName, row.districtSlug)
    }
  }
  const districts = [...districtSlugByName.entries()]
    .map(([name, slug]): DistrictOption => ({ name, slug: slug ?? slugifyDistrictName(name) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return {
    mostUsedStations: mostUsed,
    problemStations: problem,
    bikesAvailable,
    activeStationsCount: stationRows.length,
    generatedAt: new Date().toISOString(),
    briefing,
    anchorsFreeTotal,
    criticalStationsCount,
    health: briefing.health,
    topCriticalDistricts,
    districts,
  }
})
