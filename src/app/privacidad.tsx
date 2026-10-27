import { createFileRoute } from '@tanstack/react-router'
import { buildSeoHead } from '@/lib/seo-head'
import { PageShell } from '@/components/layout/page-shell'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { TrackedLink } from '@/app/_components/TrackedLink'
import { appRoutes } from '@/lib/routes'
import { createRootBreadcrumbs } from '@/lib/breadcrumbs'

export const Route = createFileRoute('/privacidad')({
  head: () =>
    buildSeoHead({
      title: 'Política de privacidad | DatosBizi',
      description:
        'Qué datos trata DatosBizi, con qué proveedores, durante cuánto tiempo y cómo ejercer tus derechos.',
      path: appRoutes.privacidad(),
      robots: 'noindex, follow',
    }),
  component: PrivacidadPage,
})

function PrivacidadPage() {
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Privacidad',
    href: appRoutes.privacidad(),
  })

  return (
    <PageShell>
      <SiteBreadcrumbs items={breadcrumbs} />
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          Política de privacidad
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Última actualización: 20 de octubre de 2026.
        </p>
      </header>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Quién es el responsable</h2>
        <p>
          El responsable del tratamiento es Guillermo Castella, al frente del proyecto independiente
          DatosBizi, con ámbito de actuación en Zaragoza (España). Puedes contactar a través de la
          página de{' '}
          <TrackedLink href={appRoutes.contacto()} className="text-[var(--primary)] underline underline-offset-2">
            contacto
          </TrackedLink>
          .
        </p>
        <p>
          DatosBizi no es el operador de Bizi Zaragoza ni presta el servicio de bicicleta pública.
          Para altas, abonos o incidencias del servicio, acude a la web oficial de Bizi Zaragoza.
        </p>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Qué datos tratamos</h2>
        <ul className="space-y-2">
          <li>
            <strong className="text-[var(--foreground)]">Navegación agregada.</strong> Usamos Umami
            Cloud para medir visitas y eventos de uso de forma agregada y sin cookies publicitarias.
            No creamos perfiles publicitarios ni vendemos datos.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Errores técnicos.</strong> Sentry recibe
            información técnica del fallo (mensaje, traza, navegador y URL) para poder corregirlo.
            Puede incluir la IP y el identificador de la sesión técnica.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Formularios.</strong> Si envías el
            formulario de contacto o de feedback, Tally recibe los datos que escribas (por ejemplo,
            tu correo y el mensaje) para poder responderte.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Cuenta de desarrollador.</strong> Si inicias
            sesión para gestionar claves de API, Auth0 gestiona tu correo y la autenticación. No
            almacenamos tu contraseña.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Preferencias locales.</strong> El tema claro
            u oscuro y tus estaciones favoritas ("Mis estaciones", sin cuenta ni avisos) se guardan en el almacenamiento local de tu
            navegador; no se envían al servidor.
          </li>
        </ul>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Para qué y con qué base legal</h2>
        <ul className="space-y-2">
          <li>· Medir el uso del sitio y mejorarlo: interés legítimo en mantener un servicio público útil.</li>
          <li>· Corregir errores técnicos: interés legítimo en la seguridad y estabilidad del sitio.</li>
          <li>· Responder a tus mensajes: consentimiento al enviar el formulario o base contractual si eres usuario registrado.</li>
          <li>· Gestionar el acceso al área de desarrollador: ejecución de la relación de servicio.</li>
        </ul>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Proveedores y transferencias</h2>
        <p>
          Para funcionar, el sitio se apoya en Cloudflare (red y seguridad), Umami Cloud (analítica),
          Sentry (errores), Auth0 (autenticación), Tally (formularios) y GitHub (código e
          incidencias). Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico
          Europeo con garantías contractuales adecuadas.
        </p>
        <p>
          La tipografía Inter se sirve desde el propio dominio, así que tu navegador no necesita
          contactar con Google Fonts para mostrarla.
        </p>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Conservación y derechos</h2>
        <p>
          Los datos de analítica se conservan de forma agregada. Los mensajes de contacto se guardan
          el tiempo necesario para responder y cerrar la consulta. Los datos de cuenta se conservan
          mientras la cuenta esté activa.
        </p>
        <p>
          Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad
          escribiendo por los canales de contacto. También puedes reclamar ante la Agencia Española de
          Protección de Datos (AEPD).
        </p>
      </section>

      <section className="ui-section-card space-y-3 text-sm text-[var(--muted)]">
        <h2 className="text-xl font-black text-[var(--foreground)]">Cookies</h2>
        <p>
          No usamos cookies publicitarias ni de seguimiento entre sitios. Umami funciona sin cookies.
          Auth0 puede usar cookies técnicas necesarias para mantener la sesión si decides iniciar
          sesión. El almacenamiento local se usa solo para tus preferencias.
        </p>
      </section>
    </PageShell>
  )
}
