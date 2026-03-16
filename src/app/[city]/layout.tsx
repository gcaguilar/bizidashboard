import { notFound } from 'next/navigation'
import { CITY_CONFIGS, isValidCity } from '@/lib/constants'

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  
  if (!isValidCity(city)) {
    notFound()
  }

  const cityConfig = CITY_CONFIGS[city]

  return (
    <div data-city={city} data-city-name={cityConfig.name}>
      {children}
    </div>
  )
}
