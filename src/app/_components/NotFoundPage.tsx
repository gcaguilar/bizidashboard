import { TrackedLink } from '@/app/_components/TrackedLink';
import { PageShell } from '@/components/layout/page-shell';
import { appRoutes } from '@/lib/routes';

export function NotFoundPage() {
  return (
    <PageShell>
      <section className="ui-page-hero py-24 text-center">
        <h1 className="text-4xl font-black text-[var(--foreground)]">Página no encontrada</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">La ruta que buscas no existe o ha sido movida.</p>
        <TrackedLink href={appRoutes.home()} className="ui-inline-action mt-6">Volver al inicio</TrackedLink>
      </section>
    </PageShell>
  );
}
