import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const publicSectionNavSpy = vi.fn();

vi.mock('server-only', () => ({}));

vi.mock('@/app/_components/PublicSectionNav', () => ({
  PublicSectionNav: ({
    activeItemId,
    className,
  }: {
    activeItemId: string;
    className?: string;
  }) => {
    publicSectionNavSpy({ activeItemId, className });

    return <div data-active-item-id={activeItemId} data-class-name={className ?? ''} />;
  },
}));

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

describe('biciradar public page', () => {
  it('renders the shared public navigation with home active', async () => {
    publicSectionNavSpy.mockClear();

    const biciradarPage = await import('@/app/biciradar/page');

    renderToStaticMarkup(biciradarPage.default());

    expect(publicSectionNavSpy).toHaveBeenCalledWith({
      activeItemId: 'home',
      className: 'mt-1',
    });
  });
});
