import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildCtaClickEventMock,
  buildEntitySelectEventMock,
  buildLegacyInteractionEventMock,
  buildNavigationClickEventMock,
  resolveRouteKeyFromPathnameMock,
  trackUmamiEventMock,
} = vi.hoisted(() => ({
  buildCtaClickEventMock: vi.fn(),
  buildEntitySelectEventMock: vi.fn(),
  buildLegacyInteractionEventMock: vi.fn(),
  buildNavigationClickEventMock: vi.fn(),
  resolveRouteKeyFromPathnameMock: vi.fn(),
  trackUmamiEventMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/metodologia',
}));

vi.mock('@/lib/umami', () => ({
  buildCtaClickEvent: buildCtaClickEventMock,
  buildEntitySelectEvent: buildEntitySelectEventMock,
  buildLegacyInteractionEvent: buildLegacyInteractionEventMock,
  buildNavigationClickEvent: buildNavigationClickEventMock,
  resolveRouteKeyFromPathname: resolveRouteKeyFromPathnameMock,
  trackUmamiEvent: trackUmamiEventMock,
}));

describe('TrackedAnchor', () => {
  beforeEach(() => {
    buildCtaClickEventMock.mockReset();
    buildEntitySelectEventMock.mockReset();
    buildLegacyInteractionEventMock.mockReset();
    buildNavigationClickEventMock.mockReset();
    resolveRouteKeyFromPathnameMock.mockReset();
    trackUmamiEventMock.mockReset();

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

  it('builds CTA payloads from the current public pathname before tracking', async () => {
    const { TrackedAnchor } = await import('@/app/_components/TrackedAnchor');
    const onClick = vi.fn();
    const anchor = TrackedAnchor({
      href: 'https://gbfs.example.com',
      children: 'Abrir',
      ctaEvent: {
        source: 'methodology_hero',
        ctaId: 'dataset_source_open',
        destination: 'gbfs_discovery',
        isExternal: true,
        sourceRole: 'utility',
        destinationRole: 'utility',
        transitionKind: 'within_public',
      },
      onClick,
    });

    anchor.props.onClick({ type: 'click' });

    expect(resolveRouteKeyFromPathnameMock).toHaveBeenCalledWith('/metodologia');
    expect(buildCtaClickEventMock).toHaveBeenCalledWith({
      surface: 'public',
      routeKey: 'methodology',
      source: 'methodology_hero',
      ctaId: 'dataset_source_open',
      destination: 'gbfs_discovery',
      isExternal: true,
      sourceRole: 'utility',
      destinationRole: 'utility',
      transitionKind: 'within_public',
    });
    expect(trackUmamiEventMock).toHaveBeenCalledWith({
      name: 'cta_click',
      payload: {
        surface: 'public',
        routeKey: 'methodology',
        source: 'methodology_hero',
        ctaId: 'dataset_source_open',
        destination: 'gbfs_discovery',
        isExternal: true,
        sourceRole: 'utility',
        destinationRole: 'utility',
        transitionKind: 'within_public',
      },
    });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('prioritizes navigation events over CTA and entity selection payloads', async () => {
    const { TrackedAnchor } = await import('@/app/_components/TrackedAnchor');
    const anchor = TrackedAnchor({
      href: '/estado',
      children: 'Estado',
      navigationEvent: {
        source: 'methodology_hero',
        destination: 'status',
        sourceRole: 'utility',
        destinationRole: 'utility',
        transitionKind: 'within_public',
      },
      ctaEvent: {
        source: 'methodology_hero',
        ctaId: 'api_open',
      },
      entitySelectEvent: {
        source: 'methodology_hero',
        entityType: 'help',
      },
    });

    anchor.props.onClick({ type: 'click' });

    expect(buildNavigationClickEventMock).toHaveBeenCalledWith({
      surface: 'public',
      routeKey: 'methodology',
      source: 'methodology_hero',
      destination: 'status',
      sourceRole: 'utility',
      destinationRole: 'utility',
      transitionKind: 'within_public',
    });
    expect(buildCtaClickEventMock).not.toHaveBeenCalled();
    expect(buildEntitySelectEventMock).not.toHaveBeenCalled();
    expect(trackUmamiEventMock).toHaveBeenCalledWith({
      name: 'navigation_click',
      payload: {
        surface: 'public',
        routeKey: 'methodology',
        source: 'methodology_hero',
        destination: 'status',
        sourceRole: 'utility',
        destinationRole: 'utility',
        transitionKind: 'within_public',
      },
    });
  });
});
