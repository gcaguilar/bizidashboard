import { redirect } from 'next/navigation'

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  redirect(`/${city}/dashboard`)
}
