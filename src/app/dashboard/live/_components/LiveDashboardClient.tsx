'use client'

import { FormEvent, useMemo, useState } from 'react'
import type {
  AlertsResponse,
  HeatmapCell,
  RankingsResponse,
  StationPatternRow,
  StationSnapshot,
  StationsResponse,
  StatusResponse
} from '@/lib/api'
import { AlertsPanel } from '@/app/dashboard/_components/AlertsPanel'
import { Heatmap } from '@/app/dashboard/_components/Heatmap'
import { HourlyCharts } from '@/app/dashboard/_components/HourlyCharts'
import { MapPanel } from '@/app/dashboard/_components/MapPanel'
import { StatusBanner } from '@/app/dashboard/_components/StatusBanner'
import { formatPercent } from '@/lib/format'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

type LiveDashboardWidget = {
  id: string
  title: string
  description: string
  visualization: string
  endpoint: string
  resolvedParams: Record<string, string | number>
  fetchedAt: string
  data: unknown
}

type LiveDashboardResponse = {
  request: string
  title: string
  generatedAt: string
  selectedStationId: string | null
  notes: string[]
  widgets: LiveDashboardWidget[]
}

type LiveDashboardErrorResponse = {
  error?: string
  details?: string
  message?: string
}

type CustomWidgetSourceEndpoint =
  | 'status'
  | 'stations'
  | 'rankings'
  | 'alerts'
  | 'patterns'
  | 'heatmap'
  | 'mobility'

type CustomWidgetMode = 'kpi' | 'table' | 'timeseries'

type CustomWidgetInput = {
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

type LiveDashboardRequestPayload = {
  request: string
  stationId?: string
  rankLimit?: number
  alertLimit?: number
  mobilityDays?: number
  demandDays?: number
  customWidgets?: CustomWidgetInput[]
}

type MobilitySignalRow = {
  stationId: string
  hour: number
  departures: number
  arrivals: number
  sampleCount: number
}

type DailyDemandRow = {
  day: string
  demandScore: number
  avgOccupancy: number
  sampleCount: number
}

type MobilityPayload = {
  mobilityDays: number
  demandDays: number
  methodology: string
  hourlySignals: MobilitySignalRow[]
  dailyDemand: DailyDemandRow[]
  generatedAt: string
}

type CustomKpiPayload = {
  kind: 'custom'
  mode: 'kpi'
  title: string
  valuePath: string | null
  value: string | number | boolean | null
  sourceEndpoint: string
  sourceParams: Record<string, string | number>
}

type CustomTablePayload = {
  kind: 'custom'
  mode: 'table'
  title: string
  collectionPath: string | null
  columns: string[]
  rows: Record<string, unknown>[]
  sourceEndpoint: string
  sourceParams: Record<string, string | number>
}

type CustomTimeseriesPayload = {
  kind: 'custom'
  mode: 'timeseries'
  title: string
  collectionPath: string | null
  xKey: string
  yKey: string
  points: Array<{ x: unknown; y: number }>
  sourceEndpoint: string
  sourceParams: Record<string, string | number>
}

type CustomWidgetPayload =
  | CustomKpiPayload
  | CustomTablePayload
  | CustomTimeseriesPayload

const DEFAULT_REQUEST =
  'Quiero top 10 por rotacion, alertas y heatmap para station 130'

const CUSTOM_SOURCE_ENDPOINTS: CustomWidgetSourceEndpoint[] = [
  'status',
  'stations',
  'rankings',
  'alerts',
  'patterns',
  'heatmap',
  'mobility'
]

const CUSTOM_MODES: CustomWidgetMode[] = ['kpi', 'table', 'timeseries']

const CUSTOM_WIDGETS_SAMPLE = `[
  {
    "id": "rows_total",
    "title": "Filas totales del pipeline",
    "sourceEndpoint": "status",
    "mode": "kpi",
    "valuePath": "pipeline.totalRowsCollected"
  }
]`

function parseOptionalInteger(value: string): number | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  const parsed = Number.parseInt(trimmed, 10)

  if (!Number.isInteger(parsed)) {
    return undefined
  }

  return parsed
}

function stringifyJson(value: unknown): string {
  const text = JSON.stringify(value, null, 2)
  const maxLength = 9_000

  if (!text) {
    return 'null'
  }

  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength)}\n... (truncated)`
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function parseCustomWidgetsJson(input: string): CustomWidgetInput[] | undefined {
  const trimmed = input.trim()

  if (!trimmed) {
    return undefined
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error('customWidgets debe ser JSON valido (array).')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('customWidgets debe ser un array JSON.')
  }

  if (parsed.length > 8) {
    throw new Error('customWidgets permite maximo 8 widgets.')
  }

  const validated: CustomWidgetInput[] = []

  for (const [index, item] of parsed.entries()) {
    if (!isObject(item)) {
      throw new Error(`customWidgets[${index}] debe ser un objeto.`)
    }

    const id = typeof item.id === 'string' ? item.id.trim() : ''
    const title = typeof item.title === 'string' ? item.title.trim() : ''
    const sourceEndpoint =
      typeof item.sourceEndpoint === 'string' ? item.sourceEndpoint : ''
    const mode = typeof item.mode === 'string' ? item.mode : ''

    if (!id || !title) {
      throw new Error(`customWidgets[${index}] necesita id y title.`)
    }

    if (!CUSTOM_SOURCE_ENDPOINTS.includes(sourceEndpoint as CustomWidgetSourceEndpoint)) {
      throw new Error(
        `customWidgets[${index}].sourceEndpoint invalido: ${sourceEndpoint}`
      )
    }

    if (!CUSTOM_MODES.includes(mode as CustomWidgetMode)) {
      throw new Error(`customWidgets[${index}].mode invalido: ${mode}`)
    }

    const sourceParams = item.sourceParams

    if (sourceParams !== undefined) {
      if (!isObject(sourceParams)) {
        throw new Error(`customWidgets[${index}].sourceParams debe ser objeto.`)
      }

      for (const [key, value] of Object.entries(sourceParams)) {
        if (!(typeof value === 'string' || typeof value === 'number')) {
          throw new Error(
            `customWidgets[${index}].sourceParams.${key} debe ser string o number.`
          )
        }
      }
    }

    validated.push(item as CustomWidgetInput)
  }

  return validated
}

function isErrorResponse(value: unknown): value is LiveDashboardErrorResponse {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.error === 'string' ||
    typeof value.details === 'string' ||
    typeof value.message === 'string'
  )
}

function isStationsPayload(value: unknown): value is StationsResponse {
  return isObject(value) && Array.isArray(value.stations)
}

function isStatusPayload(value: unknown): value is StatusResponse {
  return (
    isObject(value) &&
    isObject(value.pipeline) &&
    isObject(value.quality) &&
    isObject(value.system)
  )
}

function isRankingsPayload(value: unknown): value is RankingsResponse {
  return (
    isObject(value) &&
    (value.type === 'turnover' || value.type === 'availability') &&
    Array.isArray(value.rankings)
  )
}

function isAlertsPayload(value: unknown): value is AlertsResponse {
  return isObject(value) && Array.isArray(value.alerts)
}

function isMobilityPayload(value: unknown): value is MobilityPayload {
  return (
    isObject(value) &&
    Array.isArray(value.hourlySignals) &&
    Array.isArray(value.dailyDemand)
  )
}

function isCustomWidgetPayload(value: unknown): value is CustomWidgetPayload {
  if (!isObject(value)) {
    return false
  }

  if (value.kind !== 'custom') {
    return false
  }

  if (value.mode === 'kpi') {
    return 'value' in value
  }

  if (value.mode === 'table') {
    return Array.isArray(value.columns) && Array.isArray(value.rows)
  }

  if (value.mode === 'timeseries') {
    return (
      typeof value.xKey === 'string' &&
      typeof value.yKey === 'string' &&
      Array.isArray(value.points)
    )
  }

  return false
}

function getStationName(stationId: string, stations: StationSnapshot[]): string {
  const station = stations.find((item) => item.id === stationId)

  if (!station) {
    return `Estacion ${stationId}`
  }

  return station.name
}

function resolveWidgetStationId(
  widget: LiveDashboardWidget,
  dashboardStationId: string | null,
  stations: StationSnapshot[]
): string {
  const paramValue = widget.resolvedParams.stationId

  if (typeof paramValue === 'string' && paramValue) {
    return paramValue
  }

  if (typeof paramValue === 'number') {
    return String(paramValue)
  }

  if (dashboardStationId) {
    return dashboardStationId
  }

  return stations[0]?.id ?? ''
}

function getWidgetGridClass(widget: LiveDashboardWidget): string {
  if (widget.endpoint === 'custom' && widget.visualization === 'line') {
    return 'md:col-span-2'
  }

  if (
    widget.endpoint === 'status' ||
    widget.endpoint === 'stations' ||
    widget.endpoint === 'mobility' ||
    widget.endpoint === 'heatmap'
  ) {
    return 'md:col-span-2'
  }

  return 'md:col-span-1'
}

function getDayLabel(value: string): string {
  if (value.length >= 10 && value[4] === '-' && value[7] === '-') {
    return `${value.slice(8, 10)}/${value.slice(5, 7)}`
  }

  return value
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return String(value)
    }

    return value.toFixed(2)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return JSON.stringify(value)
}

function toAxisLabel(value: unknown): string {
  if (typeof value === 'string') {
    return getDayLabel(value)
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return 'n/a'
}

function FallbackWidget({ widget }: { widget: LiveDashboardWidget }) {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          {widget.title}
        </h3>
        <span className="rounded-full bg-[#f3ece2] px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
          {widget.endpoint}
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">{widget.description}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Visualizacion: {widget.visualization} · Cargado: {widget.fetchedAt}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Parametros: {JSON.stringify(widget.resolvedParams)}
      </p>
      <details className="mt-3 rounded-xl border border-[var(--border)] bg-[#fcf8f2] px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-[var(--foreground)]">
          Ver JSON del widget
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto text-[11px] leading-5 text-[var(--foreground)]">
          {stringifyJson(widget.data)}
        </pre>
      </details>
    </article>
  )
}

function LiveRankingsWidget({
  rankings,
  stations,
  title
}: {
  rankings: RankingsResponse
  stations: StationSnapshot[]
  title: string
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
          <p className="text-xs text-[var(--muted)]">
            Ranking {rankings.type === 'turnover' ? 'por rotacion' : 'por disponibilidad'}
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {rankings.rankings.length} filas
        </span>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-[#f8f3eb] text-[var(--muted)]">
            <tr className="text-left">
              <th className="px-3 py-2">Estacion</th>
              <th className="px-3 py-2 text-right">Score</th>
              <th className="px-3 py-2 text-right">H vacia</th>
              <th className="px-3 py-2 text-right">H llena</th>
              <th className="px-3 py-2 text-right">% problema</th>
            </tr>
          </thead>
          <tbody>
            {rankings.rankings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-[var(--muted)]">
                  Sin filas para este ranking.
                </td>
              </tr>
            ) : (
              rankings.rankings.map((row) => {
                const problemHours = row.emptyHours + row.fullHours
                const problemRate =
                  row.totalHours > 0 ? (problemHours / row.totalHours) * 100 : 0

                return (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">
                      <p className="font-medium text-[var(--foreground)]">
                        {getStationName(row.stationId, stations)}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                        {row.stationId}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.turnoverScore.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-right">{row.emptyHours}</td>
                    <td className="px-3 py-2 text-right">{row.fullHours}</td>
                    <td className="px-3 py-2 text-right">{formatPercent(problemRate)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function LiveMobilityWidget({
  mobility,
  title
}: {
  mobility: MobilityPayload
  title: string
}) {
  const hourlyData = useMemo(() => {
    const byHour = new Map<number, { hour: number; arrivals: number; departures: number }>()

    for (let hour = 0; hour < 24; hour += 1) {
      byHour.set(hour, { hour, arrivals: 0, departures: 0 })
    }

    for (const row of mobility.hourlySignals) {
      const hour = Number(row.hour)

      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        continue
      }

      const current = byHour.get(hour)

      if (!current) {
        continue
      }

      current.arrivals += Number(row.arrivals) || 0
      current.departures += Number(row.departures) || 0
    }

    return Array.from(byHour.values())
      .sort((a, b) => a.hour - b.hour)
      .map((row) => ({
        ...row,
        label: `${String(row.hour).padStart(2, '0')}:00`,
        volume: row.arrivals + row.departures
      }))
  }, [mobility.hourlySignals])

  const demandData = useMemo(
    () =>
      mobility.dailyDemand.map((row) => ({
        ...row,
        label: getDayLabel(row.day),
        avgOccupancyPercent: Number(row.avgOccupancy) * 100
      })),
    [mobility.dailyDemand]
  )

  const totalArrivals = hourlyData.reduce((sum, row) => sum + row.arrivals, 0)
  const totalDepartures = hourlyData.reduce((sum, row) => sum + row.departures, 0)
  const peakHour =
    hourlyData.reduce(
      (best, row) => (row.volume > best.volume ? row : best),
      hourlyData[0] ?? { hour: 0, label: '00:00', arrivals: 0, departures: 0, volume: 0 }
    ) ?? null

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
        <p className="text-xs text-[var(--muted)]">
          Movilidad ({mobility.mobilityDays} dias) · Demanda ({mobility.demandDays} dias)
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Llegadas
          </p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {totalArrivals.toFixed(0)}
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Salidas
          </p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {totalDepartures.toFixed(0)}
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Hora pico
          </p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {peakHour ? peakHour.label : 'sin datos'}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Flujo por hora
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlyData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ece3d6" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={14} />
              <YAxis tick={{ fontSize: 11 }} width={38} />
              <Tooltip />
              <Legend />
              <Bar dataKey="arrivals" name="Llegadas" fill="#1f7a8c" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="departures"
                name="Salidas"
                fill="#d97706"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Curva de demanda
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={demandData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ece3d6" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={14} />
              <YAxis tick={{ fontSize: 11 }} width={38} />
              <Tooltip
                formatter={(value, name) => {
                  const metricName = typeof name === 'string' ? name : 'Valor'
                  const numericValue = Number(value)

                  if (metricName === 'Ocupacion media') {
                    return [formatPercent(numericValue), metricName]
                  }

                  return [numericValue.toFixed(1), metricName]
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="demandScore"
                name="Demanda"
                stroke="#c85c2d"
                fill="#e07a3f55"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="avgOccupancyPercent"
                name="Ocupacion media"
                stroke="#0f766e"
                fill="#0f766e2a"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-[var(--muted)]">{mobility.methodology}</p>
    </section>
  )
}

function LiveCustomWidget({
  widget,
  payload
}: {
  widget: LiveDashboardWidget
  payload: CustomWidgetPayload
}) {
  if (payload.mode === 'kpi') {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
        <header className="mb-3">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{widget.title}</h3>
          <p className="text-xs text-[var(--muted)]">{widget.description}</p>
        </header>
        <div className="rounded-2xl border border-[var(--border)] bg-white px-5 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            KPI ad hoc
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
            {formatCellValue(payload.value)}
          </p>
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            Fuente: {payload.sourceEndpoint}
            {payload.valuePath ? ` · path: ${payload.valuePath}` : ''}
          </p>
        </div>
      </section>
    )
  }

  if (payload.mode === 'table') {
    const columns = payload.columns.length > 0 ? payload.columns : ['value']

    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
        <header className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">{widget.title}</h3>
            <p className="text-xs text-[var(--muted)]">{widget.description}</p>
          </div>
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            {payload.rows.length} filas
          </span>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
          <table className="min-w-full text-xs">
            <thead className="bg-[#f8f3eb] text-[var(--muted)]">
              <tr className="text-left">
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payload.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-4 text-center text-[var(--muted)]"
                  >
                    Sin filas para este panel ad hoc.
                  </td>
                </tr>
              ) : (
                payload.rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="border-t border-[var(--border)]">
                    {columns.map((column) => (
                      <td key={`${rowIndex}-${column}`} className="px-3 py-2">
                        {formatCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const chartData = payload.points.map((point, index) => ({
    index,
    xLabel: toAxisLabel(point.x),
    yValue: point.y
  }))

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header className="mb-3">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{widget.title}</h3>
        <p className="text-xs text-[var(--muted)]">
          Serie ad hoc · {payload.xKey} vs {payload.yKey}
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece3d6" />
            <XAxis dataKey="xLabel" tick={{ fontSize: 11 }} minTickGap={14} />
            <YAxis tick={{ fontSize: 11 }} width={38} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="yValue"
              name={payload.yKey}
              stroke="#1f7a8c"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export function LiveDashboardClient() {
  const [requestText, setRequestText] = useState(DEFAULT_REQUEST)
  const [stationId, setStationId] = useState('')
  const [rankLimit, setRankLimit] = useState('')
  const [alertLimit, setAlertLimit] = useState('')
  const [mobilityDays, setMobilityDays] = useState('')
  const [demandDays, setDemandDays] = useState('')
  const [customWidgetsJson, setCustomWidgetsJson] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<LiveDashboardResponse | null>(null)

  const widgetCount = dashboard?.widgets.length ?? 0

  const widgetBadges = useMemo(() => {
    if (!dashboard) {
      return []
    }

    return dashboard.widgets.map((widget) => `${widget.endpoint}:${widget.visualization}`)
  }, [dashboard])

  const stationsContext = useMemo(() => {
    if (!dashboard) {
      return {
        stations: [] as StationSnapshot[],
        generatedAt: null as string | null
      }
    }

    for (const widget of dashboard.widgets) {
      if (widget.endpoint === 'stations' && isStationsPayload(widget.data)) {
        return {
          stations: widget.data.stations,
          generatedAt:
            typeof widget.data.generatedAt === 'string' ? widget.data.generatedAt : null
        }
      }
    }

    return {
      stations: [] as StationSnapshot[],
      generatedAt: null as string | null
    }
  }, [dashboard])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!requestText.trim()) {
      setErrorMessage('Escribe una solicitud para generar el dashboard.')
      return
    }

    let parsedCustomWidgets: CustomWidgetInput[] | undefined

    try {
      parsedCustomWidgets = parseCustomWidgetsJson(customWidgetsJson)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error))
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    const payload: LiveDashboardRequestPayload = {
      request: requestText.trim()
    }

    if (stationId.trim()) {
      payload.stationId = stationId.trim()
    }

    const nextRankLimit = parseOptionalInteger(rankLimit)
    const nextAlertLimit = parseOptionalInteger(alertLimit)
    const nextMobilityDays = parseOptionalInteger(mobilityDays)
    const nextDemandDays = parseOptionalInteger(demandDays)

    if (typeof nextRankLimit === 'number') {
      payload.rankLimit = nextRankLimit
    }

    if (typeof nextAlertLimit === 'number') {
      payload.alertLimit = nextAlertLimit
    }

    if (typeof nextMobilityDays === 'number') {
      payload.mobilityDays = nextMobilityDays
    }

    if (typeof nextDemandDays === 'number') {
      payload.demandDays = nextDemandDays
    }

    if (parsedCustomWidgets && parsedCustomWidgets.length > 0) {
      payload.customWidgets = parsedCustomWidgets
    }

    try {
      const response = await fetch('/api/dashboard/live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const body = (await response.json()) as
        | LiveDashboardResponse
        | LiveDashboardErrorResponse

      if (!response.ok) {
        const details = isErrorResponse(body)
          ? body.details ?? body.message ?? body.error
          : null

        throw new Error(details ?? 'No se pudo generar el dashboard solicitado.')
      }

      setDashboard(body as LiveDashboardResponse)
    } catch (error) {
      setDashboard(null)
      setErrorMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const renderWidget = (widget: LiveDashboardWidget) => {
    if (widget.endpoint === 'status' && isStatusPayload(widget.data)) {
      return (
        <StatusBanner
          status={widget.data}
          stationsGeneratedAt={stationsContext.generatedAt ?? undefined}
        />
      )
    }

    if (widget.endpoint === 'stations' && isStationsPayload(widget.data)) {
      const selectedId =
        dashboard?.selectedStationId ?? widget.data.stations[0]?.id ?? undefined

      return <MapPanel stations={widget.data.stations} selectedStationId={selectedId} />
    }

    if (widget.endpoint === 'rankings' && isRankingsPayload(widget.data)) {
      return (
        <LiveRankingsWidget
          rankings={widget.data}
          stations={stationsContext.stations}
          title={widget.title}
        />
      )
    }

    if (widget.endpoint === 'alerts' && isAlertsPayload(widget.data)) {
      return (
        <AlertsPanel
          alerts={widget.data}
          stations={stationsContext.stations.length > 0 ? stationsContext.stations : undefined}
        />
      )
    }

    if (widget.endpoint === 'patterns' && Array.isArray(widget.data)) {
      const stationIdForWidget = resolveWidgetStationId(
        widget,
        dashboard?.selectedStationId ?? null,
        stationsContext.stations
      )

      return (
        <HourlyCharts
          stationId={stationIdForWidget}
          stationName={getStationName(stationIdForWidget, stationsContext.stations)}
          patterns={widget.data as StationPatternRow[]}
        />
      )
    }

    if (widget.endpoint === 'heatmap' && Array.isArray(widget.data)) {
      const stationIdForWidget = resolveWidgetStationId(
        widget,
        dashboard?.selectedStationId ?? null,
        stationsContext.stations
      )

      return (
        <Heatmap
          stationId={stationIdForWidget}
          stationName={getStationName(stationIdForWidget, stationsContext.stations)}
          heatmap={widget.data as HeatmapCell[]}
        />
      )
    }

    if (widget.endpoint === 'mobility' && isMobilityPayload(widget.data)) {
      return <LiveMobilityWidget mobility={widget.data} title={widget.title} />
    }

    if (widget.endpoint === 'custom' && isCustomWidgetPayload(widget.data)) {
      return <LiveCustomWidget widget={widget} payload={widget.data} />
    }

    return <FallbackWidget widget={widget} />
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
          Dashboard Live Builder
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          Genera paneles al vuelo con lenguaje natural
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Este panel usa `generate_dashboard` y renderiza widgets reales sobre los
          datos devueltos por la API.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 shadow-[var(--shadow)]"
      >
        <label
          htmlFor="dashboard-request"
          className="text-sm font-medium text-[var(--foreground)]"
        >
          Solicitud
        </label>
        <textarea
          id="dashboard-request"
          value={requestText}
          onChange={(event) => setRequestText(event.target.value)}
          rows={4}
          className="mt-2 w-full resize-y rounded-2xl border border-[var(--border)] bg-[#fffaf4] px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-0 focus:border-[var(--accent)]"
          placeholder="Ejemplo: Quiero estado del pipeline, mapa de estaciones y top 15 de disponibilidad"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={stationId}
            onChange={(event) => setStationId(event.target.value)}
            placeholder="stationId opcional"
            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            value={rankLimit}
            onChange={(event) => setRankLimit(event.target.value)}
            placeholder="rankLimit"
            inputMode="numeric"
            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            value={alertLimit}
            onChange={(event) => setAlertLimit(event.target.value)}
            placeholder="alertLimit"
            inputMode="numeric"
            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            value={mobilityDays}
            onChange={(event) => setMobilityDays(event.target.value)}
            placeholder="mobilityDays"
            inputMode="numeric"
            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            value={demandDays}
            onChange={(event) => setDemandDays(event.target.value)}
            placeholder="demandDays"
            inputMode="numeric"
            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <details className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fcf8f2] px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">
            Widgets ad hoc (JSON opcional)
          </summary>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Pega un array JSON de `customWidgets` para pedir panels dinamicos sobre
            datos existentes.
          </p>
          <textarea
            value={customWidgetsJson}
            onChange={(event) => setCustomWidgetsJson(event.target.value)}
            rows={10}
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            placeholder={CUSTOM_WIDGETS_SAMPLE}
          />
        </details>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Generando...' : 'Generar dashboard'}
          </button>
          <a
            href="/dashboard"
            className="text-sm text-[var(--teal)] underline decoration-[var(--border)] underline-offset-3 hover:text-[var(--foreground)]"
          >
            Ver dashboard clasico
          </a>
        </div>
      </form>

      {errorMessage ? (
        <section className="rounded-2xl border border-[#f2d08f] bg-[#fff5d7] px-4 py-3 text-sm text-[#8a5b00]">
          {errorMessage}
        </section>
      ) : null}

      {dashboard ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {dashboard.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Widgets: {widgetCount} · Estacion seleccionada:{' '}
            {dashboard.selectedStationId ?? 'auto'} · Generado: {dashboard.generatedAt}
          </p>
          {widgetBadges.length > 0 ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              {widgetBadges.join(' · ')}
            </p>
          ) : null}
          {dashboard.notes.length > 0 ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              {dashboard.notes.join(' | ')}
            </p>
          ) : null}
        </section>
      ) : null}

      {dashboard ? (
        <div className="grid gap-5 md:grid-cols-2">
          {dashboard.widgets.map((widget) => (
            <div key={widget.id} className={getWidgetGridClass(widget)}>
              {renderWidget(widget)}
              <details className="mt-2 rounded-xl border border-[var(--border)] bg-[#fcf8f2] px-3 py-2">
                <summary className="cursor-pointer text-xs font-medium text-[var(--foreground)]">
                  Debug JSON · {widget.endpoint}
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto text-[11px] leading-5 text-[var(--foreground)]">
                  {stringifyJson(widget.data)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
