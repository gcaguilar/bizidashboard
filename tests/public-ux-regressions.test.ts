import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('public UX regressions', () => {
  it('does not render duplicate secondary nav in public pages', () => {
    const publicPages = [
      'src/app/estado.tsx',
      'src/app/informes.tsx',
      'src/app/informes.$month.tsx',
      'src/app/metodologia.tsx',
      'src/app/developers.tsx',
      'src/app/biciradar.tsx',
      'src/app/comparar.tsx',
      'src/app/estadisticas/index.tsx',
      'src/app/estadisticas/mapa.tsx',
      'src/app/estadisticas/estaciones/index.tsx',
    ];

    for (const file of publicPages) {
      const source = readSource(file);
      expect(source, file).not.toMatch(/<PublicSectionNav\b|<StatsSecondaryNav\b/);
    }
  });

  it('does not use SeoLandingPageComponent in principal statistics pages', () => {
    const pages = [
      'src/app/estadisticas/horarios.tsx',
      'src/app/estadisticas/viajes.tsx',
      'src/app/estadisticas/redistribucion.tsx',
      'src/app/estadisticas/barrios/index.tsx',
    ];

    for (const file of pages) {
      const source = readSource(file);
      expect(source, file).not.toMatch(/import.*SeoLandingPageComponent/);
    }
  });

  it('keeps the statistics hub sections unique', () => {
    const source = readSource('src/app/estadisticas/index.tsx');
    const matches = source.match(/Quiero entender el sistema/g) ?? [];
    expect(matches).toHaveLength(0);
    expect(source).toContain('Quiero analizar uso y problemas');
    expect(source).toContain('Quiero ver evolución');
  });

  it('monthly report page renders real metrics when a month has data', () => {
    const source = readSource('src/app/informes.$month.tsx');
    expect(source).toContain('monthRow ?');
    expect(source).toContain('Demanda estimada');
    expect(source).toContain('Ver serie acumulada');
  });

  it('about page is user-focused and not tech-stack oriented', () => {
    const source = readSource('src/app/about.tsx');
    expect(source).toContain('datos claros sobre Bizi Zaragoza');
    expect(source).not.toMatch(/TanStack Start|TanStack Router|TanStack Query|Prisma|Sentry/);
  });

  it('informes-mensuales-bizi-zaragoza is a redirect, not a landing page', () => {
    const source = readSource('src/app/informes-mensuales-bizi-zaragoza.tsx');
    expect(source).toContain('redirect');
    expect(source).toContain("appRoutes.reports()");
    expect(source).not.toMatch(/SeoLandingPageComponent/);
  });

  it('orphaned secondary nav components have been deleted', () => {
    const sectionNavPath = path.join(process.cwd(), 'src/app/_components/PublicSectionNav.tsx');
    const statsNavPath = path.join(process.cwd(), 'src/app/estadisticas/_components/StatsSecondaryNav.tsx');
    expect(() => readFileSync(sectionNavPath)).toThrow();
    expect(() => readFileSync(statsNavPath)).toThrow();
  });

  it('stale public-navigation types and getPublicNavItem are removed', () => {
    const source = readSource('src/lib/public-navigation.ts');
    expect(source).not.toMatch(/PublicNavItem\b/);
    expect(source).not.toMatch(/getPublicNavItem/);
    expect(source).not.toMatch(/PUBLIC_PRIMARY_NAV_ITEMS/);
    expect(source).not.toMatch(/PUBLIC_UTILITY_NAV_ITEMS/);
    expect(source).toMatch(/getExploreHubSections/);
    expect(source).toMatch(/PUBLIC_NAV_ITEMS/);
  });

  it('header exposes Bici Radar and Redistribución in main or more nav', () => {
    const source = readSource('src/components/Header.tsx');
    expect(source).toContain('appRoutes.biciradar()');
    expect(source).toContain('appRoutes.statsRedistribucion()');
  });

  it('header and footer use route helpers and tracked links for internal navigation', () => {
    const header = readSource('src/components/Header.tsx');
    const footer = readSource('src/components/Footer.tsx');

    expect(header).toContain('appRoutes.');
    expect(header).toContain('TrackedLink');
    expect(header).not.toMatch(/href:\s*['"]\//);
    expect(header).not.toMatch(/<a\s+[^>]*href=['"]\//);

    expect(footer).toContain('appRoutes.');
    expect(footer).toContain('TrackedLink');
    expect(footer).not.toMatch(/href:\s*['"]\//);
    expect(footer).not.toMatch(/<a\s+[^>]*href=['"]\//);
  });

  it('about page stays on the main design system', () => {
    const source = readSource('src/app/about.tsx');
    expect(source).not.toMatch(/island-|display-title|sea-/);
    expect(source).toContain('ui-page-hero');
    expect(source).toContain('ui-section-card');
  });

  it('legacy Next metadata types are not imported in src', () => {
    const routeSource = readSource('src/lib/routes.ts');
    const seoSource = readSource('src/lib/seo.ts');
    const landingSource = readSource('src/lib/seo-landing.server.tsx');
    expect(routeSource).not.toContain("from 'next'");
    expect(seoSource).not.toContain("from 'next'");
    expect(landingSource).not.toContain("from 'next'");
  });

  it('estadisticas/mapa redirects to dashboard instead of showing empty landing', () => {
    const source = readSource('src/app/estadisticas/mapa.tsx');
    expect(source).toContain('redirect');
    expect(source).toContain('appRoutes.dashboard()');
    expect(source).not.toContain('PageShell');
    expect(source).not.toContain('MapaPage');
  });

  it('dashboard pages do not render the public Header', () => {
    const rootSource = readSource('src/app/__root.tsx');
    expect(rootSource).toContain('useLocation');
    expect(rootSource).toContain('isDashboard');
    expect(rootSource).toContain('startsWith(\'/dashboard\')');
  });

  it('dashboard route links include redistribucion in all dashboard pages', () => {
    const dashboardPages = [
      'src/app/dashboard/_components/DashboardHeader.tsx',
      'src/app/dashboard/flujo/index.tsx',
      'src/app/dashboard/conclusiones/index.tsx',
      'src/app/dashboard/ayuda/_components/HelpCenterClient.tsx',
      'src/app/dashboard/alertas/_components/AlertsHistoryClient.tsx',
      'src/app/dashboard/estaciones/_components/StationsDirectoryClient.tsx',
    ];

    for (const file of dashboardPages) {
      const source = readSource(file);
      expect(source, file).toMatch(/redistribucion/);
    }
  });

  it('home explore section uses TrackedLink instead of native anchor', () => {
    const source = readSource('src/app/_components/HomeExploreSection.tsx');
    expect(source).toContain('TrackedLink');
    expect(source).not.toMatch(/<a\s/);
  });

  it('informes page uses TrackedLink for monthly report navigation', () => {
    const source = readSource('src/app/informes.tsx');
    expect(source).toContain('TrackedLink');
    expect(source).toContain('appRoutes.reportMonth');
  });
});
