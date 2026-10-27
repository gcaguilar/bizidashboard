import { appRoutes } from '@/lib/routes';
import { TrackedLink } from '@/app/_components/TrackedLink';
import type { MessageKey } from '@/lib/i18n/messages';
import { useT } from '@/lib/i18n/use-locale';

type ExploreLink = {
  label: MessageKey;
  href: string;
  ctaId: string;
};

type ExploreCard = {
  icon: string;
  title: MessageKey;
  description: MessageKey;
  links: ExploreLink[];
};

const exploreCards: ExploreCard[] = [
  {
    icon: '📊',
    title: 'home.explore.reports.title',
    description: 'home.explore.reports.description',
    links: [
      { label: 'home.explore.reports.link.reports', href: appRoutes.reports(), ctaId: 'explore_reports' },
      { label: 'home.explore.reports.link.barrios', href: appRoutes.statsBarrios(), ctaId: 'explore_barrios' },
      { label: 'home.explore.reports.link.compare', href: appRoutes.compare(), ctaId: 'explore_compare' },
    ],
  },
  {
    icon: '⚠️',
    title: 'home.explore.diagnosis.title',
    description: 'home.explore.diagnosis.description',
    links: [
      { label: 'home.explore.diagnosis.link.network', href: appRoutes.dashboard(), ctaId: 'explore_network' },
      { label: 'home.explore.diagnosis.link.redistribucion', href: appRoutes.statsRedistribucion(), ctaId: 'explore_redistribucion' },
      { label: 'home.explore.diagnosis.link.status', href: appRoutes.status(), ctaId: 'explore_status' },
    ],
  },
  {
    icon: '💻',
    title: 'home.explore.developers.title',
    description: 'home.explore.developers.description',
    links: [
      { label: 'home.explore.developers.link.api', href: appRoutes.developers(), ctaId: 'explore_api' },
      { label: 'home.explore.developers.link.mcp', href: appRoutes.mcp(), ctaId: 'explore_mcp' },
      { label: 'home.explore.developers.link.methodology', href: appRoutes.methodology(), ctaId: 'explore_methodology' },
    ],
  },
];

export function HomeExploreSection() {
  const { t } = useT();

  return (
    <section className="ui-section-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        {t('home.explore.kicker')}
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {exploreCards.map((card) => (
          <div key={card.title} className="border-t border-[var(--border)] pt-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              <span aria-hidden="true" className="mr-1.5">{card.icon}</span>
              {t(card.title)}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{t(card.description)}</p>
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
                      {t(link.label)}
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
