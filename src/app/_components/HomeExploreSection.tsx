import { appRoutes } from '@/lib/routes';
import { TrackedLink } from '@/app/_components/TrackedLink';

type ExploreLink = {
  label: string;
  href: string;
  ctaId: string;
};

type ExploreCard = {
  icon: string;
  title: string;
  description: string;
  links: ExploreLink[];
};

const exploreCards: ExploreCard[] = [
  {
    icon: '📊',
    title: 'Informes y análisis',
    description: 'Consulta la evolución de la red mes a mes, resúmenes por barrios y comparativas de uso.',
    links: [
      { label: 'Informes mensuales', href: appRoutes.reports(), ctaId: 'explore_reports' },
      { label: 'Por barrios', href: appRoutes.statsBarrios(), ctaId: 'explore_barrios' },
      { label: 'Comparar', href: appRoutes.compare(), ctaId: 'explore_compare' },
    ],
  },
  {
    icon: '⚠️',
    title: 'Diagnóstico y rendimiento',
    description: 'Detecta qué zonas sufren más desequilibrio y cómo cambia la disponibilidad con el tiempo.',
    links: [
      { label: 'Estado de la red', href: appRoutes.dashboard(), ctaId: 'explore_network' },
      { label: 'Redistribución', href: appRoutes.statsRedistribucion(), ctaId: 'explore_redistribucion' },
      { label: 'Estado de los datos', href: appRoutes.status(), ctaId: 'explore_status' },
    ],
  },
  {
    icon: '💻',
    title: 'Datos abiertos y desarrolladores',
    description: 'Descarga datos en CSV, accede a la API pública o conecta tu asistente de IA.',
    links: [
      { label: 'API y datos abiertos', href: appRoutes.developers(), ctaId: 'explore_api' },
      { label: 'Conector MCP', href: appRoutes.mcp(), ctaId: 'explore_mcp' },
      { label: 'Metodología', href: appRoutes.methodology(), ctaId: 'explore_methodology' },
    ],
  },
];

export function HomeExploreSection() {
  return (
    <section className="ui-section-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Explora la red a tu manera
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {exploreCards.map((card) => (
          <div key={card.title} className="border-t border-[var(--border)] pt-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              <span aria-hidden="true" className="mr-1.5">{card.icon}</span>
              {card.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{card.description}</p>
            <ul className="mt-4 space-y-2">
              {card.links.map((link) => (
                <li key={link.ctaId}>
                  <TrackedLink
                    href={link.href}
                    ctaEvent={{
                      source: 'home_explore',
                      ctaId: link.ctaId,
                      destination: link.ctaId.replace('explore_', ''),
                      sourceRole: 'home',
                      destinationRole: 'hub',
                      transitionKind: 'within_public',
                    }}
                    className="group"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                      {link.label}
                      <span
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </span>
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
