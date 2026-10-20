import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SITE_URL = 'https://datosbizi.com'
const { fetchAvailableDataMonthsMock } = vi.hoisted(() => ({
  fetchAvailableDataMonthsMock: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  fetchAvailableDataMonths: fetchAvailableDataMonthsMock,
}))

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('APP_URL', SITE_URL)
  fetchAvailableDataMonthsMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('reports feed', () => {
  it('lists canonical monthly report URLs and skips invalid months', async () => {
    fetchAvailableDataMonthsMock.mockResolvedValue({
      months: ['2026-10', '2026-09', 'bad-month'],
    })

    const { buildReportsFeed } = await import('@/app/feed[.]xml')
    const xml = await buildReportsFeed()

    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain(`${SITE_URL}/informes/2026-10`)
    expect(xml).toContain(`${SITE_URL}/informes/2026-09`)
    expect(xml).not.toContain('bad-month')
    expect(xml.match(/<item>/g)).toHaveLength(2)
  })
})
