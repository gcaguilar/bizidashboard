import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes'
import { PageShell } from '@/components/layout/page-shell'

export const Route = createFileRoute('/about')({
  head: () =>
    buildSeoHead({
      title: 'Sobre DatosBizi',
      description: 'DatosBizi reúne datos actualizados, histórico, informes y API pública del sistema de bicicletas compartidas Bizi Zaragoza.',
      path: appRoutes.about(),
    }),
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
          <TrackedLink href={appRoutes.status()} className="text-[var(--primary)] underline underline-offset-2">Estado</TrackedLink>{' '}
          para ver la frescura actual y cualquier incidencia activa.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Enlaces de interes</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li><TrackedLink href={appRoutes.methodology()} className="text-[var(--primary)] underline underline-offset-2">Metodologia</TrackedLink> <span className="text-[var(--muted)]">— como se calculan las metricas y los informes.</span></li>
          <li><TrackedLink href={appRoutes.developers()} className="text-[var(--primary)] underline underline-offset-2">API publica</TrackedLink> <span className="text-[var(--muted)]">— documentacion para acceder a los datos.</span></li>
          <li><TrackedLink href={appRoutes.status()} className="text-[var(--primary)] underline underline-offset-2">Estado del sistema</TrackedLink> <span className="text-[var(--muted)]">— cobertura, frescura e incidencias.</span></li>
          <li><a href="https://github.com/gcaguilar/bizidashboard" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline underline-offset-2">GitHub</a> <span className="text-[var(--muted)]">— codigo fuente del proyecto.</span></li>
        </ul>
      </section>
    </PageShell>
  )
}
