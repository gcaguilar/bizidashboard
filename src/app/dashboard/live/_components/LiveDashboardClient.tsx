'use client'

import { FormEvent, useMemo, useState } from 'react'

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

const DEFAULT_REQUEST =
  'Quiero top 10 por rotacion, alertas y heatmap para station 130'

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

function summarizeData(value: unknown): string {
  if (Array.isArray(value)) {
    return `${value.length} filas`
  }

  if (!value || typeof value !== 'object') {
    return 'Sin estructura tabular'
  }

  const data = value as Record<string, unknown>
  const labels: string[] = []

  if (Array.isArray(data.stations)) {
    labels.push(`estaciones: ${data.stations.length}`)
  }

  if (Array.isArray(data.rankings)) {
    labels.push(`rankings: ${data.rankings.length}`)
  }

  if (Array.isArray(data.alerts)) {
    labels.push(`alertas: ${data.alerts.length}`)
  }

  if (Array.isArray(data.hourlySignals)) {
    labels.push(`senales: ${data.hourlySignals.length}`)
  }

  if (Array.isArray(data.dailyDemand)) {
    labels.push(`demanda: ${data.dailyDemand.length}`)
  }

  if (typeof data.generatedAt === 'string') {
    labels.push(`generado: ${data.generatedAt}`)
  }

  if (typeof data.timestamp === 'string') {
    labels.push(`timestamp: ${data.timestamp}`)
  }

  if (labels.length === 0) {
    labels.push(`campos: ${Object.keys(data).length}`)
  }

  return labels.join(' · ')
}

function isErrorResponse(value: unknown): value is LiveDashboardErrorResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const data = value as Record<string, unknown>

  return (
    typeof data.error === 'string' ||
    typeof data.details === 'string' ||
    typeof data.message === 'string'
  )
}

export function LiveDashboardClient() {
  const [requestText, setRequestText] = useState(DEFAULT_REQUEST)
  const [stationId, setStationId] = useState('')
  const [rankLimit, setRankLimit] = useState('')
  const [alertLimit, setAlertLimit] = useState('')
  const [mobilityDays, setMobilityDays] = useState('')
  const [demandDays, setDemandDays] = useState('')
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!requestText.trim()) {
      setErrorMessage('Escribe una solicitud para generar el dashboard.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    const payload: Record<string, string | number> = {
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
          Este panel usa `generate_dashboard` sobre tu propia API y devuelve
          widgets ya resueltos con datos.
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
            <article
              key={widget.id}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow)]"
            >
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
              <p className="mt-1 text-xs text-[var(--muted)]">
                Resumen: {summarizeData(widget.data)}
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
          ))}
        </div>
      ) : null}
    </div>
  )
}
