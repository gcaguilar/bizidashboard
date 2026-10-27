import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { TrackedLink } from '@/app/_components/TrackedLink';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes'
import { toAbsoluteRouteUrl } from '@/lib/routes'
import { getSiteUrl } from '@/lib/site'
import { PageShell } from '@/components/layout/page-shell'
import { toJsonLdScript } from '@/lib/structured-data';

export const Route = createFileRoute('/about')({
  head: () =>
    buildSeoHead({
      title: 'Sobre DatosBizi: quién lo hace y de dónde salen los datos',
      description: 'Conoce quién hace DatosBizi, su independencia del operador de Bizi Zaragoza, la fuente GBFS de los datos y cómo citar el observatorio.',
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
        '@id': `${getSiteUrl()}${appRoutes.about()}#about`,
        name: 'Sobre DatosBizi',
        description: 'DatosBizi reúne datos actualizados, histórico, informes y API pública de Bizi Zaragoza.',
        url: toAbsoluteRouteUrl(appRoutes.about()),
        inLanguage: 'es-ES',
        publisher: { '@id': `${getSiteUrl()}/#organization` },
        author: {
          '@type': 'Person',
          name: 'Guillermo Castella',
          url: 'https://www.linkedin.com/in/guillermocastella/',
          sameAs: [
            'https://www.linkedin.com/in/guillermocastella/',
            'https://github.com/gcaguilar',
          ],
        },
      },
    ],
  };

  return (
    <PageShell>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: toJsonLdScript(structuredData) }} />
      <SiteBreadcrumbs items={breadcrumbs} />
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Sobre el proyecto</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">DatosBizi: datos claros sobre Bizi Zaragoza</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          DatosBizi reúne disponibilidad actual, histórico, informes mensuales y una API pública
          para que sea más fácil entender Bizi Zaragoza. La información se actualiza cada pocos
          minutos mientras el sistema público de bicicletas esté operativo.
        </p>
      </header>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Qué ofrece DatosBizi</h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--muted)] leading-7">
          <li><strong className="text-[var(--foreground)]">Disponibilidad en vivo</strong> — mapa interactivo y listado de estaciones con bicis y huecos disponibles ahora.</li>
          <li><strong className="text-[var(--foreground)]">Historial y análisis</strong> — informes mensuales, tendencias diarias y patrones horarios para entender cómo cambia la red.</li>
          <li><strong className="text-[var(--foreground)]">Redistribución y alertas</strong> — estaciones que se quedan sin bicis o huecos y avisos para entender dónde hay problemas.</li>
          <li><strong className="text-[var(--foreground)]">API pública</strong> — acceso programático a los datos para investigadores, desarrolladores y aficionados.</li>
        </ul>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Quién lo hace</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          DatosBizi es un proyecto independiente creado y mantenido por{' '}
          <a
            href="https://www.linkedin.com/in/guillermocastella/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] underline underline-offset-2"
          >
            Guillermo Castella
          </a>
          . El código es abierto y se publica en{' '}
          <a
            href="https://github.com/gcaguilar/bizidashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] underline underline-offset-2"
          >
            GitHub
          </a>
          . Para prensa, correcciones o colaboración, usa la página de{' '}
          <TrackedLink href={appRoutes.contacto()} className="text-[var(--primary)] underline underline-offset-2">contacto</TrackedLink>.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Independencia y alcance</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          DatosBizi no es la web oficial de Bizi Zaragoza ni su operador. No vende abonos, no gestiona
          altas y no representa al Ayuntamiento de Zaragoza. Es un observatorio que reutiliza el feed
          público GBFS para facilitar la consulta y el análisis. Las cifras de actividad son
          estimaciones y se explican en la{' '}
          <TrackedLink href={appRoutes.methodology()} className="text-[var(--primary)] underline underline-offset-2">metodología</TrackedLink>.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Cobertura y limitaciones</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Los datos provienen del sistema oficial de Bizi Zaragoza, que usa el formato técnico GBFS,
          y se recogen automáticamente cada pocos minutos. La cobertura histórica depende de cuándo
          empezó la recogida y de la estabilidad del sistema. Consulta la página de{' '}
          <TrackedLink href={appRoutes.status()} className="text-[var(--primary)] underline underline-offset-2">Estado</TrackedLink>{' '}
          para ver la frescura actual y cualquier incidencia activa.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Cómo citar DatosBizi</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Si usas estos datos en un artículo, un trabajo académico o una respuesta asistida por IA,
          cita la fuente y la fecha de consulta:
        </p>
        <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3 text-sm text-[var(--foreground)]">
          DatosBizi (2026). Observatorio independiente de Bizi Zaragoza. Consultado el [fecha] en{' '}
          {getSiteUrl()}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Indica que el índice de actividad no equivale al número oficial de viajes. En la página de{' '}
          <TrackedLink href={appRoutes.prensa()} className="text-[var(--primary)] underline underline-offset-2">prensa</TrackedLink>{' '}
          tienes las cifras clave y el contacto.
        </p>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Enlaces de interés</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li><TrackedLink href={appRoutes.methodology()} className="text-[var(--primary)] underline underline-offset-2">Metodología</TrackedLink> <span className="text-[var(--muted)]">— cómo se calculan las métricas y los informes.</span></li>
          <li><TrackedLink href={appRoutes.developers()} className="text-[var(--primary)] underline underline-offset-2">API pública</TrackedLink> <span className="text-[var(--muted)]">— documentación para acceder a los datos.</span></li>
          <li><TrackedLink href={appRoutes.status()} className="text-[var(--primary)] underline underline-offset-2">Estado del sistema</TrackedLink> <span className="text-[var(--muted)]">— cobertura, frescura e incidencias.</span></li>
          <li><TrackedLink href={appRoutes.faq()} className="text-[var(--primary)] underline underline-offset-2">Preguntas frecuentes</TrackedLink> <span className="text-[var(--muted)]">— respuestas directas sobre Bizi y DatosBizi.</span></li>
          <li><a href="https://github.com/gcaguilar/bizidashboard" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline underline-offset-2">GitHub</a> <span className="text-[var(--muted)]">— código fuente del proyecto.</span></li>
        </ul>
      </section>
    </PageShell>
  )
}
