export type RankingType = 'turnover' | 'availability'

export type DashboardEndpoint =
  | 'status'
  | 'stations'
  | 'rankings'
  | 'alerts'
  | 'patterns'
  | 'heatmap'
  | 'mobility'
  | 'custom'

export type DashboardVisualization =
  | 'kpi'
  | 'map'
  | 'table'
  | 'line'
  | 'heatmap'
  | 'bar'

export type CustomWidgetSourceEndpoint = Exclude<DashboardEndpoint, 'custom'>

export type CustomWidgetMode = 'kpi' | 'table' | 'timeseries'

export type CustomWidgetDefinition = {
  id: string
  title: string
  description?: string
  sourceEndpoint: CustomWidgetSourceEndpoint
  sourceParams?: Record<string, string | number>
  mode: CustomWidgetMode
  valuePath?: string
  collectionPath?: string
  xKey?: string
  yKey?: string
  limit?: number
}

export type DashboardWidgetSpec = {
  id: string
  title: string
  description: string
  visualization: DashboardVisualization
  endpoint: DashboardEndpoint
  params?: Record<string, string | number>
  custom?: CustomWidgetDefinition
}

export type DashboardPlannerOptions = {
  stationId?: string
  rankLimit?: number
  alertLimit?: number
  mobilityDays?: number
  demandDays?: number
  customWidgets?: CustomWidgetDefinition[]
}

export type DashboardSpec = {
  request: string
  title: string
  generatedAt: string
  selectedStationId: string | null
  notes: string[]
  widgets: DashboardWidgetSpec[]
}

const DEFAULT_RANK_LIMIT = 20
const DEFAULT_ALERT_LIMIT = 50
const DEFAULT_MOBILITY_DAYS = 14
const DEFAULT_DEMAND_DAYS = 30
const MAX_CUSTOM_WIDGETS = 8

const CUSTOM_WIDGET_SOURCE_ENDPOINTS: CustomWidgetSourceEndpoint[] = [
  'status',
  'stations',
  'rankings',
  'alerts',
  'patterns',
  'heatmap',
  'mobility'
]

const CUSTOM_WIDGET_MODES: CustomWidgetMode[] = ['kpi', 'table', 'timeseries']

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)))
}

function getClampedOption(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return clampInteger(value, minimum, maximum)
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function extractTopLimit(normalizedRequest: string): number | null {
  const directMatch = normalizedRequest.match(/(?:top|limit|limite)\s*(?:de\s*)?(\d{1,3})/)

  if (directMatch?.[1]) {
    return Number.parseInt(directMatch[1], 10)
  }

  const nounMatch = normalizedRequest.match(/(\d{1,3})\s*(?:estaciones|stations|filas|rows)/)

  if (nounMatch?.[1]) {
    return Number.parseInt(nounMatch[1], 10)
  }

  return null
}

function extractDays(normalizedRequest: string): number | null {
  const match = normalizedRequest.match(
    /(?:ultimos|ultimas|last)\s*(\d{1,3})\s*(?:dias|days)/
  )

  if (!match?.[1]) {
    return null
  }

  return Number.parseInt(match[1], 10)
}

function extractStationId(input: string): string | null {
  const match = input.match(
    /(?:station(?:\s*id)?|station[_-]id|estacion(?:\s*id)?|estacion[_-]id)\s*[:=#]?\s*([a-zA-Z0-9_-]{1,40})/i
  )

  if (!match?.[1]) {
    return null
  }

  return match[1]
}

function formatTitle(request: string): string {
  const sanitized = request.trim().replace(/\s+/g, ' ')
  if (!sanitized) {
    return 'Dashboard operativo Bizi'
  }

  return `Dashboard: ${sanitized.slice(0, 72)}`
}

function isCustomWidgetSourceEndpoint(
  value: string
): value is CustomWidgetSourceEndpoint {
  return CUSTOM_WIDGET_SOURCE_ENDPOINTS.includes(
    value as CustomWidgetSourceEndpoint
  )
}

function isCustomWidgetMode(value: string): value is CustomWidgetMode {
  return CUSTOM_WIDGET_MODES.includes(value as CustomWidgetMode)
}

function sanitizeWidgetId(value: string, index: number): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)

  if (normalized) {
    return normalized
  }

  return `widget_${index + 1}`
}

function sanitizeFieldPath(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim().replace(/\s+/g, '')

  if (!normalized) {
    return undefined
  }

  return normalized.slice(0, 100)
}

function sanitizeCustomWidgets(
  customWidgets: CustomWidgetDefinition[] | undefined
): CustomWidgetDefinition[] {
  if (!Array.isArray(customWidgets) || customWidgets.length === 0) {
    return []
  }

  const sanitized: CustomWidgetDefinition[] = []

  for (const [index, rawWidget] of customWidgets.entries()) {
    if (!rawWidget || typeof rawWidget !== 'object') {
      continue
    }

    const sourceEndpoint = String(rawWidget.sourceEndpoint)
    const mode = String(rawWidget.mode)
    const title = String(rawWidget.title ?? '').trim().slice(0, 100)

    if (!isCustomWidgetSourceEndpoint(sourceEndpoint)) {
      continue
    }

    if (!isCustomWidgetMode(mode)) {
      continue
    }

    if (!title) {
      continue
    }

    const id = sanitizeWidgetId(String(rawWidget.id ?? ''), index)
    const description =
      typeof rawWidget.description === 'string' && rawWidget.description.trim()
        ? rawWidget.description.trim().slice(0, 220)
        : undefined

    const sourceParams =
      rawWidget.sourceParams && typeof rawWidget.sourceParams === 'object'
        ? rawWidget.sourceParams
        : undefined

    const limit =
      typeof rawWidget.limit === 'number' && Number.isInteger(rawWidget.limit)
        ? clampInteger(rawWidget.limit, 1, 200)
        : undefined

    sanitized.push({
      id,
      title,
      description,
      sourceEndpoint,
      sourceParams,
      mode,
      valuePath: sanitizeFieldPath(rawWidget.valuePath),
      collectionPath: sanitizeFieldPath(rawWidget.collectionPath),
      xKey: sanitizeFieldPath(rawWidget.xKey),
      yKey: sanitizeFieldPath(rawWidget.yKey),
      limit
    })

    if (sanitized.length >= MAX_CUSTOM_WIDGETS) {
      break
    }
  }

  return sanitized
}

function getVisualizationForCustomMode(mode: CustomWidgetMode): DashboardVisualization {
  if (mode === 'kpi') {
    return 'kpi'
  }

  if (mode === 'table') {
    return 'table'
  }

  return 'line'
}

function addWidget(
  widgets: DashboardWidgetSpec[],
  knownIds: Set<string>,
  widget: DashboardWidgetSpec
): void {
  if (knownIds.has(widget.id)) {
    return
  }

  knownIds.add(widget.id)
  widgets.push(widget)
}

export function buildDashboardSpec(
  request: string,
  options: DashboardPlannerOptions = {}
): DashboardSpec {
  const normalizedRequest = normalizeText(request)
  const stationFromRequest = extractStationId(normalizedRequest)
  const selectedStationId = options.stationId ?? stationFromRequest

  const extractedTopLimit = extractTopLimit(normalizedRequest)
  const extractedDays = extractDays(normalizedRequest)

  const rankLimit = getClampedOption(
    options.rankLimit ?? extractedTopLimit ?? undefined,
    DEFAULT_RANK_LIMIT,
    1,
    100
  )

  const alertLimit = getClampedOption(
    options.alertLimit ?? extractedTopLimit ?? undefined,
    DEFAULT_ALERT_LIMIT,
    1,
    200
  )

  const mobilityDays = getClampedOption(
    options.mobilityDays ?? extractedDays ?? undefined,
    DEFAULT_MOBILITY_DAYS,
    1,
    90
  )

  const demandDays = getClampedOption(
    options.demandDays ?? extractedDays ?? undefined,
    DEFAULT_DEMAND_DAYS,
    1,
    120
  )

  const customWidgets = sanitizeCustomWidgets(options.customWidgets)

  const wantsStatus = containsAny(normalizedRequest, [
    'status',
    'estado',
    'health',
    'salud',
    'pipeline'
  ])

  const wantsStations =
    containsAny(normalizedRequest, [
      'estaciones',
      'stations',
      'mapa',
      'map',
      'ubicacion',
      'geograf'
    ]) || selectedStationId !== null

  const wantsRanking = containsAny(normalizedRequest, [
    'ranking',
    'rankings',
    'top',
    'rotacion',
    'turnover',
    'availability',
    'disponibilidad'
  ])

  const wantsTurnover = containsAny(normalizedRequest, [
    'turnover',
    'rotacion',
    'rotational'
  ])

  const wantsAvailability = containsAny(normalizedRequest, [
    'availability',
    'disponibilidad',
    'ocupacion',
    'occupancy'
  ])

  const wantsAlerts = containsAny(normalizedRequest, [
    'alerta',
    'alertas',
    'alert',
    'alerts',
    'incidencia',
    'riesgo'
  ])

  const wantsPatterns = containsAny(normalizedRequest, [
    'pattern',
    'patterns',
    'patron',
    'patrones',
    'weekday',
    'weekend'
  ])

  const wantsHeatmap = containsAny(normalizedRequest, [
    'heatmap',
    'calor',
    'intensidad'
  ])

  const wantsMobility = containsAny(normalizedRequest, [
    'movilidad',
    'mobility',
    'demanda',
    'demand',
    'origen destino',
    'o-d'
  ])

  const widgets: DashboardWidgetSpec[] = []
  const knownIds = new Set<string>()

  if (wantsStatus) {
    addWidget(widgets, knownIds, {
      id: 'status_overview',
      title: 'Estado del pipeline',
      description: 'Salud operativa y calidad de datos de la ingesta.',
      visualization: 'kpi',
      endpoint: 'status'
    })
  }

  if (wantsStations) {
    addWidget(widgets, knownIds, {
      id: 'stations_map',
      title: 'Mapa de estaciones',
      description: 'Disponibilidad actual de bicis y anclajes por estacion.',
      visualization: 'map',
      endpoint: 'stations'
    })
  }

  if (wantsTurnover && wantsAvailability) {
    addWidget(widgets, knownIds, {
      id: 'rankings_turnover',
      title: 'Ranking por rotacion',
      description: 'Top estaciones por score de rotacion reciente.',
      visualization: 'table',
      endpoint: 'rankings',
      params: {
        type: 'turnover',
        limit: rankLimit
      }
    })

    addWidget(widgets, knownIds, {
      id: 'rankings_availability',
      title: 'Ranking por disponibilidad',
      description: 'Top estaciones por comportamiento de disponibilidad.',
      visualization: 'table',
      endpoint: 'rankings',
      params: {
        type: 'availability',
        limit: rankLimit
      }
    })
  } else if (wantsTurnover) {
    addWidget(widgets, knownIds, {
      id: 'rankings_turnover',
      title: 'Ranking por rotacion',
      description: 'Top estaciones por score de rotacion reciente.',
      visualization: 'table',
      endpoint: 'rankings',
      params: {
        type: 'turnover',
        limit: rankLimit
      }
    })
  } else if (wantsAvailability || wantsRanking) {
    addWidget(widgets, knownIds, {
      id: 'rankings_availability',
      title: 'Ranking por disponibilidad',
      description: 'Top estaciones por comportamiento de disponibilidad.',
      visualization: 'table',
      endpoint: 'rankings',
      params: {
        type: 'availability',
        limit: rankLimit
      }
    })
  }

  if (wantsAlerts) {
    addWidget(widgets, knownIds, {
      id: 'active_alerts',
      title: 'Alertas activas',
      description: 'Alertas de estaciones en estado critico o de riesgo.',
      visualization: 'table',
      endpoint: 'alerts',
      params: {
        limit: alertLimit
      }
    })
  }

  if (wantsPatterns) {
    addWidget(widgets, knownIds, {
      id: 'station_patterns',
      title: 'Patrones horarios',
      description: 'Comportamiento promedio por hora en dia laboral y fin de semana.',
      visualization: 'line',
      endpoint: 'patterns',
      params: {
        stationId: selectedStationId ?? 'auto'
      }
    })
  }

  if (wantsHeatmap) {
    addWidget(widgets, knownIds, {
      id: 'station_heatmap',
      title: 'Heatmap de ocupacion',
      description: 'Intensidad de ocupacion por dia de semana y hora.',
      visualization: 'heatmap',
      endpoint: 'heatmap',
      params: {
        stationId: selectedStationId ?? 'auto'
      }
    })
  }

  if (wantsMobility) {
    addWidget(widgets, knownIds, {
      id: 'mobility_signals',
      title: 'Senales de movilidad',
      description: 'Llegadas, salidas y curva de demanda diaria estimada.',
      visualization: 'bar',
      endpoint: 'mobility',
      params: {
        mobilityDays,
        demandDays
      }
    })
  }

  for (const customWidget of customWidgets) {
    addWidget(widgets, knownIds, {
      id: `custom_${customWidget.id}`,
      title: customWidget.title,
      description:
        customWidget.description ??
        `Widget ad hoc desde ${customWidget.sourceEndpoint}.`,
      visualization: getVisualizationForCustomMode(customWidget.mode),
      endpoint: 'custom',
      params: {
        mode: customWidget.mode,
        sourceEndpoint: customWidget.sourceEndpoint,
        ...(customWidget.sourceParams ?? {})
      },
      custom: customWidget
    })
  }

  const notes: string[] = []

  if (widgets.length === 0) {
    addWidget(widgets, knownIds, {
      id: 'status_overview',
      title: 'Estado del pipeline',
      description: 'Salud operativa y calidad de datos de la ingesta.',
      visualization: 'kpi',
      endpoint: 'status'
    })

    addWidget(widgets, knownIds, {
      id: 'stations_map',
      title: 'Mapa de estaciones',
      description: 'Disponibilidad actual de bicis y anclajes por estacion.',
      visualization: 'map',
      endpoint: 'stations'
    })

    addWidget(widgets, knownIds, {
      id: 'rankings_availability',
      title: 'Ranking por disponibilidad',
      description: 'Top estaciones por comportamiento de disponibilidad.',
      visualization: 'table',
      endpoint: 'rankings',
      params: {
        type: 'availability',
        limit: rankLimit
      }
    })

    addWidget(widgets, knownIds, {
      id: 'active_alerts',
      title: 'Alertas activas',
      description: 'Alertas de estaciones en estado critico o de riesgo.',
      visualization: 'table',
      endpoint: 'alerts',
      params: {
        limit: alertLimit
      }
    })

    notes.push(
      'No se detectaron metricas concretas en la solicitud. Se genero un dashboard operativo por defecto.'
    )
  }

  const requiresStationSelection = widgets.some(
    (widget) =>
      (widget.endpoint === 'patterns' || widget.endpoint === 'heatmap') &&
      widget.params?.stationId === 'auto'
  )

  if (requiresStationSelection) {
    notes.push(
      'No se indico stationId para widgets de patrones/heatmap. El generador puede resolverlo automaticamente con la primera estacion disponible.'
    )
  }

  if (customWidgets.length > 0) {
    notes.push(
      `Se anadieron ${customWidgets.length} widgets ad hoc definidos por customWidgets.`
    )
  }

  return {
    request: request.trim(),
    title: formatTitle(request),
    generatedAt: new Date().toISOString(),
    selectedStationId,
    notes,
    widgets
  }
}
