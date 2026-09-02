import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardRouteLinks } from '@/app/dashboard/_components/DashboardRouteLinks';
import { appRoutes } from '@/lib/routes';

const trackedLinkSpy = vi.fn();

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({
    children,
    href,
    navigationEvent,
  }: {
    children: React.ReactNode;
    href: string;
    navigationEvent?: Record<string, unknown>;
  }) => {
    trackedLinkSpy({ href, navigationEvent });
    return <a href={href}>{children}</a>;
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

function getTrackedLinkCallByHref(href: string) {
  const call = trackedLinkSpy.mock.calls.find(([props]) => props.href === href);
  return call?.[0] as
    | {
        href: string;
        navigationEvent?: {
          source?: string;
          destination?: string;
          module?: string;
          sourceRole?: string;
          destinationRole?: string;
          transitionKind?: string;
        };
      }
    | undefined;
}

describe('dashboard route links', () => {
  it('emits the expected telemetry contract for dashboard route navigation', () => {
    trackedLinkSpy.mockClear();

    renderToStaticMarkup(<DashboardRouteLinks activeRoute="dashboard" />);

    const dashboardLink = getTrackedLinkCallByHref(appRoutes.dashboard());
    const stationsLink = getTrackedLinkCallByHref(appRoutes.dashboardStations());

    expect(dashboardLink?.navigationEvent).toEqual({
      source: 'dashboard',
      destination: 'dashboard',
      module: 'dashboard_route_links',
      sourceRole: 'dashboard',
      destinationRole: 'dashboard',
      transitionKind: 'within_dashboard',
    });
    expect(stationsLink?.navigationEvent).toEqual({
      source: 'dashboard',
      destination: 'stations',
      module: 'dashboard_route_links',
      sourceRole: 'dashboard',
      destinationRole: 'dashboard',
      transitionKind: 'within_dashboard',
    });
  });

  it('keeps alerts outside the primary dashboard navigation', () => {
    trackedLinkSpy.mockClear();

    renderToStaticMarkup(<DashboardRouteLinks activeRoute="dashboard" />);

    const trackedHrefs = trackedLinkSpy.mock.calls.map(([props]) => props.href);

    expect(trackedHrefs).toContain(appRoutes.dashboard());
    expect(trackedHrefs).toContain(appRoutes.dashboardStations());
    expect(trackedHrefs).toContain(appRoutes.dashboardFlow());
    expect(trackedHrefs).toContain(appRoutes.dashboardConclusions());
    expect(trackedHrefs).toContain(appRoutes.dashboardRedistribucion());
    expect(trackedHrefs).toContain(appRoutes.dashboardHelp());
    expect(trackedHrefs).not.toContain(appRoutes.dashboardAlerts());
  });

  it('keeps BiciRadar outside dashboard-only navigation', () => {
    trackedLinkSpy.mockClear();

    renderToStaticMarkup(<DashboardRouteLinks activeRoute="dashboard" />);

    const trackedHrefs = trackedLinkSpy.mock.calls.map(([props]) => props.href);

    expect(appRoutes.biciradar()).not.toBe(appRoutes.dashboard());
    expect(trackedHrefs).not.toContain(appRoutes.biciradar());
  });

  it('keeps the BiciRadar public route distinct from the dashboard route', () => {
    expect(appRoutes.biciradar()).toBe('/biciradar');
    expect(appRoutes.dashboard()).toBe('/dashboard');
    expect(appRoutes.biciradar()).not.toBe(appRoutes.dashboard());
  });
});
