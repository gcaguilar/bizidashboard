import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getMobileCompactNav, PublicSectionNav } from '@/app/_components/PublicSectionNav';
import {
  PUBLIC_NAV_ITEMS,
  PUBLIC_PRIMARY_NAV_ITEMS,
  PUBLIC_UTILITY_NAV_ITEMS,
  getPublicNavItem,
} from '@/lib/public-navigation';

const trackedLinkSpy = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/explorar',
}));

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({
    children,
    href,
    navigationEvent,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    navigationEvent?: Record<string, unknown>;
  }) => {
    trackedLinkSpy({ href, navigationEvent, ...props });
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

describe('public navigation contract', () => {
  it('keeps primary and utility navigation groups stable', () => {
    expect(PUBLIC_PRIMARY_NAV_ITEMS.map((item) => item.id)).toEqual([
      'home',
      'explore',
      'reports',
      'dashboard',
    ]);
    expect(PUBLIC_UTILITY_NAV_ITEMS.map((item) => item.id)).toEqual([
      'status',
      'api',
      'help',
    ]);
    expect(PUBLIC_NAV_ITEMS.map((item) => item.id)).toEqual([
      'home',
      'explore',
      'reports',
      'dashboard',
      'status',
      'api',
      'help',
    ]);
    expect(getPublicNavItem('explore').href).toBe('/explorar');
  });

  it('renders desktop and mobile navigation without exposing a long mobile primary list', () => {
    const html = renderToStaticMarkup(<PublicSectionNav activeItemId="explore" />);

    expect(html).toContain('Secciones globales');
    expect(html).toContain('>Explorar<');
    expect(html).toContain('>Informes<');
    expect(html).toContain('>Dashboard<');
    expect(html).toContain('>Estado<');
    expect(html).toContain('>API<');
    expect(html).toContain('>Metodologia<');
    expect(html).toContain('>Mas<');
    expect(html).toContain('aria-current="page"');
  });

  it('keeps home visible in compact navigation when home is active', () => {
    const compactNav = getMobileCompactNav('home');

    expect(compactNav.visibleItems.map((item) => item.id)).toEqual(['home', 'explore', 'reports']);
    expect(compactNav.overflowItems.map((item) => item.id)).toEqual([
      'dashboard',
      'status',
      'api',
      'help',
    ]);
  });

  it('keeps the active utility page visible in compact navigation', () => {
    const compactNav = getMobileCompactNav('api');

    expect(compactNav.visibleItems.map((item) => item.id)).toEqual(['explore', 'reports', 'api']);
    expect(compactNav.overflowItems.map((item) => item.id)).toEqual([
      'home',
      'dashboard',
      'status',
      'help',
    ]);
  });

  it('emits navigation telemetry with the active route role as source context', () => {
    trackedLinkSpy.mockClear();

    renderToStaticMarkup(<PublicSectionNav activeItemId="help" />);

    expect(trackedLinkSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        href: '/dashboard',
        navigationEvent: {
          source: 'public_section_nav',
          destination: 'dashboard',
          module: 'public_nav_primary',
          sourceRole: 'utility',
          destinationRole: 'dashboard',
          transitionKind: 'to_dashboard',
        },
        'aria-current': undefined,
      })
    );

    expect(trackedLinkSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        href: '/metodologia',
        navigationEvent: {
          source: 'public_section_nav',
          destination: 'help',
          module: 'public_nav_utility',
          sourceRole: 'utility',
          destinationRole: 'utility',
          transitionKind: 'within_public',
        },
        'aria-current': 'page',
      })
    );
  });
});
