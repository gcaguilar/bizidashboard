import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedAnchor } from '@/app/_components/TrackedAnchor'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes'
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { toJsonLdScript } from '@/lib/structured-data'
import { getSiteUrl } from '@/lib/site'

export const Route = createFileRoute('/prensa')({
  head: () =>
    buildSeoHead({
      title: 'Prensa y datos de Bizi Zaragoza | DatosBizi',
      description:
        'Cifras clave, metodología, imágenes y contacto de prensa de DatosBizi, el observatorio independiente de Bizi Zaragoza.',
      path: appRoutes.prensa(),
    }),
  component: PrensaPage,
})

const KEY_FIGURES = [
  {
    label: 'Estaciones operativas',
    value: '276',
    detail: 'Red de Bizi Zaragoza, 20/10/2026',
  },
  {
    label: 'Bicis disponibles',
    value: '1.154',
    detail: 'Última muestra de la red, 14:19',
  },
  {
    label: 'Anclajes libres',
    value: '4.221',
    detail: 'Huecos para devolver la bici',
  },
  {
    label: 'Estaciones sin bici o sin hueco',
    value: '60 de 276',
    detail: '22% de la red en ese momento',
  },
  {
    label: 'Cobertura histórica',
    value: '225 días',
    detail: 'Desde el 3/3/2026',
  },
  {
    label: 'Informes mensuales',
    value: '8',
    detail: 'Archivo de marzo a octubre de 2026',
  },
] as const

function PrensaPage() {
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Prensa',
    href: appRoutes.prensa(),
  })
  const siteUrl = getSiteUrl()
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'WebPage',
        name: 'Prensa y datos de Bizi Zaragoza',
        description:
          'Cifras clave, metodología y contacto de prensa del observatorio independiente DatosBizi.',
        url: toAbsoluteRouteUrl(appRoutes.prensa()),
        inLanguage: 'es-ES',
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': `${siteUrl}/#organization` },
      },
    ],
  }

  return (
    <PageShell>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(structuredData) }}
      />
      <SiteBreadcrumbs items={breadcrumbs} />
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Prensa
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          Datos de Bizi Zaragoza para medios
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          DatosBizi es un observatorio independiente que reutiliza el feed público GBFS de Bizi
          Zaragoza. Estas cifras son una foto fechada: si las publicas, indica la fecha y la hora,
          porque la disponibilidad cambia cada pocos minutos.
        </p>
      </header>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Cifras clave (20/10/2026)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KEY_FIGURES.map((figure) => (
            <div
              key={figure.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <p className="text-2xl font-black text-[var(--foreground)]">{figure.value}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{figure.label}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{figure.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Para el dato actual, consulta la{' '}
          <TrackedLink href={appRoutes.home()} className="text-[var(--primary)] underline underline-offset-2">
            portada
          </TrackedLink>{' '}
          o el{' '}
          <TrackedLink href={appRoutes.dashboard()} className="text-[var(--primary)] underline underline-offset-2">
            panel de red
          </TrackedLink>
          .
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Cómo citar</h2>
        <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3 text-sm text-[var(--foreground)]">
          DatosBizi (2026). Observatorio independiente de Bizi Zaragoza. Consultado el [fecha] en{' '}
          {siteUrl}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Si usas una métrica concreta, enlaza a la página o informe consultado e incluye la hora de
          la última muestra. El «movimiento estimado» es un índice de actividad, no el número
          oficial de viajes.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Qué podemos aportar</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          <li>· Series de disponibilidad y uso por estación, barrio y franja horaria.</li>
          <li>· Rankings de fricción: estaciones con más horas sin bicis o sin anclajes.</li>
          <li>· Informes mensuales con evolución, comparativas y conclusiones.</li>
          <li>· Contexto metodológico para no confundir actividad estimada con viajes oficiales.</li>
          <li>· Enlaces estables a cada informe y a cada ficha de estación.</li>
        </ul>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Contacto de prensa</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Para entrevistas, datos adicionales o gráficos, escribe a Guillermo Castella por LinkedIn o
          usa el formulario de contacto.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedAnchor
            href="https://www.linkedin.com/in/guillermocastella/"
            target="_blank"
            rel="noopener noreferrer"
            ctaEvent={{
              source: 'prensa',
              ctaId: 'linkedin_press',
              destination: 'linkedin',
              sourceRole: 'utility',
              destinationRole: 'utility',
              transitionKind: 'external',
              isExternal: true,
            }}
            className="ui-primary-button"
          >
            Contactar por LinkedIn
          </TrackedAnchor>
          <TrackedLink href={appRoutes.contacto()} className="ui-inline-action">
            Ir a contacto
          </TrackedLink>
          <TrackedAnchor
            href={`${siteUrl}/og-image.png`}
            target="_blank"
            rel="noopener noreferrer"
            ctaEvent={{
              source: 'prensa',
              ctaId: 'download_og_image',
              destination: 'og_image',
              sourceRole: 'utility',
              destinationRole: 'utility',
              transitionKind: 'external',
              isExternal: true,
            }}
            className="ui-inline-action"
          >
            Descargar imagen de marca
          </TrackedAnchor>
        </div>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Nota de independencia</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          DatosBizi no representa al Ayuntamiento de Zaragoza ni al operador de Bizi. Es un proyecto
          independiente de código abierto. Las cifras se elaboran a partir del feed GBFS público y
          pueden diferir de las que publique la web oficial.
        </p>
      </section>
    </PageShell>
  )
}
