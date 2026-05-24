'use client';

import { appRoutes } from '@/lib/routes';
import { TrackedLink } from '@/app/_components/TrackedLink';

const exploreLinks = [
  { label: 'Barrios', description: 'Actividad y estaciones por zona', href: appRoutes.districtLanding(), ctaId: 'explore_barrios' },
  { label: 'Horarios', description: 'Horas punta y patrones de uso', href: appRoutes.statsHorarios(), ctaId: 'explore_horarios' },
  { label: 'Viajes', description: 'Tendencia diaria y mensual', href: appRoutes.statsViajes(), ctaId: 'explore_viajes' },
  { label: 'Redistribución', description: 'Estaciones que necesitan atención', href: appRoutes.statsRedistribucion(), ctaId: 'explore_redistribucion' },
  { label: 'Informes', description: 'Archivo mensual detallado', href: appRoutes.reports(), ctaId: 'explore_informes' },
  { label: 'Estado', description: 'Cobertura y frescura del dato', href: appRoutes.status(), ctaId: 'explore_estado' },
];

export function HomeExploreSection() {
  return (
    <section className="ui-section-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Explora más
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