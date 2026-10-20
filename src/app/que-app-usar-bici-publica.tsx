import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedAnchor } from '@/app/_components/TrackedAnchor'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes'
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { toJsonLdScript } from '@/lib/structured-data'

const APP_STORE_URL = 'https://apps.apple.com/es/app/biciradar/id6760931316'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gcaguilar.biciradar'

export const Route = createFileRoute('/que-app-usar-bici-publica')({
  head: () =>
    buildSeoHead({
      title: '¿Qué app usar para bicis públicas en Zaragoza? | BiciRadar',
      description:
        'Compara la app oficial de Bizi, BiciRadar, la web de DatosBizi y mapas generales para consultar bicis y huecos en Zaragoza, Madrid, Barcelona, Valencia y Sevilla.',
      path: appRoutes.queAppBiciPublica(),
    }),
  component: QueAppPage,
})

const OPTIONS = [
  {
    name: 'BiciRadar',
    bestFor: 'Ver estaciones cercanas y guardar favoritas',
    detail:
      'App gratuita y sin publicidad. Ordena por distancia, muestra bicis y huecos, permite favoritas y alertas. Cubre Zaragoza, Madrid, Barcelona, Valencia y Sevilla.',
    highlight: true,
  },
  {
    name: 'Web de DatosBizi',
    bestFor: 'Consultar sin instalar nada',
    detail:
      'Portada, mapa y directorio de estaciones con filtros. Ideal para escritorio, para analizar la red o para compartir un enlace.',
    highlight: false,
  },
  {
    name: 'App oficial de Bizi',
    bestFor: 'Altas, abonos y gestión del servicio',
    detail:
      'Para registrarte, consultar tarifas o resolver incidencias del servicio, la fuente autorizada es la app y la web oficial de Bizi Zaragoza.',
    highlight: false,
  },
  {
    name: 'Mapas generales',
    bestFor: 'Contexto de calles y rutas',
    detail:
      'Google Maps, Moovit u otras apps de transporte pueden ayudar con la ruta, pero no siempre muestran la disponibilidad exacta de Bizi.',
    highlight: false,
  },
] as const

const FAQ = [
  {
    question: '¿Cuál es la mejor app para ver bicis públicas en Zaragoza?',
    answer:
      'Si buscas disponibilidad y cercanía, BiciRadar está pensada para eso: estaciones cercanas, bicis, huecos y favoritas. Si necesitas gestionar tu abono o una incidencia, usa la app oficial de Bizi.',
  },
  {
    question: '¿BiciRadar es gratis?',
    answer:
      'Sí. La app es gratuita y no muestra publicidad. No vende abonos ni gestiona el servicio de Bizi; solo consulta datos públicos.',
  },
  {
    question: '¿BiciRadar funciona fuera de Zaragoza?',
    answer:
      'Sí, cubre Zaragoza, Madrid, Barcelona, Valencia y Sevilla, con las redes Bizi, BiciMAD, Bicing, Valenbisi y Sevici. La disponibilidad depende de los datos que publique cada ciudad.',
  },
] as const

function QueAppPage() {
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Qué app usar para bicis públicas',
    href: appRoutes.queAppBiciPublica(),
  })
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'WebPage',
        name: '¿Qué app usar para bicis públicas en Zaragoza?',
        url: toAbsoluteRouteUrl(appRoutes.queAppBiciPublica()),
        inLanguage: 'es-ES',
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
          Comparativa
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          ¿Qué app usar para bicis públicas?
        </h1>
        <div className="mt-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/8 p-4 text-sm text-[var(--foreground)]">
          <strong>Respuesta rápida:</strong> para consultar bicis y huecos cerca de ti, BiciRadar;
          para gestionar altas, abonos o incidencias, la app oficial de Bizi. Para analizar datos o
          consultar desde el ordenador, la web de DatosBizi.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedAnchor
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            ctaEvent={{
              source: 'que_app_hero',
              ctaId: 'app_store',
              destination: 'app_store',
              sourceRole: 'utility',
              destinationRole: 'utility',
              transitionKind: 'external',
              isExternal: true,
            }}
            className="ui-primary-button"
          >
            Descargar en App Store
          </TrackedAnchor>
          <TrackedAnchor
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            ctaEvent={{
              source: 'que_app_hero',
              ctaId: 'google_play',
              destination: 'google_play',
              sourceRole: 'utility',
              destinationRole: 'utility',
              transitionKind: 'external',
              isExternal: true,
            }}
            className="ui-inline-action"
          >
            Abrir Google Play
          </TrackedAnchor>
        </div>
      </header>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Comparativa rápida</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {OPTIONS.map((option) => (
            <article
              key={option.name}
              className={`rounded-xl border p-4 ${
                option.highlight
                  ? 'border-[var(--primary)]/40 bg-[var(--primary)]/8'
                  : 'border-[var(--border)] bg-[var(--card)]'
              }`}
            >
              <h3 className="text-sm font-black text-[var(--foreground)]">{option.name}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {option.bestFor}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{option.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Qué mirar antes de elegir</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          <li>· Si necesitas tu ubicación y estaciones cercanas, prioriza una app con geolocalización.</li>
          <li>· Si te preocupa la privacidad, revisa qué permisos pide y si funciona sin cuenta.</li>
          <li>· Si viajas a otra ciudad, comprueba que la app cubre esa red.</li>
          <li>· Si el problema es un abono o una incidencia, la app oficial es la vía correcta.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.biciradar()} className="ui-inline-action">
            Ver BiciRadar
          </TrackedLink>
          <TrackedLink href={appRoutes.dondeHayBici()} className="ui-inline-action">
            Dónde hay bici ahora
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
