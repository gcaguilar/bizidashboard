import { DashboardApiClient } from './dashboard-api-client'
import {
  buildDashboardSpec,
  type CustomWidgetDefinition,
  type CustomWidgetSourceEndpoint,
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

function pathToTokens(path: string): string[] {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((token) => token.trim())
    .filter(Boolean)
}

function getPathValue(payload: unknown, path: string | undefined): unknown {
  if (!path) {
    return payload
  }

  const tokens = pathToTokens(path)
  let current: unknown = payload

  for (const token of tokens) {
    if (Array.isArray(current)) {
      const index = Number.parseInt(token, 10)

      if (!Number.isInteger(index)) {
        return undefined
      }

      current = current[index]
      continue
    }

    if (!isObject(current)) {
      return undefined
    }

    current = current[token]
  }

  return current
}

function toObjectRows(payload: unknown): Record<string, unknown>[] {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .map((item) => {
      if (isObject(item)) {
        return item
      }

      return { value: item }
    })
    .filter((item) => isObject(item))
}

function findFirstArrayInObject(payload: unknown): Record<string, unknown>[] {
  if (!isObject(payload)) {
    return []
  }

  for (const key of [
    'rankings',
    'alerts',
    'stations',
    'hourlySignals',
    'dailyDemand'
  ]) {
    const value = payload[key]

    if (Array.isArray(value)) {
      return toObjectRows(value)
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) {
      return toObjectRows(value)
    }
  }

  return []
}

function extractRowsForCustomWidget(
  sourcePayload: unknown,
  collectionPath: string | undefined
): Record<string, unknown>[] {
  if (collectionPath) {
    const atPath = getPathValue(sourcePayload, collectionPath)
    const rowsAtPath = toObjectRows(atPath)

    if (rowsAtPath.length > 0) {
      return rowsAtPath
    }
  }

  if (Array.isArray(sourcePayload)) {
    return toObjectRows(sourcePayload)
  }

  return findFirstArrayInObject(sourcePayload)
}

function toCustomScalar(value: unknown): string | number | boolean | null {
  if (value === null) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value.length
  }

  if (isObject(value)) {
    return Object.keys(value).length
  }

  return String(value)
}

function pickKpiFallbackValue(sourcePayload: unknown): unknown {
  if (Array.isArray(sourcePayload)) {
    return sourcePayload.length
  }

  if (!isObject(sourcePayload)) {
    return sourcePayload
  }

  for (const key of [
    'rankings',
    'alerts',
    'stations',
    'hourlySignals',
    'dailyDemand'
  ]) {
    const value = sourcePayload[key]

    if (Array.isArray(value)) {
      return value.length
    }
  }

  return Object.keys(sourcePayload).length
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function pickSeriesXKey(rows: Record<string, unknown>[]): string {
  const candidates = ['hour', 'day', 'timestamp', 'stationId', 'id']
  const sample = rows[0]

  for (const key of candidates) {
    if (key in sample) {
      return key
    }
  }

  return Object.keys(sample)[0] ?? 'x'
}

function pickSeriesYKey(rows: Record<string, unknown>[], xKey: string): string {
  const candidates = [
    'demandScore',
    'avgOccupancy',
    'arrivals',
    'departures',
    'turnoverScore',
    'metricValue',
    'sampleCount',
    'value'
  ]
  const sample = rows[0]

  for (const key of candidates) {
    if (key === xKey) {
      continue
    }

    if (key in sample) {
      const numericValue = toNumberOrNull(sample[key])

      if (numericValue !== null) {
        return key
      }
    }
  }

  for (const key of Object.keys(sample)) {
    if (key === xKey) {
      continue
    }

    const numericValue = toNumberOrNull(sample[key])

    if (numericValue !== null) {
      return key
    }
  }

  return 'value'
}

function buildCustomWidgetPayload(
  customWidget: CustomWidgetDefinition,
  sourcePayload: unknown,
  sourceParams: Record<string, string | number>
): unknown {
  if (customWidget.mode === 'kpi') {
    const rawValue =
      getPathValue(sourcePayload, customWidget.valuePath) ??
      pickKpiFallbackValue(sourcePayload)

    return {
      kind: 'custom',
      mode: 'kpi',
      title: customWidget.title,
      valuePath: customWidget.valuePath ?? null,
      value: toCustomScalar(rawValue),
      sourceEndpoint: customWidget.sourceEndpoint,
      sourceParams
    }
  }

  const rows = extractRowsForCustomWidget(sourcePayload, customWidget.collectionPath)

  if (customWidget.mode === 'table') {
    const limit =
      typeof customWidget.limit === 'number' && Number.isInteger(customWidget.limit)
        ? customWidget.limit
        : 25

    const limitedRows = rows.slice(0, Math.max(1, Math.min(limit, 200)))
    const columnSet = new Set<string>()

    for (const row of limitedRows) {
      for (const key of Object.keys(row)) {
        columnSet.add(key)

        if (columnSet.size >= 16) {
          break
        }
      }

      if (columnSet.size >= 16) {
        break
      }
    }

    return {
      kind: 'custom',
      mode: 'table',
      title: customWidget.title,
      collectionPath: customWidget.collectionPath ?? null,
      columns: Array.from(columnSet),
      rows: limitedRows,
      sourceEndpoint: customWidget.sourceEndpoint,
      sourceParams
    }
  }

  const xKey = customWidget.xKey ?? pickSeriesXKey(rows)
  const yKey = customWidget.yKey ?? pickSeriesYKey(rows, xKey)
  const points = rows
    .map((row) => {
      const xValue = row[xKey]
      const yValue = toNumberOrNull(row[yKey])

      if (yValue === null) {
        return null
      }

      return {
        x: xValue,
        y: yValue
      }
    })
    .filter((point): point is { x: unknown; y: number } => point !== null)

  return {
    kind: 'custom',
    mode: 'timeseries',
    title: customWidget.title,
    collectionPath: customWidget.collectionPath ?? null,
    xKey,
    yKey,
    points,
    sourceEndpoint: customWidget.sourceEndpoint,
    sourceParams
  }
}

function sourceCacheKey(
  endpoint: CustomWidgetSourceEndpoint,
  params: Record<string, string | number>
): string {
  const sorted = Object.entries(params).sort(([left], [right]) =>
    left.localeCompare(right)
  )
  const encodedParams = JSON.stringify(sorted)

  return `${endpoint}:${encodedParams}`
}

async function fetchSourcePayload(
  sourceEndpoint: CustomWidgetSourceEndpoint,
  sourceParams: Record<string, string | number>,
  apiClient: DashboardApiClient,
  resolvedStationId: string | null
): Promise<{ payload: unknown; resolvedParams: Record<string, string | number> }> {
  const resolvedParams: Record<string, string | number> = { ...sourceParams }

  switch (sourceEndpoint) {
    case 'status': {
      return {
        payload: await apiClient.getStatus(),
        resolvedParams
      }
    }

    case 'stations': {
      return {
        payload: await apiClient.getStations(),
        resolvedParams
      }
    }

    case 'rankings': {
      const typeParam =
        getStringParam(sourceParams, 'type') === 'turnover'
          ? 'turnover'
          : 'availability'
      const limitParam = getNumberParam(sourceParams, 'limit', 20)

      resolvedParams.type = typeParam
      resolvedParams.limit = limitParam

      return {
        payload: await apiClient.getRankings(typeParam as RankingType, limitParam),
        resolvedParams
      }
    }

    case 'alerts': {
      const limitParam = getNumberParam(sourceParams, 'limit', 50)
      resolvedParams.limit = limitParam

      return {
        payload: await apiClient.getAlerts(limitParam),
        resolvedParams
      }
    }

    case 'patterns': {
      const stationParam = getStringParam(sourceParams, 'stationId')
      const stationId = stationParam === 'auto' ? resolvedStationId : stationParam

      if (!stationId) {
        throw new Error('stationId is required for custom widget source patterns.')
      }

      resolvedParams.stationId = stationId

      return {
        payload: await apiClient.getPatterns(stationId),
        resolvedParams
      }
    }

    case 'heatmap': {
      const stationParam = getStringParam(sourceParams, 'stationId')
      const stationId = stationParam === 'auto' ? resolvedStationId : stationParam

      if (!stationId) {
        throw new Error('stationId is required for custom widget source heatmap.')
      }

      resolvedParams.stationId = stationId

      return {
        payload: await apiClient.getHeatmap(stationId),
        resolvedParams
      }
    }

    case 'mobility': {
      const mobilityDays = getNumberParam(sourceParams, 'mobilityDays', 14)
      const demandDays = getNumberParam(sourceParams, 'demandDays', 30)
      resolvedParams.mobilityDays = mobilityDays
      resolvedParams.demandDays = demandDays

      return {
        payload: await apiClient.getMobility(mobilityDays, demandDays),
        resolvedParams
      }
    }
  }
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
  const sourcePayloadCache = new Map<
    string,
    { payload: unknown; resolvedParams: Record<string, string | number> }
  >()

  const needsAutoStation = spec.widgets.some(
    (widget) =>
      ((widget.endpoint === 'patterns' || widget.endpoint === 'heatmap') &&
        widget.params?.stationId === 'auto') ||
      (widget.endpoint === 'custom' &&
        (widget.custom?.sourceEndpoint === 'patterns' ||
          widget.custom?.sourceEndpoint === 'heatmap') &&
        (!widget.custom.sourceParams?.stationId ||
          widget.custom.sourceParams.stationId === 'auto'))
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

      case 'custom': {
        if (!widget.custom) {
          throw new Error(`Custom widget ${widget.id} is missing configuration.`)
        }

        const sourceParams = {
          ...(widget.custom.sourceParams ?? {})
        }

        if (
          (widget.custom.sourceEndpoint === 'patterns' ||
            widget.custom.sourceEndpoint === 'heatmap') &&
          !sourceParams.stationId
        ) {
          sourceParams.stationId = resolvedStationId ?? 'auto'
        }

        const cacheKey = sourceCacheKey(widget.custom.sourceEndpoint, sourceParams)

        let sourcePayload = sourcePayloadCache.get(cacheKey)

        if (!sourcePayload) {
          sourcePayload = await fetchSourcePayload(
            widget.custom.sourceEndpoint,
            sourceParams,
            apiClient,
            resolvedStationId
          )

          sourcePayloadCache.set(cacheKey, sourcePayload)
        }

        resolvedParams.mode = widget.custom.mode
        resolvedParams.sourceEndpoint = widget.custom.sourceEndpoint

        for (const [key, value] of Object.entries(sourcePayload.resolvedParams)) {
          resolvedParams[`source.${key}`] = value
        }

        data = buildCustomWidgetPayload(
          widget.custom,
          sourcePayload.payload,
          sourcePayload.resolvedParams
        )
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
