import Link from 'next/link';

export type DashboardRoute = 'dashboard' | 'stations' | 'flow' | 'conclusions' | 'help';

type DashboardRouteLinksProps = {
  activeRoute?: DashboardRoute;
  routes?: DashboardRoute[];
  variant?: 'inline' | 'chips';
  className?: string;
};

const DEFAULT_ROUTES: DashboardRoute[] = ['dashboard', 'stations', 'flow', 'conclusions', 'help'];

const ROUTE_CONFIG: Record<DashboardRoute, { href: string; label: string }> = {
  dashboard: {
    href: '/dashboard',
    label: 'Inicio',
  },
  stations: {
    href: '/dashboard/estaciones',
    label: 'Estaciones',
  },
  flow: {
    href: '/dashboard/flujo',
    label: 'Flujo',
  },
  conclusions: {
    href: '/dashboard/conclusiones',
    label: 'Conclusiones',
  },
  help: {
    href: '/dashboard/ayuda',
    label: 'Ayuda',
  },
};

export function DashboardRouteLinks({
  activeRoute,
  routes = DEFAULT_ROUTES,
  variant = 'inline',
  className,
}: DashboardRouteLinksProps) {
  return (
    <nav className={className} aria-label="Secciones del dashboard">
      {routes.map((route) => {
        const { href, label } = ROUTE_CONFIG[route];
        const isActive = route === activeRoute;

        const linkClass =
          variant === 'chips'
            ? `icon-button ${
                isActive ? 'border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent)]' : ''
              }`
             : isActive
              ? 'border-b-2 border-[var(--accent)] pb-1 text-sm font-bold text-[var(--foreground)]'
              : 'pb-1 text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]';

        return (
          <Link
            key={route}
            href={href}
            className={linkClass}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
