import { describe, expect, it } from 'vitest';
import {
  EXPLORE_PAGE_NAV_CONFIG,
  PRIMARY_SEO_PAGE_SLUGS,
  SEO_PAGE_CONFIGS,
  UTILITY_LANDING_NAV_CONFIG,
} from '@/lib/seo-pages';

function inferDestinationRole(destination: string): 'dashboard' | 'hub' {
  return destination.startsWith('dashboard_') ? 'dashboard' : 'hub';
}

describe('seo navigation contract', () => {
  it('keeps acquisition landing CTAs aligned with their intended transitions', () => {
    expect(UTILITY_LANDING_NAV_CONFIG.pageRole).toBe('ENTRY_SEO');
    expect(UTILITY_LANDING_NAV_CONFIG.primaryCta.destination).toBe('dashboard_overview');
    expect(inferDestinationRole(UTILITY_LANDING_NAV_CONFIG.primaryCta.destination)).toBe(
      'dashboard'
    );

    expect(EXPLORE_PAGE_NAV_CONFIG.pageRole).toBe('HUB');
    expect(EXPLORE_PAGE_NAV_CONFIG.primaryCta.destination).toBe('dashboard_research');
    expect(inferDestinationRole(EXPLORE_PAGE_NAV_CONFIG.primaryCta.destination)).toBe(
      'dashboard'
    );
  });

  it('keeps primary SEO pages with a stable role and primary CTA contract', () => {
    for (const slug of PRIMARY_SEO_PAGE_SLUGS) {
      const config = SEO_PAGE_CONFIGS[slug];

      expect(config.slug).toBe(slug);
      expect(config.primaryCta.href.length).toBeGreaterThan(0);
      expect(config.primaryCta.label.length).toBeGreaterThan(0);
      expect(config.primaryCta.destination.length).toBeGreaterThan(0);

      if (config.pageRole === 'ENTRY_SEO') {
        expect(['dashboard', 'hub']).toContain(
          inferDestinationRole(config.primaryCta.destination)
        );
      }

      if (config.pageRole === 'HUB') {
        expect(['dashboard', 'hub']).toContain(
          inferDestinationRole(config.primaryCta.destination)
        );
      }
    }
  });

  it('keeps legacy aliases canonicalized through hub-style destinations', () => {
    const legacyAliases = Object.values(SEO_PAGE_CONFIGS).filter((config) => config.isLegacyAlias);

    expect(legacyAliases).toHaveLength(1);
    expect(legacyAliases[0]?.pageRole).toBe('HUB');
    expect(inferDestinationRole(legacyAliases[0]?.primaryCta.destination ?? '')).toBe('hub');
  });
});
