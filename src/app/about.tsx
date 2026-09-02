import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { TrackedLink } from '@/app/_components/TrackedLink';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes'
import { toAbsoluteRouteUrl } from '@/lib/routes'
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
  const breadcrumbs = createRootBreadcrumbs({ label: 'Sobre el proyecto', href: appRoutes.about() });
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'AboutPage',
        name: 'Sobre DatosBizi',
        description: 'DatosBizi reúne datos actualizados, histórico, informes y API pública de Bizi Zaragoza.',
        url: toAbsoluteRouteUrl(appRoutes.about()),
        inLanguage: 'es',
      },
    ],
  };

  return (
    <PageShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SiteBreadcrumbs items={breadcrumbs} />
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Sobre el proyecto</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">DatosBizi: datos claros sobre Bizi Zaragoza</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          DatosBizi reúne disponibilidad actual, histórico, informes mensuales y una API pública
          para entender mejor cómo se comporta Bizi Zaragoza. La información se actualiza cada
          pocos minutos mientras el sistema público de bicicletas esté operativo.
        </p>
      </header>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Qué ofrece DatosBizi</h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--muted)] leading-7">
          <li><strong className="text-[var(--foreground)]">Disponibilidad en vivo</strong> — mapa interactivo y listado de estaciones con bicis y huecos disponibles ahora.</li>
          <li><strong className="text-[var(--foreground)]">Historial y análisis</strong> — informes mensuales, tendencias diarias y patrones horarios de uso del sistema.</li>
          <li><strong className="text-[var(--foreground)]">Redistribución y alertas</strong> — detección de estaciones desequilibradas y notificaciones operativas.</li>
          <li><strong className="text-[var(--foreground)]">API pública</strong> — acceso programático a los datos para investigadores, desarrolladores y aficionados.</li>
        </ul>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Cobertura y limitaciones</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Los datos provienen del sistema GBFS de Bizi Zaragoza y se recogen de forma automática
          cada pocos minutos. La cobertura histórica depende de la fecha de inicio de la recogida
          y de la estabilidad del sistema. Consulta la página de{' '}
          <TrackedLink href={appRoutes.status()} className="text-[var(--primary)] underline underline-offset-2">Estado</TrackedLink>{' '}
          para ver la frescura actual y cualquier incidencia activa.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Enlaces de interés</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li><TrackedLink href={appRoutes.methodology()} className="text-[var(--primary)] underline underline-offset-2">Metodología</TrackedLink> <span className="text-[var(--muted)]">— cómo se calculan las métricas y los informes.</span></li>
          <li><TrackedLink href={appRoutes.developers()} className="text-[var(--primary)] underline underline-offset-2">API pública</TrackedLink> <span className="text-[var(--muted)]">— documentación para acceder a los datos.</span></li>
          <li><TrackedLink href={appRoutes.status()} className="text-[var(--primary)] underline underline-offset-2">Estado del sistema</TrackedLink> <span className="text-[var(--muted)]">— cobertura, frescura e incidencias.</span></li>
          <li><a href="https://github.com/gcaguilar/bizidashboard" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline underline-offset-2">GitHub</a> <span className="text-[var(--muted)]">— codigo fuente del proyecto.</span></li>
        </ul>
      </section>
    </PageShell>
  )
}
