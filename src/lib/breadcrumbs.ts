import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';

export type BreadcrumbItem = {
  label: string;
  href: string;
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
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: toAbsoluteRouteUrl(item.href),
    })),
  };
}
