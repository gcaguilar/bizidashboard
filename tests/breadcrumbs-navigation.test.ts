import { describe, expect, it } from 'vitest';
import {
  buildBreadcrumbStructuredData,
  createDistrictBreadcrumb,
  createReportBreadcrumb,
  createRootBreadcrumbs,
  createStationBreadcrumb,
  navBreadcrumb,
} from '@/lib/breadcrumbs';
import { BREADCRUMB_HOME_LABEL, findPublicNavItem } from '@/lib/public-navigation';
import { appRoutes } from '@/lib/routes';

describe('breadcrumbs follow public navigation', () => {
  it('takes label and href from the navigation item', () => {
    for (const id of ['stats', 'stats-estaciones', 'barrios']) {
      const nav = findPublicNavItem(id);
      expect(navBreadcrumb(id)).toEqual({ label: nav.label, href: nav.href });
    }
  });

  it('station breadcrumb keeps the same trail and URLs', () => {
    expect(createStationBreadcrumb('Plaza')).toEqual([
      { label: 'Inicio', href: appRoutes.home() },
      { label: 'Estadísticas', href: '/estadisticas' },
      { label: 'Estaciones', href: '/estadisticas/estaciones' },
      { label: 'Plaza', href: '/estadisticas/estaciones' },
    ]);
  });

  it('district and report breadcrumbs keep the same trail', () => {
    expect(createDistrictBreadcrumb('Centro').map((i) => i.label)).toEqual([
      'Inicio',
      'Estadísticas',
      'Barrios',
      'Centro',
    ]);
    expect(createReportBreadcrumb('Enero').map((i) => i.label)).toEqual([
      'Inicio',
      'Informes',
      'Enero',
    ]);
  });

  it('JSON-LD lists positions in order with absolute URLs', () => {
    const data = buildBreadcrumbStructuredData(createRootBreadcrumbs(navBreadcrumb('stats')));
    expect(data.itemListElement.map((i) => [i.position, i.name])).toEqual([
      [1, BREADCRUMB_HOME_LABEL],
      [2, 'Estadísticas'],
    ]);
    expect(data.itemListElement[1].item).toMatch(/^https?:\/\/.+\/estadisticas$/);
  });
});
