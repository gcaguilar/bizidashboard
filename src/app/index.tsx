import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/layout/page-shell'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <PageShell className="gap-8 py-8 md:py-12">
      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Panel publico y rutas indexables
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
              DatosBizi: Estaciones Bizi Zaragoza
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Consulta estaciones Bizi Zaragoza, disponibilidad actual, patrones de uso, barrios, rankings, informes mensuales y datos abiertos desde una unica capa publica.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <a
            href={appRoutes.dashboard()}
            className="inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir dashboard principal
          </a>
          <a
            href={appRoutes.seoPage('uso-bizi-por-estacion')}
            className="ui-inline-action"
          >
            Explorar estaciones publicas
          </a>
        </div>
      </header>

      <section className="ui-section-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Como usar la capa publica
              </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Mejor pocas rutas utiles que muchas paginas vacias
            </h2>
          </div>
          <p>
            DatosBizi combina lectura rapida para usuarios y estructura clara para buscadores.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { href: appRoutes.dashboard(), title: 'Dashboard en vivo', desc: 'Mapa, alertas, flujo y lecturas operativas del sistema actual.' },
          { href: appRoutes.seoPage('uso-bizi-por-estacion'), title: 'Hub de estaciones', desc: 'Fichas publicas, disponibilidad, patrones y acceso al detalle operativo.' },
          { href: appRoutes.districtLanding(), title: 'Barrios con cobertura', desc: 'Contexto territorial, estaciones destacadas y comparativa local por barrio.' },
          { href: appRoutes.reports(), title: 'Archivo mensual', desc: 'Informes indexables por mes con enlaces persistentes y contexto historico.' },
          { href: appRoutes.status(), title: 'Estado del sistema', desc: 'Frescura de datos, volumen reciente y diagnostico rapido.' },
          { href: appRoutes.developers(), title: 'Developers y API', desc: 'OpenAPI, ejemplos de consumo, CSV y documentacion reutilizable.' },
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
