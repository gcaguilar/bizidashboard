'use client';

import { appRoutes } from '@/lib/routes';
import { TrackedLink } from '@/app/_components/TrackedLink';

const exploreLinks = [
  { label: 'Estado de la red', description: 'Alertas, equilibrio y estaciones que conviene revisar', href: appRoutes.dashboard(), ctaId: 'explore_network' },
  { label: 'Por barrios', description: 'Compara el movimiento y la disponibilidad de cada zona', href: appRoutes.districtLanding(), ctaId: 'explore_barrios' },
  { label: 'Informes mensuales', description: 'Consulta la evolución de la red mes a mes', href: appRoutes.reports(), ctaId: 'explore_reports' },
  { label: 'Comparar', description: 'Pon lado a lado estaciones, barrios y periodos', href: appRoutes.compare(), ctaId: 'explore_compare' },
  { label: 'Estado de los datos', description: 'Comprueba si los datos están actualizados y completos', href: appRoutes.status(), ctaId: 'explore_status' },
  { label: 'Cómo se calculan', description: 'Qué significan las estimaciones y cuáles son sus límites', href: appRoutes.methodology(), ctaId: 'explore_methodology' },
  { label: 'Datos abiertos y API', description: 'Descarga y reutiliza datos con documentación y ejemplos', href: appRoutes.developers(), ctaId: 'explore_api' },
  { label: 'Conector MCP', description: 'Consulta los datos desde un asistente de IA compatible', href: appRoutes.mcp(), ctaId: 'explore_mcp' },
];

export function HomeExploreSection() {
  return (
    <section className="ui-section-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Explora la red a tu manera
      </p>
      <div className="mt-3 grid gap-3 grid-cols-2 md:grid-cols-3">
        {exploreLinks.map((link) => (
          <TrackedLink
            key={link.ctaId}
            href={link.href}
            ctaEvent={{
              source: 'home_explore',
              ctaId: link.ctaId,
              destination: link.ctaId.replace('explore_', ''),
              sourceRole: 'home',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="ui-surface-block ui-surface-block-interactive text-left p-3"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">{link.label}</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{link.description}</p>
          </TrackedLink>
        ))}
      </div>
    </section>
  );
}
