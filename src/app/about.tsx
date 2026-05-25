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
        { title },
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
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Sobre el proyecto</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">DatosBizi: datos claros sobre Bizi Zaragoza</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          DatosBizi reune disponibilidad actual, historico, informes mensuales y una API publica
          para entender mejor como se comporta Bizi Zaragoza. La informacion se actualiza cada
          pocos minutos mientras el sistema publico de bicicletas este operativo.
        </p>
      </header>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Que ofrece DatosBizi</h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--muted)] leading-7">
          <li><strong className="text-[var(--foreground)]">Disponibilidad en vivo</strong> — mapa interactivo y listado de estaciones con bicis y huecos disponibles ahora.</li>
          <li><strong className="text-[var(--foreground)]">Historial y analisis</strong> — informes mensuales, tendencias diarias y patrones horarios de uso del sistema.</li>
          <li><strong className="text-[var(--foreground)]">Redistribucion y alertas</strong> — deteccion de estaciones desequilibradas y notificaciones operativas.</li>
          <li><strong className="text-[var(--foreground)]">API publica</strong> — acceso programatico a los datos para investigadores, desarrolladores y aficionados.</li>
        </ul>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Cobertura y limitaciones</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Los datos provienen del sistema GBFS de Bizi Zaragoza y se recogen de forma automatica
          cada pocos minutos. La cobertura historica depende de la fecha de inicio de la recogida
          y de la estabilidad del sistema. Consulta la pagina de{' '}
          <Link to="/estado" className="text-[var(--primary)] underline underline-offset-2">Estado</Link>{' '}
          para ver la frescura actual y cualquier incidencia activa.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Enlaces de interes</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li><Link to="/metodologia" className="text-[var(--primary)] underline underline-offset-2">Metodologia</Link> <span className="text-[var(--muted)]">— como se calculan las metricas y los informes.</span></li>
          <li><Link to="/developers" className="text-[var(--primary)] underline underline-offset-2">API publica</Link> <span className="text-[var(--muted)]">— documentacion para acceder a los datos.</span></li>
          <li><Link to="/estado" className="text-[var(--primary)] underline underline-offset-2">Estado del sistema</Link> <span className="text-[var(--muted)]">— cobertura, frescura e incidencias.</span></li>
          <li><a href="https://github.com/gcaguilar/bizidashboard" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline underline-offset-2">GitHub</a> <span className="text-[var(--muted)]">— codigo fuente del proyecto.</span></li>
        </ul>
      </section>
    </PageShell>
  )
}
