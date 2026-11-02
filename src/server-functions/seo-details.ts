import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { inputValidator } from '@/server-functions/input-validator'

const IdInputSchema = z.string().trim()

export const getPublicStationPageData = createServerFn({ method: 'GET' })
  .validator(inputValidator(IdInputSchema))
  .handler(async ({ data: stationId }: { data: string }) => {
    const { getStationSeoPageData } = await import('@/lib/seo-stations')
    return getStationSeoPageData(stationId).catch(() => null)
  })

export const getPublicDistrictPageData = createServerFn({ method: 'GET' })
  .validator(inputValidator(IdInputSchema))
  .handler(async ({ data: districtSlug }: { data: string }) => {
    const { getDistrictSeoRowBySlug, getDistrictSeoRows } = await import('@/lib/seo-districts')
    const [district, districts] = await Promise.all([
      getDistrictSeoRowBySlug(districtSlug).catch(() => null),
      getDistrictSeoRows().catch(() => []),
    ])
    return { district, districts }
  })

export const getUtilityLandingPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const { getUtilityLandingData } = await import('@/lib/acquisition-landings')
  return getUtilityLandingData()
})

export const getInsightsLandingPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const { getInsightsLandingData } = await import('@/lib/acquisition-landings')
  return getInsightsLandingData()
})
