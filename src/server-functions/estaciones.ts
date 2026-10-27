import { createServerFn } from '@tanstack/react-start'

export const getStationsDirectoryData = createServerFn({ method: 'GET' }).handler(async () => {
  const { getStationSeoRows, toStationDirectoryRow } = await import('@/lib/seo-stations')
  return (await getStationSeoRows()).map(toStationDirectoryRow)
})