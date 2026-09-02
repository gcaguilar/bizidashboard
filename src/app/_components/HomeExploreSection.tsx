'use client';

import { appRoutes } from '@/lib/routes';
import { TrackedLink } from '@/app/_components/TrackedLink';

const exploreLinks = [
  { label: 'Rendimiento de red', description: 'Equilibrio, alertas y señales por estación', href: appRoutes.dashboard(), ctaId: 'explore_network' },
  { label: 'Barrios', description: 'Actividad estimada y contexto territorial', href: appRoutes.districtLanding(), ctaId: 'explore_barrios' },
  { label: 'Evolución e informes', description: 'Archivo mensual y comparativas temporales', href: appRoutes.reports(), ctaId: 'explore_reports' },
  { label: 'Comparar', description: 'Periodos y estaciones con cobertura visible', href: appRoutes.compare(), ctaId: 'explore_compare' },
  { label: 'Estado de los datos', description: 'Frescura, cobertura e incidencias', href: appRoutes.status(), ctaId: 'explore_status' },
  { label: 'Metodología', description: 'Cómo leer estimaciones y limitaciones', href: appRoutes.methodology(), ctaId: 'explore_methodology' },
  { label: 'Datos abiertos y API', description: 'Descargas, documentación y reutilización', href: appRoutes.developers(), ctaId: 'explore_api' },
  { label: 'Conector MCP', description: 'Consulta los datos desde un asistente de IA compatible', href: appRoutes.mcp(), ctaId: 'explore_mcp' },
];

export function HomeExploreSection() {
  return (
    <section className="ui-section-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Análisis, calidad y datos abiertos
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
