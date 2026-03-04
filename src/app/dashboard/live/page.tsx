import type { Metadata } from 'next'
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site'
import { LiveDashboardClient } from './_components/LiveDashboardClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard live builder',
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/dashboard/live'
  },
  openGraph: {
    title: `${SITE_TITLE} - Dashboard Live`,
    description: SITE_DESCRIPTION,
    url: '/dashboard/live'
  }
}

export default function DashboardLivePage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <LiveDashboardClient />
    </main>
  )
}
