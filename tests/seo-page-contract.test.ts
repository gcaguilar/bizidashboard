import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  EXPLORE_PAGE_NAV_CONFIG,
  PRIMARY_SEO_PAGE_SLUGS,
  SEO_PAGE_CONFIGS,
  UTILITY_LANDING_NAV_CONFIG,
} from '@/lib/seo-pages';

const SEO_DESTINATION_ROLE_MAP = {
  dashboard_conclusions: 'dashboard',
  dashboard_flow: 'dashboard',
  dashboard_overview: 'dashboard',
  dashboard_redistribucion: 'dashboard',
  dashboard_research: 'dashboard',
  dashboard_stations: 'dashboard',
  report_archive: 'hub',
} as const;

function inferDestinationRole(destination: string): 'dashboard' | 'hub' | null {
  if (/^dashboard_.+/.test(destination)) {
    return 'dashboard';
  }

  return SEO_DESTINATION_ROLE_MAP[destination as keyof typeof SEO_DESTINATION_ROLE_MAP] ?? null;
}

describe('seo navigation contract', () => {
  it('keeps global website and organization structured data in the document shell', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/__root.tsx'), 'utf8');

    expect(source).toContain("'@type': 'Organization'");
    expect(source).toContain("'@type': 'WebSite'");
    expect(source).toContain("'@type': 'SearchAction'");
    expect(source).toContain("'query-input': 'required name=search_term_string'");
  });

  it('keeps interactive tool hubs out of the index while allowing crawling', async () => {
    const compare = await import('@/app/comparar');
    const explore = await import('@/app/explorar');
    const compareMeta = compare.Route.options.head?.({ params: {}, matches: [], loaderData: undefined, search: {}, context: {} } as never);
    const exploreMeta = explore.Route.options.head?.({ params: {}, matches: [], loaderData: undefined, search: {}, context: {} } as never);

    expect(compareMeta?.meta).toContainEqual({ name: 'robots', content: 'noindex, follow' });
    expect(exploreMeta?.meta).toContainEqual({ name: 'robots', content: 'noindex, follow' });
  });

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
      const expectedRole = SEO_DESTINATION_ROLE_MAP[config.primaryCta.destination];

      expect(config.slug).toBe(slug);
      expect(config.primaryCta.href.length).toBeGreaterThan(0);
      expect(config.primaryCta.label.length).toBeGreaterThan(0);
      expect(config.primaryCta.destination.length).toBeGreaterThan(0);
      expect(expectedRole).toBeDefined();

      if (config.pageRole === 'ENTRY_SEO') {
        expect(inferDestinationRole(config.primaryCta.destination)).toBe(expectedRole);
      }

      if (config.pageRole === 'HUB') {
        expect(inferDestinationRole(config.primaryCta.destination)).toBe(expectedRole);
      }
    }
  });

  it('keeps legacy aliases canonicalized through explicit public destinations', () => {
    const legacyAliases = Object.values(SEO_PAGE_CONFIGS).filter((config) => config.isLegacyAlias);

    expect(legacyAliases).toHaveLength(1);
    expect(legacyAliases[0]?.pageRole).toBe('HUB');
    expect(legacyAliases[0]?.primaryCta.destination).toBe('report_archive');
    expect(inferDestinationRole(legacyAliases[0]?.primaryCta.destination ?? '')).toBe('hub');
  });

  it('treats malformed destinations as invalid instead of defaulting to hub', () => {
    expect(inferDestinationRole('dashboard')).toBeNull();
    expect(inferDestinationRole('hub_reports')).toBeNull();
    expect(inferDestinationRole('typo_archive')).toBeNull();
  });
});
