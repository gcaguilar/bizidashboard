import { redirect } from 'next/navigation'
import { CITIES, isValidCity } from '@/lib/constants'

type PageProps = {
  params: Promise<{ ciudad: string }>
}

export default async function CiudadPage({ params }: PageProps) {
  const { ciudad } = await params
  
  if (!isValidCity(ciudad)) {
    redirect('/')
  }
  
  redirect(`/dashboard`)
}
