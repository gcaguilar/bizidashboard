import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardHeader } from '@/app/dashboard/_components/DashboardHeader';
import { HelpCenterClient } from '@/app/dashboard/ayuda/_components/HelpCenterClient';
import { DEFAULT_FEEDBACK_URL } from '@/lib/feedback';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

vi.mock('@/app/_components/SiteBreadcrumbs', () => ({
  SiteBreadcrumbs: () => <div>Breadcrumbs</div>,
}));

vi.mock('@/app/dashboard/_components/DashboardPageViewTracker', () => ({
  DashboardPageViewTracker: () => null,
}));

vi.mock('@/app/dashboard/_components/DashboardRouteLinks', () => ({
  DashboardRouteLinks: () => <div>Dashboard route links</div>,
}));

vi.mock('@/app/dashboard/_components/GitHubRepoButton', () => ({
  GitHubRepoButton: () => <button type="button">GitHub</button>,
}));

vi.mock('@/app/dashboard/_components/ThemeToggleButton', () => ({
  ThemeToggleButton: () => <button type="button">Theme</button>,
}));

vi.mock('@/app/_components/CitySwitcher', () => ({
  CitySwitcher: () => <div>City switcher</div>,
}));

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({ children, href, className }: { children: ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/app/_components/TrackedAnchor', () => ({
  TrackedAnchor: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const dashboardHeaderProps = {
  timeWindows: [{ id: '24h', label: '24h' }],
  activeWindowId: '24h',
  onChangeWindow: vi.fn(),
  searchQuery: '',
  onChangeSearch: vi.fn(),
  onlyWithBikes: false,
  onlyWithAnchors: false,
  onToggleOnlyWithBikes: vi.fn(),
  onToggleOnlyWithAnchors: vi.fn(),
  filteredStationsCount: 10,
  totalStationsCount: 10,
  filteredOutCount: 0,
  favoriteCount: 2,
  activeAlertsCount: 1,
  activeWindowLabel: '24 horas',
  isMobilityPreviewLoading: false,
  isRefreshingData: false,
  nearestMessage: 'Sin geolocalizacion',
  datasetSummaryLabel: 'Dataset listo',
  onUseGeolocation: vi.fn(),
  canUseGeolocation: false,
  onJumpToNearest: vi.fn(),
  canJumpToNearest: false,
  refreshCountdownLabel: '30 s',
  refreshProgress: 0.5,
};

describe('feedback entry points', () => {
  function renderNode(node: ReactNode) {
    return renderToStaticMarkup(<>{node}</>);
  }

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows a dashboard feedback CTA linked to tally by default', () => {
    vi.stubEnv('NEXT_PUBLIC_FEEDBACK_URL', '');

    const html = renderNode(<DashboardHeader {...dashboardHeaderProps} />);

    expect(html).toContain(`href="${DEFAULT_FEEDBACK_URL}"`);
    expect(html).toContain('>Feedback<');
  });

  it('exposes explicit feedback copy in the help support block', () => {
    vi.stubEnv('NEXT_PUBLIC_FEEDBACK_URL', '');

    const html = renderNode(
      <HelpCenterClient
        historyMeta={{
          coverage: {
            firstRecordedAt: '2026-03-01T00:00:00.000Z',
            lastRecordedAt: '2026-03-31T23:00:00.000Z',
            totalDays: 31,
            totalStations: 140,
          },
          source: {
            provider: 'Bizi Zaragoza GBFS',
            gbfsDiscoveryUrl: 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json',
          },
        }}
      />
    );

    expect(html).toContain(`href="${DEFAULT_FEEDBACK_URL}"`);
    expect(html).toContain('>Enviar feedback<');
    expect(html).toContain('>Contacto<');
    expect(html).toMatch(/compartir feedback/i);
  });
});
