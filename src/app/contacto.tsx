import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedAnchor } from '@/app/_components/TrackedAnchor'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes'
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { toJsonLdScript } from '@/lib/structured-data'
import { DEFAULT_FEEDBACK_URL } from '@/lib/feedback'

export const Route = createFileRoute('/contacto')({
  head: () =>
    buildSeoHead({
      title: 'Contacto de DatosBizi | Correcciones, prensa y colaboración',
      description:
        'Contacta con DatosBizi para corregir un dato, proponer una colaboración, solicitar información de prensa o reportar un problema técnico.',
      path: appRoutes.contacto(),
    }),
  component: ContactoPage,
})

const CONTACT_OPTIONS = [
  {
    title: 'Correcciones y sugerencias',
    description:
      'Si un dato no cuadra, una estación aparece mal o echas en falta una métrica, cuéntanoslo con la URL y la fecha de consulta.',
    href: DEFAULT_FEEDBACK_URL,
    label: 'Abrir formulario de contacto',
    external: true,
  },
  {
    title: 'Prensa y medios',
    description:
      'Para declaraciones, cifras, gráficos o entrevistas sobre movilidad ciclista en Zaragoza, usa la página de prensa o LinkedIn.',
    href: appRoutes.prensa(),
    label: 'Ir a prensa',
    external: false,
  },
  {
    title: 'Errores técnicos y código',
    description:
      'Los fallos reproducibles y las propuestas de mejora del proyecto se pueden registrar en GitHub Issues.',
    href: 'https://github.com/gcaguilar/bizidashboard/issues',
    label: 'Abrir GitHub Issues',
    external: true,
  },
  {
    title: 'Colaboración e investigación',
    description:
      'Si trabajas en movilidad, datos abiertos o periodismo de datos y quieres usar el dataset, escribe por LinkedIn.',
    href: 'https://www.linkedin.com/in/guillermocastella/',
    label: 'Contactar por LinkedIn',
    external: true,
  },
] as const

function ContactoPage() {
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Contacto',
    href: appRoutes.contacto(),
  })
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'ContactPage',
        name: 'Contacto de DatosBizi',
        description:
          'Canales de contacto de DatosBizi para correcciones, prensa, colaboración y errores técnicos.',
        url: toAbsoluteRouteUrl(appRoutes.contacto()),
        inLanguage: 'es-ES',
        isPartOf: { '@id': `${toAbsoluteRouteUrl('/')}#website` },
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
          Contacto
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          Hablemos de datos de Bizi Zaragoza
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          DatosBizi es un proyecto independiente. No gestiona altas, abonos ni incidencias del
          servicio: para eso debes acudir a la web oficial de Bizi Zaragoza. Aquí puedes reportar
          errores de datos, proponer mejoras o contactar por temas de prensa.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {CONTACT_OPTIONS.map((option) => (
          <article key={option.title} className="ui-section-card">
            <h2 className="text-lg font-black text-[var(--foreground)]">{option.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{option.description}</p>
            {option.external ? (
              <TrackedAnchor
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                ctaEvent={{
                  source: 'contacto',
                  ctaId: option.label,
                  destination: option.href,
                  sourceRole: 'utility',
                  destinationRole: 'utility',
                  transitionKind: 'external',
                  isExternal: true,
                }}
                className="ui-inline-action mt-4 inline-flex"
              >
                {option.label}
              </TrackedAnchor>
            ) : (
              <TrackedLink
                href={option.href}
                ctaEvent={{
                  source: 'contacto',
                  ctaId: option.label,
                  destination: 'prensa',
                  sourceRole: 'utility',
                  destinationRole: 'hub',
                  transitionKind: 'within_public',
                }}
                className="ui-inline-action mt-4 inline-flex"
              >
                {option.label}
              </TrackedLink>
            )}
          </article>
        ))}
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Antes de escribir</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          <li>· Incluye la URL exacta y la fecha y hora de la consulta.</li>
          <li>· Si el problema es de disponibilidad, indica la estación y el barrio.</li>
          <li>· Para datos históricos, señala el mes y la métrica que no cuadra.</li>
          <li>· No envíes datos personales que no sean necesarios para responder.</li>
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Consulta también las{' '}
          <TrackedLink
            href={appRoutes.faq()}
            className="text-[var(--primary)] underline underline-offset-2"
          >
            preguntas frecuentes
          </TrackedLink>{' '}
          y la{' '}
          <TrackedLink
            href={appRoutes.privacidad()}
            className="text-[var(--primary)] underline underline-offset-2"
          >
            política de privacidad
          </TrackedLink>
          .
        </p>
      </section>
    </PageShell>
  )
}
