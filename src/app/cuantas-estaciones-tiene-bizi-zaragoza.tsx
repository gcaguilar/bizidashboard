import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes'
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { toJsonLdScript } from '@/lib/structured-data'

export const Route = createFileRoute('/cuantas-estaciones-tiene-bizi-zaragoza')({
  head: () =>
    buildSeoHead({
      title: '¿Cuántas estaciones tiene Bizi Zaragoza? | Dato actualizado',
      description:
        'Bizi Zaragoza tenía 276 estaciones operativas el 20/10/2026. Consulta el dato actual, las bicis y anclajes disponibles y las estaciones por barrio.',
      path: appRoutes.cuantasEstaciones(),
    }),
  component: CuantasEstacionesPage,
})

const QUICK_FACTS = [
  { label: 'Estaciones operativas', value: '276' },
  { label: 'Bicis disponibles', value: '1.154' },
  { label: 'Anclajes libres', value: '4.221' },
  { label: 'Estaciones sin bici o sin hueco', value: '60 de 276' },
] as const

const DISTRICTS = [
  { name: 'Universidad', stations: 26 },
  { name: 'Actur-Rey Fernando', stations: 25 },
  { name: 'Sur', stations: 25 },
  { name: 'El Rabal', stations: 24 },
  { name: 'Centro', stations: 22 },
  { name: 'Delicias', stations: 22 },
] as const

const FAQ = [
  {
    question: '¿Cuántas estaciones tiene Bizi Zaragoza en 2026?',
    answer:
      'A 20 de octubre de 2026, DatosBizi registraba 276 estaciones operativas en la red de Bizi Zaragoza. El número puede cambiar por mantenimiento, incidencias o ampliaciones.',
  },
  {
    question: '¿Cuántas bicis y anclajes hay en la red?',
    answer:
      'En la misma muestra había 1.154 bicis disponibles y 4.221 anclajes libres. Son cifras vivas: cambian cada pocos minutos y deben consultarse en la portada o en el directorio.',
  },
  {
    question: '¿Cuántas estaciones hay por barrio?',
    answer:
      'Universidad, Actur-Rey Fernando y Sur concentran el mayor número de estaciones en octubre de 2026, con 25-26 cada uno. Puedes comparar todos los barrios en la página de barrios.',
  },
] as const

function CuantasEstacionesPage() {
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Cuántas estaciones tiene Bizi Zaragoza',
    href: appRoutes.cuantasEstaciones(),
  })
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'WebPage',
        name: '¿Cuántas estaciones tiene Bizi Zaragoza?',
        url: toAbsoluteRouteUrl(appRoutes.cuantasEstaciones()),
        inLanguage: 'es-ES',
        dateModified: '2026-10-20T14:19:00+02:00',
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
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
          Dato de red
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          ¿Cuántas estaciones tiene Bizi Zaragoza?
        </h1>
        <div className="mt-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/8 p-4 text-sm text-[var(--foreground)]">
          <strong>Respuesta rápida:</strong> a 20 de octubre de 2026, la red tenía{' '}
          <strong>276 estaciones operativas</strong>. Es un dato vivo: consulta el directorio para
          ver el número y la disponibilidad de hoy.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.statsEstaciones()} className="ui-primary-button">
            Ver estaciones ahora
          </TrackedLink>
          <TrackedLink href={appRoutes.home()} className="ui-inline-action">
            Estado de la red
          </TrackedLink>
        </div>
      </header>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">La red en cifras</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_FACTS.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-2xl font-black text-[var(--foreground)]">{fact.value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{fact.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Muestra del 20/10/2026 a las 14:19. Las cifras de bicis y anclajes cambian cada pocos
          minutos; las de estaciones, solo con cambios de la red.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Barrios con más estaciones</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2 pr-4 font-semibold">Barrio</th>
                <th className="py-2 font-semibold">Estaciones (oct. 2026)</th>
              </tr>
            </thead>
            <tbody>
              {DISTRICTS.map((district) => (
                <tr key={district.name} className="border-b border-[var(--border)]/60">
                  <td className="py-2 pr-4 text-[var(--foreground)]">{district.name}</td>
                  <td className="py-2 text-[var(--muted)]">{district.stations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TrackedLink href={appRoutes.statsBarrios()} className="mt-4 inline-flex text-sm font-semibold text-[var(--primary)] underline underline-offset-2">
          Comparar todos los barrios →
        </TrackedLink>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Cómo se calcula este dato</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          DatosBizi consulta el feed GBFS oficial de Bizi Zaragoza y cuenta las estaciones que
          aparecen operativas en la última muestra validada. No todas las estaciones del mapa tienen
          por qué estar disponibles en un momento dado: una estación puede existir y estar sin bicis
          o sin anclajes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.methodology()} className="ui-inline-action">
            Metodología
          </TrackedLink>
          <TrackedLink href={appRoutes.status()} className="ui-inline-action">
            Estado de los datos
          </TrackedLink>
        </div>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Preguntas relacionadas</h2>
        <div className="mt-3 space-y-4">
          {FAQ.map((item) => (
            <article key={item.question}>
              <h3 className="text-sm font-bold text-[var(--foreground)]">{item.question}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
