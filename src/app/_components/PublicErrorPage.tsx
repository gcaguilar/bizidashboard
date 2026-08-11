import { TrackedLink } from '@/app/_components/TrackedLink';
import { PageShell } from '@/components/layout/page-shell';
import { appRoutes } from '@/lib/routes';

export function PublicErrorPage() {
  return (
    <PageShell>
      <section className="ui-page-hero py-24 text-center">
        <h1 className="text-3xl font-black text-[var(--foreground)]">No se pudo cargar la pagina</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Ocurrio un error al cargar los datos. Intenta recargar en unos minutos o revisa el estado del sistema.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <TrackedLink href={appRoutes.status()} className="ui-primary-button">Ver estado</TrackedLink>
          <TrackedLink href={appRoutes.home()} className="ui-inline-action">Volver al inicio</TrackedLink>
        </div>
      </section>
    </PageShell>
  );
}
