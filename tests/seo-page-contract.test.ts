import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  EXPLORE_PAGE_NAV_CONFIG,
  PRIMARY_SEO_PAGE_SLUGS,
  SEO_PAGE_CONFIGS,
  UTILITY_LANDING_NAV_CONFIG,
} from '@/lib/seo-pages';
import { buildSeoHead } from '@/lib/seo-head';

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

  it('keeps interactive tool hubs out of the index while allowing crawling', () => {
    for (const file of ['src/app/comparar.tsx', 'src/app/explorar.tsx']) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(source, file).toContain("robots: 'noindex, follow'");
    }
  });

  it('connects data-driven landing indexability to their robots metadata', () => {
    for (const file of [
      'src/app/estadisticas/viajes.tsx',
      'src/app/estadisticas/horarios.tsx',
      'src/app/estadisticas/barrios/index.tsx',
      'src/app/estadisticas/redistribucion.tsx',
    ]) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(source, file).toContain('loaderData?.indexability.indexable');
      expect(source, file).toContain("'noindex, follow'");
    }
  });

  it('includes breadcrumb structured data on station detail pages', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/app/estadisticas/estaciones/$stationId.tsx'),
      'utf8'
    );

    expect(source).toContain('buildBreadcrumbStructuredData(breadcrumbs)');
    expect(source).toContain("'@graph': [buildBreadcrumbStructuredData(breadcrumbs)");
  });

  it('includes breadcrumb structured data on district detail pages', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/app/estadisticas/barrios/$districtSlug.tsx'),
      'utf8'
    );

    expect(source).toContain('buildBreadcrumbStructuredData(breadcrumbs)');
    expect(source).toContain("'@graph': [buildBreadcrumbStructuredData(breadcrumbs)");
  });

  it('includes breadcrumb structured data on public station and district hubs', () => {
    for (const file of [
      'src/app/estadisticas/estaciones/index.tsx',
      'src/app/estadisticas/barrios/index.tsx',
    ]) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(source, file).toContain('buildBreadcrumbStructuredData(breadcrumbs)');
      expect(source, file).toContain('<SiteBreadcrumbs items={breadcrumbs}');
    }
  });

  it('describes the statistics hub as a collection page', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/estadisticas/index.tsx'), 'utf8');

    expect(source).toContain("'@type': 'CollectionPage'");
    expect(source).toContain('buildBreadcrumbStructuredData(breadcrumbs)');
  });

  it('marks the about page as an about page with breadcrumbs', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/about.tsx'), 'utf8');

    expect(source).toContain("'@type': 'AboutPage'");
    expect(source).toContain("publisher: { '@id': `${getSiteUrl()}/#organization` }");
    expect(source).toContain('buildBreadcrumbStructuredData(breadcrumbs)');
    expect(source).toContain('Qué ofrece DatosBizi');
  });

  it('keeps the report archive labels correctly accented', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/informes.tsx'), 'utf8');

    expect(source).toContain('Abrir último informe');
    expect(source).toContain('Último mes con informe');
    expect(source).toContain('Cada informe resume un período concreto');
  });

  it('keeps the API landing copy natural in Spanish', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/developers.tsx'), 'utf8');

    expect(source).toContain('Para qué sirve esta API hoy');
  });

  it('does not index monthly report URLs without a published report', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/informes.$month.tsx'), 'utf8');

    expect(source).toContain('opts.loaderData?.monthRow');
    expect(source).toContain("'noindex, follow'");
  });

  it('adds article and breadcrumb structured data to published monthly reports', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/informes.$month.tsx'), 'utf8');

    expect(source).toContain("'@type': 'Article'");
    expect(source).toContain('buildBreadcrumbStructuredData(breadcrumbs)');
    expect(source).toContain('structuredData ?');
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

  it('keeps public SEO labels readable in Spanish', () => {
    expect(SEO_PAGE_CONFIGS['uso-bizi-por-hora'].primaryCta.label).toBe('Ver análisis horario');
    expect(SEO_PAGE_CONFIGS['informes-mensuales-bizi-zaragoza'].metadataTitle).toContain('histórico');
    expect(SEO_PAGE_CONFIGS['informes-mensuales-bizi-zaragoza'].description).toContain('histórico');
    expect(SEO_PAGE_CONFIGS.redistribucion.primaryCta.label).toBe('Ver redistribución');
  });

  it('provides a default social image for shared pages', () => {
    const head = buildSeoHead({ title: 'Prueba', description: 'Descripción', path: '/about' });
    const ogImage = head.meta.find((entry) => entry.property === 'og:image');
    const ogImageAlt = head.meta.find((entry) => entry.property === 'og:image:alt');
    const twitterImage = head.meta.find((entry) => entry.name === 'twitter:image');
    const twitterImageAlt = head.meta.find((entry) => entry.name === 'twitter:image:alt');

    expect(ogImage?.content).toContain('/opengraph-image');
    expect(ogImageAlt?.content).toContain('Bizi Zaragoza');
    expect(twitterImage?.content).toContain('/opengraph-image');
    expect(twitterImageAlt?.content).toContain('Bizi Zaragoza');
  });

  it('uses permanent redirects for legacy SEO aliases', () => {
    const aliases = [
      'src/app/estadisticas-bizi-zaragoza.tsx',
      'src/app/estaciones-con-mas-bicis.tsx',
      'src/app/estaciones-mas-usadas-zaragoza.tsx',
      'src/app/barrios-bizi-zaragoza.tsx',
      'src/app/mapa-estaciones-bizi-zaragoza.tsx',
      'src/app/uso-bizi-por-estacion.tsx',
      'src/app/uso-bizi-por-hora.tsx',
      'src/app/viajes-por-dia-zaragoza.tsx',
      'src/app/viajes-por-mes-zaragoza.tsx',
      'src/app/ranking-estaciones-bizi.tsx',
      'src/app/redistribucion.tsx',
      'src/app/informes-mensuales-bizi-zaragoza.tsx',
    ];

    for (const file of aliases) {
      expect(readFileSync(path.join(process.cwd(), file), 'utf8'), file).toContain('status: 308');
    }
  });

  it('keeps the homepage social metadata complete', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/index.tsx'), 'utf8');

    expect(source).toContain("property: 'og:image'");
    expect(source).toContain("name: 'twitter:image'");
    expect(source).toContain("property: 'og:image:alt'");
  });

  it('keeps homepage FAQ structured data visible in the page', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/index.tsx'), 'utf8');

    expect(source).toContain("'@type': 'FAQPage'");
    expect(source).toContain('id="home-faq-title"');
    expect(source).toContain('HOME_FAQ.map((item)');
    expect(source).toContain("name: SEO_SITE_NAME");
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
