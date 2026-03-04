import { DashboardApiClient } from './dashboard-api-client'
import {
  buildDashboardSpec,
  type DashboardPlannerOptions,
  type DashboardSpec,
  type DashboardWidgetSpec,
  type RankingType
} from './dashboard-planner'

export type ResolvedDashboardWidget = DashboardWidgetSpec & {
  resolvedParams: Record<string, string | number>
  fetchedAt: string
  data: unknown
}

export type GeneratedDashboard = Omit<DashboardSpec, 'widgets'> & {
  widgets: ResolvedDashboardWidget[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStringParam(
  params: Record<string, string | number> | undefined,
  key: string
): string | null {
  const value = params?.[key]

  if (typeof value === 'string' && value) {
    return value
  }

  return null
}

function getNumberParam(
  params: Record<string, string | number> | undefined,
  key: string,
  fallback: number
): number {
  const value = params?.[key]

  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10)
  }

  return fallback
}

function extractFirstStationId(payload: unknown): string | null {
  if (!isObject(payload)) {
    return null
  }

  const stations = payload.stations

  if (!Array.isArray(stations) || stations.length === 0) {
    return null
  }

  const firstStation = stations[0]

  if (!isObject(firstStation)) {
    return null
  }

  const stationId = firstStation.id

  if (typeof stationId !== 'string' || !stationId) {
    return null
  }

  return stationId
}

function cloneParams(
  params: Record<string, string | number> | undefined
): Record<string, string | number> {
  if (!params) {
    return {}
  }

  return { ...params }
}

export async function generateDashboard(
  request: string,
  apiClient: DashboardApiClient,
  options: DashboardPlannerOptions = {}
): Promise<GeneratedDashboard> {
  const spec = buildDashboardSpec(request, options)
  const widgets: ResolvedDashboardWidget[] = []

  let stationsCache: unknown | null = null
  let resolvedStationId = spec.selectedStationId

  const needsAutoStation = spec.widgets.some(
    (widget) =>
      (widget.endpoint === 'patterns' || widget.endpoint === 'heatmap') &&
      widget.params?.stationId === 'auto'
  )

  if (needsAutoStation && !resolvedStationId) {
    stationsCache = await apiClient.getStations()
    resolvedStationId = extractFirstStationId(stationsCache)

    if (!resolvedStationId) {
      throw new Error(
        'Unable to resolve a stationId automatically. Provide stationId explicitly in your request.'
      )
    }
  }

  for (const widget of spec.widgets) {
    const resolvedParams = cloneParams(widget.params)
    let data: unknown

    switch (widget.endpoint) {
      case 'status': {
        data = await apiClient.getStatus()
        break
      }

      case 'stations': {
        if (stationsCache !== null) {
          data = stationsCache
        } else {
          data = await apiClient.getStations()
          stationsCache = data
        }
        break
      }

      case 'rankings': {
        const typeParam =
          getStringParam(widget.params, 'type') === 'turnover'
            ? 'turnover'
            : 'availability'

        const limitParam = getNumberParam(widget.params, 'limit', 20)

        resolvedParams.type = typeParam
        resolvedParams.limit = limitParam
        data = await apiClient.getRankings(typeParam as RankingType, limitParam)
        break
      }

      case 'alerts': {
        const limitParam = getNumberParam(widget.params, 'limit', 50)
        resolvedParams.limit = limitParam
        data = await apiClient.getAlerts(limitParam)
        break
      }

      case 'patterns': {
        const stationParam = getStringParam(widget.params, 'stationId')
        const stationId = stationParam === 'auto' ? resolvedStationId : stationParam

        if (!stationId) {
          throw new Error('stationId is required for patterns widget.')
        }

        resolvedParams.stationId = stationId
        data = await apiClient.getPatterns(stationId)
        break
      }

      case 'heatmap': {
        const stationParam = getStringParam(widget.params, 'stationId')
        const stationId = stationParam === 'auto' ? resolvedStationId : stationParam

        if (!stationId) {
          throw new Error('stationId is required for heatmap widget.')
        }

        resolvedParams.stationId = stationId
        data = await apiClient.getHeatmap(stationId)
        break
      }

      case 'mobility': {
        const mobilityDays = getNumberParam(widget.params, 'mobilityDays', 14)
        const demandDays = getNumberParam(widget.params, 'demandDays', 30)
        resolvedParams.mobilityDays = mobilityDays
        resolvedParams.demandDays = demandDays
        data = await apiClient.getMobility(mobilityDays, demandDays)
        break
      }

      default: {
        throw new Error(`Unsupported endpoint: ${(widget as { endpoint: string }).endpoint}`)
      }
    }

    widgets.push({
      ...widget,
      resolvedParams,
      fetchedAt: new Date().toISOString(),
      data
    })
  }

  const notes = [...spec.notes]

  if (resolvedStationId && spec.selectedStationId === null) {
    notes.push(`Resolved stationId automatically: ${resolvedStationId}.`)
  }

  return {
    ...spec,
    selectedStationId: resolvedStationId,
    notes,
    widgets
  }
}
