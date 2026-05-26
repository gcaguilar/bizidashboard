export type DashboardRoute =
  | 'dashboard'
  | 'stations'
  | 'flow'
  | 'conclusions'
  | 'redistribucion'
  | 'help';

type DashboardRouteLinksProps = {
  activeRoute?: DashboardRoute;
  routes?: DashboardRoute[];
  variant?: 'inline' | 'chips';
  className?: string;
  source?: string;
};

export function DashboardRouteLinks(_props: DashboardRouteLinksProps) {
  // Secondary dashboard navigation disabled: we keep a single header navigation.
  return null;
}
