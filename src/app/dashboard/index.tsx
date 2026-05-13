import { createFileRoute } from '@tanstack/react-router'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { DashboardClient } from '@/app/dashboard/_components/DashboardClient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageShell } from '@/components/layout/page-shell'
import { getDashboardPageData } from '@/server-functions/dashboard'

export const Route = createFileRoute('/dashboard/')({
  loader: () => getDashboardPageData(),
  component: DashboardPage,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Panel clasico - DatosBizi' },
    ],
  }),
})

function DashboardPage() {
  const { breadcrumbs, initialData, isSchemaMissing, loadErrors, structuredData } = Route.useLoaderData()

  return (
    <PageShell maxWidthClassName="">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      {loadErrors.length > 0 ? (
        <Alert variant="warning" className='mx-auto mb-6 w-full max-w-[1280px] text-amber-100'>
          <AlertTitle className='font-semibold'>
            No se pudieron cargar algunos paneles: {loadErrors.join(', ')}.
          </AlertTitle>
          <AlertDescription className='text-amber-200/80'>
            {isSchemaMissing
              ? 'La base de datos parece no estar inicializada. Ejecuta `bun prisma migrate deploy` con la misma DATABASE_URL del servidor.'
              : 'Revisa los logs del servidor para mas detalles.'}
          </AlertDescription>
        </Alert>
      ) : null}
      <DashboardClient initialData={initialData} />
    </PageShell>
  )
}
