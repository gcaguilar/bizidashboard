import { describe, expect, it } from 'vitest'
import { buildDashboardSpec } from '../src/mcp/dashboard-planner'

describe('dashboard planner', () => {
  it('builds a turnover ranking and alerts dashboard from Spanish input', () => {
    const spec = buildDashboardSpec('Quiero top 10 de rotacion y alertas activas')

    const rankingWidget = spec.widgets.find(
      (widget) => widget.id === 'rankings_turnover'
    )
    const alertsWidget = spec.widgets.find(
      (widget) => widget.id === 'active_alerts'
    )

    expect(rankingWidget?.endpoint).toBe('rankings')
    expect(rankingWidget?.params?.type).toBe('turnover')
    expect(rankingWidget?.params?.limit).toBe(10)

    expect(alertsWidget?.endpoint).toBe('alerts')
    expect(alertsWidget?.params?.limit).toBe(10)
  })

  it('keeps explicit stationId for patterns and heatmap widgets', () => {
    const spec = buildDashboardSpec('Necesito patrones y heatmap para station 321')

    const patternWidget = spec.widgets.find(
      (widget) => widget.id === 'station_patterns'
    )
    const heatmapWidget = spec.widgets.find(
      (widget) => widget.id === 'station_heatmap'
    )

    expect(spec.selectedStationId).toBe('321')
    expect(patternWidget?.params?.stationId).toBe('321')
    expect(heatmapWidget?.params?.stationId).toBe('321')
    expect(spec.notes.some((note) => note.includes('stationId'))).toBe(false)
  })

  it('extracts days for mobility widgets', () => {
    const spec = buildDashboardSpec('Dashboard de movilidad ultimos 7 dias')

    const mobilityWidget = spec.widgets.find(
      (widget) => widget.id === 'mobility_signals'
    )

    expect(mobilityWidget?.endpoint).toBe('mobility')
    expect(mobilityWidget?.params?.mobilityDays).toBe(7)
    expect(mobilityWidget?.params?.demandDays).toBe(7)
  })

  it('falls back to an operational default dashboard when no intent is found', () => {
    const spec = buildDashboardSpec('')

    expect(spec.widgets.map((widget) => widget.id)).toEqual([
      'status_overview',
      'stations_map',
      'rankings_availability',
      'active_alerts'
    ])

    expect(
      spec.notes.some((note) => note.includes('dashboard operativo por defecto'))
    ).toBe(true)
  })

  it('appends ad-hoc custom widgets from options', () => {
    const spec = buildDashboardSpec('solo widget custom', {
      customWidgets: [
        {
          id: 'rows_total',
          title: 'Filas totales',
          sourceEndpoint: 'status',
          mode: 'kpi',
          valuePath: 'pipeline.totalRowsCollected'
        },
        {
          id: 'ranking_short',
          title: 'Top ranking corto',
          sourceEndpoint: 'rankings',
          sourceParams: {
            type: 'availability',
            limit: 5
          },
          mode: 'table',
          collectionPath: 'rankings',
          limit: 5
        }
      ]
    })

    const customWidgets = spec.widgets.filter((widget) => widget.endpoint === 'custom')

    expect(customWidgets.length).toBe(2)
    expect(customWidgets[0]?.id).toBe('custom_rows_total')
    expect(customWidgets[0]?.custom?.mode).toBe('kpi')
    expect(customWidgets[1]?.id).toBe('custom_ranking_short')
    expect(spec.notes.some((note) => note.includes('widgets ad hoc'))).toBe(true)
  })
})
