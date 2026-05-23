import { createFileRoute, Link } from '@tanstack/react-router'
import { getSiteUrl } from '@/lib/site'
import { PageShell } from '@/components/layout/page-shell'

export const Route = createFileRoute('/about')({
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Sobre DatosBizi'
    const description = 'DatosBizi reune datos actualizados, historico, informes y API publica del sistema de bicicletas compartidas Bizi Zaragoza.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/about` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/about` }],
      title,
    }
  },
  component: About,
})

function About() {
  return (
    <PageShell>
      <main className="px-4 py-12">
        <section className="island-shell rounded-2xl p-6 sm:p-8">
          <p className="island-kicker mb-2">Sobre el proyecto</p>
          <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
            DatosBizi: datos claros sobre Bizi Zaragoza
          </h1>
          <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
            DatosBizi reune disponibilidad actual, historico, informes mensuales y una API publica
            para entender mejor como se comporta Bizi Zaragoza. La informacion se actualiza cada
            pocos minutos mientras el sistema publico de bicicletas este operativo.
          </p>
        </section>

        <section className="island-shell mt-8 rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--sea-ink)]">Que ofrece DatosBizi</h2>
          <ul className="mt-4 space-y-4 text-base leading-7 text-[var(--sea-ink-soft)]">
            <li><strong>Disponibilidad en vivo</strong> — mapa interactivo y listado de estaciones con bicis y huecos disponibles ahora.</li>
            <li><strong>Historial y analisis</strong> — informes mensuales, tendencias diarias y patrones horarios de uso del sistema.</li>
            <li><strong>Redistribucion y alertas</strong> — deteccion de estaciones desequilibradas y notificaciones operativas.</li>
            <li><strong>API publica</strong> — acceso programatico a los datos para investigadores, desarrolladores y aficionados.</li>
          </ul>
        </section>

        <section className="island-shell mt-8 rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--sea-ink)]">Cobertura y limitaciones</h2>
          <p className="mt-4 text-base leading-7 text-[var(--sea-ink-soft)]">
            Los datos provienen del sistema GBFS de Bizi Zaragoza y se recogen de forma automatica
            cada pocos minutos. La cobertura historica depende de la fecha de inicio de la recogida
            y de la estabilidad del sistema. Consulta la pagina de{' '}
            <Link to="/estado" className="text-[var(--primary)] underline underline-offset-2">Estado</Link>{' '}
            para ver la frescura actual y cualquier incidencia activa.
          </p>
        </section>

        <section className="island-shell mt-8 rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--sea-ink)]">Enlaces de interes</h2>
          <ul className="mt-4 space-y-3 text-base leading-7">
            <li><Link to="/metodologia" className="text-[var(--primary)] underline underline-offset-2">Metodologia</Link> <span className="text-[var(--sea-ink-soft)]">— como se calculan las metricas y los informes.</span></li>
            <li><Link to="/developers" className="text-[var(--primary)] underline underline-offset-2">API publica</Link> <span className="text-[var(--sea-ink-soft)]">— documentacion para acceder a los datos.</span></li>
            <li><Link to="/estado" className="text-[var(--primary)] underline underline-offset-2">Estado del sistema</Link> <span className="text-[var(--sea-ink-soft)]">— cobertura, frescura e incidencias.</span></li>
            <li><a href="https://github.com/gcaguilar/bizidashboard" className="text-[var(--primary)] underline underline-offset-2" target="_blank" rel="noopener noreferrer">GitHub</a> <span className="text-[var(--sea-ink-soft)]">— codigo fuente del proyecto.</span></li>
          </ul>
        </section>
      </main>
    </PageShell>
  )
}