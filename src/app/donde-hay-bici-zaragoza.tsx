import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes'
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { toJsonLdScript } from '@/lib/structured-data'

export const Route = createFileRoute('/donde-hay-bici-zaragoza')({
  head: () =>
    buildSeoHead({
      title: 'Dónde hay bici en Zaragoza ahora | Bizi en tiempo real',
      description:
        'Consulta dónde hay bicis y huecos libres en las estaciones de Bizi Zaragoza, cómo filtrar por disponibilidad y qué hacer si tu estación está llena o vacía.',
      path: appRoutes.dondeHayBici(),
    }),
  component: DondeHayBiciPage,
})

const FAQ = [
  {
    question: '¿Cómo sé si hay bicis en mi estación más cercana?',
    answer:
      'Abre la portada o el directorio de estaciones y activa el filtro «con bicis». Si usas el móvil, BiciRadar ordena las estaciones por distancia y muestra bicis y huecos en tiempo real.',
  },
  {
    question: '¿Qué hago si la estación está llena y no puedo devolver la bici?',
    answer:
      'Busca una estación cercana con huecos libres desde el filtro «con huecos» o desde BiciRadar. Si el problema se repite, consulta la fricción histórica de la zona para elegir una alternativa más estable.',
  },
  {
    question: '¿Los datos de disponibilidad son oficiales?',
    answer:
      'Proceden del feed GBFS oficial de Bizi Zaragoza, con una latencia de pocos minutos. DatosBizi los agrega y los muestra, pero no gestiona el servicio ni puede reservar bicis o anclajes.',
  },
] as const

function DondeHayBiciPage() {
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Dónde hay bici en Zaragoza',
    href: appRoutes.dondeHayBici(),
  })
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'WebPage',
        name: 'Dónde hay bici en Zaragoza ahora',
        url: toAbsoluteRouteUrl(appRoutes.dondeHayBici()),
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
          Utilidad
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          Dónde hay bici en Zaragoza ahora
        </h1>
        <div className="mt-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/8 p-4 text-sm text-[var(--foreground)]">
          <strong>Respuesta rápida:</strong> abre la portada, filtra por «con bicis» o «con huecos»
          y ordena por cercanía. Si vas con el móvil, BiciRadar hace lo mismo con tu ubicación y
          permite guardar favoritas.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.home()} className="ui-primary-button">
            Ver disponibilidad ahora
          </TrackedLink>
          <TrackedLink href={appRoutes.biciradar()} className="ui-inline-action">
            Abrir BiciRadar
          </TrackedLink>
        </div>
      </header>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Tres formas de encontrarla</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="text-sm font-black text-[var(--foreground)]">1. Portada</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Muestra el estado general, las estaciones con problemas y un buscador para filtrar por
              barrio o estación.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="text-sm font-black text-[var(--foreground)]">2. Directorio</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ordena por bicis, huecos o índice de actividad. Útil si quieres comparar varias
              estaciones antes de salir.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="text-sm font-black text-[var(--foreground)]">3. BiciRadar</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Usa tu ubicación, muestra distancia y dirección, guarda favoritas y permite activar
              alertas de estaciones vacías o llenas.
            </p>
          </div>
        </div>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Si tu estación está vacía o llena</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          <li>· Filtra por «con bicis» si necesitas recoger; por «con huecos» si necesitas devolver.</li>
          <li>· Mira la estación más cercana y una segunda opción por si cambia en los próximos minutos.</li>
          <li>· Consulta la fricción histórica: hay estaciones que se vacían o llenan casi siempre a la misma hora.</li>
          <li>· Activa una alerta en BiciRadar para no repetir la búsqueda cada dos minutos.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.statsRedistribucion()} className="ui-inline-action">
            Ver fricción por estación
          </TrackedLink>
          <TrackedLink href={appRoutes.statsHorarios()} className="ui-inline-action">
            Ver horas punta
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
