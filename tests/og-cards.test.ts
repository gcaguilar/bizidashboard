import { describe, expect, it } from 'vitest'
import type { StationSnapshot } from '@/lib/api-types'
import { buildFallbackOgCard, buildNetworkOgCard, buildStationOgCard, escapeSvgText, svgResponse } from '@/lib/og-cards'
import { CITIZEN_MAP_LEGEND } from '@/lib/map-colors'
import { appRoutes } from '@/lib/routes'

const station = (overrides: Partial<StationSnapshot> = {}): StationSnapshot => ({
  id: '1', name: 'Plaza <España> & Co', lat: 0, lon: 0, capacity: 20,
  bikesAvailable: 8, anchorsFree: 12, recordedAt: '2026-01-01T00:00:00Z', ...overrides,
})

describe('og cards', () => {
  it('escapes markup in station names', () => {
    const svg = buildStationOgCard(station())
    expect(svg).toContain('Plaza &lt;España&gt; &amp; Co')
    expect(svg).not.toContain('<España>')
    expect(escapeSvgText('a"b')).toBe('a&quot;b')
  })

  it('uses the citizen status label and color', () => {
    const depleted = CITIZEN_MAP_LEGEND.find((entry) => entry.level === 'depleted')!
    const svg = buildStationOgCard(station({ bikesAvailable: 0, anchorsFree: 20 }))
    expect(svg).toContain(depleted.label)
    expect(svg).toContain(depleted.color)
  })

  it('summarizes the network with product vocabulary', () => {
    const svg = buildNetworkOgCard([station(), station({ id: '2', bikesAvailable: 0 })])
    expect(svg).toContain('tensionado')
    expect(buildFallbackOgCard()).toContain('Sin datos ahora')
  })

  it('serves svg with a locked-down CSP', () => {
    const response = svgResponse('<svg/>')
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'")
  })

  it('exposes the endpoints in appRoutes', () => {
    expect(appRoutes.api.ogStation('a b')).toBe('/api/og/station?stationId=a+b')
    expect(appRoutes.api.ogNetwork()).toBe('/api/og/network')
  })
})
