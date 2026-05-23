'use client';

import { useLocation } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';
import {
  trackUmamiEvent,
  buildCtaClickEvent,
  resolveRouteKeyFromPathname,
} from '@/lib/umami';

const exploreLinks = [
  { label: 'Barrios', href: appRoutes.districtLanding(), ctaId: 'explore_barrios' },
  { label: 'Informes', href: appRoutes.reports(), ctaId: 'explore_informes' },
  { label: 'Estado', href: appRoutes.status(), ctaId: 'explore_estado' },
  { label: 'API', href: appRoutes.developers(), ctaId: 'explore_api' },
  { label: 'Metodología', href: appRoutes.methodology(), ctaId: 'explore_metodologia' },
  { label: 'Bici Radar', href: appRoutes.biciradar(), ctaId: 'explore_biciradar' },
];

export function HomeExploreSection() {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);

  return (
    <section className="ui-section-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Explorar más
      </p>
      <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-3">
        {exploreLinks.map((link) => (
          <a
            key={link.ctaId}
            href={link.href}
            onClick={() =>
              trackUmamiEvent(
                buildCtaClickEvent({
                  surface: 'public',
                  routeKey,
                  source: 'home_explore',
                  ctaId: link.ctaId,
                  destination: link.ctaId.replace('explore_', ''),
                }),
              )
            }
            className="ui-surface-block ui-surface-block-interactive text-center"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">{link.label}</p>
          </a>
        ))}
      </div>
    </section>
  );
}