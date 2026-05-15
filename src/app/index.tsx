import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/layout/page-shell'
import { appRoutes } from '@/lib/routes'
import { getSiteUrl, SEO_SITE_TITLE, SEO_SITE_DESCRIPTION } from '@/lib/site'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: SEO_SITE_DESCRIPTION },
      { property: 'og:title', content: SEO_SITE_TITLE },
      { property: 'og:description', content: SEO_SITE_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: getSiteUrl() },
      { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SEO_SITE_TITLE },
      { name: 'twitter:description', content: SEO_SITE_DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: getSiteUrl() }],
    title: SEO_SITE_TITLE,
  }),
  component: Home,
})

function Home() {
  return (
    <PageShell className="gap-8 py-8 md:py-12">
      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Datos publicos de Bizi
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
              DatosBizi: entiende Bizi Zaragoza de un vistazo
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Consulta disponibilidad, patrones de uso, barrios, rankings, informes mensuales y datos abiertos sin perderte entre pantallas.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <a
            href={appRoutes.dashboard()}
            className="inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir dashboard en vivo
          </a>
          <a
            href={appRoutes.seoPage('uso-bizi-por-estacion')}
            className="ui-inline-action"
          >
            Explorar estaciones
          </a>
        </div>
      </header>

      <section className="ui-section-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Por donde empezar
              </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Rutas claras para responder preguntas reales
            </h2>
          </div>
          <p>
            DatosBizi combina una lectura rapida para personas con enlaces estables para reutilizar datos, citar informes y volver a la misma vista cuando lo necesites.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { href: appRoutes.dashboard(), title: 'Dashboard en vivo', desc: 'Mapa, alertas, flujo y senales clave para saber como esta el sistema ahora.' },
          { href: appRoutes.seoPage('uso-bizi-por-estacion'), title: 'Estaciones', desc: 'Busca una estacion, revisa disponibilidad y entra al detalle cuando haga falta.' },
          { href: appRoutes.districtLanding(), title: 'Barrios', desc: 'Compara zonas, estaciones destacadas y diferencias de uso por barrio.' },
          { href: appRoutes.reports(), title: 'Informes mensuales', desc: 'Consulta el archivo por mes con enlaces estables y contexto historico.' },
          { href: appRoutes.status(), title: 'Estado de los datos', desc: 'Comprueba si los datos estan frescos, completos y listos para usar.' },
          { href: appRoutes.developers(), title: 'API y descargas', desc: 'OpenAPI, ejemplos, CSV y referencias para reutilizar los datos.' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="ui-section-card transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Acceso rapido
            </p>
            <h2 className="mt-2 text-xl font-black text-[var(--foreground)]">{link.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{link.desc}</p>
          </a>
        ))}
      </section>
    </PageShell>
  )
}
