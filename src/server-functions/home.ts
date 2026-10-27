import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { LOCALES } from '@/lib/i18n/locales'
import type { Locale } from '@/lib/i18n/locales'
import type { HomeDiagnosisSummary } from '@/lib/home-diagnosis'
import type { buildNetworkBriefing } from '@/lib/network-briefing'
import type { NetworkHealth } from '@/lib/network-health'
import { loadHomePageData } from '@/server-functions/home.server'

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

const HomePageInputSchema = z.object({ locale: z.enum(LOCALES) })

export const getHomePageData = createServerFn({ method: 'GET' })
  .validator(HomePageInputSchema)
  .handler(async ({ data }: { data: { locale: Locale } }) => loadHomePageData(data.locale))
