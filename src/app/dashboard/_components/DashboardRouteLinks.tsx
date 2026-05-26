import { DASHBOARD_ROUTE_CONFIG } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { TrackedLink } from '@/app/_components/TrackedLink';

export type DashboardRoute = 'dashboard' | 'stations' | 'flow' | 'conclusions' | 'redistribucion' | 'help';

type DashboardRouteLinksProps = {
  activeRoute?: DashboardRoute;
  routes?: DashboardRoute[];
  variant?: 'inline' | 'chips';
  className?: string;
  source?: string;
};

const DEFAULT_ROUTES: DashboardRoute[] = ['dashboard', 'stations', 'flow', 'conclusions', 'redistribucion', 'help'];

export function DashboardRouteLinks({
  activeRoute,
  routes = DEFAULT_ROUTES,
  variant = 'inline',
  className,
  source,
}: DashboardRouteLinksProps) {
  const navigationSource = source ?? activeRoute ?? 'dashboard_navigation';

  return (
    <nav className={className} aria-label="Secciones del dashboard">
      {routes.map((route) => {
        const { href, label } = DASHBOARD_ROUTE_CONFIG[route];
        const isActive = route === activeRoute;

        const linkClass =
          variant === 'chips'
            ? `rounded-full whitespace-nowrap ${
                isActive
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]'
                  : ''
              }`
            : isActive
              ? 'border-b-2 border-[var(--primary)] pb-1 text-sm font-bold text-[var(--foreground)]'
              : 'pb-1 text-sm font-semibold text-[var(--primary-strong)] transition hover:text-[var(--primary)]';

        if (variant === 'chips') {
          return (
            <Button asChild key={route} variant="chip" size="sm" className={linkClass}>
              <TrackedLink
                href={href}
                navigationEvent={{
                  source: navigationSource,
                  destination: route,
                  module: 'dashboard_route_links',
                  sourceRole: 'dashboard',
                  destinationRole: 'dashboard',
                  transitionKind: 'within_dashboard',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
              </TrackedLink>
            </Button>
          );
        }

        return (
          <TrackedLink
            key={route}
            href={href}
            navigationEvent={{
              source: navigationSource,
              destination: route,
              module: 'dashboard_route_links',
              sourceRole: 'dashboard',
              destinationRole: 'dashboard',
              transitionKind: 'within_dashboard',
            }}
            className={linkClass}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </TrackedLink>
        );
      })}
    </nav>
  );
}
