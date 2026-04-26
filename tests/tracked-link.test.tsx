import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildCtaClickEventMock,
  buildEntitySelectEventMock,
  buildLegacyInteractionEventMock,
  buildNavigationClickEventMock,
  resolveRouteKeyFromPathnameMock,
  trackUmamiEventMock,
  usePathnameMock,
} = vi.hoisted(() => ({
  buildCtaClickEventMock: vi.fn(),
  buildEntitySelectEventMock: vi.fn(),
  buildLegacyInteractionEventMock: vi.fn(),
  buildNavigationClickEventMock: vi.fn(),
  resolveRouteKeyFromPathnameMock: vi.fn(),
  trackUmamiEventMock: vi.fn(),
  usePathnameMock: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
}));

vi.mock('@/lib/umami', () => ({
  buildCtaClickEvent: buildCtaClickEventMock,
  buildEntitySelectEvent: buildEntitySelectEventMock,
  buildLegacyInteractionEvent: buildLegacyInteractionEventMock,
  buildNavigationClickEvent: buildNavigationClickEventMock,
  resolveRouteKeyFromPathname: resolveRouteKeyFromPathnameMock,
  trackUmamiEvent: trackUmamiEventMock,
}));

describe('TrackedLink', () => {
  beforeEach(() => {
    buildCtaClickEventMock.mockReset();
    buildEntitySelectEventMock.mockReset();
    buildLegacyInteractionEventMock.mockReset();
    buildNavigationClickEventMock.mockReset();
    resolveRouteKeyFromPathnameMock.mockReset();
    trackUmamiEventMock.mockReset();
    usePathnameMock.mockReset();

    usePathnameMock.mockReturnValue('/metodologia');
    resolveRouteKeyFromPathnameMock.mockReturnValue('methodology');
    buildCtaClickEventMock.mockImplementation((payload) => ({
      name: 'cta_click',
      payload,
    }));
    buildNavigationClickEventMock.mockImplementation((payload) => ({
      name: 'navigation_click',
      payload,
    }));
    buildEntitySelectEventMock.mockImplementation((payload) => ({
      name: 'entity_select',
      payload,
    }));
    buildLegacyInteractionEventMock.mockImplementation((payload) => ({
      name: 'legacy',
      payload,
    }));
  });

  it('builds navigation payloads from dashboard pathnames before tracking', async () => {
    usePathnameMock.mockReturnValue('/dashboard/alertas');
    resolveRouteKeyFromPathnameMock.mockReturnValue('dashboard_alerts');

    const { TrackedLink } = await import('@/app/_components/TrackedLink');
    const onClick = vi.fn();
    const link = TrackedLink({
      href: '/dashboard/estado',
      children: 'Estado',
      navigationEvent: {
        source: 'alerts_summary',
        destination: 'dashboard_status',
        sourceRole: 'panel',
        destinationRole: 'page',
        transitionKind: 'within_dashboard',
      },
      onClick,
    });

    link.props.onClick({ type: 'click' });

    expect(resolveRouteKeyFromPathnameMock).toHaveBeenCalledWith('/dashboard/alertas');
    expect(buildNavigationClickEventMock).toHaveBeenCalledWith({
      surface: 'dashboard',
      routeKey: 'dashboard_alerts',
      source: 'alerts_summary',
      destination: 'dashboard_status',
      sourceRole: 'panel',
      destinationRole: 'page',
      transitionKind: 'within_dashboard',
    });
    expect(trackUmamiEventMock).toHaveBeenCalledWith({
      name: 'navigation_click',
      payload: {
        surface: 'dashboard',
        routeKey: 'dashboard_alerts',
        source: 'alerts_summary',
        destination: 'dashboard_status',
        sourceRole: 'panel',
        destinationRole: 'page',
        transitionKind: 'within_dashboard',
      },
    });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('builds CTA payloads from public pathnames before tracking', async () => {
    const { TrackedLink } = await import('@/app/_components/TrackedLink');
    const link = TrackedLink({
      href: '/comparar',
      children: 'Comparar',
      ctaEvent: {
        source: 'methodology_hero',
        ctaId: 'compare_systems',
        destination: 'compare_view',
        sourceRole: 'hero',
        destinationRole: 'page',
        transitionKind: 'within_public',
      },
    });

    link.props.onClick({ type: 'click' });

    expect(resolveRouteKeyFromPathnameMock).toHaveBeenCalledWith('/metodologia');
    expect(buildCtaClickEventMock).toHaveBeenCalledWith({
      surface: 'public',
      routeKey: 'methodology',
      source: 'methodology_hero',
      ctaId: 'compare_systems',
      destination: 'compare_view',
      sourceRole: 'hero',
      destinationRole: 'page',
      transitionKind: 'within_public',
    });
    expect(trackUmamiEventMock).toHaveBeenCalledWith({
      name: 'cta_click',
      payload: {
        surface: 'public',
        routeKey: 'methodology',
        source: 'methodology_hero',
        ctaId: 'compare_systems',
        destination: 'compare_view',
        sourceRole: 'hero',
        destinationRole: 'page',
        transitionKind: 'within_public',
      },
    });
    expect(buildNavigationClickEventMock).not.toHaveBeenCalled();
  });

  it('builds entity selection payloads when no higher-priority event is provided', async () => {
    const { TrackedLink } = await import('@/app/_components/TrackedLink');
    const link = TrackedLink({
      href: '/estaciones/101',
      children: 'Abrir estacion',
      entitySelectEvent: {
        source: 'stations_table',
        entityType: 'station',
      },
    });

    link.props.onClick({ type: 'click' });

    expect(resolveRouteKeyFromPathnameMock).toHaveBeenCalledWith('/metodologia');
    expect(buildEntitySelectEventMock).toHaveBeenCalledWith({
      surface: 'public',
      routeKey: 'methodology',
      source: 'stations_table',
      entityType: 'station',
    });
    expect(trackUmamiEventMock).toHaveBeenCalledWith({
      name: 'entity_select',
      payload: {
        surface: 'public',
        routeKey: 'methodology',
        source: 'stations_table',
        entityType: 'station',
      },
    });
    expect(buildNavigationClickEventMock).not.toHaveBeenCalled();
    expect(buildCtaClickEventMock).not.toHaveBeenCalled();
  });

  it('prioritizes trackingEvent over navigation, CTA, and entity selection events', async () => {
    const { TrackedLink } = await import('@/app/_components/TrackedLink');
    const trackingEvent = {
      name: 'page_view',
      payload: {
        routeKey: 'explicit_override',
      },
    } as const;
    const link = TrackedLink({
      href: '/estado',
      children: 'Estado',
      trackingEvent,
      navigationEvent: {
        source: 'methodology_hero',
        destination: 'status',
      },
      ctaEvent: {
        source: 'methodology_hero',
        ctaId: 'status_open',
      },
      entitySelectEvent: {
        source: 'methodology_hero',
        entityType: 'station',
      },
    });

    link.props.onClick({ type: 'click' });

    expect(resolveRouteKeyFromPathnameMock).toHaveBeenCalledWith('/metodologia');
    expect(trackUmamiEventMock).toHaveBeenCalledWith(trackingEvent);
    expect(buildNavigationClickEventMock).not.toHaveBeenCalled();
    expect(buildCtaClickEventMock).not.toHaveBeenCalled();
    expect(buildEntitySelectEventMock).not.toHaveBeenCalled();
    expect(buildLegacyInteractionEventMock).not.toHaveBeenCalled();
  });
});
