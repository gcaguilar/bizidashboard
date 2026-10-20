import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes'
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { FAQ_ITEMS, FAQ_QUICK_LINKS } from '@/lib/faq-content'
import { toJsonLdScript } from '@/lib/structured-data'

export const Route = createFileRoute('/preguntas-frecuentes')({
  head: () =>
    buildSeoHead({
      title: 'Preguntas frecuentes sobre Bizi Zaragoza | DatosBizi',
      description:
        'Respuestas directas sobre Bizi Zaragoza: cuántas estaciones hay, dónde encontrar bicis, cada cuánto se actualizan los datos, API y cómo citar DatosBizi.',
      path: appRoutes.faq(),
    }),
  component: PreguntasFrecuentesPage,
})

function PreguntasFrecuentesPage() {
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Preguntas frecuentes',
    href: appRoutes.faq(),
  })
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'FAQPage',
        '@id': `${toAbsoluteRouteUrl(appRoutes.faq())}#faq`,
        name: 'Preguntas frecuentes sobre Bizi Zaragoza',
        url: toAbsoluteRouteUrl(appRoutes.faq()),
        inLanguage: 'es-ES',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
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
          Ayuda rápida
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          Preguntas frecuentes sobre Bizi Zaragoza
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Respuestas cortas y comprobables sobre la red, la disponibilidad, los datos y el proyecto.
          Cuando una cifra cambia cada pocos minutos, enlazamos a la página viva en lugar de fijarla.
        </p>
      </header>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Empieza por aquí</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {FAQ_QUICK_LINKS.map((link) => (
            <TrackedLink
              key={link.href}
              href={link.href}
              ctaEvent={{
                source: 'faq_quick_links',
                ctaId: link.label,
                destination: link.href,
                sourceRole: 'hub',
                destinationRole: 'hub',
                transitionKind: 'within_public',
              }}
              className="ui-surface-block ui-surface-block-interactive block"
            >
              <p className="text-sm font-black text-[var(--foreground)]">{link.label}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Abrir respuesta y datos relacionados →</p>
            </TrackedLink>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <article key={item.question} className="ui-section-card">
            <h2 className="text-base font-black text-[var(--foreground)]">{item.question}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.answer}</p>
            {item.href ? (
              <TrackedLink
                href={item.href}
                ctaEvent={{
                  source: 'faq_item',
                  ctaId: item.linkLabel ?? item.href,
                  destination: item.href,
                  sourceRole: 'hub',
                  destinationRole: 'hub',
                  transitionKind: 'within_public',
                }}
                className="mt-3 inline-flex text-sm font-semibold text-[var(--primary)] underline underline-offset-2"
              >
                {item.linkLabel ?? 'Ver más'}
              </TrackedLink>
            ) : null}
          </article>
        ))}
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">¿Falta tu pregunta?</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Si no encuentras la respuesta, escríbenos. Las preguntas repetidas se incorporan a esta
          página para que la próxima persona las encuentre.
        </p>
        <TrackedLink href={appRoutes.contacto()} className="ui-primary-button mt-4 inline-flex">
          Enviar una pregunta
        </TrackedLink>
      </section>
    </PageShell>
  )
}
