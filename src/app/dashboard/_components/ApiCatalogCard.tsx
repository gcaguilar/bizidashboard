import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';
import { buildPanelOpenEvent } from '@/lib/umami';

type ApiCatalogCardProps = {
  items: Array<{
    label: string;
    path: string;
    format: string;
    description: string;
  }>;
};

export function ApiCatalogCard({ items }: ApiCatalogCardProps) {
  return (
    <section className="dashboard-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--foreground)]">Catalogo de endpoints</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Resumen rapido de las rutas utiles para integrar datos del dashboard desde otras herramientas.
          </p>
        </div>
        <TrackedLink
          href={appRoutes.dashboardHelp('api-documentacion')}
          trackingEvent={buildPanelOpenEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            module: 'api_documentation',
            source: 'api_catalog',
          })}
          className="text-xs font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Ver ayuda
        </TrackedLink>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <article
            key={`${item.label}-${item.path}`}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                {item.format}
              </span>
            </div>
            <p className="mt-2 break-all font-mono text-[11px] text-[var(--foreground)]">{item.path}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
