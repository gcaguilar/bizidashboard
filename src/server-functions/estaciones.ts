import { createServerFn } from '@tanstack/react-start'

export const getStationsDirectoryData = createServerFn({ method: 'GET' }).handler(async () => {
  const { getStationSeoRows } = await import('@/lib/seo-stations')
  return getStationSeoRows()
})