import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));

vi.mock('@/app/_components/PublicPageViewTracker', () => ({
  PublicPageViewTracker: () => null,
}));

vi.mock('@/app/_components/SiteBreadcrumbs', () => ({
  SiteBreadcrumbs: () => null,
}));

vi.mock('@/app/_components/TrackedAnchor', () => ({
  TrackedAnchor: ({
    children,
    href,
    ctaEvent: _ctaEvent,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    ctaEvent?: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({
    children,
    href,
    ctaEvent: _ctaEvent,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    ctaEvent?: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/biciradar' }),
  };
});

describe('biciradar public page', () => {
  it('renders product hero without duplicating public navigation', async () => {
    const biciradarPage = await import('@/app/biciradar');

    const markup = renderToStaticMarkup(biciradarPage.default());

    expect(markup).toContain('Bici Radar');
    expect(markup).not.toContain('data-active-item-id');
  });
});
