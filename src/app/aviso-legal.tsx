import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes } from '@/lib/routes'
import { createRootBreadcrumbs } from '@/lib/breadcrumbs'

export const Route = createFileRoute('/aviso-legal')({
  head: () =>
    buildSeoHead({
      title: 'Aviso legal | DatosBizi',
      description:
        'Titularidad, independencia, licencia y condiciones de uso de DatosBizi, observatorio de Bizi Zaragoza.',
      path: appRoutes.avisoLegal(),
      robots: 'noindex, follow',
    }),
  component: AvisoLegalPage,
})

function AvisoLegalPage() {
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Aviso legal',
    href: appRoutes.avisoLegal(),
  })

  return (
    <PageShell>
      <SiteBreadcrumbs items={breadcrumbs} />
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          Aviso legal
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Última actualización: 20 de octubre de 2026.
        </p>
      </header>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Titularidad</h2>
        <p>
          DatosBizi es un proyecto personal e independiente mantenido por Guillermo Castella. El
          sitio no constituye una sociedad ni una administración pública. Para cualquier consulta,
          usa la página de{' '}
          <TrackedLink href={appRoutes.contacto()} className="text-[var(--primary)] underline underline-offset-2">
            contacto
          </TrackedLink>
          .
        </p>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Independencia del servicio</h2>
        <p>
          DatosBizi no representa al Ayuntamiento de Zaragoza, al operador de Bizi Zaragoza ni a
          ninguna administración. No gestiona altas, abonos, pagos, sanciones ni incidencias del
          servicio. La información se elabora a partir del feed público GBFS y puede diferir de la
          información oficial.
        </p>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Datos y propiedad intelectual</h2>
        <p>
          Los datos de disponibilidad pertenecen a sus fuentes originales. DatosBizi añade
          agregación, métricas, informes y visualizaciones. Puedes reutilizar los datos citando la
          fuente y la fecha de consulta, conforme a la página de{' '}
          <TrackedLink href={appRoutes.prensa()} className="text-[var(--primary)] underline underline-offset-2">
            prensa
          </TrackedLink>
          . El código fuente se publica bajo licencia GPL-3.0 en GitHub.
        </p>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Exactitud y disponibilidad</h2>
        <p>
          Los datos se actualizan cada pocos minutos, pero pueden contener retrasos, huecos o errores
          de la fuente. Las predicciones y el índice de actividad son aproximaciones, no garantías.
          No uses esta web como única fuente para decisiones críticas de desplazamiento, operación o
          seguridad.
        </p>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Enlaces externos</h2>
        <p>
          El sitio enlaza a la web oficial de Bizi Zaragoza, tiendas de aplicaciones, GitHub y otros
          servicios. No controlamos sus contenidos ni sus políticas. El acceso a esos sitios se rige
          por sus propias condiciones.
        </p>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Legislación aplicable</h2>
        <p>
          Este aviso se rige por la legislación española. Cualquier controversia se someterá a los
          juzgados y tribunales competentes conforme a la normativa aplicable.
        </p>
      </section>
    </PageShell>
  )
}
