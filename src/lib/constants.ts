export const CITIES = ['zaragoza', 'madrid', 'barcelona'] as const

export type City = (typeof CITIES)[number]

export const CITY_CONFIGS: Record<City, { name: string; gbfsUrl: string }> = {
  zaragoza: {
    name: 'Zaragoza',
    gbfsUrl: 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json',
  },
  madrid: {
    name: 'Madrid',
    gbfsUrl: 'https://madrid.publicbikesystem.net/customer/gbfs/v2/gbfs.json',
  },
  barcelona: {
    name: 'Barcelona',
    gbfsUrl: 'https://barcelona-sp.publicbikesystem.net/customer/gbfs/v2/gbfs.json',
  },
}

export const DEFAULT_CITY: City = 'zaragoza'

export function isValidCity(value: string): value is City {
  return CITIES.includes(value as City)
}

export function getCityFromPath(pathname: string): City | null {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  if (firstSegment && isValidCity(firstSegment)) {
    return firstSegment
  }
  return null
}
