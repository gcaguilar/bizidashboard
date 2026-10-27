import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes'
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { toJsonLdScript } from '@/lib/structured-data'

export const Route = createFileRoute('/como-funciona-bizi-zaragoza')({
  head: () =>
    buildSeoHead({
      title: 'Cómo funciona Bizi Zaragoza | Estaciones, bicis y datos',
      description:
        'Cómo funciona Bizi Zaragoza: estaciones y anclajes, qué mide DatosBizi, de dónde salen los datos GBFS y qué no cubre este observatorio independiente.',
      path: appRoutes.comoFuncionaBizi(),
    }),
  component: ComoFuncionaPage,
})

const FAQ = [
  {
    question: '¿DatosBizi es lo mismo que Bizi Zaragoza?',
    answer:
      'No. Bizi Zaragoza es el servicio público de bicicleta compartida. DatosBizi es un observatorio independiente que reutiliza su feed público de datos para mostrar disponibilidad, histórico e informes.',
  },
  {
    question: '¿Qué significan bicis, anclajes y ocupación?',
    answer:
      'Las bicis son unidades disponibles para recoger; los anclajes libres son huecos para devolver. La ocupación es el porcentaje de anclajes ocupados por bicis y ayuda a detectar estaciones con riesgo de quedarse vacías o llenas.',
  },
  {
    question: '¿Cómo se obtienen los datos?',
    answer:
      'DatosBizi consulta el feed GBFS oficial de Bizi Zaragoza, valida las muestras y las agrega. La frecuencia observada es de unos 2 minutos, aunque la interfaz puede mostrar algunos minutos de retraso por caché.',
  },
] as const

function ComoFuncionaPage() {
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Cómo funciona Bizi Zaragoza',
    href: appRoutes.comoFuncionaBizi(),
  })
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'WebPage',
        name: 'Cómo funciona Bizi Zaragoza',
        url: toAbsoluteRouteUrl(appRoutes.comoFuncionaBizi()),
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
          Contexto
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          Cómo funciona Bizi Zaragoza
        </h1>
        <div className="mt-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/8 p-4 text-sm text-[var(--foreground)]">
          <strong>En una frase:</strong> Bizi Zaragoza es una red de estaciones con bicis y anclajes;
          DatosBizi mide su disponibilidad y su evolución, pero no gestiona el servicio ni vende
          abonos.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.statsEstaciones()} className="ui-primary-button">
            Ver estaciones
          </TrackedLink>
          <TrackedLink href={appRoutes.methodology()} className="ui-inline-action">
            Leer metodología
          </TrackedLink>
        </div>
      </header>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">El servicio, en tres pasos</h2>
        <ol className="mt-3 space-y-3 text-sm text-[var(--muted)]">
          <li>
            <strong className="text-[var(--foreground)]">1. Consulta.</strong> Localiza una estación
            con bicis disponibles y comprueba que tiene anclajes si vas a devolver una.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">2. Recoge.</strong> El uso y las condiciones
            dependen del operador. DatosBizi no gestiona altas, pagos ni desbloqueos.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">3. Devuelve.</strong> Comprueba que la
            estación de destino tiene huecos libres; si está llena, busca una alternativa cercana.
          </li>
        </ol>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Para tarifas, registro, normativa y asistencia, consulta la{' '}
          <a
            href="https://bizi.zaragoza.es/es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] underline underline-offset-2"
          >
            web oficial de Bizi Zaragoza
          </a>
          . No publicamos precios porque cambian y no somos la fuente autorizada.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Qué mide DatosBizi</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-black text-[var(--foreground)]">Datos observados</h3>
            <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
              <li>· Bicis disponibles y anclajes libres por estación.</li>
              <li>· Capacidad y ocupación media.</li>
              <li>· Horas con problemas de disponibilidad.</li>
              <li>· Cobertura, frescura y estado del pipeline.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--foreground)]">Estimaciones</h3>
            <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
              <li>· Índice de actividad: sirve para comparar, no viajes oficiales.</li>
              <li>· Predicciones a +30/+60 minutos: orientativas, no garantías.</li>
              <li>· Redistribución sugerida: recomendación analítica, no orden operativa.</li>
            </ul>
          </div>
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
