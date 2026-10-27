import {
  BREADCRUMB_HOME_LABEL,
  BREADCRUMB_REPORTS_LABEL,
  findPublicNavItem,
} from '@/lib/public-navigation';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';

export type BreadcrumbItem = {
  label: string;
  href: string | null;
};

/** Miga hacia un destino de la navegación pública: etiqueta y ruta salen de ahí. */
export function navBreadcrumb(navItemId: string): BreadcrumbItem {
  const { label, href } = findPublicNavItem(navItemId);
  return { label, href };
}

const homeBreadcrumb = (): BreadcrumbItem => ({
  label: BREADCRUMB_HOME_LABEL,
  href: appRoutes.home(),
});

export function createRootBreadcrumbs(...items: BreadcrumbItem[]): BreadcrumbItem[] {
  return [homeBreadcrumb(), ...items];
}

export function buildBreadcrumbStructuredData(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.filter((item) => item.href !== null).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: toAbsoluteRouteUrl(item.href!),
    })),
  };
}

export function createStationBreadcrumb(
  stationName: string,
  href: string = appRoutes.statsEstaciones()
): BreadcrumbItem[] {
  return createRootBreadcrumbs(
    navBreadcrumb('stats'),
    navBreadcrumb('stats-estaciones'),
    { label: stationName, href }
  );
}

export function createDistrictBreadcrumb(
  districtName: string,
  href: string = appRoutes.statsBarrios()
): BreadcrumbItem[] {
  return createRootBreadcrumbs(
    navBreadcrumb('stats'),
    navBreadcrumb('barrios'),
    { label: districtName, href }
  );
}

export function createReportBreadcrumb(
  monthLabel: string,
  href: string = appRoutes.reports()
): BreadcrumbItem[] {
  return createRootBreadcrumbs(
    { label: BREADCRUMB_REPORTS_LABEL, href: appRoutes.reports() },
    { label: monthLabel, href }
  );
}
