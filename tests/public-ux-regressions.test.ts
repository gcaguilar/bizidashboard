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

  it('public navigation exposes shared header and footer sources', () => {
    const source = readSource('src/lib/public-navigation.ts');
    expect(source).not.toMatch(/getPublicNavItem/);
    expect(source).not.toMatch(/PUBLIC_PRIMARY_NAV_ITEMS/);
    expect(source).not.toMatch(/PUBLIC_UTILITY_NAV_ITEMS/);
    expect(source).toMatch(/PUBLIC_MAIN_NAV_ITEMS/);
    expect(source).toMatch(/PUBLIC_MORE_NAV_ITEMS/);
    expect(source).toMatch(/FOOTER_NAV_GROUPS/);
    expect(source).toMatch(/getExploreHubSections/);
    expect(source).toMatch(/PUBLIC_NAV_ITEMS/);
  });

  it('header exposes Bici Radar and Redistribución in main or more nav', () => {
    const source = readSource('src/lib/public-navigation.ts');
    expect(source).toContain('appRoutes.biciradar()');
    expect(source).toContain('appRoutes.statsRedistribucion()');
  });

  it('header and footer use route helpers and tracked links for internal navigation', () => {
    const header = readSource('src/components/Header.tsx');
    const footer = readSource('src/components/Footer.tsx');
    const publicNavigation = readSource('src/lib/public-navigation.ts');

    expect(header).toContain('PUBLIC_MAIN_NAV_ITEMS');
    expect(header).toContain('TrackedLink');
    expect(header).not.toMatch(/href:\s*['"]\//);
    expect(header).not.toMatch(/<a\s+[^>]*href=['"]\//);

    expect(footer).toContain('FOOTER_NAV_GROUPS');
    expect(footer).toContain('TrackedLink');
    expect(footer).not.toMatch(/href:\s*['"]\//);
    expect(publicNavigation).toContain('appRoutes.');
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

  it('public map CTAs describe the dashboard destination as advanced map', () => {
    const files = [
      'src/app/index.tsx',
      'src/app/estadisticas/index.tsx',
      'src/app/estadisticas/barrios/index.tsx',
      'src/app/estadisticas/barrios/$districtSlug.tsx',
      'src/app/estadisticas/horarios.tsx',
    ];

    for (const file of files) {
      const source = readSource(file);
      expect(source, file).not.toMatch(/Ver mapa en vivo|Mapa en vivo|Abrir mapa en vivo|Ver disponibilidad en el mapa|Ver disponibilidad en mapa|Ver mapa por barrios/);
    }

    expect(readSource('src/app/index.tsx')).toContain('Abrir mapa avanzado');
    expect(readSource('src/app/estadisticas/index.tsx')).toContain('Mapa avanzado');
  });

  it('public nav avoids duplicate dashboard wording', () => {
    const publicNavigation = readSource('src/lib/public-navigation.ts');

    expect(publicNavigation).toContain("label: 'Mapa avanzado'");
    expect(publicNavigation).toContain("label: 'Redistribución'");
    expect(publicNavigation).not.toContain("label: 'Panel avanzado'");
    expect(publicNavigation).not.toContain("label: 'Dashboard'");
  });

  it('public navigation labels avoid dashboard wording', () => {
    const routes = readSource('src/lib/routes.ts');
    const publicNavigation = readSource('src/lib/public-navigation.ts');

    expect(routes).not.toContain("label: 'Dashboard'");
    expect(publicNavigation).not.toMatch(/label: 'Dashboard'|Dashboard >/);
    expect(publicNavigation).toContain("label: 'Mapa avanzado'");
  });

  it('explore destination labels distinguish dashboard tools from public pages', () => {
    const source = readSource('src/lib/public-navigation.ts');
    expect(source).toContain("destinationLabel: 'Mapa avanzado > Alertas'");
    expect(source).toContain("destinationLabel: 'Mapa avanzado > Flujo'");
    expect(source).not.toContain("destinationLabel: 'Pagina dedicada'");
    expect(source).not.toContain("destinationLabel: 'Dashboard >");
  });

  it('redistribution navigation points to the functional statistics page', () => {
    const source = readSource('src/lib/public-navigation.ts');
    expect(source).toContain("href: appRoutes.statsRedistribucion()");
    expect(source).not.toContain("href: appRoutes.seoPage('redistribucion')");
  });

  it('new map CTAs use advancedMap instead of statsMapa', () => {
    const files = [
      'src/app/index.tsx',
      'src/app/estadisticas/index.tsx',
      'src/app/estadisticas/barrios/index.tsx',
      'src/app/estadisticas/barrios/$districtSlug.tsx',
      'src/app/estadisticas/horarios.tsx',
    ];

    for (const file of files) {
      const source = readSource(file);
      expect(source, file).toContain('appRoutes.advancedMap()');
      expect(source, file).not.toContain('appRoutes.statsMapa()');
    }
  });

  it('route registry avoids indexable legacy map and inconsistent labels', () => {
    const source = readSource('src/lib/routes.ts');
    expect(source).not.toMatch(/id: 'stats-mapa',[\s\S]*?label: 'Mapa'/);
    expect(source).not.toContain("label: 'Developers'");
    expect(source).not.toContain("label: 'Redistribucion'");
    expect(source).toContain("label: 'API'");
    expect(source).toContain("label: 'Redistribución'");
  });

  it('footer clarifies data freshness timestamp', () => {
    const source = readSource('src/components/Footer.tsx');
    expect(source).toContain('Última muestra de datos Bizi');
    expect(source).not.toContain('Última actualización:');
  });

  it('dashboard status route redirects to the public status page', () => {
    const source = readSource('src/app/dashboard/status/index.tsx');
    expect(source).toContain('redirect');
    expect(source).toContain('appRoutes.status()');
    expect(source).not.toContain('Estado del dashboard');
  });

  it('Bici Radar experimental features are explicitly labelled', () => {
    const source = readSource('src/app/biciradar.tsx');
    expect(source).toContain('Alertas inteligentes');
    expect(source).toContain('Modo offline');
    expect(source).toContain('En pruebas');
    expect(source).toContain('Según ciudad');
    expect(source).toContain('Bicis eléctricas');
    expect(source).toContain('posición actual');
  });

  it('clipboard failures show a visible fallback', () => {
    const compare = readSource('src/app/comparar/_components/InteractiveComparePanel.tsx');
    const rebalancing = readSource('src/app/dashboard/redistribucion/_components/RebalancingTable.tsx');
    const alerts = readSource('src/app/dashboard/alertas/_components/AlertsHistoryClient.tsx');

    expect(compare).toContain('Selecciona y copia la URL compartible de arriba');
    expect(rebalancing).toContain('Usa Exportar CSV como alternativa');
    expect(alerts).toContain('Usa el CSV como alternativa');
  });

  it('home FAQ uses current navigation language', () => {
    const source = readSource('src/app/index.tsx');
    expect(source).toContain('mapa avanzado');
    expect(source).not.toContain('mapa en vivo');
    expect(source).not.toContain('buscador global');
  });

  it('public copy avoids stale dashboard wording in key visible strings', () => {
    const home = readSource('src/app/index.tsx');
    const status = readSource('src/app/estado.tsx');
    const report = readSource('src/app/informes.$month.tsx');
    const compare = readSource('src/app/comparar.tsx');
    const station = readSource('src/app/estadisticas/estaciones/$stationId.tsx');

    expect(home).not.toMatch(/mapa en vivo|buscador global/i);
    expect(status).not.toMatch(/afecten al dashboard|Entender metodologia|Aqui aparecen|senal de estabilidad|De donde salen|Ultimo informe/i);
    expect(report).not.toContain('entra al dashboard filtrado por mes');
    expect(compare).not.toContain('Abrir analisis en el dashboard');
    expect(station).not.toContain('abre el dashboard');
  });

  it('dashboard empty states suggest a user action', () => {
    const alerts = readSource('src/app/dashboard/alertas/_components/AlertsHistoryClient.tsx');
    const rebalancing = readSource('src/app/dashboard/redistribucion/_components/RebalancingTable.tsx');
    const hourlyCharts = readSource('src/app/dashboard/_components/HourlyCharts.tsx');
    const heatmap = readSource('src/app/dashboard/_components/Heatmap.tsx');

    expect(alerts).toContain('Limpia filtros o amplía el rango de fechas');
    expect(rebalancing).toContain('Limpia filtros o cambia clasificación y urgencia');
    expect(hourlyCharts).toContain('Selecciona otra estación con más muestras');
    expect(heatmap).toContain('Selecciona otra estación con más muestras');
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
