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

    expect(dashboardLink?.navigationEvent).toMatchObject({
      source: 'dashboard',
      destination: 'dashboard',
      transitionKind: 'within_dashboard',
    });
    expect(stationsLink?.navigationEvent).toMatchObject({
      source: 'dashboard',
      destination: 'stations',
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
});
