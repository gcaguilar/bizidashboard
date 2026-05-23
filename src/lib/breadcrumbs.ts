import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';

export type BreadcrumbItem = {
  label: string;
  href: string | null;
};

export function createRootBreadcrumbs(...items: BreadcrumbItem[]): BreadcrumbItem[] {
  return [
    {
      label: 'Inicio',
      href: appRoutes.home(),
    },
    ...items,
  ];
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

export function createStationBreadcrumb(stationName: string): BreadcrumbItem[] {
  return [
    { label: 'Inicio', href: appRoutes.home() },
    { label: 'Estadísticas', href: appRoutes.statsHub() },
    { label: 'Estaciones', href: appRoutes.statsEstaciones() },
    { label: stationName, href: null },
  ]
}

export function createDistrictBreadcrumb(districtName: string): BreadcrumbItem[] {
  return [
    { label: 'Inicio', href: appRoutes.home() },
    { label: 'Estadísticas', href: appRoutes.statsHub() },
    { label: 'Barrios', href: appRoutes.statsBarrios() },
    { label: districtName, href: null },
  ]
}

export function createReportBreadcrumb(monthLabel: string): BreadcrumbItem[] {
  return [
    { label: 'Inicio', href: appRoutes.home() },
    { label: 'Informes', href: appRoutes.reports() },
    { label: monthLabel, href: null },
  ]
}
